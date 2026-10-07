/**
 * Calculations behind the subscriber "deep" readings (docs/readings-engine.md, Route A).
 * Everything here derives from the natal chart (natal.ts) or from Astronomy Engine positions;
 * nothing is interpretive. Interpretation lives in src/content/deep*.ts.
 */
import * as Astronomy from 'astronomy-engine';
import { antardashas, ascendantAndMidheaven, BODIES, houseOf, norm, placidusCusps, RASHIS, SIGNS, tropicalLongitude, type DashaPeriod } from './chart';
import type { NatalChart } from './natal';

const signIdx = (lon: number) => Math.floor(norm(lon) / 30);
const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

// ─── Vedic divisional charts ──────────────────────────────────────────────────

/** Navamsa (D9): each rashi split into nine parts of 3°20′, counted continuously from Aries. */
export function navamsaSign(siderealLon: number): number {
  const lon = norm(siderealLon);
  return (signIdx(lon) * 9 + Math.floor((lon % 30) / (30 / 9))) % 12;
}

/** Dashamsa (D10): ten parts of 3°; odd signs count from themselves, even signs from the 9th. */
export function dashamsaSign(siderealLon: number): number {
  const lon = norm(siderealLon);
  const s = signIdx(lon);
  const start = s % 2 === 0 ? s : (s + 8) % 12; // index 0 = Aries, an odd sign
  return (start + Math.floor((lon % 30) / 3)) % 12;
}

export interface Varga {
  body: string;
  d1: string;
  d9: string;
  d10: string;
  vargottama: boolean;
}

export function vargas(c: NatalChart): { grahas: Varga[]; d9Lagna: string | null; d10Lagna: string | null } {
  const grahas = c.vedic.planets.map((p) => {
    const d9 = navamsaSign(p.longitude);
    return { body: p.body, d1: RASHIS[signIdx(p.longitude)], d9: RASHIS[d9], d10: RASHIS[dashamsaSign(p.longitude)], vargottama: d9 === signIdx(p.longitude) };
  });
  let d9Lagna: string | null = null;
  let d10Lagna: string | null = null;
  if (c.vedic.lagna.certain && c.timePrecision === 'exact') {
    // The lagna's sidereal longitude is needed for its divisional signs.
    const lagnaSid = c.vedic.lagnaLongitude;
    if (lagnaSid !== null) {
      d9Lagna = RASHIS[navamsaSign(lagnaSid)];
      d10Lagna = RASHIS[dashamsaSign(lagnaSid)];
    }
  }
  return { grahas, d9Lagna, d10Lagna };
}

// ─── Vedic aspects (graha drishti) ────────────────────────────────────────────

/** Whole-sign aspects: every graha aspects the 7th; Mars also 4th and 8th, Jupiter 5th and 9th, Saturn 3rd and 10th. */
const SPECIAL: Record<string, number[]> = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
export function drishti(c: NatalChart): { from: string; to: string; nth: number }[] {
  const g = c.vedic.planets.filter((p) => !['Rahu', 'Ketu'].includes(p.body));
  const out: { from: string; to: string; nth: number }[] = [];
  for (const a of g)
    for (const b of g) {
      if (a.body === b.body) continue;
      const nth = ((signIdx(b.longitude) - signIdx(a.longitude) + 12) % 12) + 1;
      if ((SPECIAL[a.body] ?? [7]).includes(nth)) out.push({ from: a.body, to: b.body, nth });
    }
  return out;
}

// ─── Vedic house lordship yogas ───────────────────────────────────────────────

const LORD: Record<number, string> = { 0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury', 6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter' };
const EXALT: Record<string, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBIL: Record<string, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };

export interface LordshipYoga {
  name: 'Raja' | 'Dhana' | 'Viparita Raja' | 'Neecha Bhanga Raja';
  grahas: string[];
  houses: number[];
  how: string;
}

