import { afterEach, describe, expect, it } from 'vitest';
import { mergeReview, REVIEW_KEY, reviewMoveTarget } from './moveReview';

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage ??= {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

describe('review console move', () => {
  afterEach(() => localStorage.removeItem(REVIEW_KEY));

  it('leaves other links to the general move', () => {
    expect(reviewMoveTarget('')).toBeNull();
    expect(reviewMoveTarget('#/')).toBeNull();
    expect(reviewMoveTarget('#/reviews')).toBeNull();
  });

  it('opens the console on the new address when nothing was decided', () => {
    expect(reviewMoveTarget('#/review')).toBe('https://withinoracle.app/#/review');
    expect(reviewMoveTarget('#/review/western')).toBe('https://withinoracle.app/#/review/western');
  });

  it('carries saved decisions, and decisions on the new address win', () => {
    const old = { approver: 'Maggie', decisions: { a: { status: 'approved' }, b: { status: 'rejected' } } };
    localStorage.setItem(REVIEW_KEY, JSON.stringify(old));
    const target = reviewMoveTarget('#/review')!;
    expect(target.startsWith('https://withinoracle.app/#review-import=')).toBe(true);
    const merged = mergeReview({ approver: 'M', decisions: { b: { status: 'approved' } } }, old);
    expect(merged).toEqual({ approver: 'M', decisions: { a: { status: 'approved' }, b: { status: 'approved' } } });
  });
});
