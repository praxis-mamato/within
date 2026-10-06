/**
 * Ready-made options people can tap instead of typing. Every one stays editable.
 * DRAFT content, reviewed with the templates (A1). prompts.test.ts runs the content lint on all of them
 * and checks none of them trips the safety screener by itself.
 */
import type { MilestoneType } from './fixtures';

/** Situations live in content/topics.ts, because each one maps to a topic. */
export { SITUATIONS } from '../content/topics';

/** Onboarding step 2: what a useful outcome looks like. Each maps to a starting purpose. */
export const OUTCOMES: Record<string, string> = {
  Clarity: 'Notice what I need before I respond',
  'Expressing a need': 'Speak honestly, stay connected',
  'Preparing a conversation': 'Prepare what I want to say, calmly',
  Acceptance: 'Accept what I can’t change, and choose what I can',
  'Defining a boundary': 'Name one boundary and keep it',
  'Understanding a pattern': 'Notice the pattern while it’s happening',
  'Feeling calmer': 'Pause before I react',
  'Deciding what I want': 'Get clear on what I want, for me',
  'Repairing after conflict': 'Repair sooner after a disagreement',
};

/** Purpose behaviors (onboarding step 7 and My Growth). */
export const PURPOSES = [
  'Speak honestly, stay connected',
  'Say no without over-explaining',
  'Ask before assuming',
  'Take space without guilt',
  'Listen without rushing to fix',
  'Name one need each day',
  'Pause before I react',
  'Notice what I need before I respond',
];

/** Answer starters for the reflection question. */
export const ANSWER_STARTERS = [
  'I wanted to say no.',
  'I wanted more time to decide.',
  'I was worried about upsetting them.',
  'I didn’t know what I wanted yet.',
  'I wanted to suggest something else.',
  'I felt pressure to keep things smooth.',
  'I noticed I was tired.',
];

/** Follow-up notes: what happened. */
export const FOLLOW_UP_NOTES = [
  'It went better than I expected.',
  'It was uncomfortable, but okay.',
  'I didn’t find the right moment.',
  'I tried a smaller version.',
  'I said it, and it was heard.',
  'I need a different approach next time.',
  'Pausing helped me see it more clearly.',
];

/** Changes people notice in themselves. */
export const OBSERVED = [
  'I said what I wanted before agreeing.',
  'I paused before reacting.',
  'I asked instead of assuming.',
  'I took time for myself without apologizing.',
  'I noticed the pattern while it was happening.',
  'I let a small thing go on purpose.',
];

/** Journal starters. */
export const JOURNAL_STARTERS = [
  'One thing I noticed today…',
  'Something I didn’t say…',
  'What I need this week…',
  'A moment I felt close…',
  'A moment I felt unseen…',
  'Something I’m proud of…',
];

/** Milestone names by kind, and what a moment meant. */
export const MILESTONE_TITLES: Record<MilestoneType, string[]> = {
  Meeting: ['First meeting', 'First date', 'First conversation'],
  Commitment: ['Became exclusive', 'Moved in together', 'Engaged', 'Married', 'Met the family'],
  Conflict: ['A big argument', 'A turning point', 'A hard conversation'],
  Separation: ['Took a break', 'Broke up', 'Lived apart'],
  Reconciliation: ['Got back together', 'Made up', 'Started again'],
  Custom: ['A trip together', 'A new job', 'A move', 'A loss'],
};
export const MILESTONE_MEANINGS = [
  'I felt closer.',
  'I learned what I need.',
  'I held back what I wanted.',
  'It changed how I see us.',
  'I felt more like myself.',
  'It was a relief.',
];

/** Notes on "This doesn't fit" feedback. */
export const FEEDBACK_NOTES = [
  'This doesn’t sound like me.',
  'This felt too general.',
  'I don’t understand the astrology terms.',
  'This was hard to read.',
];

/** Answer ideas for the chart-based questions on the other pillars. */
export const PILLAR_ANSWERS: Record<'self' | 'other' | 'relationship' | 'purpose', string[]> = {
  self: ANSWER_STARTERS,
  other: ['How they like to spend time together.', 'What helps them when we disagree.', 'What a good week looks like for them.', 'What they wish I knew.', 'Something else.'],
  relationship: ['More time just for us.', 'More room for myself.', 'Fewer arguments about small things.', 'Feeling like a team.', 'I’m not sure yet.'],
  purpose: ['With a friend.', 'At work.', 'With family.', 'In a message first.', 'Somewhere else.'],
};