/** Classical combinations between house lords, counted from the lagna (needs an exact lagna). */
export function lordshipYogas(c: NatalChart): LordshipYoga[] {
  if (!c.vedic.lagna.certain || c.vedic.lagnaLongitude === null) return [];
  const lagna = signIdx(c.vedic.lagnaLongitude);
  const lordOf = (house: number) => LORD[(lagna + house - 1) % 12];
  const sign = (b: string) => signIdx(c.vedic.planets.find((p) => p.body === b)!.longitude);
  const houseOfG = (b: string) => ((sign(b) - lagna + 12) % 12) + 1;
  // Conjunct, mutually opposite (7th from each other), or exchanging signs (parivartana).
  const together = (a: string, b: string) =>
    a !== b && (sign(a) === sign(b) || (sign(a) - sign(b) + 12) % 12 === 6 || (LORD[sign(a)] === b && LORD[sign(b)] === a));
  const out: LordshipYoga[] = [];
  const seen = new Set<string>();
  const add = (y: LordshipYoga) => {
    const k = y.name + y.grahas.slice().sort().join();
    if (!seen.has(k)) (seen.add(k), out.push(y));
  };
  // Raja: a kendra lord with a trikona lord (conjunct, opposite, or exchanging signs).
  for (const k of [1, 4, 7, 10])
    for (const t of [1, 5, 9]) {
      const a = lordOf(k);
      const b = lordOf(t);
      if (k !== t && together(a, b)) add({ name: 'Raja', grahas: [a, b], houses: [k, t], how: sign(a) === sign(b) ? 'together in one sign' : LORD[sign(a)] === b ? 'exchanging signs' : 'facing each other' });
    }
  // Dhana: lords of the 2nd/11th with lords of the 5th/9th.
  for (const w of [2, 11])
    for (const t of [5, 9]) {
      const a = lordOf(w);
      const b = lordOf(t);
      if (together(a, b)) add({ name: 'Dhana', grahas: [a, b], houses: [w, t], how: sign(a) === sign(b) ? 'together in one sign' : LORD[sign(a)] === b ? 'exchanging signs' : 'facing each other' });
    }
  // Viparita Raja: lords of the 6th, 8th, or 12th placed in the 6th, 8th, or 12th.
  for (const d of [6, 8, 12]) {
    const l = lordOf(d);
    if ([6, 8, 12].includes(houseOfG(l)) && houseOfG(l) !== d) add({ name: 'Viparita Raja', grahas: [l], houses: [d, houseOfG(l)], how: `lord of the ${d}th in the ${houseOfG(l)}th` });
  }
  // Neecha Bhanga: a debilitated graha whose sign's lord, or the lord of its exaltation sign, is in a kendra from the lagna.
  for (const [g, d] of Object.entries(DEBIL)) {
    if (sign(g) !== d) continue;
    const dispositor = LORD[d];
    const exaltLord = LORD[EXALT[g]];
    const helper = [dispositor, exaltLord].find((h) => [1, 4, 7, 10].includes(houseOfG(h)));
    if (helper) add({ name: 'Neecha Bhanga Raja', grahas: [g, helper], houses: [houseOfG(g), houseOfG(helper)], how: `${helper} in a kendra cancels the debilitation` });
  }
  return out;
}

/** Third-level dasha periods (pratyantardasha) inside an antardasha, in Vimshottari proportion. */
export function pratyantardashas(antar: DashaPeriod): DashaPeriod[] {
  return antardashas(antar);
}

// ─── Western deep structure ───────────────────────────────────────────────────

export interface NatalAspect {
  a: string;
  b: string;
  aspect: 'conjunction' | 'sextile' | 'square' | 'trine' | 'quincunx' | 'opposition';
  orb: number;
}
const MAJOR = [
  { name: 'conjunction', angle: 0, orb: 8 },
  { name: 'sextile', angle: 60, orb: 4 },
  { name: 'square', angle: 90, orb: 7 },
  { name: 'trine', angle: 120, orb: 7 },
  { name: 'quincunx', angle: 150, orb: 3 },
  { name: 'opposition', angle: 180, orb: 8 },
] as const;

export function allAspects(c: NatalChart): NatalAspect[] {
  const ps = c.western.planets.filter((p) => p.body !== 'Node');
  const out: NatalAspect[] = [];
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const s = sep(ps[i].longitude, ps[j].longitude);
      for (const a of MAJOR) {
        const orb = Math.abs(s - a.angle);
        if (orb <= a.orb) out.push({ a: ps[i].body, b: ps[j].body, aspect: a.name, orb });
      }
    }
  return out.sort((x, y) => x.orb - y.orb);
}

export interface Pattern {
  name: 'Stellium' | 'Grand trine' | 'T-square' | 'Grand cross' | 'Yod';
  bodies: string[];
  where: string;
}

