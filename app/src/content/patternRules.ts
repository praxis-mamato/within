/**
 * Which chart factors point to each pattern, and how strongly. A pattern appears when its
 * evidence adds up; the evidence list is shown under "The astrology behind this".
 */
import { signals, type AspectKind, type Signals } from '../astro/signals';
import type { NatalChart } from '../astro/natal';
import { PATTERNS, type PatternText } from './patterns';

export interface Evidence {
  weight: number;
  text: string;
}
export interface FoundPattern extends PatternText {
  id: string;
  strength: number;
  evidence: Evidence[];
}

const HARD: AspectKind[] = ['conjunction', 'square', 'opposition'];
const SOFT: AspectKind[] = ['trine', 'sextile'];
const ANY: AspectKind[] = [...HARD, ...SOFT];
const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

type Rule = (s: Signals) => (Evidence | null)[];

// Building blocks. Each returns evidence or null.
const asp = (a: string, b: string, kinds: AspectKind[], w: number) => (s: Signals): Evidence | null => {
  const x = s.aspect(a, b);
  if (!x || !kinds.includes(x.kind)) return null;
  // Tighter aspects count more: full weight at exact, about half at 8°.
  return { weight: w * Math.max(0.45, 1 - x.orb / 14), text: `${a} ${x.kind} ${b} (orb ${x.orb.toFixed(1)}°)` };
};
const inSign = (body: string, signs: string[], w: number) => (s: Signals): Evidence | null =>
  signs.includes(s.sign[body]) ? { weight: w, text: `${body} in ${s.sign[body]}` } : null;
const rising = (signs: string[], w: number) => (s: Signals): Evidence | null => (s.rising && signs.includes(s.rising) ? { weight: w, text: `${s.rising} rising` } : null);
const inHouse = (body: string, houses: number[], w: number) => (s: Signals): Evidence | null =>
  s.house[body] && houses.includes(s.house[body]!) ? { weight: w, text: `${body} in the ${ord(s.house[body]!)} house` } : null;
const emphasis = (house: number, w: number) => (s: Signals): Evidence | null =>
  (s.inHouse[house]?.length ?? 0) >= 3 ? { weight: w, text: `${s.inHouse[house].length} planets in the ${ord(house)} house (${s.inHouse[house].join(', ')})` } : null;
const element = (el: 'fire' | 'earth' | 'air' | 'water', min: number, w: number) => (s: Signals): Evidence | null =>
  s.elements[el] >= min ? { weight: w, text: `Strong ${el} emphasis (${s.elements[el]} of the personal planets and rising)` } : null;
const figure = (name: string, w: number) => (s: Signals): Evidence | null => (s.figures.includes(name) ? { weight: w, text: `${name} in the chart` } : null);
const yoga = (name: string, w: number) => (s: Signals): Evidence | null => (s.yogas.includes(name) ? { weight: w, text: `${name} yoga (Vedic)` } : null);
const retro = (body: string, w: number) => (s: Signals): Evidence | null => (s.retro[body] ? { weight: w, text: `${body} retrograde at birth` } : null);
const all = (...fs: ((s: Signals) => Evidence | null)[]): Rule => (s) => fs.map((f) => f(s));

