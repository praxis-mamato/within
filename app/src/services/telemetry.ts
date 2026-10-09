/**
 * Opt-in usage counts and crash reports (docs/next-features.md B5).
 *
 * Both are off until the person turns them on. What can leave the device is fixed here, not
 * by the caller: an event name and a few enum or number fields from an allowlist, or a crash's
 * error type and code locations. Never free text, names, birth details, or error messages
 * (a message can quote what someone typed). Anything else is dropped before sending.
 */
import { LIVE } from './config';
import { supabase } from './supabase';

export const APP_VERSION = '0.3.0';

export interface Consent {
  usage: boolean;
  crashes: boolean;
}

type Field = readonly string[] | 'number' | 'boolean';

/** Every event and every field it may carry. Values outside these lists are dropped. */
export const EVENTS = {
  app_opened: {},
  onboarding_step: { step: 'number' },
  onboarding_finished: { self_only: 'boolean', time_precision: ['exact', 'approximate', 'unknown'], reminder: 'boolean' },
  reflection_opened: { pillar: ['self', 'other', 'relationship', 'purpose'] },
  step_chosen: { pillar: ['self', 'other', 'relationship', 'purpose', 'onboarding'], choice: ['step', 'pause', 'none'] },
  follow_up_done: { attempt: ['attempted', 'not_attempted', 'paused'], usefulness: ['helpful', 'neutral', 'unhelpful', 'skipped'] },
  feedback_given: { kind: ['does_not_fit', 'unclear', 'harmful'], lens: ['western', 'vedic', 'together'] },
  reading_opened: { tradition: ['western', 'vedic', 'timing', 'together', 'patterns', 'cycles'] },
  paywall_shown: { where: ['reflection', 'reading', 'relationship', 'check_ins', 'account'] },
  checkout_started: { plan: ['monthly', 'yearly'] },
  today_finished: {},
  astrologer_checkout: { package: ['single', 'two-sessions', 'season', 'coaching', 'year'] },
  moon_calendar: { months: 'number' },
  oracle_asked: { intent: ['decision', 'when', 'return', 'retro', 'lunation', 'together', 'chart', 'patterns', 'feeling', 'cycle', 'week', 'planet', 'sky', 'open'] },
} as const satisfies Record<string, Record<string, Field>>;

export type EventName = keyof typeof EVENTS;
type Props = Record<string, string | number | boolean>;

/** Keeps only allowlisted fields with allowlisted values. Returns null for an unknown event. */
export function sanitizeEvent(name: string, props: Props = {}): { event: EventName; props: Props } | null {
  if (!(name in EVENTS)) return null;
  const spec = EVENTS[name as EventName] as Record<string, Field>;
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) {
    const f = spec[k];
    if (!f) continue;
    if (f === 'number' && typeof v === 'number' && Number.isFinite(v)) out[k] = Math.round(v);
    else if (f === 'boolean' && typeof v === 'boolean') out[k] = v;
    else if (Array.isArray(f) && typeof v === 'string' && f.includes(v)) out[k] = v;
  }
  return { event: name as EventName, props: out };
}

export interface CrashReport {
  kind: 'error' | 'unhandled_rejection' | 'render';
  name: string;
  frames: string[];
  route: string;
  app_version: string;
}

/** Route patterns only: ids and anything after a known prefix are replaced. */
export function sanitizeRoute(hash: string): string {
  const path = hash.replace(/^#/, '').split('?')[0] || '/';
  return path
    .split('/')
    .map((seg, i) => (i === 0 || seg === '' || /^(today|reflection|relationships|relationship|you|chart|reading|milestone|new|edit|growth|follow-up|settings|account|review|self|other|purpose)$/.test(seg) ? seg : ':id'))
    .join('/')
    .slice(0, 80);
}

/** Error type and up to 8 "file:line:col" locations. The message is never kept. */
export function sanitizeError(err: unknown, kind: CrashReport['kind'], hash = ''): CrashReport {
  const e = err instanceof Error ? err : null;
  const name = (e?.name ?? typeof err).replace(/[^A-Za-z]/g, '').slice(0, 40) || 'Unknown';
  const frames = (e?.stack ?? '')
    .split('\n')
    .map((l) => l.match(/([\w.-]+\.(?:js|ts|tsx|mjs)):(\d+):(\d+)/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => `${m[1]}:${m[2]}:${m[3]}`)
    .slice(0, 8);
  return { kind, name, frames, route: sanitizeRoute(hash), app_version: APP_VERSION };
}

/** Random per install, so returns can be counted. Not linked to the account; erased with the device data. */
const INSTALL_KEY = 'within.install';
function installId(): string {
  try {
    let v = localStorage.getItem(INSTALL_KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(INSTALL_KEY, v);
    }
    return v;
  } catch {
    return 'unavailable';
  }
}
export function forgetInstall() {
  try {
    localStorage.removeItem(INSTALL_KEY);
  } catch {
    /* nothing stored */
  }
}

let consent: Consent = { usage: false, crashes: false };
export function setConsent(c: Consent) {
  consent = c;
}

/** The last things that were (or in demo mode would have been) sent, for "See what's shared". */
export const recent: { at: string; kind: 'usage' | 'crash'; body: unknown }[] = [];
function remember(kind: 'usage' | 'crash', body: unknown) {
  recent.unshift({ at: new Date().toISOString(), kind, body });
  recent.length = Math.min(recent.length, 20);
}

export function track(name: EventName, props: Props = {}) {
  if (!consent.usage) return;
  const clean = sanitizeEvent(name, props);
  if (!clean) return;
  const row = { install_id: installId(), event: clean.event, props: clean.props, app_version: APP_VERSION };
  remember('usage', row);
  if (LIVE) void supabase()?.from('usage_events').insert(row).then(() => undefined, () => undefined);
}

let lastCrash = 0;
export function reportCrash(err: unknown, kind: CrashReport['kind']) {
  if (!consent.crashes) return;
  // At most one report a minute, so a render loop can't flood the table.
  if (Date.now() - lastCrash < 60_000) return;
  lastCrash = Date.now();
  const row = sanitizeError(err, kind, typeof location === 'undefined' ? '' : location.hash);
  remember('crash', row);
  if (LIVE) void supabase()?.from('crash_reports').insert(row).then(() => undefined, () => undefined);
}

let installed = false;
/** Catches errors outside React. Call once at startup. */
export function installCrashHandlers() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => reportCrash(e.error ?? e, 'error'));
  window.addEventListener('unhandledrejection', (e) => reportCrash(e.reason, 'unhandled_rejection'));
}
