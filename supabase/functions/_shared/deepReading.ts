// The AI deep-reading contract: instructions, output shape, and the checks every section must pass.
// No imports, so it runs in Deno (the edge function) and in the app's tests (Node).

export type Kind = 'western' | 'vedic' | 'timing' | 'together' | 'question';

export interface DeepRequest {
  kind: Kind;
  /** Calculated chart facts, one per line, e.g. "Venus in Libra, 7th house (tropical)". */
  facts: string[];
  /** The approved-library reading for the same placements, used as source material. */
  source: string[];
  /** Only for kind = "question". Already screened for safety on the device. */
  question?: string;
}

export interface DeepSection {
  title: string;
  body: string;
  tradition: 'western' | 'vedic' | 'both';
}
export interface DeepResult {
  sections: DeepSection[];
  reflection_question: string;
}

export const LIMITS = { facts: 220, factChars: 240, source: 320, sourceChars: 600, question: 500 };

export function validateRequest(x: unknown): DeepRequest | string {
  if (!x || typeof x !== 'object') return 'Missing request.';
  const r = x as Record<string, unknown>;
  if (!['western', 'vedic', 'timing', 'together', 'question'].includes(r.kind as string)) return 'Unknown reading type.';
  const strs = (v: unknown, max: number, chars: number) => Array.isArray(v) && v.length <= max && v.every((s) => typeof s === 'string' && s.length <= chars);
  if (!strs(r.facts, LIMITS.facts, LIMITS.factChars) || (r.facts as string[]).length === 0) return 'Chart facts are missing or too long.';
  if (!strs(r.source, LIMITS.source, LIMITS.sourceChars)) return 'Source text is too long.';
  if (r.kind === 'question' && (typeof r.question !== 'string' || !r.question.trim() || r.question.length > LIMITS.question)) return 'Ask a question of up to 500 characters.';
  return { kind: r.kind as Kind, facts: r.facts as string[], source: r.source as string[], question: typeof r.question === 'string' ? r.question.trim() : undefined };
}

// Stable text: keep it byte-identical between requests so prompt caching applies.
export const SYSTEM_PROMPT = `You write astrology readings for Within, an app for self-understanding and relationships. Readers are adults. Within offers two separate traditions, Western (tropical) and Vedic (Jyotish, sidereal), as interpretive lenses, never as proof or prediction.

You receive:
- CHART FACTS: placements calculated by the app. They are the only facts you may use.
- APPROVED INTERPRETATIONS: Within's reviewed meanings for exactly these placements. Build on them; do not contradict them.
- A reading type, and sometimes the reader's own question.

Write a connected reading that ties the placements together into a few clear themes, in warm, plain English, in the second person. Explain any Sanskrit or technical term in a few words the first time you use it.

Rules:
1. Use only the chart facts given. Never add a placement, degree, house, aspect, date, or dasha that is not listed. If a fact is marked uncertain or missing, say so plainly instead of guessing.
2. Keep Western and Vedic separate: label each section's tradition. When both appear, compare them; never average them into one verdict.
3. Speak in possibilities ("may", "can", "one reading is"). Do not predict events, health, money, legal outcomes, pregnancy, infidelity, accidents, or death. Timing describes themes to notice, not events to expect.
4. Never say what another person thinks, feels, wants, or intends. Describe possible dynamics and suggest what the reader could ask.
5. No compatibility scores, rankings, or verdicts. Never tell the reader to stay in or leave a relationship.
6. No fatalism: do not describe karma as punishment or anything as doomed, cursed, or fixed. Difficult placements are areas for attention and growth.
7. If the reader's question asks for a prediction, gently reframe it toward themes, choices, and reflection. If it mentions fear, danger, coercion, or self-harm, do not interpret the chart: say that their safety matters more than any reading and that Within's safety resources are in the app.
8. No medical, legal, or financial advice.

Length: 4 to 7 sections of 80 to 160 words each. End with one open reflection question for the reader.`;

