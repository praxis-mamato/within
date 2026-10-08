/**
 * App state. Saved encrypted on this device only (storage/vault.ts); never sent anywhere.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { PatternCheck, Profile } from './content/mirror';
import { deviceVault } from './storage/vault';
import { SAMPLE_MILESTONES, type Milestone, type Tradition } from './data/fixtures';
import { screen, type ScreenResult } from './lib/screener';
import { setConsent, type Consent } from './services/telemetry';

export type TimePrecision = 'exact' | 'approximate' | 'unknown';
export type Choice = 'step' | 'pause' | 'none';
export type Attempt = 'attempted' | 'not_attempted' | 'paused';
export type Usefulness = 'helpful' | 'neutral' | 'unhelpful';

export interface Birth {
  date: string;
  timePrecision: TimePrecision;
  time: string;
  windowMinutes: number;
  /** Display label, e.g. "Los Angeles, CA, United States". */
  place: string;
  lat: number;
  lon: number;
  /** IANA time zone used to turn the local birth time into UTC. */
  tz: string;
}

export interface Person {
  id: string;
  nickname: string;
  birth: Birth | null;
  status: 'active' | 'archived';
  milestones: Milestone[];
}

export interface Intention {
  id: string;
  value: string;
  behavior: string;
  createdAt: string;
  status: 'active' | 'changed';
}

export interface Action {
  id: string;
  reflectionId: string;
  intentionId: string;
  choice: Choice;
  text: string;
  followUp: 'tomorrow' | 'in_3_days' | 'in_a_week' | 'none';
  createdAt: string;
  outcome?: { attempt: Attempt; usefulness?: Usefulness; notes: string; next: 'keep' | 'adjust' | 'new' | 'nothing' };
}

export interface JournalEntry {
  id: string;
  body: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  reflectionId: string;
  tradition: Tradition | 'together';
  kind: 'does_not_fit' | 'unclear' | 'harmful';
  note: string;
}

export interface State {
  onboarded: boolean;
  focus: string[];
  focusText: string;
  outcome: string;
  birth: Birth;
  person: Person | null;
  intentions: Intention[];
  actions: Action[];
  journal: JournalEntry[];
  feedback: Feedback[];
  observed: JournalEntry[];
  safety: ScreenResult;
  /** Randomized once so the pilot can compare lens order (build spec §5.3). */
  lensOrder: [Tradition, Tradition];
  /** Set when birth details change after reflections exist (PRD §8). */
  stale: boolean;
  notifications: boolean;
  /** Opt-in usage counts and crash reports. Both off until the person turns them on. */
  sharing: Consent;
  /** Where safety resources are shown for: a country code, 'other', or null to guess from the device. */
  country: string | null;
  todayDone: boolean;
  /** Opt-in for AI deep readings (sends calculated placements only). */
  aiConsent: boolean;
  /** AI readings kept on this device, keyed by reading type and chart. */
  aiReadings: Record<string, { at: string; sections: { title: string; body: string; tradition: string }[]; reflection_question: string }>;
  /** What the person tells Within about themselves, so readings can mirror them. Stays on this device. */
  profile: Profile | null;
  /** How each pattern fits, in the person's own judgment. */
  patternChecks: Record<string, PatternCheck>;
}

const now = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

export const SAMPLE_BIRTH: Birth = {
  date: '1994-05-09',
  timePrecision: 'unknown',
  time: '',
  windowMinutes: 60,
  place: 'Los Angeles, CA, United States',
  lat: 34.052,
  lon: -118.244,
  tz: 'America/Los_Angeles',
};

export function initialState(): State {
  return {
    onboarded: false,
    focus: [],
    focusText: '',
    outcome: '',
    birth: SAMPLE_BIRTH,
    person: null,
    intentions: [],
    actions: [],
    journal: [],
    feedback: [],
    observed: [],
    safety: { flagged: false, suppressContactActions: false },
    lensOrder: Math.random() < 0.5 ? ['western', 'vedic'] : ['vedic', 'western'],
    stale: false,
    notifications: false,
    sharing: { usage: false, crashes: false },
    country: null,
    todayDone: false,
    aiConsent: false,
    aiReadings: {},
    profile: null,
    patternChecks: {},
  };
}

