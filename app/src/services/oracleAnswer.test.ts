import { answerMessage, answerProblems, validateAnswer } from '../../../supabase/functions/_shared/oracleAnswer.ts';

const facts = ['Venus in Libra 12°10′, house 7 (Western, tropical)', 'Saturn in Aries 12°40′, house 1 (Western, tropical)', 'Venus opposition Saturn, orb 0°30′ (Western)'];
const req = { question: 'Should I reach out to them?', label: 'Not yet: wait for Nov 14', notes: ['Venus turns direct Nov 14 (Western)'], facts, about: [] };

describe('personal answers', () => {
  it('accepts a well-formed request and rejects bad ones', () => {
    expect(validateAnswer(req)).toMatchObject({ question: 'Should I reach out to them?', about: [] });
    expect(validateAnswer({ ...req, facts: [] })).toMatch(/facts/);
    expect(validateAnswer({ ...req, question: '' })).toMatch(/question/);
  });
  it('tells the model the verdict, the notes, the chart, and whether to go deeper', () => {
    const m = answerMessage(req, false);
    expect(m).toContain('THE VERDICT: Not yet: wait for Nov 14');
    expect(m).toContain('- Venus opposition Saturn, orb 0°30′ (Western)');
    expect(m).toContain('leave "deeper" empty');
    expect(answerMessage(req, true)).toContain('write "deeper"');
  });
  it('passes a personal answer grounded in the chart', () => {
    const ok = { answer: ['Not yet. Your Venus in Libra sits opposite Saturn, so love may ask for patience before words.', 'Wait for Nov 14, when Venus turns direct.'], deeper: [], reflection: 'What would make reaching out feel safe?' };
    expect(answerProblems(ok, req)).toEqual([]);
  });
  it('catches certainty, mind-reading, invented placements, and empty answers', () => {
    expect(answerProblems({ answer: ['They will come back.'], deeper: [], reflection: '' }, req).length).toBeGreaterThan(0);
    expect(answerProblems({ answer: ['She wants you to call.'], deeper: [], reflection: '' }, req).length).toBeGreaterThan(0);
    expect(answerProblems({ answer: ['Your Mars in Leo burns.'], deeper: [], reflection: '' }, req)).toEqual([expect.stringContaining('Mars in Leo')]);
    expect(answerProblems({ answer: [], deeper: [], reflection: '' }, req)).toContain('the answer is empty');
  });
});
