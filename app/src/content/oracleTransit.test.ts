import { describe, expect, it } from 'vitest';
import { computeNatal } from '../astro/natal';
import { activeContacts, consultOracle, intentOf, outerInEffect } from './oracleEngine';

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
  it('names the outer planets in effect in every everyday answer', () => {
    expect(outerInEffect(chart, place, now)[0].heading).toMatch(/^In effect now: (Saturn|Uranus|Neptune|Pluto) (conjunct|opposite|square) your /);
    for (const q of ['What should I focus on?', 'How is work going to go?', 'Should I quit my job?', 'Will things change soon?', 'What does this week hold?', 'What is the sky doing today?', 'What am I moving through this year?', 'When is a good day to ask for a raise?']) {
      const r = consultOracle(q, { chart, place, now });
      const all = [...r.lines, ...r.deeper].map((l) => `${l.heading} ${l.text}`).join(' | ');
      expect(all, q).toMatch(/Uranus[^.|]{0,40}your Sun/);
      expect(all, q).toMatch(/Pluto[^.|]{0,40}your Mars/);
      if (r.intent !== 'when') expect(r.lines.some((l) => /^In effect now: |Pluto|Uranus/.test(`${l.heading} ${l.text}`)), q).toBe(true);
    }
  });
});
