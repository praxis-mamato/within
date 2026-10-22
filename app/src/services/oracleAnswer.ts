/**
 * Client side of the Oracle's written answer. Sends the question, the calculated chart facts, what Within's own
 * engine found, and earlier questions (plus the Oracle's notes from earlier talks for members with memory on);
 * never the name, birth date, time, or place. Returns null whenever the written answer isn't available, so the
 * Oracle shows its own answer instead.
 */
import type { AnswerReply, Depth } from '../../../supabase/functions/_shared/oracleAnswer.ts';
import { ANSWER_LIMITS } from '../../../supabase/functions/_shared/oracleAnswer.ts';
import { LIVE } from './config';
import { supabase } from './supabase';

export type WrittenAnswer = AnswerReply & { depth: Depth };

export async function writeOracleAnswer(question: string, facts: string[], found: string[], asked: string[], memory: string[] = [], member = false): Promise<WrittenAnswer | null> {
  if (!LIVE) {
    // Demo mode: no AI call. Show the shape of an answer.
    await new Promise((r) => setTimeout(r, 700));
    return {
      depth: member ? 'member' : 'free',
      headline: 'Here is what your chart says',
      paragraphs: [
        `In live mode the Oracle writes this answer to “${question}” itself, from your chart and today’s sky: it starts with what you asked, then shows which of your placements and transits bear on it, with the dates.`,
        member ? 'As a member you get the deep version: your birth chart, what is moving now, your progressions and Vedic period, and the best days ahead, woven into one answer.' : 'Members get a much deeper answer, woven from the whole chart.',
      ],
      followups: ['What could help me this week?', 'When is a better day for this?'],
    };
  }
  try {
    const { data, error } = await supabase()!.functions.invoke('oracle-answer', {
      body: {
        question: question.slice(0, ANSWER_LIMITS.question),
        facts: facts.slice(0, ANSWER_LIMITS.facts).map((f) => f.slice(0, ANSWER_LIMITS.factChars)),
        found: found.slice(0, ANSWER_LIMITS.found).map((a) => a.slice(0, ANSWER_LIMITS.foundChars)),
        asked: asked.slice(-ANSWER_LIMITS.asked).map((a) => a.slice(0, ANSWER_LIMITS.askedChars)),
        memory: memory.slice(-ANSWER_LIMITS.memory).map((m) => m.slice(0, ANSWER_LIMITS.memoryChars)),
      },
    });
    if (error || !data?.paragraphs?.length) return null;
    return data as WrittenAnswer;
  } catch {
    return null;
  }
}
