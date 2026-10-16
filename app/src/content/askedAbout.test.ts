import { describe, expect, it } from 'vitest';
import { loadPlaces } from '../geo/places';
import { computeNatal } from '../astro/natal';
import { subjectIn, windowIn } from './askedAbout';
import { consultOracle } from './oracleEngine';

const now = new Date('2026-10-16T18:00:00Z');

describe('a question that carries someone’s birth details and an event’s dates', () => {
  it('reads the name, birth date, time, and town', async () => {
    const places = await loadPlaces();
    for (const q of ['Will my friend Mariya 6/6/86 17:40 Billings mt ride in Vegas show Nov 9-15', 'Will my friend Mariya June 6, 1986 5:40pm Billings Montana ride in the Vegas show Nov 9 to 15?']) {
      const s = subjectIn(q, places, now)!;
      expect(s.name).toBe('Mariya');
      expect(s.date).toBe('1986-06-06');
      expect(s.time).toBe('17:40');
      expect(s.place?.name).toBe('Billings');
      expect(s.place?.tz).toBe('America/Denver');
      expect(windowIn(s.rest, now)).toEqual({ start: '2026-11-09', end: '2026-11-15' });
    }
  });
  it('reads event dates in several forms, in the coming year', () => {
    expect(windowIn('on Nov 12', now)).toEqual({ start: '2026-11-12', end: '2026-11-12' });
    expect(windowIn('Dec 30 - Jan 2', now)).toEqual({ start: '2026-12-30', end: '2027-01-02' });
    expect(windowIn('11/9-11/15', now)).toEqual({ start: '2026-11-09', end: '2026-11-15' });
    expect(windowIn('in March 3 to 5', now)).toEqual({ start: '2027-03-03', end: '2027-03-05' });
    expect(windowIn('What is my rising sign?', now)).toBeNull();
  });
  it('answers from their chart over those dates, not from the asker’s', async () => {
    const places = await loadPlaces();
    const me = computeNatal({ date: '1987-11-28', time: '12:00', timePrecision: 'exact', windowMinutes: 0, lat: 39.74, lon: -104.99, tz: 'America/Denver' });
    const r = consultOracle('Will my friend Mariya 6/6/86 17:40 Billings mt ride in Vegas show Nov 9-15', { chart: me, place: { lat: 39.74, lon: -104.99 }, now, places });
    expect(r.label).toMatch(/^Mariya, Nov 9–15: /);
    expect(r.orb).toMatch(/WEEK|CARE/);
    expect(r.lines[0].basis).toMatch(/Mariya’s chart: Jun 6, 1986, 17:40, Billings/);
    expect(JSON.stringify(r)).not.toMatch(/\byour (Sun|Moon|Venus|Mars|Mercury|Ascendant)\b/);
    // Without the town list, it asks for the town rather than guessing.
    const noTown = consultOracle('Will Mariya 6/6/86 17:40 ride Nov 9-15', { chart: me, place: { lat: 39.74, lon: -104.99 }, now, places: [] });
    expect(noTown.orb).toBe('WHERE?');
  });
});
