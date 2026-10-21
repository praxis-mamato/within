import { describe, expect, it } from 'vitest';
import { computeNatal } from '../astro/natal';
import { SIGNS } from '../astro/chart';
import { lint } from './lint';
import { ARCHETYPE_INTRO, archetypeReading, chartArchetypes, PLANET_ARCHETYPE, SIGN_ARCHETYPE } from './archetypes';
import { consultOracle, intentOf } from './oracleEngine';
import { westernReading } from './fullReading';

const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);
const birth = { date: '1986-06-06', time: '17:40', timePrecision: 'exact' as const, windowMinutes: 0, lat: 45.783, lon: -108.501, tz: 'America/Denver' };
const mariya = computeNatal(birth);
const noTime = computeNatal({ ...birth, time: '', timePrecision: 'unknown' as const });
const place = { lat: 45.783, lon: -108.501 };
const now = new Date('2026-10-21T15:00:00Z');

describe('archetypes', () => {
  it('cover every sign and planet, and every text passes the content rules', () => {
    expect(Object.keys(SIGN_ARCHETYPE).sort()).toEqual([...SIGNS].sort());
    expect(Object.keys(PLANET_ARCHETYPE)).toHaveLength(10);
    const names = [...Object.values(SIGN_ARCHETYPE), ...Object.values(PLANET_ARCHETYPE)].map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
    for (const s of strings([SIGN_ARCHETYPE, PLANET_ARCHETYPE, ARCHETYPE_INTRO])) expect(lint(s), s).toEqual([]);
  });
  it('reads a chart’s cast: Sun, Moon, rising, guide, and the most connected planet', () => {
    const cast = chartArchetypes(mariya);
    expect(cast[0].heading).toBe('Your core archetype: The Messenger');
    expect(cast.map((m) => m.role)).toEqual(expect.arrayContaining(['core', 'inner', 'mask', 'guide']));
    // A planet's archetype is listed once, even when it is both the guide and the most connected.
    const planets = cast.filter((m) => m.role === 'guide' || m.role === 'loudest').map((m) => m.archetype);
    expect(new Set(planets).size).toBe(planets.length);
  });
  it('without a birth time, leaves out the rising archetype and says why', () => {
    expect(chartArchetypes(noTime).some((m) => m.role === 'mask')).toBe(false);
    expect(archetypeReading(noTime, now).lines.some((l) => /needs a birth time/.test(l.heading))).toBe(true);
  });
  it('the Oracle answers archetype questions, and the full reading has the section', () => {
    for (const q of ['What’s my archetype?', 'Which archetypes are in my chart?', 'What is my archetypal energy?']) expect(intentOf(q), q).toBe('archetype');
    const a = consultOracle('What’s my archetype?', { chart: mariya, place, now });
    expect(a.label).toBe('Your archetype: The Messenger');
    for (const l of [...a.lines, ...a.deeper]) expect(lint(`${l.heading} ${l.text}`), l.heading).toEqual([]);
    expect(westernReading(mariya, now).find((s) => s.id === 'w-archetypes')?.items.length).toBeGreaterThanOrEqual(4);
  });
});
