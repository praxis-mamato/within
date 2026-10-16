/**
 * Predictive techniques for the subscriber Timing tab (docs/readings-engine.md, Route A):
 * secondary progressions, solar arc directions, a 12-month outer-planet transit calendar,
 * and the solar return. Calculation only; interpretation lives in src/content/progressions.ts.
 */
import { angleAspectOk, ascendantAndMidheaven, ascendantFromMidheaven, withFarEnds, houseOf, norm, placidusCusps, SIGNS, tropicalLongitude, type BodyName } from './chart';
import type { NatalChart } from './natal';

const DAY = 86400000;
const YEAR = 365.2422 * DAY;
const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const signOf = (lon: number) => SIGNS[Math.floor(norm(lon) / 30)];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addMonths = (d: Date, m: number) => new Date(d.getTime() + m * 30.4369 * DAY);

export const ASPECTS = [
  { name: 'conjunct', angle: 0 },
  { name: 'sextile', angle: 60 },
  { name: 'square', angle: 90 },
  { name: 'trine', angle: 120 },
  { name: 'opposite', angle: 180 },
] as const;
export type AspectName = (typeof ASPECTS)[number]['name'];

type Point = { name: string; lon: number };

/** Natal points used as targets: the ten planets, plus the angles when the birth time is exact. */
export function natalPoints(c: NatalChart, lat: number, lon: number): Point[] {
  const pts: Point[] = c.western.planets.filter((p) => p.body !== 'Node').map((p) => ({ name: p.body, lon: p.longitude }));
  if (c.timePrecision === 'exact') {
    const am = ascendantAndMidheaven(c.utc, lat, lon);
    pts.push({ name: 'Ascendant', lon: am.asc }, { name: 'Midheaven', lon: am.mc });
  }
  return withFarEnds(pts);
}

// ─── Western essential dignity, for the placements table ──────────────────────

const EXALT: Record<string, string> = { Sun: 'Aries', Moon: 'Taurus', Mercury: 'Virgo', Venus: 'Pisces', Mars: 'Capricorn', Jupiter: 'Cancer', Saturn: 'Libra' };
const HOMES: Record<string, string[]> = {
  Sun: ['Leo'], Moon: ['Cancer'], Mercury: ['Gemini', 'Virgo'], Venus: ['Taurus', 'Libra'], Mars: ['Aries', 'Scorpio'],
  Jupiter: ['Sagittarius', 'Pisces'], Saturn: ['Capricorn', 'Aquarius'], Uranus: ['Aquarius'], Neptune: ['Pisces'], Pluto: ['Scorpio'],
};
const opposite = (sign: string) => SIGNS[(SIGNS.indexOf(sign) + 6) % 12];

export function westernDignity(body: string, sign: string): 'Domicile' | 'Exaltation' | 'Detriment' | 'Fall' | null {
  const homes = HOMES[body] ?? [];
  if (homes.includes(sign)) return 'Domicile';
  if (EXALT[body] === sign) return 'Exaltation';
  if (homes.some((h) => opposite(h) === sign)) return 'Detriment';
  if (EXALT[body] && opposite(EXALT[body]) === sign) return 'Fall';
  return null;
}

// ─── Secondary progressions (a day for a year) ────────────────────────────────

export const PROGRESSED = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'] as const;

/** The progressed instant for a moment in life: one day after birth for each year lived. */
export const progressedDate = (c: NatalChart, at: Date) => new Date(c.utc.getTime() + ((at.getTime() - c.utc.getTime()) / YEAR) * DAY);

const progressedLon = (c: NatalChart, body: (typeof PROGRESSED)[number], at: Date) => tropicalLongitude(body, progressedDate(c, at));
const isRetro = (body: (typeof PROGRESSED)[number], t: Date) =>
  body !== 'Sun' && body !== 'Moon' && ((tropicalLongitude(body, new Date(t.getTime() + DAY / 2)) - tropicalLongitude(body, new Date(t.getTime() - DAY / 2)) + 540) % 360) - 180 < 0;