const RULES: Record<keyof typeof PATTERNS, Rule> = {
  guarded_heart: all(asp('Moon', 'Saturn', HARD, 3), asp('Moon', 'Saturn', SOFT, 1.2), inSign('Moon', ['Capricorn'], 2), inHouse('Saturn', [4], 2), inHouse('Moon', [12], 1.5), inSign('Moon', ['Scorpio', 'Virgo'], 0.8)),
  deep_waters: all(asp('Moon', 'Pluto', HARD, 3), asp('Moon', 'Pluto', SOFT, 1.2), inSign('Moon', ['Scorpio'], 2), inHouse('Moon', [8], 2), asp('Moon', 'Mars', HARD, 1.2), element('water', 4, 1.2), rising(['Scorpio'], 1)),
  room_to_breathe: all(asp('Venus', 'Uranus', HARD, 3), asp('Moon', 'Uranus', HARD, 2.5), asp('Venus', 'Uranus', SOFT, 1), inSign('Venus', ['Aquarius', 'Sagittarius', 'Gemini'], 1.3), inSign('Moon', ['Aquarius', 'Sagittarius'], 1.3), inHouse('Uranus', [7], 2), inHouse('Venus', [11], 1)),
  idealist_in_love: all(asp('Venus', 'Neptune', HARD, 3), asp('Venus', 'Neptune', SOFT, 1.3), inSign('Venus', ['Pisces'], 2), inHouse('Neptune', [7, 5], 1.8), asp('Moon', 'Neptune', HARD, 1.5), inHouse('Venus', [12], 1.5)),
  high_bar: all(asp('Sun', 'Saturn', HARD, 3), asp('Mercury', 'Saturn', HARD, 1.2), inSign('Sun', ['Capricorn', 'Virgo'], 1.2), inHouse('Saturn', [1, 10], 1.6), asp('Mars', 'Saturn', HARD, 1), asp('Saturn', 'Ascendant', ['conjunction'], 2), rising(['Capricorn'], 1.2)),
  caretaker: all(inSign('Moon', ['Cancer'], 2), inSign('Sun', ['Cancer'], 1.2), inHouse('Moon', [6], 1.5), inSign('Moon', ['Pisces', 'Virgo'], 1), rising(['Cancer'], 1.3), emphasis(6, 1.5), asp('Moon', 'Neptune', SOFT, 0.8), element('water', 4, 0.8)),
  restless_mind: all(asp('Mercury', 'Uranus', ANY, 2.5), inSign('Mercury', ['Gemini', 'Aquarius'], 1.4), inSign('Sun', ['Gemini'], 1.2), inHouse('Mercury', [3, 9, 1], 1), asp('Mercury', 'Jupiter', HARD, 1.2), element('air', 4, 1.3), asp('Mercury', 'Mars', HARD, 1)),
  go_getter: all(asp('Sun', 'Mars', HARD, 2.2), inSign('Mars', ['Aries', 'Scorpio', 'Capricorn'], 1.6), inHouse('Mars', [1, 10], 1.8), element('fire', 4, 1.3), asp('Mars', 'Uranus', HARD, 1.5), rising(['Aries'], 1.5), asp('Mars', 'Ascendant', ['conjunction'], 2)),
  quiet_anger: all(asp('Mars', 'Saturn', HARD, 2.5), inSign('Mars', ['Libra', 'Cancer', 'Taurus'], 2), asp('Mars', 'Neptune', HARD, 2), inHouse('Mars', [12], 2), retro('Mars', 1.2)),
  meaning_seeker: all(inSign('Sun', ['Sagittarius'], 1.6), inSign('Moon', ['Sagittarius'], 1.4), inHouse('Jupiter', [1, 9], 1.6), asp('Sun', 'Jupiter', HARD, 2), emphasis(9, 2), rising(['Sagittarius'], 1.4), asp('Moon', 'Jupiter', HARD, 1)),
  to_be_seen: all(inSign('Sun', ['Leo'], 2), rising(['Leo'], 1.5), inHouse('Sun', [1, 5, 10], 1.4), emphasis(5, 1.8), asp('Sun', 'Ascendant', ['conjunction'], 1.5), asp('Sun', 'Midheaven', ['conjunction'], 1.5)),
  transformer: all(asp('Sun', 'Pluto', HARD, 3), inSign('Sun', ['Scorpio'], 1.8), rising(['Scorpio'], 1.6), inHouse('Pluto', [1, 10], 1.6), emphasis(8, 2.2), asp('Pluto', 'Ascendant', ['conjunction'], 2)),
  security_first: all(inSign('Moon', ['Taurus', 'Capricorn'], 1.6), inSign('Venus', ['Taurus', 'Capricorn'], 1.3), inSign('Sun', ['Taurus'], 1.3), element('earth', 4, 1.6), inHouse('Moon', [2], 1.5), emphasis(2, 1.8), rising(['Taurus'], 1.3)),
  slow_trust_love: all(asp('Venus', 'Saturn', HARD, 3), asp('Venus', 'Saturn', SOFT, 1), inSign('Venus', ['Capricorn', 'Virgo'], 1.4), inHouse('Saturn', [7, 5], 2.2), inHouse('Venus', [12], 1)),
  mirror_of_others: all(emphasis(7, 2.5), inSign('Sun', ['Libra'], 1.5), rising(['Libra'], 1.3), inHouse('Sun', [7], 2), inHouse('Moon', [7], 1.6), asp('Sun', 'Moon', ['opposition'], 1)),
  own_person: all(asp('Sun', 'Uranus', HARD, 2.5), asp('Moon', 'Uranus', ['conjunction'], 1.5), inSign('Sun', ['Aquarius', 'Aries'], 1.2), inHouse('Uranus', [1, 10], 2), emphasis(1, 2), rising(['Aquarius'], 1.4), asp('Uranus', 'Ascendant', ['conjunction'], 2)),
  sponge: all(asp('Sun', 'Neptune', HARD, 2.2), asp('Moon', 'Neptune', HARD, 2.2), inSign('Moon', ['Pisces'], 1.6), inSign('Sun', ['Pisces'], 1.3), rising(['Pisces'], 1.4), element('water', 4, 1.3), asp('Neptune', 'Ascendant', ['conjunction'], 2)),
  creative_tension: all(figure('T-square', 2.2), figure('Grand cross', 3), (s) => (s.hardCount >= 6 ? { weight: 2, text: `${s.hardCount} hard aspects to personal planets` } : null), figure('Yod', 1.5)),
  natural_flow: all(figure('Grand trine', 2.8), (s) => (s.softCount >= 7 ? { weight: 1.8, text: `${s.softCount} easy aspects to personal planets` } : null)),
  head_heart: all(asp('Sun', 'Moon', ['square', 'opposition'], 3), asp('Moon', 'Mercury', ['square', 'opposition'], 1.8), (s) => (s.sign.Sun && s.sign.Moon && elementOf(s.sign.Sun) !== elementOf(s.sign.Moon) && ['fire', 'air'].includes(elementOf(s.sign.Sun)) !== ['fire', 'air'].includes(elementOf(s.sign.Moon)) ? { weight: 1, text: `Sun in ${s.sign.Sun}, Moon in ${s.sign.Moon}: different temperaments` } : null)),
  generous_spirit: all(asp('Venus', 'Jupiter', ANY, 1.8), asp('Moon', 'Jupiter', ANY, 1.6), inHouse('Jupiter', [1, 2, 5], 1.3), inSign('Venus', ['Sagittarius', 'Pisces', 'Leo'], 1), inSign('Jupiter', ['Sagittarius', 'Pisces', 'Cancer'], 1)),
  investigator: all(asp('Mercury', 'Pluto', HARD, 2.8), inSign('Mercury', ['Scorpio'], 1.8), inHouse('Mercury', [8], 2), inSign('Mercury', ['Virgo'], 1)),
  calling: all(emphasis(10, 2.5), inHouse('Sun', [10], 1.8), inHouse('Saturn', [10], 1.3), inHouse('Mars', [10], 1.2), asp('Saturn', 'Midheaven', ['conjunction'], 1.5), inSign('Sun', ['Capricorn'], 1)),
  roots: all(emphasis(4, 2.5), inHouse('Moon', [4], 1.8), inHouse('Sun', [4], 1.5), inSign('Moon', ['Cancer'], 1), inHouse('Pluto', [4], 1.5)),
  inner_world: all(emphasis(12, 2.5), inHouse('Sun', [12], 1.8), inHouse('Moon', [12], 1.6), inHouse('Saturn', [12], 1.2), inSign('Moon', ['Pisces'], 0.8)),
  wise_steady: all(yoga('Gaja Kesari', 1.5), asp('Moon', 'Jupiter', SOFT, 1.2), inSign('Jupiter', ['Cancer', 'Sagittarius', 'Pisces'], 0.8)),
  self_reliant: all(yoga('Kemadruma', 1.6), asp('Moon', 'Saturn', HARD, 1), inHouse('Moon', [12, 8], 0.8), asp('Moon', 'Uranus', HARD, 0.6)),
};

