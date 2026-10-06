/**
 * Prototype safety screener (build spec §8.1).
 *
 * Deterministic phrase matching so the in-app response never depends on AI or a person.
 * This is a stand-in for interview testing only: the production screener needs a
 * reviewed phrase set and its own release-blocking test suite.
 */
export type SafetyCategory = 'danger' | 'self_harm' | 'coercion' | 'fear';

const PATTERNS: Record<SafetyCategory, RegExp[]> = {
  danger: [/\b(scared|afraid|unsafe) to (go|be) home\b/i, /\b(hit|hurt|choke[sd]?|threaten(ed|s)?) me\b/i, /\bin danger\b/i],
  self_harm: [/\b(kill|hurt|harm) myself\b/i, /\bend (it|my life)\b/i, /\bno point (in )?(being here|living)\b/i, /\bdon'?t see the point in being here\b/i],
  coercion: [/\b(checks?|goes through) my phone\b/i, /\bwon'?t let me\b/i, /\bnot allowed to\b/i, /\bmakes? me\b.*\bor else\b/i],
  fear: [/\b(afraid|scared|frightened|terrified) of (him|her|them|my partner)\b/i, /\bafraid to say no\b/i, /\bdon'?t know what (he|she|they)'?ll do\b/i],
};

/** Ordered most to least urgent, so the first match decides the response. */
const ORDER: SafetyCategory[] = ['danger', 'self_harm', 'coercion', 'fear'];

export interface ScreenResult {
  flagged: boolean;
  category?: SafetyCategory;
  /** Contact-the-person suggestions must be hidden whenever any category matches. */
  suppressContactActions: boolean;
}

export function screen(text: string): ScreenResult {
  for (const category of ORDER) {
    if (PATTERNS[category].some((p) => p.test(text))) {
      return { flagged: true, category, suppressContactActions: true };
    }
  }
  return { flagged: false, suppressContactActions: false };
}

export function isUrgent(category?: SafetyCategory): boolean {
  return category === 'danger' || category === 'self_harm';
}
