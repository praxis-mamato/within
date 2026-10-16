import { describe, expect, it } from 'vitest';
import { computeNatal } from '../astro/natal';
import { activeContacts, consultOracle, intentOf, outerInEffect, progressedInEffect } from './oracleEngine';
import { angleAspectOk } from '../astro/chart';
import { natalPoints, progressions } from '../astro/progressions';

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
  it('gives the same span for a transit in every answer', () => {
    const planet = consultOracle('What is going on with Uranus?', { chart, place, now });
    const feel = consultOracle('Why do I feel so restless?', { chart, place, now });
    expect(JSON.stringify(planet)).toMatch(/In effect Jun 18 to Dec 11/);
    expect(JSON.stringify(feel)).toMatch(/Uranus opposes your Sun \(Jun 18, 2026 to Dec 11, 2026/);
  });
  it('includes Jupiter among the slow transits in effect', () => {
    expect(outerInEffect(chart, place, now).some((l) => /: Jupiter /.test(l.heading))).toBe(true);
  });
  it('finds the progressed angles and the progressed New and Full Moons', () => {
    const p = progressions(chart, place.lat, place.lon, now);
    expect(p.angles?.ingresses.some((x) => x.point === 'Ascendant' && x.sign === 'Taurus')).toBe(true);
    expect(p.phase.name).toBe('Full Moon');
    expect(p.phase.lastFullMoon! < '2026-10-14').toBe(true);
    const b2 = { date: '1990-07-15', time: '09:30', timePrecision: 'exact', windowMinutes: 0, lat: 34.05, lon: -118.24, tz: 'America/Los_Angeles' } as const;
    const c2 = computeNatal(b2);
    const pl2 = { lat: b2.lat, lon: b2.lon };
    expect(progressions(c2, pl2.lat, pl2.lon, now).phase.lastNewMoon?.slice(0, 7)).toBe('2026-05');
    const r = consultOracle('What am I moving through this year?', { chart: c2, place: pl2, now });
    expect(r.lines.some((l) => /progressed New Moon/.test(l.heading))).toBe(true);
    expect(progressedInEffect(chart, place, now).phase.heading).toMatch(/progressed lunar phase: Full Moon/);
  });
  it('answers every yes-or-no question with yes or not yet, never "look closer"', () => {
    const births = [['1990-07-15', '09:30', 34.05, -118.24], ['1987-11-28', '12:00', 39.74, -104.99], ['1979-02-02', '23:10', 51.5, -0.12], ['1995-04-03', '06:15', 40.71, -74.0], ['2001-09-21', '17:45', 41.88, -87.63]] as const;
    for (const [date, time, lat, lon] of births)
      for (const day of ['2026-10-16', '2026-11-02', '2026-12-09'])
        for (const q of ['Should I reach out to them?', 'Should I quit my job?', 'Should I text him tonight?']) {
          const c = computeNatal({ date, time, timePrecision: 'exact', windowMinutes: 0, lat, lon, tz: 'UTC' });
          const r = consultOracle(q, { chart: c, place: { lat, lon }, now: new Date(`${day}T15:00:00Z`) });
          expect(r.label, q).not.toMatch(/look closer/i);
          expect(r.orb, `${q} ${date} ${day}`).toMatch(/^(YES|YES, WITH CARE|NOT YET|WAIT FOR [A-Z]{3} \d{1,2}|ASK AGAIN)$/);
          expect(r.lines[0].text, q).toMatch(/^(Yes|Not yet|Ask)/);
        }
  });
});
