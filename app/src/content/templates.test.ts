import * as T from './templates';
import { composeReflection } from './compose';
import { computeNatal } from '../astro/natal';
import { BANNED as RULES } from './lint';

const BANNED = RULES.map((b) => b.re);

/** Every string in the library, flattened. */
function strings(x: unknown): string[] {
  if (typeof x === 'string') return [x];
  if (Array.isArray(x)) return x.flatMap(strings);
  if (x && typeof x === 'object') return Object.values(x).flatMap(strings);
  return [];
}
const all = strings(Object.values(T));

describe('template library', () => {
  it.each(BANNED.map((r) => [r.source, r]))('contains no %s', (_s, re) => {
    expect(all.filter((s) => re.test(s))).toEqual([]);
  });
  it('covers all 12 signs and 27 nakshatras', () => {
    expect(Object.keys(T.WESTERN_SIGN)).toHaveLength(12);
    expect(Object.keys(T.VEDIC_RASHI)).toHaveLength(12);
    expect(Object.keys(T.NAKSHATRA)).toHaveLength(27);
    expect(Object.keys(T.DASHA_THEME)).toHaveLength(9);
  });
});

const base = { timePrecision: 'exact' as const, windowMinutes: 60 };
const charts = [
  computeNatal({ ...base, date: '1985-11-23', time: '08:35', lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' }),
  computeNatal({ ...base, date: '1994-05-09', time: '15:30', lat: 34.052, lon: -118.244, tz: 'America/Los_Angeles' }),
  computeNatal({ ...base, date: '1972-02-15', time: '09:45', lat: -33.87, lon: 151.21, tz: 'Australia/Sydney' }),
  computeNatal({ ...base, date: '2001-09-30', time: '22:10', lat: 51.5, lon: -0.13, tz: 'Europe/London' }),
];
const now = new Date('2026-10-06T12:00:00Z');

describe('composeReflection', () => {
  it.each(['self', 'purpose', 'relationship', 'other'] as const)('gives different charts different %s readings', (pillar) => {
    const bodies = charts.map((c, i) => {
      const r = composeReflection(pillar, c, pillar === 'other' ? charts[(i + 1) % charts.length] : null, 'Alex', now);
      return r.western.body + r.vedic.body;
    });
    expect(new Set(bodies).size).toBe(charts.length);
  });

  it('leaves no unfilled placeholders and passes the content lint', () => {
    for (const c of charts)
      for (const p of ['self', 'purpose', 'relationship', 'other'] as const) {
        const r = composeReflection(p, c, charts[0], 'Alex', now);
        const text = [r.western.title, r.western.body, r.vedic.title, r.vedic.body, r.together.body, r.question, r.step].join(' ');
        expect(text).not.toMatch(/\{|\}|undefined|null|NaN/);
        for (const re of BANNED) expect(text).not.toMatch(re);
      }
  });

  it('records template IDs for every reading', () => {
    const r = composeReflection('self', charts[0], null, 'Alex', now);
    expect(r.western.templateIds.length).toBeGreaterThan(0);
    expect(r.vedic.templateIds.every((id) => id.endsWith(`@${T.LIBRARY_VERSION}`))).toBe(true);
  });

  it('says so when the birth time is unknown instead of picking a Moon sign', () => {
    // 2000-01-07: the Moon changes sign during the day in both zodiacs.
    const c = computeNatal({ ...base, timePrecision: 'unknown', date: '2000-01-07', time: '', lat: 51.5, lon: -0.13, tz: 'Europe/London' });
    const r = composeReflection('self', c, null, 'Alex', now);
    if (!c.western.moonSign.certain) expect(r.western.body).toMatch(/could be in \w+ or \w+/);
    if (!c.vedic.moonRashi.certain) expect(r.vedic.body).toMatch(/could be in/);
    expect(r.western.body + r.vedic.body).not.toMatch(/undefined/);
  });

  it('only offers steps involving the other person on the Other pillar', () => {
    expect(composeReflection('self', charts[0], null).stepInvolvesOther).toBe(false);
    expect(composeReflection('other', charts[0], charts[1], 'Alex').stepInvolvesOther).toBe(true);
  });
});
