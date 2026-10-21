// The Oracle's answer, written by Claude: the personal astrology assistant answering one question from the
// person's calculated chart and today's sky. Free answers are short and personal; members get a much deeper one.
// Imports only the deep-reading rules, so it runs in Deno (the edge function) and in the app and its tests.
import { BANNED, unsupportedClaims } from './deepReading.ts';

export type Depth = 'free' | 'member';

export interface AnswerRequest {
  question: string;
  /** Calculated chart facts, one per line, as for deep readings. */
  facts: string[];
  /** What Within's own engine found for this question, line by line: the grounding Claude writes from. */
  found: string[];
  /** Earlier questions on this device, dated, so the Oracle can notice a thread ("2026-10-18: Should I quit my job?"). */
  asked: string[];
  /** Notes from earlier conversations, kept on the device; members with memory on only. */
  memory: string[];
}
export interface AnswerReply {
  /** A short headline in the Oracle's voice. */
  headline: string;
  /** The answer itself, in paragraphs. */
  paragraphs: string[];
  /** Two or three follow-ups the person might ask next, in their own voice. */
  followups: string[];
}

export const ANSWER_LIMITS = { question: 300, facts: 220, factChars: 240, found: 40, foundChars: 600, asked: 8, askedChars: 320, memory: 12, memoryChars: 420 };

export function validateAnswer(x: unknown): AnswerRequest | string {
  if (!x || typeof x !== 'object') return 'Missing request.';
  const r = x as Record<string, unknown>;
  const strs = (v: unknown, max: number, chars: number) => Array.isArray(v) && v.length <= max && v.every((s) => typeof s === 'string' && s.length <= chars);
  if (typeof r.question !== 'string' || !r.question.trim() || r.question.length > ANSWER_LIMITS.question) return 'Ask one question, up to 300 characters.';
  if (!strs(r.facts, ANSWER_LIMITS.facts, ANSWER_LIMITS.factChars) || (r.facts as string[]).length === 0) return 'Chart facts are missing or too long.';
  if (!strs(r.found, ANSWER_LIMITS.found, ANSWER_LIMITS.foundChars)) return 'The answer is too long.';
  if (r.asked !== undefined && !strs(r.asked, ANSWER_LIMITS.asked, ANSWER_LIMITS.askedChars)) return 'Too many earlier questions.';
  if (r.memory !== undefined && !strs(r.memory, ANSWER_LIMITS.memory, ANSWER_LIMITS.memoryChars)) return 'The Oracle’s memory is too long.';
  return { question: r.question.trim(), facts: r.facts as string[], found: r.found as string[], asked: (r.asked as string[] | undefined) ?? [], memory: (r.memory as string[] | undefined) ?? [] };
}

