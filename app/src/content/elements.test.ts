import { describe, expect, it } from 'vitest';
import { computeNatal } from '../astro/natal';
import { lint } from './lint';
import { chartBalance, ELEMENT_INTRO, ELEMENTS, MODES, POLARITY, SIGN_ENERGY, skyBalance } from './elements';
import { consultOracle, intentOf } from './oracleEngine';

const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);
const mariya = computeNatal({ date: '1986-06-06', time: '17:40', timePrecision: 'exact', windowMinutes: 0, lat: 45.783, lon: -108.501, tz: 'America/Denver' });
const place = { lat: 45.783, lon: -108.501 };
const now = new Date('2026-10-20T15:00:00Z');

describe('elements, modes, and polarity', () => {
  it('every text passes the content rules', () => {
    for (const s of strings([ELEMENTS, MODES, POLARITY, SIGN_ENERGY, ELEMENT_INTRO])) expect(lint(s), s).toEqual([]);
  });
  it('weighs a chart: Sun, Moon, and rising count most, outer planets not at all', () => {
    const b = chartBalance(mariya, place);
    const sum = (r: Record<string, number>) => Object.values(r).reduce((a, x) => a + x, 0);
    expect(Math.abs(sum(b.elementPct) - 100)).toBeLessThanOrEqual(2);
    expect(Math.abs(sum(b.modePct) - 100)).toBeLessThanOrEqual(2);
    expect(b.who.air).toEqual(expect.arrayContaining(['Sun', 'Moon']));
    expect(b.who.water).toContain('Ascendant');
    expect(Object.values(b.who).flat()).not.toContain('Pluto');
    expect(Math.abs(sum(skyBalance(now).elementPct) - 100)).toBeLessThanOrEqual(2);
  });
  it('the Oracle answers questions about elements and modes', () => {
    for (const q of ['What are my elements?', 'Am I cardinal, fixed, or mutable?', 'Am I a water sign?', 'What energy types am I?', 'What is my modality?']) expect(intentOf(q), q).toBe('elements');
    expect(intentOf('Is my car fixed yet?')).not.toBe('elements');
    const r = consultOracle('What are my elements?', { chart: mariya, place, now });
    expect(r.label).toMatch(/^Your elements: (Cardinal|Fixed|Mutable) (fire|earth|air|water)$/);
    for (const l of [...r.lines, ...r.deeper]) expect(lint(`${l.heading} ${l.text}`), l.heading).toEqual([]);
  });
});