export type Event =
  | { type: 'onboarding/answers'; focus: string[]; focusText: string; outcome: string }
  | { type: 'onboarding/finish'; birth: Birth; nickname: string | null; intention: string; behavior: string }
  | { type: 'birth/update'; birth: Birth }
  | { type: 'stale/refresh' }
  | { type: 'person/add'; nickname: string }
  | { type: 'person/birth'; birth: Birth | null }
  | { type: 'person/archive' }
  | { type: 'person/unarchive' }
  | { type: 'person/delete' }
  | { type: 'milestone/save'; milestone: Milestone }
  | { type: 'milestone/delete'; id: string }
  | { type: 'intention/set'; value: string; behavior: string }
  | { type: 'action/choose'; reflectionId: string; choice: Choice; text: string; followUp: Action['followUp'] }
  | { type: 'action/followUp'; id: string; outcome: NonNullable<Action['outcome']> }
  | { type: 'journal/add'; body: string }
  | { type: 'observed/add'; body: string }
  | { type: 'feedback/add'; feedback: Omit<Feedback, 'id'> }
  | { type: 'text/screen'; text: string }
  | { type: 'notifications/set'; on: boolean }
  | { type: 'sharing/set'; sharing: Consent }
  | { type: 'country/set'; country: string | null }
  | { type: 'today/finish' }
  | { type: 'ai/consent'; on: boolean }
  | { type: 'ai/save'; key: string; reading: State['aiReadings'][string] }
  | { type: 'reset' }
  | { type: 'profile/set'; profile: Profile }
  | { type: 'pattern/check'; id: string; check: PatternCheck | null }
  | { type: 'hydrate'; state: State };

function addIntention(s: State, value: string, behavior: string): State {
  const intentions = s.intentions.map((i) => (i.status === 'active' ? { ...i, status: 'changed' as const } : i));
  return { ...s, intentions: [...intentions, { id: id(), value, behavior, createdAt: now(), status: 'active' }] };
}

/** Free text is screened before anything else uses it, and a flag is never cleared by later text. */
function withScreen(s: State, text: string): State {
  const r = screen(text);
  return r.flagged && !s.safety.flagged ? { ...s, safety: r } : s;
}