export function aspectPatterns(c: NatalChart): Pattern[] {
  const asp = allAspects(c);
  const has = (a: string, b: string, kind: NatalAspect['aspect']) => asp.some((x) => x.aspect === kind && ((x.a === a && x.b === b) || (x.a === b && x.b === a)));
  const bodies = c.western.planets.filter((p) => p.body !== 'Node').map((p) => p.body);
  const out: Pattern[] = [];
  // Stellium: three or more planets in one sign.
  const bySign = new Map<string, string[]>();
  for (const p of c.western.planets.filter((x) => x.body !== 'Node')) bySign.set(p.sign, [...(bySign.get(p.sign) ?? []), p.body]);
  for (const [s, bs] of bySign) if (bs.length >= 3) out.push({ name: 'Stellium', bodies: bs, where: s });
  const combos = <T,>(xs: T[], k: number): T[][] => (k === 0 ? [[]] : xs.flatMap((x, i) => combos(xs.slice(i + 1), k - 1).map((r) => [x, ...r])));
  for (const [a, b, d] of combos(bodies, 3)) {
    if (has(a, b, 'trine') && has(b, d, 'trine') && has(a, d, 'trine')) out.push({ name: 'Grand trine', bodies: [a, b, d], where: c.western.planets.find((p) => p.body === a)!.sign });
    for (const [x, y, apex] of [[a, b, d], [a, d, b], [b, d, a]]) {
      if (has(x, y, 'opposition') && has(x, apex, 'square') && has(y, apex, 'square')) out.push({ name: 'T-square', bodies: [x, y, apex], where: `apex ${apex}` });
      if (has(x, y, 'sextile') && has(x, apex, 'quincunx') && has(y, apex, 'quincunx')) out.push({ name: 'Yod', bodies: [x, y, apex], where: `apex ${apex}` });
    }
  }
  for (const [a, b, d, e] of combos(bodies, 4)) {
    const ops = [[a, b, d, e], [a, d, b, e], [a, e, b, d]].find(([w, x, y, z]) => has(w, x, 'opposition') && has(y, z, 'opposition'));
    if (ops) {
      const [w, x, y, z] = ops;
      if (has(w, y, 'square') && has(w, z, 'square') && has(x, y, 'square') && has(x, z, 'square')) out.push({ name: 'Grand cross', bodies: [w, x, y, z], where: c.western.planets.find((p) => p.body === w)!.sign });
    }
  }
  // A grand cross contains T-squares; report only the larger figure.
  const crosses = out.filter((p) => p.name === 'Grand cross');
  return out.filter((p) => !(p.name === 'T-square' && crosses.some((g) => p.bodies.every((b) => g.bodies.includes(b)))));
}

const TRAD_RULER: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

/** Where each house's ruling planet sits (needs exact birth time and Placidus houses). */
export function houseRulers(c: NatalChart, lat: number, lon: number): { house: number; sign: string; ruler: string; rulerHouse: number }[] {
  if (c.timePrecision !== 'exact') return [];
  const cusps = placidusCusps(c.utc, lat, lon);
  if (!cusps) return [];
  return cusps.map((cusp, i) => {
    const sign = SIGNS[signIdx(cusp)];
    const ruler = TRAD_RULER[sign];
    const p = c.western.planets.find((x) => x.body === ruler)!;
    return { house: i + 1, sign, ruler, rulerHouse: houseOf(p.longitude, cusps) };
  });
}

