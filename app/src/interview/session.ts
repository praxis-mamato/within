/**
 * Interview mode for Stage 1 (docs/next-features.md A2; PRD §11). A facilitator turns it on with
 * ?interview in the address. It times the session, asks a three-question comprehension check after
 * the first reflection, and can show one lens or both so lens value can be compared.
 *
 * Kept in this tab only (sessionStorage) and never sent anywhere. The summary holds timings,
 * ratings, the lens condition, and the kind of step chosen: no birth data and no free text.
 */
import type { Tradition } from '../data/fixtures';

export type LensCondition = 'both' | 'western' | 'vedic';
export type Rating = 'accurate' | 'partly' | 'not_yet';

export const CHECK_QUESTIONS = [
  { id: 'meaning', text: 'In your own words, what is this reflection saying?' },
  { id: 'fact', text: 'Is what you read a fact about you, or an interpretation?' },
  { id: 'next', text: 'What would you do next, if anything?' },
] as const;
export type CheckId = (typeof CHECK_QUESTIONS)[number]['id'];

export interface InterviewSession {
  code: string;
  lens: LensCondition;
  startedAt: number;
  /** Milliseconds from start when each onboarding step was first reached. */
  steps: Record<number, number>;
  finishedAt: number | null;
  choice: 'step' | 'pause' | 'none' | null;
  ratings: Partial<Record<CheckId, Rating>>;
}

const KEY = 'within.interview';

function store(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

/** Turns interview mode on for this tab when the address has ?interview (or #/…?interview). */
export function interviewRequested(href = typeof location === 'undefined' ? '' : location.href): boolean {
  return /[?&]interview\b/.test(href);
}

export function load(): InterviewSession | null {
  const raw = store()?.getItem(KEY);
  return raw ? (JSON.parse(raw) as InterviewSession) : null;
}

export function save(s: InterviewSession | null) {
  if (s) store()?.setItem(KEY, JSON.stringify(s));
  else store()?.removeItem(KEY);
}

export function start(lens: LensCondition, now = Date.now()): InterviewSession {
  const s: InterviewSession = { code: Math.random().toString(36).slice(2, 6).toUpperCase(), lens, startedAt: now, steps: {}, finishedAt: null, choice: null, ratings: {} };
  save(s);
  return s;
}

export function update(fn: (s: InterviewSession) => InterviewSession) {
  const s = load();
  if (s) save(fn(s));
}

export function markStep(step: number, now = Date.now()) {
  update((s) => (s.steps[step] !== undefined ? s : { ...s, steps: { ...s.steps, [step]: now - s.startedAt } }));
}

/** Which lens cards to show, in the session's randomized order. */
export function visibleLenses(order: [Tradition, Tradition], s: InterviewSession | null = load()): Tradition[] {
  if (!s || s.lens === 'both') return order;
  return order.filter((t) => t === s.lens);
}

const secs = (ms: number | undefined) => (ms === undefined ? '—' : `${Math.round(ms / 1000)}s`);

/** The anonymized summary the facilitator pastes into the study notes. */
export function summary(s: InterviewSession): string {
  const reflection = s.steps[6] !== undefined && s.steps[7] !== undefined ? s.steps[7] - s.steps[6] : undefined;
  return [
    `Session ${s.code} · lens: ${s.lens}`,
    `Setup to first reflection: ${secs(s.steps[6])}`,
    `Time on first reflection: ${secs(reflection)} (target 180s)`,
    `Onboarding finished: ${s.finishedAt ? secs(s.finishedAt - s.startedAt) : 'no'}`,
    `Chose: ${s.choice ?? '—'}`,
    ...CHECK_QUESTIONS.map((q) => `${q.id}: ${s.ratings[q.id] ?? '—'}`),
  ].join('\n');
}
