/**
 * Turns what the person told us in onboarding (topic chips, their situation, their outcome)
 * into the reflection question, answer ideas, and step options. The chart only adds a style hint.
 * DRAFT content, reviewed with the templates (A1).
 */
import type { Element } from './templates';

export type Topic =
  | 'agreeing'
  | 'conflict'
  | 'uncertainty'
  | 'closeness'
  | 'distance'
  | 'pattern'
  | 'asking'
  | 'breakup'
  | 'boundaries'
  | 'transition'
  | 'balance'
  | 'general';

export interface TopicContent {
  question: string;
  answers: string[];
  step: string;
  /** Steps that involve the other person are withheld after a safety flag. */
  stepInvolvesOther: boolean;
}

export const TOPICS: Record<Topic, TopicContent> = {
  agreeing: {
    question: 'What did you want to say before you agreed?',
    answers: ['I wanted to say no.', 'I wanted more time to decide.', 'I was worried about upsetting them.', 'I didn’t know what I wanted yet.', 'I felt pressure to keep things smooth.'],
    step: 'Say one preference before agreeing to a low-stakes plan.',
    stepInvolvesOther: false,
  },
  conflict: {
    question: 'When the same argument starts again, what are you hoping to be understood?',
    answers: ['That this matters to me.', 'That I’m not trying to attack anyone.', 'That I need a break before we keep going.', 'That I want us on the same side.', 'I’m not sure yet.'],
    step: 'Next time it starts, say what you’re hoping for in one sentence before getting into the details.',
    stepInvolvesOther: true,
  },
  uncertainty: {
    question: 'What would help you feel clearer about where this is going?',
    answers: ['Knowing whether we want the same things.', 'Hearing how they see the future.', 'Being honest with myself about what I want.', 'More time before deciding.', 'I don’t know yet.'],
    step: 'Write down one thing you know you want, and one thing you don’t know yet.',
    stepInvolvesOther: false,
  },
  closeness: {
    question: 'What does enough time together look like to you, and enough time apart?',
    answers: ['A few evenings a week together.', 'Regular time to recharge alone.', 'Doing ordinary things side by side.', 'Feeling missed when we’re apart.', 'I’m still working it out.'],
    step: 'Name one thing that helps you feel close, and one thing you need for yourself.',
    stepInvolvesOther: false,
  },
  distance: {
    question: 'When did you last feel close, and what was different then?',
    answers: ['We had more time together.', 'We were talking more.', 'Life was less busy.', 'I felt more like myself.', 'I can’t remember clearly.'],
    step: 'Notice one moment this week when you feel close or far, and what was happening.',
    stepInvolvesOther: false,
  },
  pattern: {
    question: 'What tends to draw you in, and what tends to happen after?',
    answers: ['I’m drawn to people who need me.', 'I’m drawn to excitement, then feel unsettled.', 'I overlook early signs.', 'I lose track of my own needs.', 'I’m not sure yet.'],
    step: 'Write down the last two times this showed up, and one thing they had in common.',
    stepInvolvesOther: false,
  },
  asking: {
    question: 'What is one thing you would ask for, if asking felt easy?',
    answers: ['More help at home.', 'More time together.', 'More time to myself.', 'To be listened to without fixing.', 'Something else.'],
    step: 'Ask for one small thing this week, in one sentence.',
    stepInvolvesOther: true,
  },
  breakup: {
    question: 'What do you want to carry forward from this relationship, and what do you want to leave behind?',
    answers: ['I learned I need more honesty.', 'I want to speak up sooner next time.', 'I want to keep my independence.', 'I’m still too close to it to say.'],
    step: 'Write one thing this relationship taught you about what you need.',
    stepInvolvesOther: false,
  },
  boundaries: {
    question: 'Where do your limits feel crossed, even a little?',
    answers: ['When plans change without asking me.', 'When I’m expected to be available.', 'When my time alone gets used up.', 'When I’m spoken to in a certain way.', 'I’m still noticing.'],
    step: 'Name one small boundary to yourself, then keep it once this week.',
    stepInvolvesOther: false,
  },
  transition: {
    question: 'What is changing, and what do you want to stay the same?',
    answers: ['Where we live.', 'How much time we have.', 'What we want long term.', 'How I see myself.', 'I’m not sure yet.'],
    step: 'Write down one thing you want to protect through this change.',
    stepInvolvesOther: false,
  },
  balance: {
    question: 'What would a fair balance look like to you?',
    answers: ['Sharing everyday tasks.', 'Taking turns making plans.', 'Both of us checking in.', 'Me asking for help sooner.', 'I’m not sure yet.'],
    step: 'This week, notice one thing you do by choice and one you do out of habit.',
    stepInvolvesOther: false,
  },
  general: {
    question: 'What would you most like to understand about this?',
    answers: ['Why it keeps happening.', 'What I actually want.', 'How to bring it up.', 'Whether it’s worth worrying about.', 'I’m not sure yet.'],
    step: 'Write one sentence about what you want, just for yourself.',
    stepInvolvesOther: false,
  },
};

