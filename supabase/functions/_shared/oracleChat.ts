// "Talk to the Oracle": a conversation about what the person is living through, read from their chart.
// Imports only the deep-reading rules, so it runs in Deno (the edge function) and in the app and its tests.
import { BANNED, unsupportedClaims } from './deepReading.ts';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}
export interface ChatRequest {
  /** Calculated chart facts, one per line, as for deep readings. */
  facts: string[];
  /** The Oracle's own answer to the question that started the conversation, line by line. */
  answer: string[];
  /** The conversation so far, starting and ending with the person. Already screened for safety on the device. */
  turns: ChatTurn[];
  /** Notes from earlier conversations, dated, kept on the person's device; only when they turned memory on. */
  memory: string[];
}
export interface ChatReply {
  reply: string;
  followups: string[];
  /** A short note of what's worth remembering from this conversation (the device keeps it only if memory is on). */
  remember: string;
}

export const CHAT_LIMITS = { facts: 220, factChars: 240, answer: 40, answerChars: 600, turns: 24, turnChars: 1500, memory: 12, memoryChars: 420 };

export function validateChat(x: unknown): ChatRequest | string {
  if (!x || typeof x !== 'object') return 'Missing request.';
  const r = x as Record<string, unknown>;
  const strs = (v: unknown, max: number, chars: number) => Array.isArray(v) && v.length <= max && v.every((s) => typeof s === 'string' && s.length <= chars);
  if (!strs(r.facts, CHAT_LIMITS.facts, CHAT_LIMITS.factChars) || (r.facts as string[]).length === 0) return 'Chart facts are missing or too long.';
  if (!strs(r.answer, CHAT_LIMITS.answer, CHAT_LIMITS.answerChars)) return 'The answer is too long.';
  if (r.memory !== undefined && !strs(r.memory, CHAT_LIMITS.memory, CHAT_LIMITS.memoryChars)) return 'The Oracle’s memory is too long.';
  const turns = r.turns;
  if (!Array.isArray(turns) || turns.length === 0 || turns.length > CHAT_LIMITS.turns) return 'This conversation is too long. Start a new one.';
  for (const [i, t] of turns.entries()) {
    const ok = t && typeof t === 'object' && t.role === (i % 2 ? 'assistant' : 'user') && typeof t.text === 'string' && t.text.trim() && t.text.length <= CHAT_LIMITS.turnChars;
    if (!ok) return 'Write up to 1,500 characters.';
  }
  if (turns.length % 2 === 0) return 'The conversation must end with your message.';
  return { facts: r.facts as string[], answer: r.answer as string[], turns: (turns as ChatTurn[]).map((t) => ({ role: t.role, text: t.text.trim() })), memory: (r.memory as string[] | undefined) ?? [] };
}

// Stable text: keep it byte-identical between requests so prompt caching applies.
export const CHAT_SYSTEM = `You are the Oracle in Within, an astrology app for self-understanding. You are talking with one person about what they are living through, the way a wise, warm astrologer would at a kitchen table: personal, present, and plain-spoken. Readers are adults.

You receive the person's CHART FACTS (calculated by the app, including today's sky against their chart, their progressions and their Vedic periods), the ORACLE'S FIRST ANSWER to the question that started the conversation, sometimes WHAT YOU REMEMBER from earlier conversations with them, and the conversation so far.

This is a relationship that grows over time. People open up at their own pace, so never ask for everything at once and never press for details they haven't offered. When you remember earlier conversations, let it show the way a friend's memory does ("last time you mentioned your mom's birthday"), only when it helps, and never recite it back. Feelings change: ask how something is now rather than assume it is the same.

How to reply:
- Start with them, not the chart. Name what they seem to be feeling, in their own words, and let it be okay before you explain anything. If they are grieving, be gentle and unhurried; do not try to fix it.
- Then show why this might be moving through them now: one to three specific facts from their chart, with the date or degree when the facts give one, explained in a sentence each in plain words (for example, the Moon and the 4th house are the traditional places of mothers, home and memory). Pick what fits what they told you; leave the rest.
- Offer one small, kind thing they could do today, if it fits.
- You may ask one short question to understand them better, when it would help the next reply. Never more than one.
- 60 to 180 words. Speak to them as "you". No headings, no lists, no bold. Explain any technical or Sanskrit term in a few words.
- Suggest two or three short follow-ups they might want to ask next, written as they would say them (first person, under 70 characters each).
- In "remember", write a short note for next time (under 300 characters): the people, events and feelings they shared in this whole conversation, in plain words, speaking to them as "you" (for example "Your mom's birthday is in October; you miss her and the grief can arrive without warning"). Fold in what is still true from WHAT YOU REMEMBER about the same things. No birth details and no chart details. Leave it empty if nothing personal was shared.

Rules:
1. Use only the chart facts given. Never add a placement, degree, house, aspect, date, or period that is not listed. If something is uncertain or missing, say so.
2. Speak in possibilities ("may", "can", "one way to read this"). Never use "will", "always", "never", "destiny", "fated" or "soulmate". Do not predict events, health, money, legal outcomes, pregnancy, infidelity, accidents, or death.
3. Never say what another person thinks, feels, wants, or intends, including someone who has died. You may speak about the bond, the memories, and what the person carries of them.
4. Never tell them to stay in or leave a relationship. No compatibility scores or verdicts.
5. No fatalism: nothing is doomed, cursed, punished, or fixed. Hard placements are places for attention and growth.
6. No medical, legal, or financial advice. If they describe ongoing distress, it is kind to suggest talking with someone they trust or a professional.
7. If they mention danger, coercion, self-harm, or not wanting to be here, do not interpret the chart. Say their safety matters more than any reading, and that in the US they can call or text 988, and elsewhere find a line at findahelpline.com.
8. Within is for reflection, not prediction. You are an AI writing in the Oracle's voice; if they ask, say so plainly.`;

export const CHAT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'followups', 'remember'],
  properties: {
    reply: { type: 'string' },
    followups: { type: 'array', items: { type: 'string' } },
    remember: { type: 'string' },
  },
} as const;

/** The conversation as API messages: the chart and the first answer ride with the person's first message. */
export function chatMessages(r: ChatRequest): { role: 'user' | 'assistant'; content: string }[] {
  const context = [
    'CHART FACTS:',
    ...r.facts.map((f) => `- ${f}`),
    '',
    "ORACLE'S FIRST ANSWER:",
    ...(r.answer.length ? r.answer.map((a) => `- ${a}`) : ['- (none)']),
    ...(r.memory.length ? ['', 'WHAT YOU REMEMBER FROM EARLIER CONVERSATIONS:', ...r.memory.map((m) => `- ${m}`)] : []),
    '',
    'THE PERSON SAYS:',
  ].join('\n');
  return r.turns.map((t, i) => ({ role: t.role, content: i === 0 ? `${context}\n${t.text}` : t.text }));
}

/** What in a reply breaks Within's rules, if anything. */
export function chatProblems(reply: string, facts: string[]): string[] {
  const out: string[] = [];
  for (const re of BANNED) if (re.test(reply)) out.push(`uses a forbidden phrase (${re.source})`);
  const claims = unsupportedClaims(reply, facts);
  if (claims.length) out.push(`mentions placements or degrees not in the chart facts: ${claims.join(', ')}`);
  return out;
}

/** Follow-up suggestions that pass the rules, at most three. */
export function cleanFollowups(list: string[]): string[] {
  return list
    .map((s) => s.trim())
    .filter((s) => s && s.length <= 90 && !BANNED.some((re) => re.test(s)))
    .slice(0, 3);
}
