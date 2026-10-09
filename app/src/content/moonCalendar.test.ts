import { computeNatal } from '../astro/natal';
import { toIcs } from '../lib/ics';
import { lint } from './lint';
import { MOON_CAL_TEXT, moonCalendar } from './moonCalendar';

describe('the Moon calendar', () => {
  const b = { date: '1985-07-14', time: '06:30', timePrecision: 'exact' as const, windowMinutes: 60, lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' };
  const c = computeNatal(b, new Date('2026-10-09T12:00:00Z'));
  const all = { phases: true, signs: true, voidOfCourse: true, retrogrades: true };
  const ev = moonCalendar(c, b, new Date('2026-10-09T12:00:00Z'), 12, all);
  it('maps a year: about 49 phases, 160 sign changes, voids, and retrogrades', () => {
    const count = (re: RegExp) => ev.filter((e) => re.test(e.title)).length;
    expect(count(/New Moon|Full Moon|Quarter/)).toBeGreaterThanOrEqual(48);
    expect(count(/enters/)).toBeGreaterThanOrEqual(155);
    expect(count(/void/)).toBeGreaterThan(80);
    expect(count(/Mercury retrograde/)).toBeGreaterThanOrEqual(3);
    expect(ev.some((e) => /your \d+(st|nd|rd|th) house/.test(e.title))).toBe(true);
  });
  it('has New Moon 10 October 2026 in Libra and no gaps or banned words', () => {
    const nm = ev.find((e) => /New Moon/.test(e.title))!;
    expect(nm.start.toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(nm.title).toMatch(/Libra/);
    for (const e of ev) {
      expect(`${e.title} ${e.description}`).not.toMatch(/undefined|NaN/);
      for (const l of e.description.split('\n')) expect(lint(l), l).toEqual([]);
    }
    for (const s of Object.values(MOON_CAL_TEXT)) expect(lint(s)).toEqual([]);
  });
  it('writes valid iCalendar', () => {
    const ics = toIcs(ev.slice(0, 5), MOON_CAL_TEXT.name);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
});