/** A simple dominance score: chart ruler, angularity, aspect count, dignity. */
export function dominantPlanet(c: NatalChart): { body: string; reasons: string[] } {
  const asp = allAspects(c);
  const ascRuler = c.western.ascendant.certain ? TRAD_RULER[c.western.ascendant.value!] : null;
  const DOMICILE: Record<string, string[]> = { Sun: ['Leo'], Moon: ['Cancer'], Mercury: ['Gemini', 'Virgo'], Venus: ['Taurus', 'Libra'], Mars: ['Aries', 'Scorpio'], Jupiter: ['Sagittarius', 'Pisces'], Saturn: ['Capricorn', 'Aquarius'] };
  const EX: Record<string, string> = { Sun: 'Aries', Moon: 'Taurus', Mercury: 'Virgo', Venus: 'Pisces', Mars: 'Capricorn', Jupiter: 'Cancer', Saturn: 'Libra' };
  const scored = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].map((b) => {
    const p = c.western.planets.find((x) => x.body === b)!;
    const reasons: string[] = [];
    let s = 0;
    if (b === ascRuler) (s += 3, reasons.push('rules your rising sign'));
    if (p.house && [1, 4, 7, 10].includes(p.house)) (s += 2, reasons.push(`sits on an angle (house ${p.house})`));
    if (DOMICILE[b]?.includes(p.sign)) (s += 2, reasons.push(`is in its own sign, ${p.sign}`));
    if (EX[b] === p.sign) (s += 2, reasons.push(`is exalted in ${p.sign}`));
    const n = asp.filter((x) => (x.a === b || x.b === b) && x.orb < 4).length;
    if (n >= 3) (s += 1, reasons.push(`makes ${n} close aspects`));
    return { body: b, s, reasons };
  });
  scored.sort((a, b) => b.s - a.s);
  return { body: scored[0].body, reasons: scored[0].reasons };
}

// ─── Timing: the month ahead ──────────────────────────────────────────────────

export interface TransitEvent {
  date: string; // YYYY-MM-DD, the day it is closest to exact
  transiting: string;
  aspect: 'conjunct' | 'sextile' | 'square' | 'trine' | 'opposite';
  natal: string;
  orb: number;
}
export interface LunarEvent {
  date: string;
  kind: 'New Moon' | 'Full Moon';
  sign: string;
  house: number | null;
  eclipse: boolean;
}
export interface Station {
  date: string;
  body: string;
  turns: 'retrograde' | 'direct';
  sign: string;
}

const T_ASPECTS = [
  { name: 'conjunct', angle: 0 },
  { name: 'sextile', angle: 60 },
  { name: 'square', angle: 90 },
  { name: 'trine', angle: 120 },
  { name: 'opposite', angle: 180 },
] as const;
const day = (d: Date) => d.toISOString().slice(0, 10);

