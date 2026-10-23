import { describe, expect, it } from 'vitest';
import { skyNow } from './skyNow';

describe('skyNow', () => {
  const lines = skyNow(new Date('2026-10-23T18:00:00Z'));
  it('names the retrogrades with their stations', () => {
    expect(lines.some((l) => l.startsWith('Venus retrograde now') && l.includes('stations direct 2026-11-14'))).toBe(true);
    expect(lines).toContain('Mercury stations retrograde 2026-10-24 at 20°58′ Scorpio (sky now)');
  });
  it('gives the Full Moon to the minute', () => {
    expect(lines).toContain('Full Moon 2026-10-26 04:12 UTC at 2°46′ Taurus (sky now)');
  });
  it('finds exact aspects and fits the fact limits', () => {
    expect(lines.some((l) => l.startsWith('Sun square Pluto exact 2026-10-26'))).toBe(true);
    expect(lines.length).toBeLessThanOrEqual(20);
    expect(lines.every((l) => l.length <= 240 && l.endsWith('(sky now)'))).toBe(true);
  });
});
