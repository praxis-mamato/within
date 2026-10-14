import { describe, expect, it } from 'vitest';
import { computeNatal } from '../astro/natal';
import { activeContacts, consultOracle, intentOf } from './oracleEngine';

// Sun at 6° Sagittarius; in Oct 2026 Uranus sits at 5° Gemini, opposite it, but turns retrograde,
// so no exact hit falls in the next 30 days. The Oracle must still name it.
const b = { date: '1987-11-28', time: '12:00', timePrecision: 'exact', windowMinutes: 0, lat: 39.74, lon: -104.99, tz: 'America/Denver' } as const;
const chart = computeNatal(b);
const place = { lat: b.lat, lon: b.lon };
const now = new Date('2026-10-14T12:00:00Z');

describe('slow transits in effect', () => {
  it('finds Uranus opposite the Sun while it is within orb, with its return passes', () => {
    const c = activeContacts(chart, place, now, 'Uranus').find((x) => x.natal === 'Sun' && x.aspect === 'opposite');
    expect(c).toBeTruthy();
    expect(c!.orb).toBeLessThan(1.5);
    expect(c!.again.length).toBeGreaterThan(0);
  });
  it('answers a question about Uranus with the opposition first', () => {
    for (const q of ['What is going on with Uranus?', 'Uranus opposite my sun']) {
      const r = consultOracle(q, { chart, place, now });
      expect(r.intent).toBe('planet');
      expect(r.lines[0].heading).toMatch(/Uranus opposite your Sun/);
    }
  });
  it('routes aspect questions to the transit, naming the slower planet as the mover', () => {
    expect(intentOf('Is Saturn square my Venus?')).toBe('planet');
    expect(intentOf('my sun opposite uranus')).toBe('planet');
    expect(intentOf('Show my chart’s energy')).toBe('energy');
  });
});
