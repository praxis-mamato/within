import { applyApprovedEdits, COMMITTED, FRAGMENTS, GROUPS, hashText, problems, statusOf } from './registry';
import { RISING } from './western';
import { buildCorpus, samplesFor } from './samples';

describe('fragment registry', () => {
  it('lists every library fragment once, with a group', () => {
    expect(FRAGMENTS.length).toBeGreaterThan(400);
    expect(new Set(FRAGMENTS.map((f) => f.id)).size).toBe(FRAGMENTS.length);
    const groups = new Set(GROUPS.map((g) => g.key));
    expect(FRAGMENTS.every((f) => groups.has(f.group))).toBe(true);
    expect(GROUPS.every((g) => FRAGMENTS.some((f) => f.group === g.key))).toBe(true);
  });

  it('treats a decision as stale once the text changes', () => {
    const f = FRAGMENTS[0];
    const d = { status: 'approved' as const, rev: 1, hash: f.hash, by: 'Maggie', at: '2026-10-06' };
    expect(statusOf(f, d)).toBe('approved');
    expect(statusOf(f, { ...d, hash: hashText(f.text + ' ') })).toBe('changed');
    expect(statusOf(f, undefined)).toBe('draft');
  });

  it('finds sample readings for most fragments', () => {
    const corpus = buildCorpus();
    const missing = FRAGMENTS.filter((f) => !samplesFor(f, corpus).length);
    console.log(`${FRAGMENTS.length} fragments, ${missing.length} without samples:`, missing.map((f) => f.id).join(', '));
    expect(missing.length / FRAGMENTS.length).toBeLessThan(0.1);
  });
});

describe('approved edits', () => {
  it('replace the library text, and only while the decision is current and passes the lint', () => {
    const f = FRAGMENTS.find((x) => x.id === 'western.RISING.Aries')!;
    const d = { status: 'approved' as const, rev: 2, hash: f.hash, text: 'You may meet the world head-on.', by: 'Maggie', at: '2026-10-06' };
    try {
      applyApprovedEdits({ version: 1, decisions: { [f.id]: { ...d, hash: 'stale' } } });
      expect(RISING.Aries).toBe(f.text);
      applyApprovedEdits({ version: 1, decisions: { [f.id]: { ...d, text: 'You will meet the world head-on.' } } });
      expect(RISING.Aries).toBe(f.text);
      expect(problems({ version: 1, decisions: { [f.id]: { ...d, text: 'You will meet the world head-on.' } } })).toHaveLength(1);
      applyApprovedEdits({ version: 1, decisions: { [f.id]: d } });
      expect(RISING.Aries).toBe(d.text);
    } finally {
      RISING.Aries = f.text;
    }
  });
});

describe('content/approvals.json', () => {
  it('names only real fragments, and edited text passes the lint', () => {
    expect(problems(COMMITTED)).toEqual([]);
  });

  // `npm run test:pilot` sets WITHIN_BUILD=pilot: a pilot build may only use approved text.
  it.runIf(process.env.WITHIN_BUILD === 'pilot')('approves every fragment for a pilot build', () => {
    const notApproved = FRAGMENTS.filter((f) => statusOf(f, COMMITTED.decisions[f.id]) !== 'approved');
    expect(notApproved.map((f) => `${f.id} (${statusOf(f, COMMITTED.decisions[f.id])})`)).toEqual([]);
  });
});
