import * as W from './western';
import * as V from './vedic';
import { dignityOf, skyNotes, vedicReading, vedicYogas, westernReading } from './fullReading';
import { computeNatal } from '../astro/natal';
import { screen } from '../lib/screener';

const strings = (x: unknown): string[] =>
  typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : [];
const BANNED = [/\bwill\b/i, /\bdestin/i, /\bsoulmate/i, /\bkarmic debt/i, /\bfated?\b/i, /\balways\b/i, /\bnever\b/i, /\bdiagnos/i, /\btoxic\b/i, /\bdoom/i, /\bcurse/i, /\bdisaster/i];

const base = { timePrecision: 'exact' as const, windowMinutes: 60 };
const people = [
  { ...base, date: '1985-11-23', time: '08:35', lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' },
  { ...base, date: '1994-05-09', time: '15:30', lat: 34.052, lon: -118.244, tz: 'America/Los_Angeles' },
  { ...base, date: '1972-02-15', time: '09:45', lat: -33.87, lon: 151.21, tz: 'Australia/Sydney' },
  { ...base, date: '2001-09-30', time: '22:10', lat: 51.5, lon: -0.13, tz: 'Europe/London' },
  { ...base, timePrecision: 'unknown' as const, time: '', date: '1990-03-03', lat: 40.71, lon: -74.0, tz: 'America/New_York' },
];
const now = new Date('2026-10-06T12:00:00Z');
const charts = people.map((p) => computeNatal(p, now));

describe('interpretation libraries', () => {
  const all = [...strings(W), ...strings(V)];
  it.each(BANNED.map((r) => [r.source, r]))('contain no %s', (_s, re) => expect(all.filter((s) => re.test(s))).toEqual([]));
  it('cover every sign for the personal planets, lagna, and every nakshatra', () => {
    for (const p of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) expect(Object.keys(W.PLANET_IN_SIGN[p])).toHaveLength(12);
    expect(Object.keys(W.RISING)).toHaveLength(12);
    expect(Object.keys(V.LAGNA)).toHaveLength(12);
    expect(Object.keys(V.NAKSHATRA_DETAIL)).toHaveLength(27);
    expect(Object.keys(V.LAGNA_LORD_IN)).toHaveLength(12);
  });
});

describe('dignityOf (Parashari rules)', () => {
  it.each([
    ['Sun', 'Aries', 10, 'exalted'],
    ['Venus', 'Virgo', 5, 'debilitated'],
    ['Mars', 'Aries', 5, 'moolatrikona'],
    ['Mars', 'Aries', 20, 'own'],
    ['Moon', 'Leo', 3, 'friend'],
    ['Jupiter', 'Gemini', 3, 'enemy'],
    ['Saturn', 'Sagittarius', 3, 'neutral'],
  ] as const)('%s in %s %i° is %s', (g, s, d, want) => expect(dignityOf(g, s, d)).toBe(want));
});

describe('full readings', () => {
  it.each(charts.map((c, i) => [people[i].date, c]))('%s: complete, filled, and within the content rules', (_d, c) => {
    const w = westernReading(c, now);
    const v = vedicReading(c, '1990-01-01', now);
    expect(w.map((s) => s.id)).toEqual(['w-big3', 'w-signs', 'w-houses', 'w-aspects', 'w-balance', 'w-now']);
    expect(v.map((s) => s.id)).toEqual(['v-lagna', 'v-moon', 'v-grahas', 'v-yogas', 'v-dasha', 'v-panchang', 'v-now']);
    const text = [...w, ...v].flatMap((s) => [s.title, s.intro ?? '', ...s.items.flatMap((i) => [i.heading, i.text, i.basis ?? ''])]).join(' ');
    expect(text).not.toMatch(/undefined|NaN|\[object/);
    for (const re of BANNED) expect(text).not.toMatch(re);
    expect(w.reduce((n, s) => n + s.items.length, 0) + v.reduce((n, s) => n + s.items.length, 0)).toBeGreaterThan(35);
  });

  it('gives different people different readings', () => {
    const firsts = charts.map((c) => westernReading(c, now)[0].items.map((i) => i.text).join() + vedicReading(c, '1990-01-01', now)[2].items.map((i) => i.text).join());
    expect(new Set(firsts).size).toBe(charts.length);
  });

  it('counts houses from the Moon when the birth time is unknown', () => {
    const v = vedicReading(charts[4], '1990-03-03', now);
    expect(v[2].intro).toMatch(/counted from your Moon/);
    expect(v[0].items[0].heading).toBe('Lagna not included');
  });

  it('finds Budha-Aditya exactly when the Sun and Mercury share a rashi', () => {
    for (const c of charts) {
      const same = c.vedic.planets.find((p) => p.body === 'Sun')!.sign === c.vedic.planets.find((p) => p.body === 'Mercury')!.sign;
      expect(vedicYogas(c).includes('Budha-Aditya')).toBe(same);
    }
  });

  it('turns the current sky into answer ideas that never trip the safety screener', () => {
    for (const c of charts) for (const n of skyNotes(c, now)) expect(screen(n).flagged).toBe(false);
  });
});
