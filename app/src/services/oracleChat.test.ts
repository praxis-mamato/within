import { chatMessages, chatProblems, cleanFollowups, validateChat } from '../../../supabase/functions/_shared/oracleChat.ts';

const facts = ['Moon in Cancer 12°04′, house 4 (Western, tropical)', '2026-10-21: transiting Saturn square natal Moon (12°04′ Cancer), within 0°40′ (Western)'];
const turns = [{ role: 'user' as const, text: 'It’s my mom’s birthday and I can’t stop crying.' }];

describe('validateChat', () => {
  it('accepts a conversation that ends with the person', () => {
    expect(validateChat({ facts, answer: ['Your 4th house is lit.'], turns })).toMatchObject({ turns });
  });
  it.each([
    [null, /Missing/],
    [{ facts: [], answer: [], turns }, /facts/],
    [{ facts, answer: [], turns: [] }, /too long/],
    [{ facts, answer: [], turns: [...turns, { role: 'assistant', text: 'I hear you.' }] }, /end with your message/],
    [{ facts, answer: [], turns: [{ role: 'assistant', text: 'Hi' }] }, /1,500/],
    [{ facts, answer: [], turns: [{ role: 'user', text: 'x'.repeat(1501) }] }, /1,500/],
  ])('rejects %j', (req, msg) => expect(validateChat(req)).toMatch(msg as RegExp));
});

describe('chatMessages', () => {
  it('sends the chart with the first message only', () => {
    const m = chatMessages({ facts, answer: ['a'], turns: [...turns, { role: 'assistant', text: 'b' }, { role: 'user', text: 'c' }] });
    expect(m[0].content).toContain('CHART FACTS:');
    expect(m[0].content).toContain('mom’s birthday');
    expect(m[2].content).toBe('c');
  });
});

describe('chatProblems', () => {
  it('passes a warm reply grounded in the facts', () => {
    expect(chatProblems('A wave like that can come before the mind catches up. Your Moon in Cancer sits at 12°04′, and Saturn is pressing on it today.', facts)).toEqual([]);
  });
  it('catches certainty, mind-reading, and invented placements', () => {
    expect(chatProblems('She will always be with you.', facts).length).toBeGreaterThan(0);
    expect(chatProblems('She feels proud of you.', facts).length).toBeGreaterThan(0);
    expect(chatProblems('Your Venus in Leo softens this.', facts)).toEqual([expect.stringContaining('Venus in Leo')]);
  });
});

it('keeps at most three clean follow-ups', () => {
  expect(cleanFollowups(['Why today?', 'Will it pass?', ' What helps? ', 'Is it Saturn?', 'More'])).toEqual(['Why today?', 'What helps?', 'Is it Saturn?']);
});
