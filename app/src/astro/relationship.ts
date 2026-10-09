/**
 * Two charts together: full synastry (both directions, with the North Node and angles), house
 * overlays, the composite chart with midpoint houses, the Davison chart (the real sky at the midpoint
 * in time and place), progressed synastry, the relationship's timeline (slow transits to the
 * composite), and the Vedic factors of compatibility read one by one. Calculation only; the words
 * live in src/content/relationship.ts.
 */
import { ascendantAndMidheaven, houseOf, norm, placidusCusps, SIGNS, tropicalLongitude, BODIES } from './chart';
import type { NatalChart } from './natal';
import { progressions } from './progressions';

export interface Place {
  lat: number;
  lon: number;
}
export type Aspect = 'conjunct' | 'sextile' | 'square' | 'trine' | 'opposite';
export interface Point {
  name: string;
  lon: number;
}
export interface CrossAspect {
  /** The first person's point and the second's. */
  a: string;
  b: string;
  aspect: Aspect;
  orb: number;
}

const ASPECTS: { name: Aspect; angle: number; orb: number }[] = [
  { name: 'conjunct', angle: 0, orb: 7 },
  { name: 'opposite', angle: 180, orb: 7 },
  { name: 'square', angle: 90, orb: 6 },
  { name: 'trine', angle: 120, orb: 6 },
  { name: 'sextile', angle: 60, orb: 4 },
];
const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const signIdx = (lon: number) => Math.floor(norm(lon) / 30);
const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const LUMINARY = ['Sun', 'Moon'];
const ANGLES = ['Ascendant', 'Midheaven'];

/** A chart's points: the planets, the North Node, and the angles when the birth time is exact. */
export function pointsOf(c: NatalChart, place: Place): Point[] {
  const pts = c.western.planets.map((p) => ({ name: p.body === 'Node' ? 'North Node' : p.body, lon: p.longitude }));
  if (c.timePrecision === 'exact') {
    const am = ascendantAndMidheaven(c.utc, place.lat, place.lon);
    pts.push({ name: 'Ascendant', lon: am.asc }, { name: 'Midheaven', lon: am.mc });
  }
  return pts;
}

/** Every major aspect between one chart's points and the other's. Tighter orbs for slow and angle pairs. */
export function crossAspects(a: Point[], b: Point[]): CrossAspect[] {
  const out: CrossAspect[] = [];
  for (const x of a)
    for (const y of b) {
      const s = sep(x.lon, y.lon);
      const slow = ['Uranus', 'Neptune', 'Pluto', 'North Node'].includes(x.name) && ['Uranus', 'Neptune', 'Pluto', 'North Node'].includes(y.name);
      if (slow) continue; // generational: the same for most people of the same age
      for (const m of ASPECTS) {
        const wide = LUMINARY.includes(x.name) || LUMINARY.includes(y.name) ? 1 : 0;
        const tight = ANGLES.includes(x.name) || ANGLES.includes(y.name) || x.name === 'North Node' || y.name === 'North Node' ? -2 : 0;
        const orb = Math.abs(s - m.angle);
        if (orb <= m.orb + wide + tight) out.push({ a: x.name, b: y.name, aspect: m.name, orb });
      }
    }
  return out.sort((p, q) => p.orb - q.orb);
}

export interface CompositePoint extends Point {
  sign: string;
  house: number | null;
}

/** Midpoint on the shorter arc. */
const mid = (x: number, y: number) => norm(x + (((y - x + 540) % 360) - 180) / 2);

/** The composite chart: midpoints of each pair, with midpoint-cusp houses when both times are exact. */
export function composite(a: NatalChart, aPlace: Place, b: NatalChart, bPlace: Place): { points: CompositePoint[]; cusps: number[] | null } {
  const pa = pointsOf(a, aPlace);
  const pb = pointsOf(b, bPlace);
  const ca = a.timePrecision === 'exact' ? placidusCusps(a.utc, aPlace.lat, aPlace.lon) : null;
  const cb = b.timePrecision === 'exact' ? placidusCusps(b.utc, bPlace.lat, bPlace.lon) : null;
  const cusps = ca && cb ? ca.map((x, i) => mid(x, cb[i])) : null;
  // Keep the cusps in zodiac order: the midpoint of the 1st and 7th can flip by 180°.
  if (cusps) for (let i = 6; i < 12; i++) cusps[i] = norm(cusps[i - 6] + 180);
  const points = pa
    .map((x) => {
      const y = pb.find((p) => p.name === x.name);
      if (!y) return null;
      const lon = x.name === 'Ascendant' && cusps ? cusps[0] : x.name === 'Midheaven' && cusps ? cusps[9] : mid(x.lon, y.lon);
      return { name: x.name, lon, sign: SIGNS[signIdx(lon)], house: cusps ? houseOf(lon, cusps) : null };
    })
    .filter((p): p is CompositePoint => !!p);
  return { points, cusps };
}

