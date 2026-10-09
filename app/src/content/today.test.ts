import { computeNatal } from '../astro/natal';
import { lint } from './lint';
import { chartInBrief, todaySky } from './today';
import { WHY } from '../components/Paywall';
import { sampleBirths } from './samples';

describe('today, free layer', () => {
  const now = new Date('2026-10-09T15:00:00Z');
  it('reads every sample chart with no gaps and passes the lint', () => {
    for (const b of sampleBirths()) {
      const c = computeNatal(b, now);
      const sky = todaySky(c, b, now);
      const lines = [sky.moon, ...sky.now, ...chartInBrief(c)].flatMap((x) => [x.heading, x.text, x.basis ?? '']).concat(sky.later);
      for (const l of lines) {
        expect(l).not.toMatch(/undefined|NaN|null/);
        expect(lint(l), l).toEqual([]);
      }
      expect(chartInBrief(c).length).toBeGreaterThanOrEqual(2);
    }
  });
  it('the paywall pitch passes the lint', () => {
    for (const [h, t] of WHY) expect(lint(`${h} ${t}`)).toEqual([]);
  });
});
