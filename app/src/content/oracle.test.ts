import { computeNatal } from '../astro/natal';
import { lint } from './lint';
import * as OR from './oracle';
import { sampleBirths } from './samples';

const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);

describe('the Oracle', () => {
  it('library passes the content lint', () => {
    for (const s of strings([OR.ORACLE_TONE, OR.ORACLE_REFRAME, OR.ORACLE_TEXT])) expect(lint(s), s).toEqual([]);
  });
  it('never gives a tone to health, pregnancy, another person’s heart, legal, or gambling questions', () => {
    for (const [q, kind] of [
      ['Will I get pregnant this year?', 'health'],
      ['Is the tumor cancer?', 'health'],
      ['Is he cheating on me?', 'others'],
      ['Does she still love me?', 'others'],
      ['Will I win the court case?', 'legal'],
      ['Should I buy bitcoin?', 'gamble'],
      ['hi', 'unclear'],
    ] as const)
      expect(OR.limitOf(q), q).toBe(kind);
    expect(OR.limitOf('Should I text him tonight?')).toBeNull();
    expect(OR.areaOf('Should I apply for the job?')).toBe('work');
  });
  it('answers every sample chart with a tone, a reason, and no gaps', () => {
    const now = new Date('2026-10-09T15:00:00Z');
    for (const [i, b] of sampleBirths().entries()) {
      const c = computeNatal(b, now);
      const a = OR.askOracle('Should I reach out to them this week?', c, b, new Date(now.getTime() + i * 5 * 3600000));
      expect(['go', 'wait', 'closer']).toContain(a.tone);
      expect(a.because.length).toBeGreaterThan(10);
      const text = [a.label, a.line, a.because, ...a.why].join('\n');
      expect(text).not.toMatch(/undefined|NaN|null/);
      for (const l of text.split('\n')) expect(lint(l), l).toEqual([]);
    }
  });
  it('gives the same answer to the same question on the same day', () => {
    const b = sampleBirths()[0];
    const now = new Date('2026-10-09T15:00:00Z');
    const c = computeNatal(b, now);
    expect(OR.askOracle('Should I go?', c, b, now).line).toBe(OR.askOracle('should I go? ', c, b, now).line);
  });
  it('finds void-of-course Moons', () => {
    let voids = 0;
    for (let h = 0; h < 24 * 28; h += 6) if (!OR.moonOfMoment(new Date(Date.UTC(2026, 9, 1) + h * 3600000)).next) voids++;
    expect(voids).toBeGreaterThan(0);
    expect(voids).toBeLessThan(60);
  });
});
