import { computeNatal } from '../astro/natal';
import { lint } from './lint';
import { PATTERNS } from './patterns';
import { findPatterns } from './patternRules';
import * as CY from './cycles';
import { sampleBirths } from './samples';

const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);
const now = new Date('2026-10-06T12:00:00Z');
const births = sampleBirths();
const charts = births.map((b) => computeNatal(b, now));

describe('pattern and cycle libraries', () => {
  it('pass the content lint', () => {
    expect(strings(PATTERNS).flatMap((s) => lint(s).map((why) => `${why}: ${s.slice(0, 60)}`))).toEqual([]);
    expect(strings(CY).flatMap((s) => lint(s).map((why) => `${why}: ${s.slice(0, 60)}`))).toEqual([]);
  });
  it('fill every field of every pattern', () => {
    for (const p of Object.values(PATTERNS)) {
      for (const k of ['title', 'summary', 'shows', 'gift', 'edge', 'helps', 'question'] as const) expect(p[k].length).toBeGreaterThan(20);
      expect(p.notice).toHaveLength(3);
    }
  });
  it('cover every slow planet and aspect class', () => {
    for (const m of ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']) for (const k of ['conj', 'hard', 'soft'] as const) for (const t of [CY.CYCLE_TITLE, CY.CYCLE_FEEL, CY.CYCLE_HELP]) expect(t[m][k]).toBeTruthy();
  });
});

describe('patterns', () => {
  const found = charts.map((c, i) => findPatterns(c, births[i].lat, births[i].lon));
  it('give every chart at least six patterns, each with evidence', () => {
    for (const ps of found) {
      expect(ps.length).toBeGreaterThanOrEqual(6);
      for (const p of ps) expect(p.evidence.length).toBeGreaterThan(0);
    }
  });
  it('differ between people and use most of the library', () => {
    const tops = new Set(found.map((ps) => ps.slice(0, 3).map((p) => p.id).join()));
    expect(tops.size).toBeGreaterThan(births.length * 0.8);
    const used = new Set(found.flat().map((p) => p.id));
    expect(used.size).toBeGreaterThan(Object.keys(PATTERNS).length * 0.85);
  });
});

describe('mirror', () => {
  it('writes area lines and personal season lines without banned words, for every pattern and planet', async () => {
    const M = await import('./mirror');
    expect(strings(M).flatMap((s) => lint(s).map((why) => `${why}: ${s.slice(0, 60)}`))).toEqual([]);
    for (const id of Object.keys(PATTERNS)) expect(Object.keys(M.PATTERN_AREAS[id] ?? {}).length).toBeGreaterThanOrEqual(3);
    for (const m of ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']) {
      for (const t of Object.keys(M.TARGET_AREAS)) expect(M.MOVER_TARGET[m][t]).toBeTruthy();
      expect(Object.keys(M.MOVER_AREA[m])).toHaveLength(8);
    }
  });
  it('reflects the person’s answers back', async () => {
    const { mirrorFor } = await import('./mirror');
    const notice: [string, string, string] = ['Saying yes', 'Feeling tired', 'Relief'];
    expect(mirrorFor({ fit: 'yes', noticed: ['Saying yes', 'Relief'] }, notice, 'Try X.')).toBe('This one is you, especially saying yes and relief. What tends to help: try X.');
    expect(mirrorFor({ fit: 'no', noticed: [] }, notice, 'Try X.')).toMatch(/moves down your list/);
    expect(mirrorFor({ fit: 'partly', noticed: ['Feeling tired'] }, notice, 'Try X.')).toMatch(/feeling tired/);
  });
  it('puts what is on the person’s mind first in cycles', () => {
    const r = CY.cycles(charts[0], births[0].lat, births[0].lon, now, { season: 'Changing direction', onMind: ['work', 'love'], recharge: '' });
    const firstFor = r.now.findIndex((x) => x.forYou.length > 0);
    if (firstFor >= 0) expect(r.now.slice(0, firstFor).every((x) => x.forYou.length > 0)).toBe(true);
  });
});

describe('cycles', () => {
  it('are dated, ordered, and phased for every chart, including unknown birth time', () => {
    charts.forEach((c, i) => {
      const r = CY.cycles(c, births[i].lat, births[i].lon, now);
      expect(r.now.length).toBeGreaterThan(0);
      for (const x of r.now) {
        expect(x.start <= x.end).toBe(true);
        expect(x.end >= '2026-10-06').toBe(true);
        expect(`${x.title} ${x.feel} ${x.helps} ${x.touches} ${x.contacts.map((ct) => ct.line).join(' ')}`).not.toMatch(/undefined|NaN/);
        for (const p of x.peaks) expect(p >= x.start && p <= x.end).toBe(true);
      }
      // One season per planet: no repeated titles.
      expect(new Set(r.now.map((x) => x.title)).size).toBe(r.now.length);
      for (const x of r.next) {
        expect(x.start > '2026-10-06').toBe(true);
        expect(x.line).toBeTruthy();
      }
      expect(new Set(r.next.map((x) => x.transiting + x.natal)).size).toBe(r.next.length);
    });
  });
});
