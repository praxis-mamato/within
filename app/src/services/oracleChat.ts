/**
 * Client side of "Talk to the Oracle". Sends the calculated chart facts, the Oracle's first answer, and the
 * conversation; never the name, birth date, time, or place. Nothing is kept on the server.
 */
import type { ChatReply, ChatTurn } from '../../../supabase/functions/_shared/oracleChat.ts';
import { CHAT_LIMITS } from '../../../supabase/functions/_shared/oracleChat.ts';
import { LIVE } from './config';
import { supabase } from './supabase';

export type { ChatReply, ChatTurn };
export { CHAT_LIMITS };

export async function talkToOracle(facts: string[], answer: string[], turns: ChatTurn[]): Promise<ChatReply> {
  if (!LIVE) {
    // Demo mode: no AI call. Show the shape of a reply.
    await new Promise((r) => setTimeout(r, 700));
    return {
      reply: 'In live mode the Oracle answers you here in its own words: it starts with what you’re feeling, then shows which parts of your chart and today’s sky may be stirring it, with the dates.',
      followups: ['Why does this feel so strong today?', 'What could help me through this week?'],
    };
  }
  const { data, error } = await supabase()!.functions.invoke('oracle-chat', {
    body: { facts: facts.slice(0, CHAT_LIMITS.facts), answer: answer.slice(0, CHAT_LIMITS.answer).map((a) => a.slice(0, CHAT_LIMITS.answerChars)), turns },
  });
  if (error) {
    // The function's own message (limit reached, not a member) is in the response body.
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'The Oracle couldn’t answer right now. Try again later.');
  }
  return data as ChatReply;
}
