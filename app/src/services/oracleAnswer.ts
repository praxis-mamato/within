/**
 * Personal Oracle answers. The engine works out the astrology; the oracle-answer function writes the words for
 * this person from their whole chart. Sends the question, the engine's verdict and notes, and calculated chart
 * facts, never a name or birth details. Returns null (keep the engine's own answer) on any problem or delay.
 */
import type { AnswerReply } from '../../../supabase/functions/_shared/oracleAnswer.ts';
import { ANSWER_LIMITS } from '../../../supabase/functions/_shared/oracleAnswer.ts';
import { LIVE } from './config';
import { supabase } from './supabase';

export type { AnswerReply };

const clip = (xs: string[], n: number, chars: number) => xs.filter(Boolean).slice(0, n).map((x) => x.slice(0, chars));

export async function personalAnswer(input: { question: string; label: string; notes: string[]; facts: string[]; about: string[] }, timeoutMs = 12000): Promise<AnswerReply | null> {
  if (!LIVE) return null;
  const L = ANSWER_LIMITS;
  const body = {
    question: input.question.slice(0, L.question),
    label: input.label.slice(0, L.label),
    notes: clip(input.notes, L.notes, L.noteChars),
    facts: clip(input.facts, L.facts, L.factChars),
    about: clip(input.about, L.about, L.aboutChars),
  };
  const call = supabase()!
    .functions.invoke('oracle-answer', { body })
    .then(({ data, error }) => (error || !data || data.fallback || !Array.isArray(data.answer) || !data.answer.length ? null : (data as AnswerReply)))
    .catch(() => null);
  const late = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
  return Promise.race([call, late]);
}
