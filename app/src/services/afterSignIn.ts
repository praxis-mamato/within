/**
 * Where to go after Google or Apple sign-in. Signing in leaves the app and comes back to its front door, so
 * the page the person was on (and the plan they picked, if they were about to pay) is kept on this device for
 * a few minutes and picked up again on return.
 */
import type { Plan } from "./account";

const KEY = "within.afterSignIn";
const FRESH_MS = 20 * 60 * 1000;

export interface AfterSignIn {
  hash: string;
  plan?: Plan;
  at: number;
}

export function rememberReturn(plan?: Plan) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        hash: location.hash,
        plan,
        at: Date.now(),
      } satisfies AfterSignIn),
    );
  } catch {
    /* storage blocked: the person lands on the front page as before */
  }
}

/** The saved place, once: it is cleared as it is read, and ignored when stale. */
export function takeReturn(now = Date.now()): AfterSignIn | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const r = JSON.parse(raw) as AfterSignIn;
    return now - r.at < FRESH_MS ? r : null;
  } catch {
    return null;
  }
}
