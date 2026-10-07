import { checkResult, OUTPUT_SCHEMA, SYSTEM_PROMPT, unsupportedClaims, userMessage, validateRequest } from '../../../supabase/functions/_shared/deepReading';

const facts = ['Venus in Libra, 7th house (Western, tropical)', 'Moon in Meena, Revati pada 1 (Vedic)', 'Sun in Sagittarius 0°46′ (Western)'];

describe('validateRequest', () => {
  it('accepts a well-formed request', () => {
    expect(validateRequest({ kind: 'western', facts, source: ['x'] })).toMatchObject({ kind: 'western' });
  });
  it.each([
    [null, /Missing/],
    [{ kind: 'tarot', facts, source: [] }, /Unknown/],
    [{ kind: 'western', facts: [], source: [] }, /facts/],
    [{ kind: 'question', facts, source: [] }, /question/],
    [{ kind: 'western', facts: Array(500).fill('x'), source: [] }, /too long/],
  ])('rejects %j', (req, msg) => expect(validateRequest(req)).toMatch(msg as RegExp));
});

describe('unsupportedClaims', () => {
  it('allows placements that are in the facts, in either tradition’s names', () => {
    expect(unsupportedClaims('Your Venus in Libra seeks harmony, and the Moon in Meena is sensitive.', facts)).toEqual([]);
  });
  it('catches invented placements and degrees', () => {
    expect(unsupportedClaims('Your Mars in Aries burns bright.', facts)).toEqual(['Mars in Aries']);
    expect(unsupportedClaims('Your Sun sits at 12°.', facts)).toEqual(['12°']);
  });
});

describe('checkResult', () => {
  const ok = { title: 'Love and balance', body: 'Venus in Libra may make fairness central to how you love.', tradition: 'western' as const };
  it('keeps sections that follow the rules', () => {
    const r = checkResult({ sections: [ok], reflection_question: 'Where do you seek balance?' }, facts);
    expect(r.result.sections).toHaveLength(1);
    expect(r.dropped).toEqual([]);
  });
  it('drops predictions, mind-reading, and invented placements', () => {
    const r = checkResult(
      {
        sections: [
          ok,
          { title: 'Next year', body: 'You will meet someone in March.', tradition: 'western' },
          { title: 'Them', body: 'They want more space from you.', tradition: 'both' },
          { title: 'Drive', body: 'Mars in Aries gives you fire.', tradition: 'western' },
        ],
        reflection_question: 'What is fated for you?',
      },
      facts,
    );
    expect(r.result.sections.map((s) => s.title)).toEqual(['Love and balance']);
    expect(r.dropped).toHaveLength(3);
    expect(r.result.reflection_question).not.toMatch(/fated/);
  });
});

describe('prompt', () => {
  it('keeps the system prompt stable (no dates or IDs) so it caches', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
  it('puts facts, source, and the question in the user message', () => {
    const m = userMessage({ kind: 'question', facts, source: ['Approved line'], question: 'What do I need in love?' });
    expect(m).toContain('CHART FACTS');
    expect(m).toContain('- Venus in Libra');
    expect(m).toContain('Approved line');
    expect(m).toContain("READER'S QUESTION: What do I need in love?");
  });
  it('declares a strict output schema', () => {
    expect(OUTPUT_SCHEMA.additionalProperties).toBe(false);
  });
});
