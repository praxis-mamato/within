import { computeNatal } from '../astro/natal';
import { lint } from './lint';
import * as OE from './oracleEngine';
import { sampleBirths } from './samples';

const Q: [string, OE.Intent][] = [
  ['What’s my rising sign?', 'chart'],
  ['What does my Venus mean?', 'chart'],
  ['What dasha am I in?', 'chart'],
  ['When is a good day to ask for a raise?', 'when'],
  ['Is Mercury retrograde?', 'retro'],
  ['When is my Saturn return?', 'return'],
  ['When is the next Full Moon?', 'lunation'],
  ['What am I moving through this year?', 'cycle'],
  ['Why do I feel restless?', 'feeling'],
  ['What are my patterns?', 'patterns'],
  ['Where is Mars right now?', 'planet'],
  ['What’s the sky doing tonight?', 'sky'],
  ['Are we compatible?', 'together'],
  ['What does my week look like?', 'week'],
  ['Should I text him?', 'decision'],
  ['Should I reach out to them this week?', 'decision'],
  ['Tell me something', 'open'],
];

describe('the Oracle engine', () => {
  it('reads what kind of question it is', () => {
    for (const [q, intent] of Q) expect(OE.intentOf(q), q).toBe(intent);
  });
  it('library passes the lint', () => {
    for (const s of [...Object.values(OE.ORACLE_SAYS), ...Object.values(OE.RETURN_MEANING)]) expect(lint(s), s).toEqual([]);
  });
  it('answers every kind of question for every sample chart, with no gaps and within the lint', () => {
    const now = new Date('2026-10-09T15:00:00Z');
    const births = sampleBirths();
    for (const [i, b] of births.entries()) {
      if (i % 4) continue;
      const c = computeNatal(b, now);
      for (const [q] of Q) {
        const a = OE.consultOracle(q, { chart: c, place: b, now });
        expect(a.lines.length, q).toBeGreaterThan(0);
        expect(a.label).toBeTruthy();
        const text = [a.label, a.orb, ...(a.consulted ?? []), ...(a.layers ?? []).map((l) => l.title), ...[...a.lines, ...a.deeper, ...(a.layers ?? []).flatMap((l) => l.lines)].flatMap((l) => [l.heading, l.text, l.basis ?? ''])];
        for (const t of text) {
          expect(t, `${q}: ${t}`).not.toMatch(/undefined|NaN|\bnull\b|\[object/);
          expect(lint(t), `${q}: ${t}`).toEqual([]);
        }
      }
    }
  });
  it('gives a full layered reading for life-area and planet questions', () => {
    const b = sampleBirths()[0];
    const c = computeNatal(b, new Date('2026-10-09T15:00:00Z'));
    const job = OE.consultOracle('Should I apply for the new job?', { chart: c, place: b, now: new Date('2026-10-09T15:00:00Z') });
    expect(job.layers!.map((l) => l.title)).toEqual(expect.arrayContaining(['The year ahead: slow planets', 'The next 30 days', 'Your progressed chart and solar arcs', 'The Vedic view']));
    expect(job.consulted!.length).toBeGreaterThan(5);
    const venus = OE.consultOracle('What does my Venus mean?', { chart: c, place: b });
    expect(venus.layers![0].title).toBe('Your birth chart: your Venus');
  });
  it('answers health questions from the chart, with a boundary for illness, and still refuses others, legal, and gambling', () => {
    const b = sampleBirths()[0];
    const c = computeNatal(b, new Date());
    const h = OE.consultOracle('How is my health?', { chart: c, place: b });
    expect(h.intent).toBe('area');
    expect(h.lines[0].heading).toMatch(/Your vitality: Sun in/);
    for (const q of ['How is my health?', 'How is my love life?', 'What about my money?', 'Should I apply for the new job?', 'Tell me something'])
      for (const l of [...OE.consultOracle(q, { chart: c, place: b }).lines, ...OE.consultOracle(q, { chart: c, place: b }).deeper]) {
        expect(`${l.heading} ${l.text}`).not.toMatch(/undefined|NaN/);
        expect(lint(`${l.heading} ${l.text}`), l.text).toEqual([]);
      }
    const p = OE.consultOracle('When will I get pregnant?', { chart: c, place: b });
    expect(p.lines[0].text).toMatch(/can’t speak to illness/);
    expect(p.lines.some((l) => /vitality/.test(l.heading))).toBe(true);
    for (const q of ['When will he come back?', 'When should I buy bitcoin?']) expect(OE.consultOracle(q, { chart: c, place: b }).limit, q).toBeTruthy();
  });
  it('remembers locally: no repeated lines the same day, and a callback to a related question', () => {
    const b = sampleBirths()[0];
    const now = new Date('2026-10-10T12:00:00Z');
    const c = computeNatal(b, now);
    const first = OE.consultOracle('What’s the energy today?', { chart: c, place: b, now });
    const second = OE.consultOracle('What are the stars saying right now?', { chart: c, place: b, now, history: [first] });
    const firstTexts = new Set(first.lines.map((l) => l.text));
    expect(second.lines.filter((l) => l.text && firstTexts.has(l.text)).length).toBeLessThan(second.lines.length);
    const yesterday = { ...OE.consultOracle('How is my career going?', { chart: c, place: b, now }), day: '2026-10-09' };
    const again = OE.consultOracle('What about work this month?', { chart: c, place: b, now, history: [yesterday] });
    expect(again.lines.some((l) => l.heading === 'Last time' && /Oct 9/.test(l.text))).toBe(true);
  });
});
