import * as P from '../data/prompts';
import { OUTCOME_STEPS, planFor, SITUATIONS, SITUATION_TOPIC, topicFor, TOPICS } from './topics';
import { screen } from '../lib/screener';

const strings = (x: unknown): string[] =>
  typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : [];
const all = [...strings(P), ...strings(TOPICS), ...strings(OUTCOME_STEPS), ...SITUATIONS];
const BANNED = [/\bwill\b/i, /\bdestin/i, /\bsoulmate/i, /\bfated?\b/i, /\balways\b/i, /\bnever\b/i, /\bdiagnos/i, /\btoxic\b/i, /\bnarcissis/i];

describe('prompts and topics', () => {
  it('pass the content lint', () => {
    for (const re of BANNED) expect(all.filter((s) => re.test(s))).toEqual([]);
  });
  it('never trip the safety screener on their own', () => {
    expect(all.filter((s) => screen(s).flagged)).toEqual([]);
  });
  it('map every ready-made situation to a topic', () => {
    for (const s of SITUATIONS) expect(topicFor(s, [])).toBe(SITUATION_TOPIC[s]);
  });
  it('read free text and fall back to the chosen topic chips', () => {
    expect(topicFor('We fight about chores every week', [])).toBe('conflict');
    expect(topicFor('My ex keeps texting me', [])).toBe('breakup');
    expect(topicFor('', ['Boundaries'])).toBe('boundaries');
    expect(topicFor('hmm', [])).toBe('general');
  });
});

describe('planFor (onboarding step 7)', () => {
  it('asks about the situation the person gave, not a fixed question', () => {
    const questions = SITUATIONS.map((s) => planFor(s, [], 'Clarity', 'fire').question);
    expect(new Set(questions).size).toBeGreaterThan(8);
    expect(planFor('I’m getting over a breakup.', [], 'Clarity', null).question).toMatch(/carry forward/);
  });
  it('offers a second step from the chosen outcome', () => {
    const p = planFor('I say yes and later feel resentful.', [], 'Preparing a conversation', 'water');
    expect(p.steps.map((s) => s.source)).toEqual(['situation', 'outcome']);
    expect(p.steps[1].text).toMatch(/first sentence/);
    expect(p.style).toBe('naming the feeling first');
  });
  it('gives every topic answer ideas', () => {
    for (const t of Object.values(TOPICS)) expect(t.answers.length).toBeGreaterThanOrEqual(4);
  });
});
