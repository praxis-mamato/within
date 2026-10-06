export type DateKind = 'exact' | 'approximate' | 'range';

export interface FuzzyDate {
  kind: DateKind;
  /** ISO date (YYYY-MM-DD). For approximate dates only the month is meaningful. */
  start: string;
  /** ISO date; required for ranges. */
  end?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Renders a milestone date so its precision stays visible (build spec D5). */
export function formatFuzzyDate(date: FuzzyDate): string {
  const s = parts(date.start);
  if (date.kind === 'exact') return `${MONTHS[s.m - 1]} ${s.d}, ${s.y}`;
  if (date.kind === 'approximate') return `~${MONTHS[s.m - 1]} ${s.y}`;
  if (!date.end) throw new Error('A date range needs an end date');
  const e = parts(date.end);
  if (s.y === e.y) return `${MONTHS[s.m - 1]}–${MONTHS[e.m - 1]} ${s.y}`;
  return `${s.y}–${e.y}`;
}

/** Plain-language label for screen readers and detail views. */
export function describePrecision(kind: DateKind): string {
  return { exact: 'Exact date', approximate: 'Approximate date', range: 'Date range' }[kind];
}