/** Ready-made situations and the topic each one belongs to. */
export const SITUATION_TOPIC: Record<string, Topic> = {
  'I say yes and later feel resentful.': 'agreeing',
  'We keep having the same argument.': 'conflict',
  'I hold back what I need so things stay calm.': 'agreeing',
  'I’m not sure where this relationship is going.': 'uncertainty',
  'We want different amounts of time together.': 'closeness',
  'I feel distant from them lately.': 'distance',
  'I’m deciding whether to commit more.': 'uncertainty',
  'I’m getting over a breakup.': 'breakup',
  'I keep choosing the same kind of person.': 'pattern',
  'I find it hard to ask for what I want.': 'asking',
  'Small things turn into big arguments.': 'conflict',
  'I give more than I get back.': 'balance',
};
export const SITUATIONS = Object.keys(SITUATION_TOPIC);

const FOCUS_TOPIC: Record<string, Topic> = {
  'Recurring patterns': 'pattern',
  Communication: 'asking',
  Boundaries: 'boundaries',
  Uncertainty: 'uncertainty',
  'A transition': 'transition',
};

/** Keywords for free text that doesn't match a ready-made situation. First match wins. */
const KEYWORDS: [RegExp, Topic][] = [
  [/\b(say|said|saying) yes\b|\bagree|\bresent|\bgo along|\bhold back/i, 'agreeing'],
  [/\bargu|\bfight|\bconflict|\bdisagree/i, 'conflict'],
  [/\bbreak ?up|\bbroke up|\bex\b|\bgetting over|\bdivorc/i, 'breakup'],
  [/\bcommit|\bnot sure|\bunsure|\bwhere (this|it|we)('s| is)? going|\bfuture/i, 'uncertainty'],
  [/\bdistant|\bdisconnect|\bdrift|\blonely/i, 'distance'],
  [/\btime together|\bspace\b|\balone time|\bclingy|\bneedy/i, 'closeness'],
  [/\bsame (kind|type|pattern)|\bkeep (choosing|picking|ending up)|\bpattern/i, 'pattern'],
  [/\bask(ing)? for|\bspeak up|\bsay what I (want|need)/i, 'asking'],
  [/\bboundar|\blimit|\btoo much\b/i, 'boundaries'],
  [/\bmov(e|ing)\b|\bnew job|\bbaby|\bchang(e|ing)\b|\btransition/i, 'transition'],
  [/\bgive more|\bunfair|\bbalance|\bdo everything/i, 'balance'],
];

export function topicFor(situation: string, focus: string[]): Topic {
  const s = situation.trim();
  if (SITUATION_TOPIC[s]) return SITUATION_TOPIC[s];
  for (const [re, t] of KEYWORDS) if (re.test(s)) return t;
  for (const f of focus) if (FOCUS_TOPIC[f]) return FOCUS_TOPIC[f];
  return 'general';
}

/** A second step option drawn from the outcome the person chose in onboarding step 2. */
export const OUTCOME_STEPS: Record<string, { step: string; stepInvolvesOther: boolean }> = {
  Clarity: { step: 'Before your next reply in a tense moment, notice what you need first.', stepInvolvesOther: false },
  'Expressing a need': { step: 'Say one need in one sentence, somewhere little is at stake.', stepInvolvesOther: false },
  'Preparing a conversation': { step: 'Write the first sentence you would want to say.', stepInvolvesOther: false },
  Acceptance: { step: 'Write down one thing you can’t change and one thing you can.', stepInvolvesOther: false },
  'Defining a boundary': { step: 'Name one boundary to yourself and keep it once this week.', stepInvolvesOther: false },
  'Understanding a pattern': { step: 'Next time the pattern starts, note what happened just before.', stepInvolvesOther: false },
  'Feeling calmer': { step: 'Take three slow breaths before replying to anything charged.', stepInvolvesOther: false },
  'Deciding what I want': { step: 'List three things you want, without editing them.', stepInvolvesOther: false },
  'Repairing after conflict': { step: 'After the next disagreement, offer one sentence of repair.', stepInvolvesOther: true },
};

/** How the chart flavors the step: a suggestion about style, never the content. */
export const ELEMENT_STYLE: Record<Element, string> = {
  fire: 'saying it plainly, in one sentence',
  earth: 'writing it down first, then saying it',
  air: 'starting with a question',
  water: 'naming the feeling first',
};

export interface Plan {
  topic: Topic;
  question: string;
  answers: string[];
  steps: { text: string; involvesOther: boolean; source: 'situation' | 'outcome' }[];
  style: string | null;
}

/** Everything step 7 (and the Self reflection) needs, from the person's own answers. */
export function planFor(situation: string, focus: string[], outcome: string, element: Element | null): Plan {
  const topic = topicFor(situation, focus);
  const t = TOPICS[topic];
  const steps: Plan['steps'] = [{ text: t.step, involvesOther: t.stepInvolvesOther, source: 'situation' }];
  const o = OUTCOME_STEPS[outcome];
  if (o && o.step !== t.step) steps.push({ text: o.step, involvesOther: o.stepInvolvesOther, source: 'outcome' });
  return { topic, question: t.question, answers: t.answers, steps, style: element ? ELEMENT_STYLE[element] : null };
}