// Stable text: keep each byte-identical between requests so prompt caching applies.
export const ANSWER_SYSTEM = `You are the Oracle in Within, a personal astrology assistant. One person has asked you one question. Answer them the way a wise, warm astrologer who knows their chart well would: personal, specific, and plain-spoken. Readers are adults.

You receive their QUESTION, their CHART FACTS (calculated by the app: birth chart in both traditions, today's sky against their chart, progressions, and Vedic periods), WHAT WITHIN FOUND for this question (the app's own reading of the relevant transits, dates, and best days), sometimes EARLIER QUESTIONS they asked on this device, and sometimes WHAT YOU REMEMBER from earlier conversations.

How to answer:
- Answer the question they asked, in their words. If it is a yes-or-no question, lead with the Oracle's lean from WHAT WITHIN FOUND (yes, not yet, or yes with care) and the day to act when one is given, then explain.
- If the question carries a feeling, meet the feeling first, in a sentence or two, before any astrology. Do not rush to fix it.
- Then show why, from their own chart: the specific placements, transits, and dates that bear on this question, each explained in plain words and tied back to what they asked. Choose what fits; leave the rest. Never list placements for their own sake.
- If an earlier question or memory is clearly related, connect to it briefly, the way a friend would ("You asked about work last week too").
- End with one small, concrete thing they could do, if it fits.
- Speak to them as "you". No headings, no lists, no bold, no emoji. Explain any technical or Sanskrit term in a few words.
- The headline is under 60 characters, in the Oracle's voice, about their question (not a placement name).
- Suggest two or three short follow-ups they might ask next, written as they would say them (first person, under 70 characters each).

Rules:
1. Use only the chart facts and what Within found. Never add a placement, degree, house, aspect, date, or period that is not given. If something is uncertain or missing (for example no birth time), say so.
2. Speak in possibilities ("may", "can", "one way to read this"). Never use "will", "always", "never", "destiny", "fated" or "soulmate". Do not predict events, health, money, legal outcomes, pregnancy, infidelity, accidents, or death.
3. Never say what another person thinks, feels, wants, or intends. You may speak about the bond and about their side of it.
4. Never tell them to stay in or leave a relationship. No compatibility scores or verdicts.
5. No fatalism: nothing is doomed, cursed, punished, or fixed. Hard placements are places for attention and growth.
6. No medical, legal, or financial advice. If they describe ongoing distress, it is kind to suggest talking with someone they trust or a professional.
7. If they mention danger, coercion, self-harm, or not wanting to be here, do not interpret the chart. Say their safety matters more than any reading, and that in the US they can call or text 988, and elsewhere find a line at findahelpline.com.
8. Within is for reflection, not prediction. You are an AI writing in the Oracle's voice; if asked, say so plainly.`;

export const DEPTH_TEXT: Record<Depth, string> = {
  free: 'Length: a short, personal answer of 90 to 160 words in two or three paragraphs. Pick the one or two chart facts that matter most for this question.',
  member: 'Length: a deep, personal reading of 350 to 600 words in four to seven paragraphs. This person is a member, so go further: weave the birth chart, the transits and progressions in effect now with their dates, the Vedic period when it adds something, and the best days ahead into one connected answer to their question, and say how the pieces fit together for them. Stay specific to their question throughout.',
};

export const ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'paragraphs', 'followups'],
  properties: {
    headline: { type: 'string' },
    paragraphs: { type: 'array', items: { type: 'string' } },
    followups: { type: 'array', items: { type: 'string' } },
  },
} as const;

/** The request as one message to the model. */
export function answerMessage(r: AnswerRequest): string {
  return [
    `QUESTION: ${r.question}`,
    '',
    'CHART FACTS:',
    ...r.facts.map((f) => `- ${f}`),
    '',
    'WHAT WITHIN FOUND FOR THIS QUESTION:',
    ...(r.found.length ? r.found.map((a) => `- ${a}`) : ['- (nothing specific)']),
    ...(r.asked.length ? ['', 'EARLIER QUESTIONS ON THIS DEVICE:', ...r.asked.map((a) => `- ${a}`)] : []),
    ...(r.memory.length ? ['', 'WHAT YOU REMEMBER FROM EARLIER CONVERSATIONS:', ...r.memory.map((m) => `- ${m}`)] : []),
  ].join('\n');
}

/** What in an answer breaks Within's rules, if anything. */
export function answerProblems(a: AnswerReply, facts: string[]): string[] {
  const text = [a.headline, ...a.paragraphs].join('\n');
  const out: string[] = [];
  for (const re of BANNED) if (re.test(text)) out.push(`uses a forbidden phrase (${re.source})`);
  const claims = unsupportedClaims(text, facts);
  if (claims.length) out.push(`mentions placements or degrees not in the chart facts: ${claims.join(', ')}`);
  if (!a.paragraphs.some((p) => p.trim())) out.push('has no answer');
  return out;
}

/** The answer tidied for the screen: no empty paragraphs, a short headline, follow-ups that pass the rules. */
export function cleanAnswer(a: AnswerReply): AnswerReply {
  return {
    headline: a.headline.trim().slice(0, 90),
    paragraphs: a.paragraphs.map((p) => p.trim()).filter(Boolean).slice(0, 8),
    followups: a.followups
      .map((s) => s.trim())
      .filter((s) => s && s.length <= 90 && !BANNED.some((re) => re.test(s)))
      .slice(0, 3),
  };
}