const EL: Record<string, string> = { Aries: 'fire', Leo: 'fire', Sagittarius: 'fire', Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth', Gemini: 'air', Libra: 'air', Aquarius: 'air', Cancer: 'water', Scorpio: 'water', Pisces: 'water' };
const elementOf = (sign: string) => EL[sign];

/** Every pattern with enough evidence, strongest first. At least six are returned. */
export function findPatterns(c: NatalChart, lat: number, lon: number): FoundPattern[] {
  const s = signals(c, lat, lon);
  const scored = (Object.keys(RULES) as (keyof typeof PATTERNS)[]).map((id) => {
    const evidence = RULES[id](s).filter((e): e is Evidence => e !== null).sort((a, b) => b.weight - a.weight);
    return { id, ...PATTERNS[id], evidence, strength: evidence.reduce((n, e) => n + e.weight, 0) };
  });
  scored.sort((a, b) => b.strength - a.strength);
  const strong = scored.filter((p) => p.strength >= 2.4);
  const out = strong.length >= 6 ? strong : scored.filter((p) => p.strength > 0).slice(0, 6);
  return out.slice(0, 12);
}

/** Strength as a label for the card. */
export const strengthLabel = (n: number) => (n >= 5 ? 'Very strong in your chart' : n >= 3.2 ? 'Strong in your chart' : 'Present in your chart');
