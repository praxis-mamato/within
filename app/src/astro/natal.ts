/**
 * Builds the Western and Vedic chart facts the app shows, applying the PRD's rules for
 * uncertain birth data: nothing time-dependent is shown as if it were known.
 */
import {
  antardashas,
  ascendantAndMidheaven,
  BODIES,
  houseOf,
  lahiriAyanamsa,
  meanNode,
  nakshatraOf,
  norm,
  placement,
  placidusCusps,
  RASHIS,
  SIGNS,
  tropicalLongitude,
  vimshottari,
  type DashaPeriod,
  type Nakshatra,
  type Placement,
} from './chart';
import { formatOffset, localToUtc } from '../geo/places';

export type TimePrecision = 'exact' | 'approximate' | 'unknown';

export interface BirthInput {
  date: string;
  time: string;
  timePrecision: TimePrecision;
  windowMinutes: number;
  lat: number;
  lon: number;
  tz: string;
}

export interface WesternPlacement extends Placement {
  house?: number;
}

export interface VedicPlacement {
  body: string;
  longitude: number;
  rashi: string;
  sign: string;
  degree: number;
  house?: number;
  retrograde: boolean;
}

/** A value that may only be known as a range when the birth time is uncertain. */
export interface Uncertain<T> {
  value: T | null;
  /** True when every time in the possible window gives the same answer. */
  certain: boolean;
  /** Distinct answers across the window, for "between X and Y". */
  options: T[];
}

export interface NatalChart {
  utc: Date;
  offsetLabel: string;
  timePrecision: TimePrecision;
  western: {
    planets: WesternPlacement[];
    ascendant: Uncertain<string>;
    ascendantDegree: number | null;
    midheaven: string | null;
    houseSystem: 'Placidus' | null;
    unavailable: string[];
  };
  vedic: {
    ayanamsa: number;
    planets: VedicPlacement[];
    lagna: Uncertain<string>;
    moonRashi: Uncertain<string>;
    moonNakshatra: Uncertain<string>;
    nakshatra: Nakshatra;
    dashas: DashaPeriod[] | null;
    current: { maha: DashaPeriod; antar: DashaPeriod } | null;
    unavailable: string[];
  };
}

function uncertain<T>(values: T[]): Uncertain<T> {
  const options = [...new Set(values)];
  return { value: options.length === 1 ? options[0] : null, certain: options.length === 1, options };
}

const retrograde = (body: (typeof BODIES)[number], t: Date) =>
  body !== 'Sun' && body !== 'Moon' && norm(tropicalLongitude(body, new Date(t.getTime() + 43200000)) - tropicalLongitude(body, new Date(t.getTime() - 43200000)) + 180) - 180 < 0;

