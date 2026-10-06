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
  | 'self'
  | 'stuck'
  | 'restless'
  | 'sky'
  | 'others'
  | 'work'
  | 'decision'
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
  self: {
    question: 'What part of yourself would you most like to understand right now?',
    answers: ['Why I react the way I do.', 'What I really want.', 'What drains me and what restores me.', 'Where I hold myself back.', 'I’m not sure yet.'],
    step: 'Read your full reading and mark one line that feels true and one that doesn’t.',
    stepInvolvesOther: false,
  },
  stuck: {
    question: 'Where do you feel most stuck, and what would one small change look like?',
    answers: ['In my routine.', 'In my work.', 'In how I spend my time.', 'In a relationship.', 'I can’t name it yet.'],
    step: 'Choose one small thing to do differently this week, and notice how it feels.',
    stepInvolvesOther: false,
  },
  restless: {
    question: 'When did the unsettled feeling start, and what else changed around then?',
    answers: ['It started with a change at home.', 'It started with work.', 'It comes and goes.', 'It’s been there a while.', 'I don’t know.'],
    step: 'Write down when it started, then read “The sky now, for you” and notice whether any theme resonates.',
    stepInvolvesOther: false,
  },
  sky: {
    question: 'Which part of what’s happening in the sky feels most alive for you right now?',
    answers: ['Something about my current period or dasha.', 'The planets crossing my chart.', 'Retrograde planets.', 'The Moon’s mood today.', 'None of it fits right now.'],
    step: 'This week, notice where the theme of your current transit or dasha shows up, and write one line about it.',
    stepInvolvesOther: false,
  },
  others: {
    question: 'Who around you is on your mind, and what would you like to understand?',
    answers: ['A family member.', 'A friend.', 'Someone at work.', 'My partner.', 'Someone I’ve lost touch with.'],
    step: 'Ask one person how they’re really doing, and listen without fixing.',
    stepInvolvesOther: true,
  },
  work: {
    question: 'What part of your work feels most out of step with who you are?',
    answers: ['The pace.', 'The people.', 'The purpose behind it.', 'How much of myself I can bring.', 'I’m not sure yet.'],
    step: 'Write down one thing at work that gives you energy and one that drains it.',
    stepInvolvesOther: false,
  },
  decision: {
    question: 'What do you already know about what you want here?',
    answers: ['I know what I want but I’m scared to choose it.', 'I’m torn between two options.', 'I’m worried about letting someone down.', 'I need more information.', 'I don’t know yet.'],
    step: 'Write the decision down, then list what matters most to you, not what you think you should do.',
    stepInvolvesOther: false,
  },
  general: {
    question: 'What would you most like to understand about this?',
    answers: ['Why it keeps happening.', 'What I actually want.', 'How to bring it up.', 'Whether it’s worth worrying about.', 'I’m not sure yet.'],
    step: 'Write one sentence about what you want, just for yourself.',
    stepInvolvesOther: false,
  },
};

/** Ready-made situations, grouped, with the topic each one belongs to. */
export const SITUATION_GROUPS: { label: string; items: Record<string, Topic> }[] = [
  {
    label: 'About me',
    items: {
      'I want to understand myself better.': 'self',
      'I feel stuck.': 'stuck',
      'I feel unsettled and don’t know why.': 'restless',
      'I have a big decision to make.': 'decision',
      'Work feels out of step with who I am.': 'work',
      'I’m going through a big change.': 'transition',
      'I find it hard to ask for what I want.': 'asking',
      'I keep choosing the same kind of person.': 'pattern',
    },
  },
  {
    label: 'The sky now',
    items: {
      'What’s happening in the sky right now, and how might it affect me?': 'sky',
      'Is this a challenging period for me astrologically?': 'sky',
      'What does my current dasha or transit mean for me?': 'sky',
      'How might the current sky be affecting the people around me?': 'others',
    },
  },
  {
    label: 'People around me',
    items: {
      'I want to understand my family better.': 'others',
      'Someone close to me is going through a hard time.': 'others',
      'I give more than I get back.': 'balance',
      'Small things turn into big arguments.': 'conflict',
    },
  },
  {
    label: 'Relationships',
    items: {
      'I say yes and later feel resentful.': 'agreeing',
      'We keep having the same argument.': 'conflict',
      'I hold back what I need so things stay calm.': 'agreeing',
      'I’m not sure where this relationship is going.': 'uncertainty',
      'We want different amounts of time together.': 'closeness',
      'I feel distant from them lately.': 'distance',
      'I’m deciding whether to commit more.': 'uncertainty',
      'I’m getting over a breakup.': 'breakup',
    },
  },
];
export const SITUATION_TOPIC: Record<string, Topic> = Object.assign({}, ...SITUATION_GROUPS.map((g) => g.items));
export const SITUATIONS = Object.keys(SITUATION_TOPIC);

const FOCUS_TOPIC: Record<string, Topic> = {
  'Understanding myself': 'self',
  'The sky right now': 'sky',
  'People around me': 'others',
  'Work and purpose': 'work',
  'A decision': 'decision',
  'Recurring patterns': 'pattern',
  Communication: 'asking',
  Boundaries: 'boundaries',
  Uncertainty: 'uncertainty',
  'A transition': 'transition',
};

/** Keywords for free text that doesn't match a ready-made situation. First match wins. */
const KEYWORDS: [RegExp, Topic][] = [
  [/\b(sky|planets?|retrograde|transits?|dasha|eclipse|full moon|new moon|stars|astrolog|saturn|mercury|jupiter)\b/i, 'sky'],
  [/\b(family|friends?|mother|mom|father|dad|parents?|kids|children|son|daughter|cowork|colleague|boss|sister|brother)\b/i, 'others'],
  [/\bstuck\b|\bin a rut\b/i, 'stuck'],
  [/\bunsettled|\brestless|\boff lately|\bnot myself/i, 'restless'],
  [/\bdecid|\bdecision|\bchoose between/i, 'decision'],
  [/\b(work|job|career)\b/i, 'work'],
  [/\bmyself\b|\bwho I am\b|\bunderstand me\b/i, 'self'],
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

/**
 * Everything step 7 (and the Self reflection) needs, from the person's own answers.
 * `sky` lists short notes about the current sky for this person (transits, dasha); they become
 * the answer ideas when the person asked about the sky.
 */
export function planFor(situation: string, focus: string[], outcome: string, element: Element | null, sky: string[] = []): Plan {
  const topic = topicFor(situation, focus);
  const t = topic === 'sky' && sky.length ? { ...TOPICS.sky, answers: [...sky, ...TOPICS.sky.answers] } : TOPICS[topic];
  const steps: Plan['steps'] = [{ text: t.step, involvesOther: t.stepInvolvesOther, source: 'situation' }];
  const o = OUTCOME_STEPS[outcome];
  if (o && o.step !== t.step) steps.push({ text: o.step, involvesOther: o.stepInvolvesOther, source: 'outcome' });
  return { topic, question: t.question, answers: t.answers, steps, style: element ? ELEMENT_STYLE[element] : null };
}