/** The Davison chart: the actual sky at the midpoint in time between two births, over the midpoint in space. */
export function davison(a: NatalChart, aPlace: Place, b: NatalChart, bPlace: Place) {
  const when = new Date((a.utc.getTime() + b.utc.getTime()) / 2);
  const lat = (aPlace.lat + bPlace.lat) / 2;
  const lon = mid(aPlace.lon, bPlace.lon) > 180 ? mid(aPlace.lon, bPlace.lon) - 360 : mid(aPlace.lon, bPlace.lon);
  const exact = a.timePrecision === 'exact' && b.timePrecision === 'exact';
  const cusps = exact ? placidusCusps(when, lat, lon) : null;
  const points: CompositePoint[] = BODIES.map((body) => {
    const l = tropicalLongitude(body, when);
    return { name: body, lon: l, sign: SIGNS[signIdx(l)], house: cusps ? houseOf(l, cusps) : null };
  });
  if (exact) {
    const am = ascendantAndMidheaven(when, lat, lon);
    points.push({ name: 'Ascendant', lon: am.asc, sign: SIGNS[signIdx(am.asc)], house: 1 }, { name: 'Midheaven', lon: am.mc, sign: SIGNS[signIdx(am.mc)], house: 10 });
  }
  return { when, lat, lon, points, cusps };
}

export interface ProgressedContact {
  /** Whose progressed planet: 'a' (the first person) or 'b'. */
  who: 'a' | 'b';
  progressed: string;
  natal: string;
  aspect: Aspect;
  orb: number;
  applying: boolean;
}

