import { formatFuzzyDate } from './dates';

describe('formatFuzzyDate', () => {
  it('shows exact dates in full', () => {
    expect(formatFuzzyDate({ kind: 'exact', start: '2021-06-12' })).toBe('Jun 12, 2021');
  });
  it('marks approximate dates with a tilde and drops the day', () => {
    expect(formatFuzzyDate({ kind: 'approximate', start: '2023-04-01' })).toBe('~Apr 2023');
  });
  it('shows ranges within a year by month', () => {
    expect(formatFuzzyDate({ kind: 'range', start: '2024-02-01', end: '2024-05-01' })).toBe('Feb–May 2024');
  });
  it('shows multi-year ranges by year', () => {
    expect(formatFuzzyDate({ kind: 'range', start: '2021-01-01', end: '2022-12-01' })).toBe('2021–2022');
  });
  it('rejects a range without an end', () => {
    expect(() => formatFuzzyDate({ kind: 'range', start: '2021-01-01' })).toThrow();
  });
});
