import { computeNatal } from '../astro/natal';
import { lint } from './lint';
import { consultOracle } from './oracleEngine';
import { plain, PLAIN_TEXT } from './plain';

describe('say it simply', () => {
  const now = new Date('2026-10-09T15:00:00Z');
  const b = { date: '1985-07-14', time: '06:30', timePrecision: 'exact' as const, windowMinutes: 60, lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' };
  const c = computeNatal(b, now);
  it('swaps astrology terms for everyday words', () => {
    expect(plain('Transiting Saturn square your natal Moon, within 0°34′.')).toBe('passing planets Saturn clashes with your birth Moon, closely.'.replace('passing planets Saturn', 'passing Saturn'));
    expect(plain('Your progressed Moon is in your 5th house')).toBe('Your grown-up Moon is in your 5th house');
  });
  it('rewrites any earlier answer in plain words, with no jargon and within the lint', () => {
    for (const q of ['Should I apply for the new job?', 'When is a good day to ask for a raise?', 'What does my Venus mean?', 'Is Mercury retrograde?', 'What am I moving through this year?']) {
      const first = consultOracle(q, { chart: c, place: b, now });
      const s = consultOracle('Say it simply', { chart: c, place: b, now, previous: first });
      expect(s.intent).toBe('simplify');
      expect(s.lines[0].heading).toBe(PLAIN_TEXT.gist);
      const text = s.lines.map((l) => `${l.heading} ${l.text}`).join(' ');
      expect(text, q).not.toMatch(/\b(square|trine|sextile|natal|transit|progressed|°)/i);
      expect(text).not.toMatch(/undefined|NaN/);
      expect(lint(text), text).toEqual([]);
    }
  });
  it('with nothing to simplify, gives the chart in three plain lines', () => {
    const s = consultOracle('Explain my chart simply', { chart: c, place: b, now });
    expect(s.lines.length).toBeGreaterThanOrEqual(3);
  });
});
