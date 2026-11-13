/**
 * The template review console (#/review) on the old GitHub Pages address. The general move (public/bridge.html)
 * only carries the saved app and lands on the start page, so the approver's old #/review link lost the console
 * and the decisions saved there (kept per address by the browser). This sends #/review links straight to the
 * console on withinoracle.app, carrying the decisions in the #fragment, which never leaves the device.
 */
export const REVIEW_KEY = 'within.review.v1';
const HOME = 'https://withinoracle.app/';
const PREFIX = '#review-import=';

interface Local {
  approver?: string;
  decisions?: Record<string, unknown>;
}

function encode(s: string): string {
  const b = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(b);
}

/** On the old address: where a #/review link should go, with this device's review decisions if it has any. */
export function reviewMoveTarget(hash: string): string | null {
  if (!/^#\/review(\/|$)/.test(hash)) return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(REVIEW_KEY);
  } catch {
    /* storage blocked: nothing to carry */
  }
  try {
    const old = raw ? (JSON.parse(raw) as Local) : null;
    if (old && old.decisions && Object.keys(old.decisions).length) return `${HOME}${PREFIX}${encode(raw!)}`;
  } catch {
    /* unreadable: just open the console */
  }
  return `${HOME}${hash}`;
}

/** Merges two saved review states. Decisions already made on this address win over carried ones. */
export function mergeReview(here: Local | null, moved: Local): Local {
  return {
    approver: here?.approver || moved.approver || 'Maggie',
    decisions: { ...(moved.decisions ?? {}), ...(here?.decisions ?? {}) },
  };
}

/** On withinoracle.app: save review decisions carried from the old address, then open the console. */
export function moveReviewIn(): void {
  if (!location.hash.startsWith(PREFIX)) return;
  const payload = location.hash.slice(PREFIX.length);
  history.replaceState(null, '', `${location.pathname}${location.search}#/review`);
  try {
    const moved = JSON.parse(decode(payload)) as Local;
    const raw = localStorage.getItem(REVIEW_KEY);
    const here = raw ? (JSON.parse(raw) as Local) : null;
    localStorage.setItem(REVIEW_KEY, JSON.stringify(mergeReview(here, moved)));
  } catch {
    // A move that can't be read is skipped: the old address still has the decisions.
  }
}
