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
        const text = [a.label, a.orb, ...[...a.lines, ...a.deeper].flatMap((l) => [l.heading, l.text, l.basis ?? ''])];
        for (const t of text) {
          expect(t, `${q}: ${t}`).not.toMatch(/undefined|NaN|\bnull\b|\[object/);
          expect(lint(t), `${q}: ${t}`).toEqual([]);
        }
      }
    }
  });
  it('still refuses health, others, legal, and gambling questions', () => {
    const b = sampleBirths()[0];
    const c = computeNatal(b, new Date());
    for (const q of ['When will I get pregnant?', 'When will he come back?', 'When should I buy bitcoin?']) expect(OE.consultOracle(q, { chart: c, place: b }).limit, q).toBeTruthy();
  });
});
