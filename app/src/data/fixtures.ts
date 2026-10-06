/**
 * Sample content for the E1 prototype.
 *
 * The interpretation text here is ILLUSTRATIVE, NOT APPROVED (PRD §6, build spec §3.5). The
 * placements shown beside it are calculated live from the person's birth details (src/astro);
 * the prose does not yet change with them. It exists to test layout, tone, and comprehension.
 */
import type { FuzzyDate } from '../lib/dates';

export type Pillar = 'self' | 'other' | 'relationship' | 'purpose';
export type Tradition = 'western' | 'vedic';

export interface Perspective {
  tradition: Tradition;
  title: string;
  body: string;
  limitation?: string;
}

export interface Reflection {
  id: string;
  pillar: Pillar;
  kicker: string;
  heading: string;
  subheading: string;
  situation: string;
  perspectives: Record<Tradition, Perspective>;
  together: string;
  question: string;
  /** Suggested step. Omitted (pause only) when the safety screener has flagged text. */
  step: string;
  /** True when the step involves the other person; these are hidden on a safety flag. */
  stepInvolvesOther: boolean;
}

export const METHOD = {
  western: {
    name: 'Western',
    version: 'western.tropical.placidus.prototype-v1',
    summary:
      'Uses the tropical zodiac, tied to the seasons, with Placidus houses. Placements are calculated live in your browser. The conventions are provisional until the approver signs them off.',
  },
  vedic: {
    name: 'Vedic',
    version: 'vedic.sidereal.lahiri.prototype-v1',
    summary:
      'Uses the sidereal zodiac, tied to the fixed stars, with the Lahiri ayanamsa, whole-sign houses from the lagna, and Vimshottari dashas. Placements are calculated live in your browser. The conventions are provisional until the approver signs them off.',
  },
} as const;


export const REFLECTIONS: Record<Pillar, Reflection> = {
  self: {
    id: 'r-self-1',
    pillar: 'self',
    kicker: 'Self',
    heading: 'Your inner landscape',
    subheading: 'What do I need to feel connected without losing myself?',
    situation: 'I say yes to plans and later feel resentful.',
    perspectives: {
      western: {
        tradition: 'western',
        title: 'Harmony, and the cost of keeping it',
        body: 'One way to read this is a pull between keeping the peace and naming what you want. The question isn’t whether you’re agreeable; it’s whether agreeing is a choice you make or a reflex.',
      },
      vedic: {
        tradition: 'vedic',
        title: 'Steadiness that can turn into silence',
        body: 'This lens might describe a temperament that values steadiness and loyalty. That can be a strength, and it can also make it easy to set your own preference aside to keep things calm.',
      },
    },
    together:
      'Both lenses point at a wish to keep things smooth. The Western reading frames it as a tension to notice; the Vedic reading frames it as a strength that can overextend. Neither says what you should do.',
    question: 'What did you want to say before you agreed?',
    step: 'Express one preference before accepting a low-stakes plan.',
    stepInvolvesOther: false,
  },
  other: {
    id: 'r-other-1',
    pillar: 'other',
    kicker: 'Other',
    heading: 'Understanding {name}',
    subheading: 'Make room for another perspective',
    situation: 'We keep missing each other about how much time to spend together.',
    perspectives: {
      western: {
        tradition: 'western',
        title: 'Different rhythms, not different stakes',
        body: 'This reading offers a possibility, not a fact about {name}: some people recharge alone even when a relationship matters deeply to them. Is that something you could ask about?',
      },
      vedic: {
        tradition: 'vedic',
        title: 'Closeness shown in different ways',
        body: 'This lens might suggest that you and {name} show care differently: one through presence, one through reliability. That is a question to explore together, not a conclusion about how {name} feels.',
      },
    },
    together:
      'Both lenses describe a difference in rhythm. Neither can tell you what {name} thinks or intends; only {name} can.',
    question: 'What could you ask instead of assuming?',
    step: 'Ask one open question about how {name} likes to spend time together.',
    stepInvolvesOther: true,
  },
  relationship: {
    id: 'r-rel-1',
    pillar: 'relationship',
    kicker: 'Relationship',
    heading: 'Your relationship chapter',
    subheading: 'Closeness with room to grow',
    situation: 'Things feel steadier than last year, and I want to keep my own life too.',
    perspectives: {
      western: {
        tradition: 'western',
        title: 'A season of settling',
        body: 'This tradition might read the current period as one of consolidating: less about big changes, more about how you both make space for each other’s routines.',
      },
      vedic: {
        tradition: 'vedic',
        title: 'Building on what you have',
        body: 'This lens might describe a period suited to strengthening foundations, for instance agreeing on what “enough time together” looks like for each of you.',
        limitation: 'Interpretations of periods describe themes, not events. Nothing here says what will happen.',
      },
    },
    together:
      'Both lenses describe a settling period. They differ on emphasis: the Western reading on routines, the Vedic on foundations.',
    question: 'What would “closeness with room to grow” look like this month?',
    step: 'Name one thing you want to keep for yourself, and one thing you want to share.',
    stepInvolvesOther: false,
  },
  purpose: {
    id: 'r-purpose-1',
    pillar: 'purpose',
    kicker: 'Purpose',
    heading: 'Who am I becoming?',
    subheading: 'Express my needs with care',
    situation: 'I want to practise saying what I need without it becoming a fight.',
    perspectives: {
      western: {
        tradition: 'western',
        title: 'Directness as a skill',
        body: 'This reading might frame your intention as practising directness in small, safe moments, so it’s familiar before it matters most.',
      },
      vedic: {
        tradition: 'vedic',
        title: 'Speech with care',
        body: 'This lens might describe a value placed on kind, considered speech. Your intention fits it: saying what you need, and choosing how.',
      },
    },
    together: 'Both lenses support practising small, honest statements. You choose the pace.',
    question: 'Where could you practise this where little is at stake?',
    step: 'Share one preference before agreeing.',
    stepInvolvesOther: false,
  },
};