export interface ProgressedPlanet {
  body: (typeof PROGRESSED)[number];
  lon: number;
  sign: string;
  degree: number;
  natalSign: string;
  house: number | null;
  retrograde: boolean;
}
export interface ProgressedContact {
  progressed: string;
  aspect: AspectName;
  natal: string;
  /** Date the contact is exact, when that falls in the window searched. */
  exact: string | null;
  orbNow: number;
  applying: boolean;
}
export interface Progressions {
  age: number;
  planets: ProgressedPlanet[];
  moon: { sign: string; house: number | null; nextSign: string; nextIngress: string | null; enteredOn: string | null };
  /** Angle from progressed Sun to progressed Moon, 0–360, and the date of the last progressed New Moon. */
  phase: { angle: number; name: string; lastNewMoon: string | null; nextNewMoon: string | null; lastFullMoon: string | null; nextFullMoon: string | null };
  /** The progressed Ascendant and Midheaven (Midheaven by solar arc, Ascendant from it), and their sign changes within ±5 years. Null without an exact birth time. */
  angles: { asc: { lon: number; sign: string; degree: number }; mc: { lon: number; sign: string; degree: number }; ingresses: { point: 'Ascendant' | 'Midheaven'; sign: string; date: string }[] } | null;
  /** Sign changes of progressed Sun, Mercury, Venus, Mars within ±5 years. */
  ingresses: { body: string; sign: string; date: string }[];
  contacts: ProgressedContact[];
}

/** Dates in [from, to) at which f(t) changes sign index, found monthly then refined by bisection. */
function ingressDates(f: (t: Date) => number, from: Date, to: Date, stepMonths = 1): { date: Date; sign: string }[] {
  const out: { date: Date; sign: string }[] = [];
  let prev = from;
  let prevSign = Math.floor(norm(f(from)) / 30);
  for (let t = addMonths(from, stepMonths); t <= to; t = addMonths(t, stepMonths)) {
    const s = Math.floor(norm(f(t)) / 30);
    if (s !== prevSign) {
      let lo = prev.getTime();
      let hi = t.getTime();
      while (hi - lo > DAY) {
        const mid = (lo + hi) / 2;
        if (Math.floor(norm(f(new Date(mid))) / 30) === prevSign) lo = mid;
        else hi = mid;
      }
      out.push({ date: new Date(hi), sign: SIGNS[s] });
    }
    prev = t;
    prevSign = s;
  }
  return out;
}

