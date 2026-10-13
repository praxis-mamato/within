import { beforeEach, describe, expect, it } from 'vitest';
import { captureReferral, referralCode } from './referral';

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

describe('affiliate referral links', () => {
  beforeEach(() => store.clear());
  it('keeps a valid code for 60 days', () => {
    captureReferral('?ref=Chris-B', 0);
    expect(referralCode(59 * 86400000)).toBe('chris-b');
    expect(referralCode(61 * 86400000)).toBeUndefined();
  });
  it('ignores malformed codes and lets the last valid link win', () => {
    captureReferral('?ref=<script>', 0);
    expect(referralCode(1)).toBeUndefined();
    captureReferral('?ref=first', 0);
    captureReferral('?ref=second', 10);
    expect(referralCode(20)).toBe('second');
  });
});
