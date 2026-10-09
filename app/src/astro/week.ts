/**
 * The week ahead, planet by planet: every contact the Sun, Mercury, Venus, Mars and the slow planets
 * make to the birth chart (including the North Node and the angles), on the day each is exact,
 * plus New and Full Moons with their degree, house, and aspects to natal planets.
 * Calculation only; the words live in src/content/week.ts.
 */
import * as Astronomy from 'astronomy-engine';
import { ascendantAndMidheaven, houseOf, norm, placidusCusps, SIGNS, tropicalLongitude } from './chart';
import type { NatalChart } from './natal';

const DAY = 86400000;
const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const signOf = (lon: number) => SIGNS[Math.floor(norm(lon) / 30)];

export const MOVERS = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
export type Mover = (typeof MOVERS)[number];
const ASPECTS = [
  { name: 'conjunct', angle: 0 },
  { name: 'sextile', angle: 60 },
  { name: 'square', angle: 90 },
  { name: 'trine', angle: 120 },
  { name: 'opposite', angle: 180 },
] as const;
export type WeekAspect = (typeof ASPECTS)[number]['name'];

export interface NatalPoint {
  name: string;
  lon: number;
}
export interface WeekContact {
  date: string;
  aspect: WeekAspect;
  natal: string;
  natalLon: number;
  orb: number;
}
export interface MoverWeek {
  mover: Mover;
  lon: number;
  sign: string;
  /** Natal house the planet is moving through (exact birth time only). */
  house: number | null;
  retrograde: boolean;
  /** A station (turning retrograde or direct) inside the window. */
  station: { date: string; turns: 'retrograde' | 'direct' } | null;
  /** A sign change inside the window. */
  ingress: { date: string; sign: string } | null;
  contacts: WeekContact[];
}
export interface WeekLunation {
  date: string;
  kind: 'New Moon' | 'Full Moon';
  lon: number;
  sign: string;
  house: number | null;
  aspects: { natal: string; natalLon: number; aspect: WeekAspect; orb: number }[];
}
export interface Week {
  start: string;
  end: string;
  movers: MoverWeek[];
  lunations: WeekLunation[];
}

/** Natal points a transit can touch: personal planets, the slow planets, the North Node, and the angles. */
export function weekTargets(c: NatalChart, lat: number, lon: number): NatalPoint[] {
  const pts: NatalPoint[] = c.western.planets.map((p) => ({ name: p.body === 'Node' ? 'North Node' : p.body, lon: p.longitude }));
  if (c.timePrecision === 'exact') {
    const am = ascendantAndMidheaven(c.utc, lat, lon);
    pts.push({ name: 'Ascendant', lon: am.asc }, { name: 'Midheaven', lon: am.mc });
  }
  return pts;
}

// Fast planets only count close contacts; slow ones are listed when exact in the window.
const ORB: Record<Mover, number> = { Sun: 1, Mercury: 1, Venus: 1, Mars: 1, Jupiter: 1, Saturn: 1, Uranus: 1, Neptune: 1, Pluto: 1 };

export function weekAhead(c: NatalChart, lat: number, lon: number, now = new Date(), days = 10): Week {
  const exact = c.timePrecision === 'exact';
  const cusps = exact ? placidusCusps(c.utc, lat, lon) : null;
  const targets = weekTargets(c, lat, lon);
  // Noon samples from the day before to the day after the window, so the edges can be local minima.
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  const samples = Array.from({ length: days + 2 }, (_, i) => new Date(start.getTime() + (i - 1) * DAY));

  const movers: MoverWeek[] = MOVERS.map((m) => {
    const pos = samples.map((d) => tropicalLongitude(m, d));
    const speed = pos.map((l, i, a) => (i === 0 ? ((a[1] - l + 540) % 360) - 180 : ((l - a[i - 1] + 540) % 360) - 180));
    const contacts: WeekContact[] = [];
    for (const t of targets)
      for (const a of ASPECTS) {
        if (m === t.name && a.angle === 0) continue;
        const orbs = pos.map((l) => Math.abs(sep(l, t.lon) - a.angle));
        for (let i = 1; i < orbs.length - 1; i++)
          if (orbs[i] <= orbs[i - 1] && orbs[i] < orbs[i + 1] && orbs[i] < ORB[m]) contacts.push({ date: iso(samples[i]), aspect: a.name, natal: t.name, natalLon: t.lon, orb: orbs[i] });
      }
    contacts.sort((x, y) => x.date.localeCompare(y.date) || x.orb - y.orb);
    let station: MoverWeek['station'] = null;
    let ingress: MoverWeek['ingress'] = null;
    for (let i = 2; i < samples.length - 1; i++) {
      if (m !== 'Sun' && speed[i - 1] >= 0 && speed[i] < 0) station = { date: iso(samples[i]), turns: 'retrograde' };
      if (m !== 'Sun' && speed[i - 1] < 0 && speed[i] >= 0) station = { date: iso(samples[i]), turns: 'direct' };
      if (signOf(pos[i]) !== signOf(pos[i - 1])) ingress = { date: iso(samples[i]), sign: signOf(pos[i]) };
    }
    const here = pos[1];
    return { mover: m, lon: here, sign: signOf(here), house: cusps ? houseOf(here, cusps) : null, retrograde: speed[1] < 0, station, ingress, contacts };
  }).filter((x) => x.contacts.length || x.station || x.ingress);

  // New and Full Moons in the window, with their aspects to the birth chart.
  const lunations: WeekLunation[] = [];
  const end = new Date(start.getTime() + days * DAY);
  for (const [phase, kind] of [[0, 'New Moon'], [180, 'Full Moon']] as const) {
    let t = Astronomy.SearchMoonPhase(phase, Astronomy.MakeTime(new Date(start.getTime() - DAY / 2)), days + 1);
    while (t && t.date < end) {
      const l = tropicalLongitude('Moon', t.date);
      const aspects = targets
        .flatMap((p) => ASPECTS.map((a) => ({ natal: p.name, natalLon: p.lon, aspect: a.name, orb: Math.abs(sep(l, p.lon) - a.angle) })))
        .filter((x) => x.orb < 3)
        .sort((x, y) => x.orb - y.orb);
      lunations.push({ date: iso(t.date), kind, lon: l, sign: signOf(l), house: cusps ? houseOf(l, cusps) : null, aspects });
      t = Astronomy.SearchMoonPhase(phase, t.AddDays(1), days + 1);
    }
  }
  lunations.sort((a, b) => a.date.localeCompare(b.date));

  // Most active planets first: fast movers with several contacts, then slow movers with an exact hit.
  movers.sort((a, b) => b.contacts.length - a.contacts.length || MOVERS.indexOf(a.mover) - MOVERS.indexOf(b.mover));
  return { start: iso(start), end: iso(new Date(end.getTime() - DAY)), movers, lunations };
}
