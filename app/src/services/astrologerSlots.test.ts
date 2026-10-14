import { describe, expect, it } from 'vitest';
import { readingSlots, zonedTime } from './astrologer';

describe('live reading times', () => {
  it('converts Mountain time across daylight saving', () => {
    expect(zonedTime(2026, 10, 14, 12).toISOString()).toBe('2026-10-14T18:00:00.000Z'); // MDT, UTC-6
    expect(zonedTime(2026, 11, 13, 12).toISOString()).toBe('2026-11-13T19:00:00.000Z'); // MST, UTC-7
  });
  it('offers Mon, Wed and Fri at 12, 1 and 2pm from 20 hours ahead, minus taken times', () => {
    const now = new Date('2026-10-14T12:00:00Z'); // Wed 6am Mountain
    const taken = new Set([zonedTime(2026, 10, 16, 12).getTime()]);
    const slots = readingSlots(now, taken);
    expect(slots[0].toISOString()).toBe('2026-10-16T19:00:00.000Z'); // Fri 1pm (12pm taken; Wed too soon)
    expect(slots.every((s) => s.getTime() - now.getTime() >= 20 * 3600000)).toBe(true);
    expect(slots.length).toBeGreaterThanOrEqual(30);
  });
});
