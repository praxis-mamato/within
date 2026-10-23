// Personal Oracle answers: the app's engine works out the astrology (the verdict, the dates, the transits that
// matter for the question), and the AI writes the answer for this one person from their whole chart.
// Imports only the deep-reading rules, so it runs in Deno (the edge function) and in the app and its tests.
import { BANNED, unsupportedClaims } from './deepReading.ts';

export interface AnswerRequest {
  question: string;
  /** The engine's verdict for the question, e.g. "Yes, go gently" or "Not yet: wait for Nov 14". */
  label: string;
  /** The engine's own answer, line by line: the astrologer's notes for this question, with the exact dates. */
  notes: string[];
  /** The person's whole chart and current sky, as calculated facts. */
  facts: string[];
  /** What the person has told Within about their life, and the Oracle's notes from earlier talks (both optional). */
  about: string[];
}
export interface AnswerReply {
  answer: string[];
  deeper: { heading: string; text: string }[];
  reflection: string;
}

export const ANSWER_LIMITS = { question: 500, label: 120, notes: 40, noteChars: 600, facts: 220, factChars: 240, about: 16, aboutChars: 420 };

export function validateAnswer(x: unknown): AnswerRequest | string {
  if (!x || typeof x !== 'object') return 'Missing request.';
  const r = x as Record<string, unknown>;
  const strs = (v: unknown, max: number, chars: number) => Array.isArray(v) && v.length <= max && v.every((s) => typeof s === 'string' && s.length <= chars);
  if (typeof r.question !== 'string' || !r.question.trim() || r.question.length > ANSWER_LIMITS.question) return 'Ask a question of up to 500 characters.';
  if (typeof r.label !== 'string' || r.label.length > ANSWER_LIMITS.label) return 'Missing verdict.';
  if (!strs(r.notes, ANSWER_LIMITS.notes, ANSWER_LIMITS.noteChars)) return 'Notes are too long.';
  if (!strs(r.facts, ANSWER_LIMITS.facts, ANSWER_LIMITS.factChars) || (r.facts as string[]).length === 0) return 'Chart facts are missing or too long.';
  if (r.about !== undefined && !strs(r.about, ANSWER_LIMITS.about, ANSWER_LIMITS.aboutChars)) return 'About is too long.';
  return { question: r.question.trim(), label: r.label, notes: r.notes as string[], facts: r.facts as string[], about: (r.about as string[] | undefined) ?? [] };
}

// Stable text: keep it byte-identical between requests so prompt caching applies.
export const ANSWER_SYSTEM = `You are the Oracle in Within, an astrology app. A person has asked you a question. Answer them the way a gifted astrologer answers a client sitting across the table: personally, from their whole chart, in plain warm words. Astrology is never canned: the same placement means something different in every chart, because the rest of the chart changes it. Show that.

You receive:
- THE QUESTION.
- THE VERDICT and THE ASTROLOGER'S NOTES: what Within's chart engine worked out for this question (the verdict, the transits and periods that matter, and their exact dates). Keep the verdict and every date exactly as given. They are the backbone of your answer.
- CHART FACTS: the person's whole birth chart (Western and Vedic), today's sky against it, progressions, and Vedic periods. The only facts you may use.
- Sometimes ABOUT THE PERSON: what they have shared about their life, and notes from earlier conversations.
- Facts ending "(sky now)" are the prominent transits for everyone right now (retrogrades, stations, the New or Full Moon, sign changes, exact aspects). When one touches their question or a placement in their chart, name it with its date as given, and say how it lands for them; never list them all.

How to answer:
- Open with the answer to their question in one or two sentences, in the spirit of the verdict.
- Then make it theirs: name the two or three placements in their chart that most shape this answer and how they work together (a planet's sign and house, the aspects it makes, its ruler, a Vedic period), with dates where the notes give them. Explain any technical word in a few words.
- If something they shared is relevant, speak to it gently, without reciting it.
- End with one practical step or timing they can use.
- The answer is 2 to 4 short paragraphs, 90 to 180 words in all, speaking to them as "you". No headings, lists, or bold.
- "deeper": for members only (you are told whether to write it). 3 to 5 sections, each with a short heading and 60 to 120 words, going further into the chart behind the answer. Otherwise return an empty list.
- "reflection": one open question for them to sit with.

Rules:
1. Use only the facts given. Never add a placement, degree, house, aspect, date, or period that is not in the facts or notes. When you name a house, use the house listed for that exact planet; Western and Vedic houses can differ, so say which tradition you mean. If something is uncertain or missing (for example no birth time), say so.
2. Speak in possibilities ("may", "can", "one way to read this"). Never use "will", "always", "never", "destiny", "fated", or "soulmate". Do not predict events, health, money, legal or election outcomes, pregnancy, infidelity, accidents, or death. Timing describes themes and good moments, not events.
3. Never say what another person thinks, feels, wants, or intends. Never tell them to stay in or leave a relationship. No compatibility scores.
4. No fatalism: nothing is doomed, cursed, punished, or fixed.
5. No medical, legal, or financial advice; suggest a professional where it matters.
6. People of every age use Within. Keep everything suitable for a young person; nothing sexual; suggest a trusted adult for anything heavy.
7. If the question mentions danger, coercion, self-harm, or not wanting to be here, do not read the chart: say their safety matters more than any reading, and that in the US they can call or text 988, and elsewhere find a line at findahelpline.com.`;

export const ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'deeper', 'reflection'],
  properties: {
    answer: { type: 'array', items: { type: 'string' } },
    deeper: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['heading', 'text'], properties: { heading: { type: 'string' }, text: { type: 'string' } } },
    },
    reflection: { type: 'string' },
  },
} as const;

export function answerMessage(r: AnswerRequest, member: boolean): string {
  return [
    `THE QUESTION: ${r.question}`,
    '',
    `THE VERDICT: ${r.label}`,
    '',
    "THE ASTROLOGER'S NOTES:",
    ...(r.notes.length ? r.notes.map((n) => `- ${n}`) : ['- (none)']),
    '',
    'CHART FACTS:',
    ...r.facts.map((f) => `- ${f}`),
    ...(r.about.length ? ['', 'ABOUT THE PERSON:', ...r.about.map((a) => `- ${a}`)] : []),
    '',
    member ? 'This person is a member: write "deeper".' : 'This person is not a member: leave "deeper" empty.',
  ].join('\n');
}

/** What in a reply breaks Within's rules: forbidden words, or placements and degrees the facts don't support. */
export function answerProblems(reply: AnswerReply, r: AnswerRequest): string[] {
  const text = [...reply.answer, ...reply.deeper.flatMap((d) => [d.heading, d.text]), reply.reflection].join('\n');
  const out: string[] = [];
  for (const re of BANNED) if (re.test(text)) out.push(`uses a forbidden phrase (${re.source})`);
  const claims = unsupportedClaims(text, [...r.facts, ...r.notes]);
  if (claims.length) out.push(`mentions placements or degrees not in the facts: ${claims.join(', ')}`);
  if (!reply.answer.length || !reply.answer.join('').trim()) out.push('the answer is empty');
  return out;
}

/** Dollars per million tokens, input and output, for the cost cap. */
export const PRICES: Record<string, [number, number]> = {
  'claude-haiku-5-5': [0.1, 0.5],
  'claude-sonnet-5-5': [2, 10],
};