export const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sections', 'reflection_question'],
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'body', 'tradition'],
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          tradition: { type: 'string', enum: ['western', 'vedic', 'both'] },
        },
      },
    },
    reflection_question: { type: 'string' },
  },
} as const;

const KIND_TEXT: Record<Kind, string> = {
  western: 'A deep Western natal reading.',
  vedic: 'A deep Vedic natal reading, including the navamsa where listed.',
  timing: 'A reading of the coming month and the current dasha period: themes and timing, not events.',
  together: 'A reading of two charts side by side. The other person is called "them"; say nothing about their inner life.',
  question: 'An answer to the reader’s question, grounded in their chart.',
};

export function userMessage(r: DeepRequest): string {
  return [
    `READING TYPE: ${KIND_TEXT[r.kind]}`,
    '',
    'CHART FACTS:',
    ...r.facts.map((f) => `- ${f}`),
    '',
    'APPROVED INTERPRETATIONS:',
    ...r.source.map((s) => `- ${s}`),
    ...(r.question ? ['', `READER'S QUESTION: ${r.question}`] : []),
  ].join('\n');
}

// ─── Checks on the model's output ─────────────────────────────────────────────

const BANNED = [/\bwill\b/i, /\bdestined\b/i, /\bdestiny\b/i, /\bsoulmate/i, /\bfated?\b/i, /\bdoom/i, /\bcursed?\b/i, /\balways\b/i, /\bnever\b/i, /\b(he|she|they) (feels?|wants?|intends?|thinks?)\b/i, /\bdiagnos/i, /\b(break up|leave (him|her|them)|stay with)\b/i, /\bcompatibility score\b/i, /\bkarmic debt\b/i];

const BODIES = 'Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rahu|Ketu|Chandra|Surya|Shukra|Mangala|Budha|Guru|Shani';
const SIGNS = 'Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|Mesha|Vrishabha|Mithuna|Karka|Simha|Kanya|Tula|Vrishchika|Dhanu|Makara|Kumbha|Meena';
const PLACEMENT = new RegExp(`\\b(${BODIES})\\b[^.;]{0,24}?\\bin\\s+(?:the\\s+)?(${SIGNS})\\b`, 'gi');
const DEGREE = /\b\d{1,2}°/g;

/** Words in the output that claim a placement or degree must exist in the chart facts. */
export function unsupportedClaims(text: string, facts: string[]): string[] {
  const hay = facts.join(' \n ').toLowerCase();
  const bad: string[] = [];
  for (const m of text.matchAll(PLACEMENT)) {
    const body = m[1].toLowerCase();
    const sign = m[2].toLowerCase();
    // The same body and sign must appear together in one fact line.
    if (!facts.some((f) => f.toLowerCase().includes(body) && f.toLowerCase().includes(sign))) bad.push(m[0]);
  }
  for (const m of text.matchAll(DEGREE)) if (!hay.includes(m[0])) bad.push(m[0]);
  return bad;
}

export interface CheckedResult {
  result: DeepResult;
  dropped: { title: string; reason: string }[];
}

/** Drops any section that breaks the content rules or claims a placement that isn't in the facts. */
export function checkResult(raw: DeepResult, facts: string[]): CheckedResult {
  const dropped: CheckedResult['dropped'] = [];
  const sections = raw.sections.filter((s) => {
    const text = `${s.title} ${s.body}`;
    const banned = BANNED.find((re) => re.test(text));
    if (banned) return dropped.push({ title: s.title, reason: `content rule ${banned.source}` }), false;
    const claims = unsupportedClaims(text, facts);
    if (claims.length) return dropped.push({ title: s.title, reason: `not in chart facts: ${claims.join(', ')}` }), false;
    return true;
  });
  const q = BANNED.some((re) => re.test(raw.reflection_question)) ? 'What part of this feels most true for you right now?' : raw.reflection_question;
  return { result: { sections, reflection_question: q }, dropped };
}
