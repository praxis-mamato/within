import { computeNatal } from '../astro/natal';
import { answerFor, answerText, feelingIn, wantsAnswer } from './answer';
import { lint } from './lint';
import { topicFor } from './topics';
import { sampleBirths } from './samples';

const now = new Date('2026-10-08T19:00:00Z');
const births = sampleBirths();
const charts = births.map((b) => computeNatal(b, now));
const place = (i: number) => ({ lat: births[i].lat, lon: births[i].lon });
const ask = (q: string, i: number) => answerFor(q, topicFor(q, []), charts[i], place(i), now);
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe('answers to sky and feeling questions', () => {
  it('recognizes the feeling the person named', () => {
    expect(feelingIn('why do I feel anxious')).toBe('anxious');
    expect(feelingIn('I’m so stressed at work')).toBe('stressed');
    expect(feelingIn('feeling low lately')).toBe('low');
    expect(feelingIn('We keep having the same argument.')).toBeNull();
    expect(topicFor('I asked about the sky right now and why I feel anxious', [])).toBe('feelings');
  });

  it('only answers sky and feeling questions', () => {
    expect(wantsAnswer('conflict', 'We keep having the same argument.')).toBe(false);
    expect(ask('We keep having the same argument.', 0)).toBeNull();
  });

  it('gives a full, personal answer about feeling anxious, not a couple of sentences', () => {
    for (let i = 0; i < charts.length; i++) {
      const a = ask('What’s in the sky right now, and why do I feel anxious?', i)!;
      expect(a.title).toBe('About feeling anxious');
      expect(a.sections.map((s) => s.id)).toEqual(expect.arrayContaining(['why', 'sky', 'help']));
      expect(a.care).toMatch(/doctor or counselor/);
      const text = answerText(a);
      expect(words(text)).toBeGreaterThan(150);
      expect(text).not.toMatch(/undefined|NaN|\{target\}/);
    }
  });

  it('answers the sky question with dated, chart-specific detail', () => {
    const a = ask('What’s happening in the sky right now, and how might it affect me?', 0)!;
    expect(a.title).toBe('The sky right now, for you');
    expect(answerText(a)).toMatch(/The Moon is in \w+/);
    expect(answerText(a)).toMatch(/20\d\d/);
  });

  it('differs between charts', () => {
    const texts = new Set(charts.slice(0, 10).map((_, i) => answerText(ask('Why do I feel anxious right now?', i)!)));
    expect(texts.size).toBe(10);
  });

  it('passes the content lint for every sample chart', () => {
    for (let i = 0; i < charts.length; i++)
      for (const q of ['Why do I feel anxious right now?', 'What’s happening in the sky right now, and how might it affect me?', 'I feel stressed and low.'])
        expect(lint(answerText(ask(q, i)!))).toEqual([]);
  });

  it('names houses only when the birth time is exact', () => {
    const i = charts.findIndex((c) => c.timePrecision === 'unknown');
    expect(answerText(ask('Why do I feel anxious right now?', i)!)).toMatch(/houses are not included/);
  });
});
