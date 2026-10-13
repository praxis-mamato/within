/**
 * Reviews people write in the app. They go to the reviews table for the owner to approve; nothing is
 * shown publicly unless approved and the writer agreed. Works without an account (anon key + RLS).
 */
import { CONFIG, IN_PLAY_APP } from './config';

export const PLAY_PACKAGE = 'dev.workers.withinoracle.within_oracle.twa';
export const PLAY_REVIEW_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`;

export interface ReviewInput {
  rating: number;
  body: string;
  name: string;
  consentPublic: boolean;
  freeAccess: boolean;
}

export async function submitReview(r: ReviewInput): Promise<void> {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) throw new Error('Reviews aren’t available in this preview.');
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/reviews`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.supabaseAnonKey,
      authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      rating: r.rating,
      body: r.body.trim(),
      name: r.name.trim() || null,
      consent_public: r.consentPublic,
      free_access: r.freeAccess,
      source: IN_PLAY_APP ? 'android' : 'web',
    }),
  });
  if (!res.ok) throw new Error('Your review couldn’t be sent. Try again in a moment.');
}

/** When to ask: after the third answer, then (after "Not now") five answers later. Once sent, never again. */
const KEY = 'within.review';
export function shouldAsk(answers: number): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'done') return false;
    return answers >= (v ? Number(v) : 3);
  } catch {
    return answers >= 3;
  }
}
export function askLater(answers: number) {
  try {
    localStorage.setItem(KEY, String(answers + 5));
  } catch {
    // private mode: the prompt returns next session
  }
}
export function markReviewed() {
  try {
    localStorage.setItem(KEY, 'done');
  } catch {
    // ignore
  }
}