export function progressions(c: NatalChart, lat: number, lon: number, now = new Date()): Progressions {
  const age = (now.getTime() - c.utc.getTime()) / YEAR;
  const exact = c.timePrecision === 'exact';
  const cusps = exact ? placidusCusps(c.utc, lat, lon) : null;
  const pd = progressedDate(c, now);

  const planets: ProgressedPlanet[] = PROGRESSED.map((body) => {
    const l = tropicalLongitude(body, pd);
    return {
      body,
      lon: l,
      sign: signOf(l),
      degree: l % 30,
      natalSign: c.western.planets.find((p) => p.body === body)!.sign,
      house: cusps ? houseOf(l, cusps) : null,
      retrograde: isRetro(body, pd),
    };
  });

  // Progressed Moon: about 1° a month, so a new sign roughly every two and a half years.
  const moonF = (t: Date) => progressedLon(c, 'Moon', t);
  const back = ingressDates(moonF, addMonths(now, -36), now);
  const fwd = ingressDates(moonF, now, addMonths(now, 36));
  const pMoon = planets[1];

  // Progressed lunation cycle: the Moon–Sun angle grows about 12° a year (about 29.5 years a cycle).
  const angleF = (t: Date) => norm(progressedLon(c, 'Moon', t) - progressedLon(c, 'Sun', t));
  const angle = angleF(now);
  // Shifting the angle by 180° turns a progressed Full Moon into the same wrap from ~360 to ~0.
  const findNewMoon = (dir: 1 | -1, shift = 0): string | null => {
    const at = (t: Date) => norm(angleF(t) - shift);
    let prevA = at(now);
    for (let m = 1; m <= 32 * 12; m++) {
      const t = addMonths(now, dir * m);
      const a = at(t);
      // The angle wraps from ~360 to ~0 going forward (or ~0 to ~360 going back) at a progressed New Moon.
      if (dir === 1 ? a < prevA - 180 : a > prevA + 180) return iso(t);
      prevA = a;
    }
    return null;
  };
  const PHASES = ['New Moon', 'Crescent', 'First Quarter', 'Gibbous', 'Full Moon', 'Disseminating', 'Last Quarter', 'Balsamic'];

  // Progressed angles: the Midheaven moves by the solar arc, and the Ascendant follows from it.
  const natalSun = c.western.planets.find((p) => p.body === 'Sun')!.longitude;
  let angles: Progressions['angles'] = null;
  if (exact) {
    const am = ascendantAndMidheaven(c.utc, lat, lon);
    const mcAt = (t: Date) => norm(am.mc + progressedLon(c, 'Sun', t) - natalSun);
    const ascAt = (t: Date) => ascendantFromMidheaven(mcAt(t), lat, c.utc);
    const pos = (l: number) => ({ lon: l, sign: signOf(l), degree: l % 30 });
    const ingresses = (
      [
        ['Midheaven', mcAt],
        ['Ascendant', ascAt],
      ] as const
    )
      .flatMap(([point, f]) => ingressDates(f, addMonths(now, -60), addMonths(now, 60), 1).map((x) => ({ point, sign: x.sign, date: iso(x.date) })))
      .sort((a, b) => a.date.localeCompare(b.date));
    angles = { asc: pos(ascAt(now)), mc: pos(mcAt(now)), ingresses };
  }

  const ingresses = (['Sun', 'Mercury', 'Venus', 'Mars'] as const)
    .flatMap((b) => ingressDates((t) => progressedLon(c, b, t), addMonths(now, -60), addMonths(now, 60), 3).map((x) => ({ body: b, sign: x.sign, date: iso(x.date) })))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Progressed-to-natal contacts, searched monthly from a year ago to two years ahead.
  const targets = natalPoints(c, lat, lon);
  const months = Array.from({ length: 37 }, (_, i) => addMonths(now, i - 12));
  const track: Record<string, number[]> = {};
  for (const b of PROGRESSED) track[b] = months.map((t) => progressedLon(c, b, t));
  const contacts: ProgressedContact[] = [];
  for (const b of PROGRESSED)
    for (const t of targets)
      for (const a of ASPECTS) {
        if ((b === t.name && a.angle === 0) || !angleAspectOk(t.name, a.name)) continue;
        const orbs = track[b].map((l) => Math.abs(sep(l, t.lon) - a.angle));
        const orbNow = orbs[12];
        let exactAt: string | null = null;
        for (let i = 1; i < orbs.length - 1; i++) if (orbs[i] <= orbs[i - 1] && orbs[i] < orbs[i + 1] && orbs[i] < 0.6) exactAt = iso(months[i]);
        // The Moon makes a contact every few months, so only the year ahead counts for it.
        if (b === 'Moon') {
          if (!exactAt || exactAt < iso(now) || exactAt > iso(addMonths(now, 12))) continue;
        } else if (orbNow > 1 && !exactAt) continue;
        contacts.push({ progressed: b, aspect: a.name, natal: t.name, exact: exactAt, orbNow, applying: orbs[13] < orbNow });
      }
  // The progressed Ascendant against the birth planets (the progressed Midheaven is the solar-arc Midheaven).
  if (exact) {
    const am = ascendantAndMidheaven(c.utc, lat, lon);
    const asc = months.map((t) => ascendantFromMidheaven(norm(am.mc + progressedLon(c, 'Sun', t) - natalSun), lat, c.utc));
    for (const t of targets.filter((x) => !['Ascendant', 'Midheaven', 'Descendant', 'IC'].includes(x.name)))
      for (const a of ASPECTS) {
        const orbs = asc.map((l) => Math.abs(sep(l, t.lon) - a.angle));
        const orbNow = orbs[12];
        let exactAt: string | null = null;
        for (let i = 1; i < orbs.length - 1; i++) if (orbs[i] <= orbs[i - 1] && orbs[i] < orbs[i + 1] && orbs[i] < 0.6) exactAt = iso(months[i]);
        if (orbNow > 1 && !exactAt) continue;
        contacts.push({ progressed: 'Ascendant', aspect: a.name, natal: t.name, exact: exactAt, orbNow, applying: orbs[13] < orbNow });
      }
  }
  contacts.sort((x, y) => (x.exact ?? '9999').localeCompare(y.exact ?? '9999') || x.orbNow - y.orbNow);

  return {
    age,
    planets,
    moon: {
      sign: pMoon.sign,
      house: pMoon.house,
      nextSign: fwd[0]?.sign ?? SIGNS[(SIGNS.indexOf(pMoon.sign) + 1) % 12],
      nextIngress: fwd[0] ? iso(fwd[0].date) : null,
      enteredOn: back.length ? iso(back[back.length - 1].date) : null,
    },
    phase: { angle, name: PHASES[Math.floor(angle / 45) % 8], lastNewMoon: findNewMoon(-1), nextNewMoon: findNewMoon(1), lastFullMoon: findNewMoon(-1, 180), nextFullMoon: findNewMoon(1, 180) },
    angles,
    ingresses,
    contacts,
  };
}