/** Transits from start for `days`, with the date each aspect is closest to exact (within 1°). */
export function monthAhead(c: NatalChart, start: Date, days = 30, lat?: number, lon?: number) {
  const movers = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  const targets: { name: string; lon: number }[] = c.western.planets.filter((p) => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(p.body)).map((p) => ({ name: p.body, lon: p.longitude }));
  if (c.timePrecision === 'exact' && lat !== undefined && lon !== undefined) {
    const am = ascendantAndMidheaven(c.utc, lat, lon);
    targets.push({ name: 'Ascendant', lon: am.asc }, { name: 'Midheaven', lon: am.mc });
  }
  const samples = Array.from({ length: days + 2 }, (_, i) => new Date(start.getTime() + (i - 1) * 86400000 + 43200000));
  const pos: Record<string, number[]> = {};
  for (const m of movers) pos[m] = samples.map((d) => tropicalLongitude(m, d));

  const transits: TransitEvent[] = [];
  for (const m of movers)
    for (const t of targets)
      for (const a of T_ASPECTS) {
        if (m === t.name && a.angle === 0) continue;
        const orbs = pos[m].map((l) => Math.abs(sep(l, t.lon) - a.angle));
        for (let i = 1; i < orbs.length - 1; i++) {
          // Local minimum inside the window, close to exact.
          if (orbs[i] <= orbs[i - 1] && orbs[i] < orbs[i + 1] && orbs[i] < 1) transits.push({ date: day(samples[i]), transiting: m, aspect: a.name, natal: t.name, orb: orbs[i] });
        }
      }
  // Fast movers make many contacts; keep the meaningful ones (slow planets always; fast ones to Sun, Moon, Venus, angles).
  const keep = transits.filter((t) => ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Mars'].includes(t.transiting) || ['Sun', 'Moon', 'Venus', 'Ascendant', 'Midheaven'].includes(t.natal));
  keep.sort((x, y) => x.date.localeCompare(y.date) || x.orb - y.orb);

  // New and Full Moons, and whether they are eclipses.
  const lunar: LunarEvent[] = [];
  const end = new Date(start.getTime() + days * 86400000);
  const cusps = c.timePrecision === 'exact' && lat !== undefined && lon !== undefined ? placidusCusps(c.utc, lat, lon) : null;
  for (const [phase, kind] of [[0, 'New Moon'], [180, 'Full Moon']] as const) {
    let t = Astronomy.SearchMoonPhase(phase, Astronomy.MakeTime(start), days + 1);
    while (t && t.date < end) {
      const moonLon = tropicalLongitude('Moon', t.date);
      const sunLon = tropicalLongitude('Sun', t.date);
      const nodeLon = c.western.planets.find((p) => p.body === 'Node') ? meanNodeAt(t.date) : 0;
      // Eclipse season: the lunation falls within about 15° of the lunar node axis.
      const nearNode = Math.min(sep(phase === 0 ? sunLon : moonLon, nodeLon), sep(phase === 0 ? sunLon : moonLon, nodeLon + 180)) < 15;
      lunar.push({ date: day(t.date), kind, sign: SIGNS[signIdx(moonLon)], house: cusps ? houseOf(moonLon, cusps) : null, eclipse: nearNode });
      t = Astronomy.SearchMoonPhase(phase, t.AddDays(1), days + 1);
    }
  }
  lunar.sort((a, b) => a.date.localeCompare(b.date));

  // Retrograde and direct stations.
  const stations: Station[] = [];
  for (const m of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const) {
    const speeds = pos[m].map((l, i, a) => (i === 0 ? 0 : ((l - a[i - 1] + 540) % 360) - 180));
    for (let i = 2; i < speeds.length; i++) {
      if (speeds[i - 1] >= 0 && speeds[i] < 0) stations.push({ date: day(samples[i]), body: m, turns: 'retrograde', sign: SIGNS[signIdx(pos[m][i])] });
      if (speeds[i - 1] < 0 && speeds[i] >= 0) stations.push({ date: day(samples[i]), body: m, turns: 'direct', sign: SIGNS[signIdx(pos[m][i])] });
    }
  }
  return { transits: keep, lunar, stations };
}

function meanNodeAt(d: Date) {
  const T = Astronomy.MakeTime(d).tt / 36525;
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
}

/** Dasha sub-periods (antar and pratyantar) that start within the next `months`. */
export function dashaCalendar(c: NatalChart, from: Date, months = 24) {
  const out: { level: 'antardasha' | 'pratyantardasha'; lord: string; within: string; start: string; end: string }[] = [];
  if (!c.vedic.dashas) return out;
  const until = new Date(from.getTime() + months * 30.44 * 86400000);
  for (const maha of c.vedic.dashas) {
    if (maha.end < from || maha.start > until) continue;
    for (const antar of antardashas(maha)) {
      if (antar.end < from || antar.start > until) continue;
      out.push({ level: 'antardasha', lord: antar.lord, within: maha.lord, start: day(antar.start), end: day(antar.end) });
      for (const p of pratyantardashas(antar)) if (p.end >= from && p.start <= until) out.push({ level: 'pratyantardasha', lord: p.lord, within: `${maha.lord}–${antar.lord}`, start: day(p.start), end: day(p.end) });
    }
  }
  return out;
}

// ─── Two charts ───────────────────────────────────────────────────────────────

export function synastry(a: NatalChart, b: NatalChart, bCusps: number[] | null, aCusps: number[] | null) {
  const pa = a.western.planets.filter((p) => p.body !== 'Node');
  const pb = b.western.planets.filter((p) => p.body !== 'Node');
  const aspects: NatalAspect[] = [];
  for (const x of pa)
    for (const y of pb) {
      const s = sep(x.longitude, y.longitude);
      for (const m of MAJOR) {
        const orb = Math.abs(s - m.angle);
        if (orb <= Math.min(m.orb, 6)) aspects.push({ a: x.body, b: y.body, aspect: m.name, orb });
      }
    }
  aspects.sort((x, y) => x.orb - y.orb);
  const overlays = {
    theirsInMine: aCusps ? pb.map((p) => ({ body: p.body, house: houseOf(p.longitude, aCusps) })) : [],
    mineInTheirs: bCusps ? pa.map((p) => ({ body: p.body, house: houseOf(p.longitude, bCusps) })) : [],
  };
  // Composite: midpoint of each pair of planets, on the shorter arc.
  const composite = pa.map((x) => {
    const y = pb.find((p) => p.body === x.body)!;
    const mid = norm(x.longitude + (((y.longitude - x.longitude + 540) % 360) - 180) / 2);
    return { body: x.body, sign: SIGNS[signIdx(mid)], longitude: mid };
  });
  return { aspects, overlays, composite };
}

export { BODIES };
