// "Talk to the Oracle": a member's conversation with the Oracle about what they're living through (Claude Sonnet 5.5).
// The device sends calculated chart facts, the Oracle's first answer, the conversation, and (if the person turned
// memory on) notes from earlier conversations kept on their device; never the name or birth details. Nothing is stored except a usage count. Each reply is checked against Within's rules first.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131';
import { admin, callingUser, cors, json } from '../_shared/clients.ts';
import { CHAT_SCHEMA, CHAT_SYSTEM, chatMessages, chatProblems, cleanFollowups, validateChat, type ChatReply } from '../_shared/oracleChat.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const MONTHLY_LIMIT = Number(Deno.env.get('AI_CHAT_MONTHLY_LIMIT') ?? '200');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);

  // Members only.
  const { data: ent } = await admin.from('entitlements').select('status').eq('user_id', user.id).maybeSingle();
  if (!ent || !['active', 'trialing'].includes(ent.status)) return json({ error: 'Talking with the Oracle is part of a membership.' }, 402);

  const parsed = validateChat(await req.json().catch(() => null));
  if (typeof parsed === 'string') return json({ error: parsed }, 400);

  const period = new Date().toISOString().slice(0, 7);
  const { data: usage } = await admin.from('ai_usage').select('chat_count').eq('user_id', user.id).eq('period', period).maybeSingle();
  if ((usage?.chat_count ?? 0) >= MONTHLY_LIMIT) return json({ error: `You’ve used this month’s ${MONTHLY_LIMIT} messages with the Oracle. They reset on the 1st.` }, 429);

  let tokensIn = 0;
  let tokensOut = 0;
  // One rewrite is allowed when a draft breaks the rules; the second draft must pass or nothing is shown.
  const write = async (fix?: string[]) => {
    const response = await anthropic.beta.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [
        { type: 'text', text: CHAT_SYSTEM, cache_control: { type: 'ephemeral' } },
        ...(fix ? [{ type: 'text' as const, text: `Your last draft broke these rules, so write the reply again without them: ${fix.join('; ')}.` }] : []),
      ],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: CHAT_SCHEMA } },
      messages: chatMessages(parsed),
    });
    tokensIn += response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0);
    tokensOut += response.usage.output_tokens;
    if (response.stop_reason === 'refusal') return null;
    const text = response.content.find((b) => b.type === 'text');
    try {
      return JSON.parse(text && 'text' in text ? text.text : '') as ChatReply;
    } catch {
      return null;
    }
  };

  let reply: ChatReply | null;
  try {
    reply = await write();
    const problems = reply ? chatProblems(reply.reply, parsed.facts) : [];
    if (problems.length) {
      console.warn('chat rewrite', JSON.stringify(problems));
      reply = await write(problems);
      if (reply && chatProblems(reply.reply, parsed.facts).length) reply = null;
    }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'Too many requests right now. Try again in a minute.' }, 429);
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', e.status, e.message);
      if (e.status === 400 && /credit balance/i.test(e.message)) return json({ error: 'The Oracle can’t talk right now. Please try again later.' }, 503);
      return json({ error: 'The Oracle couldn’t answer right now. Try again later.' }, 502);
    }
    throw e;
  }

  await admin.rpc('record_chat_usage', { p_user: user.id, p_period: period, p_in: tokensIn, p_out: tokensOut });
  if (!reply?.reply?.trim()) return json({ error: 'The Oracle couldn’t find the words for that. Try saying it another way.' }, 422);
  return json({ reply: reply.reply.trim(), followups: cleanFollowups(reply.followups ?? []), remember: (reply.remember ?? '').trim().slice(0, 400) });
});