// ─── Solar arc directions ─────────────────────────────────────────────────────

export interface ArcContact {
  directed: string;
  aspect: AspectName;
  natal: string;
  exact: string | null;
  orbNow: number;
}

/** Every natal point moved forward by the progressed Sun's arc; contacts to natal points within the next two years. */
export function solarArc(c: NatalChart, lat: number, lon: number, now = new Date()): { arc: number; contacts: ArcContact[]; directed: { name: string; lon: number }[] } {
  const natalSun = c.western.planets.find((p) => p.body === 'Sun')!.longitude;
  const arcAt = (t: Date) => norm(progressedLon(c, 'Sun', t) - natalSun);
  const pts = natalPoints(c, lat, lon);
  const months = Array.from({ length: 37 }, (_, i) => addMonths(now, i - 12));
  const arcs = months.map(arcAt);
  const contacts: ArcContact[] = [];
  // Solar arc work traditionally uses the hard aspects; sextiles and trines are left out.
  const hard = ASPECTS.filter((a) => a.name === 'conjunct' || a.name === 'square' || a.name === 'opposite');
  for (const d of pts.filter((x) => !['Descendant', 'IC'].includes(x.name)))
    for (const t of pts)
      for (const a of hard) {
        if (d.name === t.name || !angleAspectOk(t.name, a.name)) continue;
        const orbs = arcs.map((arc) => Math.abs(sep(d.lon + arc, t.lon) - a.angle));
        const orbNow = orbs[12];
        let exactAt: string | null = null;
        for (let i = 1; i < orbs.length - 1; i++) if (orbs[i] <= orbs[i - 1] && orbs[i] < orbs[i + 1] && orbs[i] < 0.3) exactAt = iso(months[i]);
        if (!exactAt || exactAt < iso(now)) {
          if (orbNow > 0.5) continue;
        }
        contacts.push({ directed: d.name, aspect: a.name, natal: t.name, exact: exactAt, orbNow });
      }
  contacts.sort((x, y) => (x.exact ?? '9999').localeCompare(y.exact ?? '9999') || x.orbNow - y.orbNow);
  const arc = arcs[12];
  return { arc, contacts, directed: pts.map((p) => ({ name: p.name, lon: norm(p.lon + arc) })) };
}

// ─── The year ahead: slow-planet transits ─────────────────────────────────────

export const SLOW = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;

export interface TransitWindow {
  transiting: (typeof SLOW)[number];
  aspect: AspectName;
  natal: string;
  /** First and last day within the in-effect orb (3°), clipped to the year searched. */
  start: string;
  end: string;
  /** Each date the contact is closest, one per pass (retrogrades can make three). */
  exact: string[];
}

/** How close a slow planet must be to count as in effect: the same orb the Oracle uses for 'in effect now'. */
export const IN_EFFECT = 3;

