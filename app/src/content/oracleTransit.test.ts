import { describe, expect, it } from 'vitest';
import { computeNatal } from '../astro/natal';
import { activeContacts, consultOracle, intentOf, outerInEffect, progressedInEffect } from './oracleEngine';
import { angleAspectOk } from '../astro/chart';
import { natalPoints } from '../astro/progressions';

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
  it('reads both ends of each angle axis, once', () => {
    const pts = natalPoints(chart, place.lat, place.lon);
    const at = (n: string) => pts.find((p) => p.name === n)!.lon;
    expect((at('Descendant') - at('Ascendant') + 360) % 360).toBeCloseTo(180, 6);
    expect((at('IC') - at('Midheaven') + 360) % 360).toBeCloseTo(180, 6);
    expect(angleAspectOk('Ascendant', 'opposite')).toBe(false);
    expect(angleAspectOk('Descendant', 'conjunct')).toBe(true);
    expect(angleAspectOk('IC', 'square')).toBe(false);
    for (const q of ['How is my love life?', 'What should I focus on?', 'How is work going to go?', 'What does this week hold?']) {
      const all = JSON.stringify(consultOracle(q, { chart, place, now }));
      expect(all, q).not.toMatch(/opposite (your )?(Ascendant|Midheaven)/);
    }
  });
  it('names the progressions and solar arcs in effect', () => {
    const pr = progressedInEffect(chart, place, now);
    expect(pr.contacts[0].heading).toMatch(/^(Progressed|Solar arc): your \w+ \w+ your \w+/);
    const r = consultOracle('What should I focus on?', { chart, place, now });
    expect(r.lines.some((l) => /^(Progressed|Solar arc):/.test(l.heading))).toBe(true);
    expect([...r.lines, ...r.deeper].some((l) => /progressed Moon/i.test(l.heading))).toBe(true);
  });
  it('reads what is moving between two people now', () => {
    const o = { date: '1985-03-09', time: '07:45', timePrecision: 'exact', windowMinutes: 0, lat: 40.71, lon: -74.0, tz: 'America/New_York' } as const;
    const other = { name: 'Sam', chart: computeNatal(o), place: { lat: o.lat, lon: o.lon } };
    const r = consultOracle('How are things with Sam?', { chart, place, now, other });
    expect(r.lines.some((l) => /^In effect now/.test(l.heading))).toBe(true);
    const all = [...r.lines, ...r.deeper].map((l) => l.heading).join(' | ');
    expect(all).toMatch(/composite|Sam’s/);
    expect(all).toMatch(/progressed/);
  });
});
