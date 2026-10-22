import { answerMessage, answerProblems, cleanAnswer, validateAnswer } from '../../../supabase/functions/_shared/oracleAnswer.ts';

const facts = ['Moon in Cancer 12°04′, house 4 (Western, tropical)', '2026-10-21: transiting Saturn square natal Moon (12°04′ Cancer), within 0°40′ (Western)'];
const req = { question: 'Why do I feel so lonely lately?', facts, found: ['About feeling lonely'] };

describe('validateAnswer', () => {
  it('accepts a question with chart facts', () => {
    expect(validateAnswer(req)).toMatchObject({ question: 'Why do I feel so lonely lately?', asked: [], memory: [] });
  });
  it.each([
    [null, /Missing/],
    [{ ...req, question: ' ' }, /one question/],
    [{ ...req, question: 'x'.repeat(301) }, /one question/],
    [{ ...req, facts: [] }, /facts/],
    [{ ...req, asked: Array(9).fill('q') }, /earlier questions/],
    [{ ...req, memory: Array(13).fill('m') }, /memory/],
  ])('rejects %j', (r, msg) => expect(validateAnswer(r)).toMatch(msg as RegExp));
});

describe('answerMessage', () => {
  it('carries the question, the chart, what Within found, and earlier questions', () => {
    const m = answerMessage({ ...req, asked: ['2026-10-18: Should I quit my job?'], memory: [] });
    expect(m.startsWith('QUESTION: Why do I feel so lonely lately?')).toBe(true);
    expect(m).toContain('CHART FACTS:\n- Moon in Cancer');
    expect(m).toContain('WHAT WITHIN FOUND FOR THIS QUESTION:\n- About feeling lonely');
    expect(m).toContain('EARLIER QUESTIONS ON THIS DEVICE:\n- 2026-10-18: Should I quit my job?');
    expect(m).not.toContain('WHAT YOU REMEMBER');
  });
});

describe('answerProblems and cleanAnswer', () => {
  it('passes a warm answer grounded in the facts', () => {
    expect(answerProblems({ headline: 'A heavy Moon, not a flaw in you', paragraphs: ['Loneliness can sit with you even in a full room. Your Moon in Cancer sits at 12°04′, and Saturn is pressing on it today.'], followups: [] }, facts)).toEqual([]);
  });
  it('catches certainty, invented placements, and an empty answer', () => {
    expect(answerProblems({ headline: 'You will find love', paragraphs: ['x'], followups: [] }, facts).length).toBeGreaterThan(0);
    expect(answerProblems({ headline: 'h', paragraphs: ['Your Venus in Leo glows.'], followups: [] }, facts).length).toBeGreaterThan(0);
    expect(answerProblems({ headline: 'h', paragraphs: [' '], followups: [] }, facts)).toContain('has no answer');
  });
  it('drops empty paragraphs and follow-ups that break the rules', () => {
    const c = cleanAnswer({ headline: ' h ', paragraphs: ['a', ' ', 'b'], followups: ['Will he come back?', 'What helps me sleep?', 'x'.repeat(100)] });
    expect(c).toEqual({ headline: 'h', paragraphs: ['a', 'b'], followups: ['What helps me sleep?'] });
  });
});
