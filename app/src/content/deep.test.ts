import * as D from './deep';
import { timingReading, togetherReading, vedicDeep, westernDeep } from './deepReading';
import { computeNatal } from '../astro/natal';

const strings = (x: unknown): string[] =>
  typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : [];
const BANNED = [/\bwill\b/i, /\bdestin/i, /\bsoulmate/i, /\bfated?\b/i, /\balways\b/i, /\bnever\b/i, /\bdiagnos/i, /\btoxic\b/i, /\bdoom/i, /\bcurse/i, /\bscore\b(?! is given)/i];

const now = new Date('2026-10-06T12:00:00Z');
const people = [
  { date: '1985-11-23', time: '08:35', lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' },
  { date: '1994-05-09', time: '15:30', lat: 34.052, lon: -118.244, tz: 'America/Los_Angeles' },
  { date: '1972-02-15', time: '09:45', lat: -33.87, lon: 151.21, tz: 'Australia/Sydney' },
  { date: '2001-09-30', time: '', lat: 51.5, lon: -0.13, tz: 'Europe/London' },
].map((p) => ({ ...p, timePrecision: (p.time ? 'exact' : 'unknown') as 'exact' | 'unknown', windowMinutes: 60 }));
const charts = people.map((p) => computeNatal(p, now));

describe('depth library', () => {
  it('passes the content lint', () => {
    for (const re of BANNED) expect(strings(D).filter((s) => re.test(s))).toEqual([]);
  });
  it('covers all 12 houses for each hand-written planet', () => {
    for (const p of Object.keys(D.PLANET_IN_HOUSE)) expect(Object.keys(D.PLANET_IN_HOUSE[p])).toHaveLength(12);
  });
});

describe('deep readings', () => {
  const all = charts.map((c, i) => {
    const place = { lat: people[i].lat, lon: people[i].lon };
    return [...westernDeep(c, place), ...vedicDeep(c), ...timingReading(c, place, now), ...togetherReading(c, place, charts[(i + 1) % 4], { lat: people[(i + 1) % 4].lat, lon: people[(i + 1) % 4].lon }, 'Alex')];
  });
  it('are complete and filled for every chart, including unknown birth time', () => {
    for (const sections of all) {
      const text = sections.flatMap((s) => [s.title, s.intro ?? '', ...s.items.flatMap((i) => [i.heading, i.text, i.basis ?? ''])]).join(' ');
      expect(text).not.toMatch(/undefined|NaN|\{|\}|\[object/);
      for (const re of BANNED) expect(text).not.toMatch(re);
      expect(sections.reduce((n, s) => n + s.items.length, 0)).toBeGreaterThan(30);
    }
  });
  it('differ between people', () => {
    const firsts = all.map((s) => s[0].items.map((i) => i.text).join());
    expect(new Set(firsts).size).toBe(4);
  });
  it('explain what needs a birth time instead of guessing', () => {
    const unknown = all[3];
    const text = JSON.stringify(unknown);
    expect(text).toMatch(/needs? an exact birth time|needs a known lagna/);
  });
});
