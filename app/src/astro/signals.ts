/**
 * Chart signals for the Patterns screen: the facts a pattern rule can test, in one place.
 * Calculation only; which signals make a pattern lives in src/content/patternRules.ts.
 */
import { ascendantAndMidheaven } from './chart';
import { allAspects, aspectPatterns } from './deep';
import type { NatalChart } from './natal';
import { vedicYogas } from '../content/fullReading';

const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const ELEMENT: Record<string, 'fire' | 'earth' | 'air' | 'water'> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

export type AspectKind = 'conjunction' | 'sextile' | 'square' | 'trine' | 'quincunx' | 'opposition';

export interface Signals {
  sign: Record<string, string>;
  /** Placidus house per planet, only with an exact birth time. */
  house: Record<string, number | undefined>;
  retro: Record<string, boolean>;
  rising: string | null;
  /** Aspect between two bodies (either order), with its orb, or undefined. */
  aspect: (a: string, b: string) => { kind: AspectKind; orb: number } | undefined;
  /** Planets (Sun to Pluto) in each house. */
  inHouse: Record<number, string[]>;
  /** Sun-to-Saturn count per element, rising counted once. */
  elements: Record<'fire' | 'earth' | 'air' | 'water', number>;
  hardCount: number;
  softCount: number;
  figures: string[];
  yogas: string[];
  exact: boolean;
}

export function signals(c: NatalChart, lat: number, lon: number): Signals {
  const ps = c.western.planets.filter((p) => p.body !== 'Node');
  const sign = Object.fromEntries(ps.map((p) => [p.body, p.sign]));
  const house = Object.fromEntries(ps.map((p) => [p.body, p.house]));
  const retro = Object.fromEntries(ps.map((p) => [p.body, p.retrograde]));
  const asp = allAspects(c);
  // Angles join the aspect set when the time is exact (conjunctions and oppositions, 6° orb).
  const exact = c.timePrecision === 'exact';
  const angleAsp: { a: string; b: string; aspect: AspectKind; orb: number }[] = [];
  if (exact) {
    const am = ascendantAndMidheaven(c.utc, lat, lon);
    for (const p of ps)
      for (const [name, l] of [['Ascendant', am.asc], ['Midheaven', am.mc]] as const) {
        const s = sep(p.longitude, l);
        if (s <= 6) angleAsp.push({ a: p.body, b: name, aspect: 'conjunction', orb: s });
        else if (180 - s <= 6) angleAsp.push({ a: p.body, b: name, aspect: 'opposition', orb: 180 - s });
      }
  }
  const all = [...asp, ...angleAsp];
  const aspect = (a: string, b: string) => {
    const x = all.find((y) => (y.a === a && y.b === b) || (y.a === b && y.b === a));
    return x ? { kind: x.aspect as AspectKind, orb: x.orb } : undefined;
  };
  const inHouse: Record<number, string[]> = {};
  for (const p of ps) if (p.house) (inHouse[p.house] ??= []).push(p.body);
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const p of ps.filter((x) => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(x.body))) elements[ELEMENT[p.sign]]++;
  const rising = c.western.ascendant.certain ? c.western.ascendant.value : null;
  if (rising) elements[ELEMENT[rising]]++;
  const personal = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
  const touchesPersonal = (x: { a: string; b: string }) => personal.includes(x.a) || personal.includes(x.b);
  return {
    sign,
    house,
    retro,
    rising,
    aspect,
    inHouse,
    elements,
    hardCount: asp.filter((x) => (x.aspect === 'square' || x.aspect === 'opposition') && touchesPersonal(x)).length,
    softCount: asp.filter((x) => (x.aspect === 'trine' || x.aspect === 'sextile') && touchesPersonal(x)).length,
    figures: aspectPatterns(c).map((p) => p.name),
    yogas: vedicYogas(c),
    exact,
  };
}