export function computeNatal(b: BirthInput, now = new Date()): NatalChart {
  const known = b.timePrecision !== 'unknown';
  const { utc, offset } = localToUtc(b.date, known ? b.time || '12:00' : '12:00', b.tz);

  // The window of possible birth instants: the stated time ± window, or the whole local day.
  const window =
    b.timePrecision === 'exact'
      ? [utc]
      : b.timePrecision === 'approximate'
        ? [-1, -0.5, 0, 0.5, 1].map((k) => new Date(utc.getTime() + k * b.windowMinutes * 60000))
        : [0, 3, 6, 9, 12, 15, 18, 21, 23.99].map((h) => localToUtc(b.date, `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`, b.tz).utc);

  const ayanamsa = lahiriAyanamsa(utc);
  const tropical = BODIES.map((body) => ({ body, lon: tropicalLongitude(body, utc), retro: retrograde(body, utc) }));
  const node = meanNode(utc);

  // Western
  const cusps = known ? placidusCusps(utc, b.lat, b.lon) : null;
  const angles = known ? ascendantAndMidheaven(utc, b.lat, b.lon) : null;
  const westernPlanets: WesternPlacement[] = [
    ...tropical.map((p) => ({ ...placement(p.body, p.lon, p.retro ? -1 : 1), house: cusps && b.timePrecision === 'exact' ? houseOf(p.lon, cusps) : undefined })),
    { ...placement('Node', node), body: 'Node' as const },
  ];
  const ascSigns = known ? uncertain(window.map((t) => SIGNS[Math.floor(ascendantAndMidheaven(t, b.lat, b.lon).asc / 30)])) : uncertain<string>([]);

  const westernUnavailable: string[] = [];
  if (!known) westernUnavailable.push('Rising sign, Midheaven, and houses need a birth time, so they are not included.');
  else if (!ascSigns.certain) westernUnavailable.push(`Your rising sign could be ${ascSigns.options.join(' or ')} within your time window, so houses are not included.`);
  else if (b.timePrecision === 'approximate') westernUnavailable.push('House positions are not included because the birth time is approximate.');
  if (known && !cusps) westernUnavailable.push('Placidus houses are undefined this far north or south, so they are not included.');

  // Vedic
  const sid = (lon: number) => norm(lon - ayanamsa);
  const lagnaRashis = known ? uncertain(window.map((t) => RASHIS[Math.floor(norm(ascendantAndMidheaven(t, b.lat, b.lon).asc - lahiriAyanamsa(t)) / 30)])) : uncertain<string>([]);
  const lagnaIndex = known && lagnaRashis.certain ? RASHIS.indexOf(lagnaRashis.value!) : null;
  const vedicPlanets: VedicPlacement[] = [
    ...tropical.filter((p) => !['Uranus', 'Neptune', 'Pluto'].includes(p.body)).map((p) => ({ body: p.body as string, lon: p.lon, retro: p.retro })),
    { body: 'Rahu', lon: node, retro: true },
    { body: 'Ketu', lon: norm(node + 180), retro: true },
  ].map((p) => {
    const s = sid(p.lon);
    const sign = Math.floor(s / 30);
    return {
      body: p.body,
      longitude: s,
      rashi: RASHIS[sign],
      sign: SIGNS[sign],
      degree: s % 30,
      house: lagnaIndex === null ? undefined : ((sign - lagnaIndex + 12) % 12) + 1,
      retrograde: p.retro,
    };
  });

  const moonAt = (t: Date) => norm(tropicalLongitude('Moon', t) - lahiriAyanamsa(t));
  const moonRashi = uncertain(window.map((t) => RASHIS[Math.floor(moonAt(t) / 30)]));
  const moonNakshatra = uncertain(window.map((t) => nakshatraOf(moonAt(t)).name));
  const moonSid = moonAt(utc);

  // Dasha dates shift with the Moon (about 2.5 months of dasha per hour of birth time),
  // so start dates are only shown for an exact time; the current period only if it's the same across the window.
  const currentAt = (t: Date) => {
    const maha = vimshottari(t, moonAt(t)).find((p) => p.start <= now && now < p.end)!;
    const antar = antardashas(maha).find((p) => p.start <= now && now < p.end)!;
    return { maha, antar };
  };
  const currents = window.map(currentAt);
  const sameCurrent = uncertain(currents.map((c) => `${c.maha.lord}/${c.antar.lord}`)).certain;

  const vedicUnavailable: string[] = [];
  if (!known) vedicUnavailable.push('Lagna (ascendant) and houses need a birth time, so they are not included.');
  else if (!lagnaRashis.certain) vedicUnavailable.push(`Your lagna could be ${lagnaRashis.options.join(' or ')} within your time window, so houses are not included.`);
  if (!moonNakshatra.certain) vedicUnavailable.push(`The Moon changes nakshatra during the possible birth window (${moonNakshatra.options.join(' or ')}), so the nakshatra and dashas are uncertain.`);
  else if (b.timePrecision !== 'exact') vedicUnavailable.push('Dasha start dates need an exact birth time, so only the current period is shown.');
  if (!sameCurrent && moonNakshatra.certain) vedicUnavailable.push('The current dasha period differs across the possible birth window, so it is not shown.');

  return {
    utc,
    offsetLabel: formatOffset(offset),
    timePrecision: b.timePrecision,
    western: {
      planets: westernPlanets,
      ascendant: ascSigns,
      ascendantDegree: angles && b.timePrecision === 'exact' ? angles.asc % 30 : null,
      midheaven: angles && b.timePrecision === 'exact' ? SIGNS[Math.floor(angles.mc / 30)] : null,
      houseSystem: cusps && b.timePrecision === 'exact' && ascSigns.certain ? 'Placidus' : null,
      unavailable: westernUnavailable,
    },
    vedic: {
      ayanamsa,
      planets: vedicPlanets,
      lagna: lagnaRashis,
      moonRashi,
      moonNakshatra,
      nakshatra: nakshatraOf(moonSid),
      dashas: b.timePrecision === 'exact' ? vimshottari(utc, moonSid) : null,
      current: sameCurrent && moonNakshatra.certain ? currents[0] : null,
      unavailable: vedicUnavailable,
    },
  };
}

export const fmtDeg = (d: number) => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, '0')}′`;

const ASPECTS = [
  { name: 'conjunction', angle: 0, orb: 8 },
  { name: 'sextile', angle: 60, orb: 4 },
  { name: 'square', angle: 90, orb: 6 },
  { name: 'trine', angle: 120, orb: 6 },
  { name: 'opposition', angle: 180, orb: 8 },
];

export interface CrossAspect {
  a: string;
  b: string;
  aspect: string;
  orb: number;
}

/** Western comparison: major aspects between two people's personal planets (no score, by design). */
export function crossAspects(a: NatalChart, b: NatalChart): CrossAspect[] {
  const personal = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
  const pa = a.western.planets.filter((p) => personal.includes(p.body));
  const pb = b.western.planets.filter((p) => personal.includes(p.body));
  const out: CrossAspect[] = [];
  for (const x of pa)
    for (const y of pb) {
      const sep = Math.abs(((x.longitude - y.longitude + 540) % 360) - 180);
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) out.push({ a: x.body, b: y.body, aspect: asp.name, orb });
      }
    }
  return out.sort((p, q) => p.orb - q.orb);
}

/** Vedic comparison: distance between Moon rashis, counted from the user's Moon (no score, by design). */
export function moonSignDistance(a: NatalChart, b: NatalChart): number | null {
  if (!a.vedic.moonRashi.certain || !b.vedic.moonRashi.certain) return null;
  return ((RASHIS.indexOf(b.vedic.moonRashi.value!) - RASHIS.indexOf(a.vedic.moonRashi.value!) + 12) % 12) + 1;
}
