import { computeNatal } from '../astro/natal';
import { lint } from './lint';
import * as WK from './week';
import { sampleBirths } from './samples';

const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);

describe('week library', () => {
  it('passes the content lint', () => {
    for (const s of strings([WK.WEEK_MOVER, WK.WEEK_CONTACT, WK.WEEK_TARGET, WK.WEEK_HOUSE_SHORT, WK.WEEK_POINT_SHORT, WK.WEEK_LUNATION_ASPECT, WK.WEEK_FOCUS, WK.WEEK_STATION, WK.WEEK_TEXT])) expect(lint(s), s).toEqual([]);
  });
  it('has a line for every planet and aspect', () => {
    for (const m of ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'])
      for (const a of ['conjunct', 'sextile', 'square', 'trine', 'opposite'] as const) expect(WK.WEEK_CONTACT[m][a]).toBeTruthy();
  });
});

describe('weekReading', () => {
  const now = new Date('2026-10-09T15:00:00Z');
  it('reads every sample chart without gaps', () => {
    for (const b of sampleBirths()) {
      const c = computeNatal(b, now);
      const secs = WK.weekReading(c, b, now, { season: 'Building', onMind: ['work', 'love'], recharge: '' });
      const text = secs.flatMap((s) => [s.title, s.intro ?? '', ...s.items.flatMap((i) => [i.heading, i.text, i.basis ?? ''])]).join('\n');
      expect(text).not.toMatch(/undefined|NaN|null/);
      for (const line of text.split('\n')) expect(lint(line), line).toEqual([]);
    }
  });
  it('dates contacts, names houses and degrees, and gives lunations their exact degree', () => {
    const b = { date: '1985-07-14', time: '06:30', timePrecision: 'exact' as const, windowMinutes: 60, lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' };
    const secs = WK.weekReading(computeNatal(b, now), b, now, { season: 'Building', onMind: ['work'], recharge: '' });
    const mars = secs.find((s) => s.id === 'w-mars');
    expect(mars?.title).toMatch(/^Mars in \w+: desire/);
    expect(mars?.intro).toMatch(/your \d+(st|nd|rd|th) house/);
    expect(mars?.items[0].heading).toMatch(/^(Today|Oct \d+): Mars \w+ your /);
    const moon = secs.find((s) => s.id === 'w-lunations');
    expect(moon?.items[0].heading).toMatch(/New Moon at \d+°\d\d′ Libra/);
  });
});
