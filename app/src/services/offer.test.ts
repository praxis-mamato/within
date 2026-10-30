import { describe, expect, it } from 'vitest';
import { offerOn } from './offer';

describe('Black Friday window', () => {
  it('runs from midnight Eastern Nov 27 to midnight Pacific after Cyber Monday', () => {
    expect(offerOn(Date.parse('2026-11-27T04:59:00Z'))).toBe(false);
    expect(offerOn(Date.parse('2026-11-27T05:00:00Z'))).toBe(true);
    expect(offerOn(Date.parse('2026-12-02T07:59:00Z'))).toBe(true);
    expect(offerOn(Date.parse('2026-12-02T08:00:00Z'))).toBe(false);
  });
});