export function yearAhead(c: NatalChart, lat: number, lon: number, now = new Date(), days = 365): TransitWindow[] {
  const step = 2;
  const samples = Array.from({ length: Math.floor(days / step) + 1 }, (_, i) => new Date(now.getTime() + i * step * DAY));
  const pos: Record<string, number[]> = {};
  for (const m of SLOW) pos[m] = samples.map((d) => tropicalLongitude(m, d));
  const targets = natalPoints(c, lat, lon).filter((t) => !['Uranus', 'Neptune', 'Pluto'].includes(t.name));
  const out: TransitWindow[] = [];
  for (const m of SLOW)
    for (const t of targets)
      for (const a of ASPECTS) {
        if ((m === t.name && a.angle === 0) || !angleAspectOk(t.name, a.name)) continue;
        const orbs = pos[m].map((l) => Math.abs(sep(l, t.lon) - a.angle));
        let i = 0;
        while (i < orbs.length) {
          if (orbs[i] >= IN_EFFECT) {
            i++;
            continue;
          }
          // The span is the whole time the planet is within the in-effect orb, the same span the Oracle
          // names everywhere; it counts as a contact only if it comes within 1 degree of exact.
          const s = i;
          while (i < orbs.length && orbs[i] < IN_EFFECT) i++;
          const e = i - 1;
          if (Math.min(...orbs.slice(s, e + 1)) >= 1) continue;
          // Merge passes split only by sampling; a retrograde return is its own pass, as in the Oracle.
          const exact: string[] = [];
          for (let k = s; k <= e; k++) if (orbs[k] < 1 && (k === 0 || orbs[k] <= orbs[k - 1]) && (k === orbs.length - 1 || orbs[k] < orbs[k + 1])) exact.push(iso(samples[k]));
          const prev = out[out.length - 1];
          if (prev && prev.transiting === m && prev.natal === t.name && prev.aspect === a.name && new Date(iso(samples[s])).getTime() - new Date(prev.end).getTime() < 10 * DAY) {
            prev.end = iso(samples[e]);
            prev.exact.push(...exact);
          } else out.push({ transiting: m, aspect: a.name, natal: t.name, start: iso(samples[s]), end: iso(samples[e]), exact });
        }
      }
  return out.sort((x, y) => x.start.localeCompare(y.start));
}

// ─── Solar return ─────────────────────────────────────────────────────────────

export interface SolarReturn {
  date: Date;
  ascendant: string;
  ascDegree: number;
  midheaven: string;
  sunHouse: number | null;
  moonSign: string;
  moonHouse: number | null;
  /** Natal house the solar-return Ascendant falls in. */
  ascInNatalHouse: number | null;
}

/** The most recent return of the Sun to its birth longitude, cast for the given place. */
export function solarReturn(c: NatalChart, lat: number, lon: number, now = new Date()): SolarReturn | null {
  if (c.timePrecision !== 'exact') return null;
  const natalSun = c.western.planets.find((p) => p.body === 'Sun')!.longitude;
  const findNear = (guess: Date) => {
    let t = guess.getTime();
    for (let k = 0; k < 8; k++) {
      const diff = ((natalSun - tropicalLongitude('Sun', new Date(t)) + 540) % 360) - 180;
      t += (diff / 0.9856) * DAY;
      if (Math.abs(diff) < 1e-5) break;
    }
    return new Date(t);
  };
  const birthday = new Date(c.utc);
  birthday.setUTCFullYear(now.getUTCFullYear());
  let sr = findNear(birthday);
  if (sr > now) {
    birthday.setUTCFullYear(now.getUTCFullYear() - 1);
    sr = findNear(birthday);
  }
  const am = ascendantAndMidheaven(sr, lat, lon);
  const cusps = placidusCusps(sr, lat, lon);
  const natalCusps = placidusCusps(c.utc, lat, lon);
  const moon = tropicalLongitude('Moon', sr);
  return {
    date: sr,
    ascendant: signOf(am.asc),
    ascDegree: am.asc % 30,
    midheaven: signOf(am.mc),
    sunHouse: cusps ? houseOf(natalSun, cusps) : null,
    moonSign: signOf(moon),
    moonHouse: cusps ? houseOf(moon, cusps) : null,
    ascInNatalHouse: natalCusps ? houseOf(am.asc, natalCusps) : null,
  };
}

export type { BodyName };