export function reducer(s: State, e: Event): State {
  switch (e.type) {
    case 'onboarding/answers':
      return withScreen({ ...s, focus: e.focus, focusText: e.focusText, outcome: e.outcome }, e.focusText);
    case 'onboarding/finish': {
      const person: Person | null = e.nickname
        ? { id: id(), nickname: e.nickname, birth: null, status: 'active', milestones: SAMPLE_MILESTONES }
        : null;
      return addIntention({ ...s, onboarded: true, birth: e.birth, person }, e.intention, e.behavior);
    }
    case 'birth/update':
      return { ...s, birth: e.birth, stale: s.onboarded };
    case 'stale/refresh':
      return { ...s, stale: false };
    case 'person/add':
      return { ...s, person: { id: id(), nickname: e.nickname, birth: null, status: 'active', milestones: SAMPLE_MILESTONES } };
    case 'person/birth':
      return s.person ? { ...s, person: { ...s.person, birth: e.birth } } : s;
    case 'person/archive':
      return s.person ? { ...s, person: { ...s.person, status: 'archived' } } : s;
    case 'person/unarchive':
      return s.person ? { ...s, person: { ...s.person, status: 'active' } } : s;
    case 'person/delete':
      return { ...s, person: null };
    case 'milestone/save': {
      if (!s.person) return s;
      const rest = s.person.milestones.filter((m) => m.id !== e.milestone.id);
      const milestones = [...rest, e.milestone].sort((a, b) => a.date.start.localeCompare(b.date.start));
      return withScreen({ ...s, person: { ...s.person, milestones } }, `${e.milestone.title} ${e.milestone.meaning}`);
    }
    case 'milestone/delete':
      return s.person ? { ...s, person: { ...s.person, milestones: s.person.milestones.filter((m) => m.id !== e.id) } } : s;
    case 'intention/set':
      return withScreen(addIntention(s, e.value, e.behavior), e.behavior);
    case 'action/choose':
      return { ...s, actions: [...s.actions, { id: id(), reflectionId: e.reflectionId, intentionId: activeIntention(s)?.id ?? '', choice: e.choice, text: e.text, followUp: e.followUp, createdAt: now() }] };
    case 'action/followUp':
      return withScreen({ ...s, actions: s.actions.map((a) => (a.id === e.id ? { ...a, outcome: e.outcome } : a)) }, e.outcome.notes);
    case 'journal/add':
      return withScreen({ ...s, journal: [{ id: id(), body: e.body, createdAt: now() }, ...s.journal] }, e.body);
    case 'observed/add':
      return withScreen({ ...s, observed: [{ id: id(), body: e.body, createdAt: now() }, ...s.observed] }, e.body);
    case 'feedback/add':
      return withScreen({ ...s, feedback: [...s.feedback, { ...e.feedback, id: id() }] }, e.feedback.note);
    case 'text/screen':
      return withScreen(s, e.text);
    case 'notifications/set':
      return { ...s, notifications: e.on };
    case 'sharing/set':
      return { ...s, sharing: e.sharing };
    case 'country/set':
      return { ...s, country: e.country };
    case 'today/finish':
      return { ...s, todayDone: true };
    case 'ai/consent':
      return { ...s, aiConsent: e.on, aiReadings: e.on ? s.aiReadings : {} };
    case 'ai/save':
      return { ...s, aiReadings: { ...s.aiReadings, [e.key]: e.reading } };
    case 'profile/set':
      return { ...s, profile: e.profile };
    case 'pattern/check': {
      const patternChecks = { ...s.patternChecks };
      if (e.check) patternChecks[e.id] = e.check;
      else delete patternChecks[e.id];
      return { ...s, patternChecks };
    }
    case 'reset':
      return initialState();
    case 'hydrate':
      // Safety flags are per session: a past flag shouldn't keep suppressing steps forever.
      return { ...initialState(), ...e.state, safety: { flagged: false, suppressContactActions: false }, todayDone: false };
  }
}

export function activeIntention(s: State): Intention | undefined {
  return s.intentions.find((i) => i.status === 'active');
}

const Ctx = createContext<{ state: State; dispatch: (e: Event) => void } | null>(null);

const VAULT_KEY = 'state.v1';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [ready, setReady] = useState(false);
  const vault = useRef(deviceVault());

  // Load saved entries once; render nothing until then so onboarding doesn't flash.
  useEffect(() => {
    const v = vault.current;
    if (!v) return setReady(true);
    const done = setTimeout(() => setReady(true), 1500);
    v.load<State>(VAULT_KEY)
      .then((saved) => saved && dispatch({ type: 'hydrate', state: saved }))
      .catch(() => undefined)
      .finally(() => (clearTimeout(done), setReady(true)));
  }, []);

  // Save after each change (debounced). "Delete everything" wipes the vault.
  useEffect(() => {
    const v = vault.current;
    if (!ready || !v) return;
    const t = setTimeout(() => {
      (state.onboarded ? v.save(VAULT_KEY, state) : v.wipe()).catch(() => undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [state, ready]);

  // Set during render (idempotent) so children's effects already see the current choice.
  setConsent(state.sharing);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return ready ? <Ctx.Provider value={value}>{children}</Ctx.Provider> : null;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

/** Fills {name} in fixture text with the user's nickname for the other person. */
export function personalize(text: string, nickname?: string) {
  return text.replaceAll('{name}', nickname ?? 'them');
}