/** Each person's progressed Sun, Moon, Mercury, Venus, and Mars against the other's birth chart (1° orb). */
export function progressedSynastry(a: NatalChart, aPlace: Place, b: NatalChart, bPlace: Place, now = new Date()): ProgressedContact[] {
  const out: ProgressedContact[] = [];
  const soon = new Date(now.getTime() + 365 * DAY);
  for (const [who, me, myPlace, them, theirPlace] of [['a', a, aPlace, b, bPlace], ['b', b, bPlace, a, aPlace]] as const) {
    const pNow = progressions(me, myPlace.lat, myPlace.lon, now).planets;
    const pSoon = progressions(me, myPlace.lat, myPlace.lon, soon).planets;
    for (const p of pNow)
      for (const t of pointsOf(them, theirPlace)) {
        if (['Uranus', 'Neptune', 'Pluto'].includes(t.name)) continue;
        for (const m of ASPECTS) {
          const orb = Math.abs(sep(p.lon, t.lon) - m.angle);
          const later = Math.abs(sep(pSoon.find((x) => x.body === p.body)!.lon, t.lon) - m.angle);
          if (orb <= (p.body === 'Moon' ? 1.5 : 1)) out.push({ who, progressed: p.body, natal: t.name, aspect: m.name, orb, applying: later < orb });
        }
      }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

export interface TimelineHit {
  date: string;
  mover: string;
  aspect: Aspect;
  point: string;
  /** All exact passes inside the year (retrogrades can make three). */
  passes: string[];
}

/** The relationship's year: Jupiter to Pluto and the eclipse-season nodes crossing the composite's key points. */
export function relationshipTimeline(comp: CompositePoint[], now = new Date(), days = 365): TimelineHit[] {
  const targets = comp.filter((p) => ['Sun', 'Moon', 'Venus', 'Mars', 'Ascendant', 'Midheaven'].includes(p.name));
  const movers = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  const step = 2;
  const samples = Array.from({ length: Math.floor(days / step) + 1 }, (_, i) => new Date(now.getTime() + i * step * DAY));
  const out: TimelineHit[] = [];
  for (const m of movers) {
    const pos = samples.map((d) => tropicalLongitude(m, d));
    for (const t of targets)
      for (const a of ASPECTS.filter((x) => x.name !== 'sextile')) {
        const orbs = pos.map((l) => Math.abs(sep(l, t.lon) - a.angle));
        const passes: string[] = [];
        for (let i = 1; i < orbs.length - 1; i++) if (orbs[i] <= orbs[i - 1] && orbs[i] < orbs[i + 1] && orbs[i] < 1) passes.push(iso(samples[i]));
        if (orbs[0] < 1 && orbs[0] < orbs[1]) passes.unshift(iso(samples[0]));
        if (passes.length) out.push({ date: passes[0], mover: m, aspect: a.name, point: t.name, passes });
      }
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

// ─── Vedic compatibility, factor by factor (no total score) ───────────────────

export type Koota = 'Varna' | 'Tara' | 'Yoni' | 'Graha Maitri' | 'Gana' | 'Bhakoot' | 'Nadi';
export interface KootaRead {
  koota: Koota;
  tone: 'harmony' | 'mixed' | 'care';
  detail: string;
}

const VARNA: Record<string, number> = { Cancer: 4, Scorpio: 4, Pisces: 4, Aries: 3, Leo: 3, Sagittarius: 3, Taurus: 2, Virgo: 2, Capricorn: 2, Gemini: 1, Libra: 1, Aquarius: 1 };
const RULER: Record<string, string> = { Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter' };
/** Natural friendships (Parashara): friends and enemies; everyone else is neutral. */
const FRIENDS: Record<string, [string[], string[]]> = {
  Sun: [['Moon', 'Mars', 'Jupiter'], ['Venus', 'Saturn']],
  Moon: [['Sun', 'Mercury'], []],
  Mars: [['Sun', 'Moon', 'Jupiter'], ['Mercury']],
  Mercury: [['Sun', 'Venus'], ['Moon']],
  Jupiter: [['Sun', 'Moon', 'Mars'], ['Mercury', 'Venus']],
  Venus: [['Mercury', 'Saturn'], ['Sun', 'Moon']],
  Saturn: [['Mercury', 'Venus'], ['Sun', 'Moon', 'Mars']],
};
const YONI_ENEMY: [string, string][] = [['horse', 'buffalo'], ['elephant', 'lion'], ['sheep', 'monkey'], ['serpent', 'mongoose'], ['dog', 'deer'], ['cat', 'rat'], ['cow', 'tiger']];
const NADI = (i: number) => (['Adi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Adi'] as const)[i % 6];
const relation = (x: string, y: string) => (FRIENDS[x][0].includes(y) ? 'friend' : FRIENDS[x][1].includes(y) ? 'enemy' : 'neutral');

export interface VedicSide {
  rashi: string;
  sign: string;
  nakshatra: string;
  index: number;
  gana: string;
  yoni: string;
}

export function kootas(a: VedicSide, b: VedicSide): KootaRead[] {
  const out: KootaRead[] = [];
  const va = VARNA[a.sign];
  const vb = VARNA[b.sign];
  out.push({ koota: 'Varna', tone: va === vb ? 'harmony' : 'mixed', detail: va === vb ? 'same temperament' : 'different temperaments' });
  const tara = (from: number, to: number) => ((((to - from + 27) % 27) + 1) % 9) || 9;
  const bad = [3, 5, 7];
  const t1 = bad.includes(tara(a.index, b.index));
  const t2 = bad.includes(tara(b.index, a.index));
  out.push({ koota: 'Tara', tone: !t1 && !t2 ? 'harmony' : t1 && t2 ? 'care' : 'mixed', detail: `${!t1 && !t2 ? 'supportive both ways' : t1 && t2 ? 'challenging both ways' : 'supportive one way'}` });
  const enemy = YONI_ENEMY.some(([x, y]) => (x === a.yoni && y === b.yoni) || (y === a.yoni && x === b.yoni));
  out.push({ koota: 'Yoni', tone: a.yoni === b.yoni ? 'harmony' : enemy ? 'care' : 'mixed', detail: `${a.yoni} and ${b.yoni}` });
  const la = RULER[a.sign];
  const lb = RULER[b.sign];
  const r1 = la === lb ? 'friend' : relation(la, lb);
  const r2 = la === lb ? 'friend' : relation(lb, la);
  out.push({ koota: 'Graha Maitri', tone: r1 === 'friend' && r2 === 'friend' ? 'harmony' : r1 === 'enemy' || r2 === 'enemy' ? 'care' : 'mixed', detail: `${la} and ${lb}` });
  out.push({ koota: 'Gana', tone: a.gana === b.gana ? 'harmony' : [a.gana, b.gana].includes('Rakshasa') && [a.gana, b.gana].includes('Deva') ? 'care' : 'mixed', detail: `${a.gana} and ${b.gana}` });
  const dist = ((SIGNS.indexOf(b.sign) - SIGNS.indexOf(a.sign) + 12) % 12) + 1;
  const pair = [dist, 14 - dist].sort((x, y) => x - y).join('/');
  out.push({ koota: 'Bhakoot', tone: ['2/12', '5/9', '6/8'].includes(pair) ? 'care' : 'harmony', detail: `Moons ${pair === '1/13' ? 'in the same sign' : `${pair.replace('/', ' and ')} from each other`}` });
  const na = NADI(a.index);
  const nb = NADI(b.index);
  out.push({ koota: 'Nadi', tone: na === nb ? 'care' : 'harmony', detail: `${na} and ${nb}` });
  return out;
}