export const FOCUS_OPTIONS = ['Understanding myself', 'The sky right now', 'People around me', 'Relationships', 'Work and purpose', 'A decision', 'Recurring patterns', 'Communication', 'Boundaries', 'Uncertainty', 'A transition'];
export const OUTCOME_OPTIONS = ['Clarity', 'Expressing a need', 'Preparing a conversation', 'Acceptance', 'Defining a boundary'];
export const MILESTONE_TYPES = ['Meeting', 'Commitment', 'Conflict', 'Separation', 'Reconciliation', 'Custom'] as const;
export type MilestoneType = (typeof MILESTONE_TYPES)[number];

export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  meaning: string;
  date: FuzzyDate;
  excluded: boolean;
}

export const SAMPLE_MILESTONES: Milestone[] = [
  {
    id: 'm1',
    type: 'Meeting',
    title: 'First meeting',
    meaning: 'A friend’s birthday dinner. We talked all night.',
    date: { kind: 'exact', start: '2021-06-12' },
    excluded: false,
  },
  {
    id: 'm2',
    type: 'Conflict',
    title: 'A turning point',
    meaning: 'We argued about moving in. I realised I hadn’t said what I wanted.',
    date: { kind: 'approximate', start: '2023-04-01' },
    excluded: false,
  },
];

/** Milestone perspectives keep the three PRD §8 voices separate. */
export const MILESTONE_INTERPRETATION = {
  western: 'This tradition might note a period emphasising commitments and structure around this time. It does not say what happened; you did.',
  vedic: 'This lens might describe a time suited to re-examining shared foundations. It is an interpretation, not an explanation of the event.',
  question: 'Looking back, what did this moment teach you about what you need?',
};

/** Placeholder until region resource lists are written and verified (runbook §8). */
export const SAFETY_RESOURCES = {
  note: 'Prototype placeholder. Real, verified resources for your region will appear here.',
  lines: ['Local emergency number', 'A crisis line (verified per region)', 'A domestic-violence support line (verified per region)'],
};
