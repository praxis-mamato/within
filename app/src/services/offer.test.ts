import { describe, expect, it } from 'vitest';
import { offerOn } from './offer';

describe('Black Friday window', () => {
  it('runs from midnight Eastern Nov 27 to midnight Pacific at the end of Cyber Monday (Nov 30)', () => {
    expect(offerOn(Date.parse('2026-11-27T04:59:00Z'))).toBe(false);
    expect(offerOn(Date.parse('2026-11-27T05:00:00Z'))).toBe(true);
    expect(offerOn(Date.parse('2026-12-01T07:59:00Z'))).toBe(true);
    expect(offerOn(Date.parse('2026-12-01T08:00:00Z'))).toBe(false);
  });
});
