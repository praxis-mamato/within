/**
 * Content lint (build spec §8.3): certainty and destiny language, mind-reading, diagnoses, scores, directives.
 * Shared by the library tests and the review console, so edited text is checked by the same rules.
 */
export const BANNED: { re: RegExp; why: string }[] = [
  { re: /\bwill\b/i, why: '“will” states certainty' },
  { re: /\bdestin/i, why: 'destiny language' },
  { re: /\bsoulmate/i, why: '“soulmate”' },
  { re: /\bkarmic debt/i, why: '“karmic debt”' },
  { re: /\bfated?\b/i, why: 'fate language' },
  { re: /\balways\b/i, why: '“always” states certainty' },
  { re: /\bnever\b/i, why: '“never” states certainty' },
  { re: /\bthey (feel|want|intend|think)\b/i, why: 'says what another person feels or wants' },
  { re: /\b(he|she) (feels|wants|intends|thinks)\b/i, why: 'says what another person feels or wants' },
  { re: /\bdiagnos/i, why: 'diagnosis' },
  { re: /\bscore\b/i, why: 'scores' },
  { re: /\b(leave|break up|stay with)\b/i, why: 'stay/leave advice' },
  { re: /\bnarcissis/i, why: 'clinical label' },
  { re: /\btoxic\b/i, why: '“toxic”' },
  { re: /\bdoom/i, why: 'doom language' },
  { re: /\bcurse/i, why: 'curse language' },
  { re: /\bdisaster/i, why: 'disaster language' },
];

/** The reasons a text fails the lint; empty when it passes. */
export function lint(text: string): string[] {
  return [...new Set(BANNED.filter((b) => b.re.test(text)).map((b) => b.why))];
}
