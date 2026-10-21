// The Oracle's answer, written by Claude: the personal astrology assistant answering one question. Free answers
// (Claude Sonnet 5.5) are short and personal, 3 a day; members get a much deeper one (Claude Opus 5.5).
// The device sends the question, calculated chart facts, what Within's own engine found, and earlier questions
// (and, for members with memory on, notes from earlier talks); never the name or birth details. Only a daily
// count is stored. Each answer is checked against Within's rules first; the device falls back to its own answer.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131';
import { admin, callingUser, cors, json } from '../_shared/clients.ts';
import { ANSWER_SCHEMA, ANSWER_SYSTEM, answerMessage, answerProblems, cleanAnswer, DEPTH_TEXT, validateAnswer, type AnswerReply, type Depth } from '../_shared/oracleAnswer.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const FREE_PER_DAY = Number(Deno.env.get('ORACLE_FREE_PER_DAY') ?? '3');
// People who share a network (a household, an office) share the count when not signed in, so allow a little more.
const FREE_PER_NETWORK = Number(Deno.env.get('ORACLE_FREE_PER_NETWORK') ?? '6');
const MEMBER_PER_DAY = Number(Deno.env.get('ORACLE_MEMBER_PER_DAY') ?? '40');
// A ceiling on free answers across everyone per day, to cap cost.
const FREE_DAILY_TOTAL = Number(Deno.env.get('ORACLE_FREE_DAILY_TOTAL') ?? '3000');
const SALT = Deno.env.get('ORACLE_IP_SALT') ?? 'within-oracle';
const MODEL: Record<Depth, string> = { free: 'claude-sonnet-5-5', member: 'claude-opus-5-5' };

const sha = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const parsed = validateAnswer(await req.json().catch(() => null));
  if (typeof parsed === 'string') return json({ error: parsed }, 400);

  const user = await callingUser(req);
  let depth: Depth = 'free';
  if (user) {
    const { data: ent } = await admin.from('entitlements').select('status').eq('user_id', user.id).maybeSingle();
    if (ent && ['active', 'trialing'].includes(ent.status)) depth = 'member';
  }
  // Only members' answers may draw on remembered conversations.
  if (depth === 'free') parsed.memory = [];

  const day = new Date().toISOString().slice(0, 10);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const key = user ? `user:${user.id}` : `net:${await sha(`${SALT}|${ip}`)}`;
  const limit = depth === 'member' ? MEMBER_PER_DAY : user ? FREE_PER_DAY : FREE_PER_NETWORK;
  const { data: n } = await admin.rpc('take_oracle_answer', { p_key: key, p_day: day, p_limit: limit });
  if (n === -1) return json({ error: 'limit' }, 429);
  if (depth === 'free') {
    const { data: all } = await admin.rpc('take_oracle_answer', { p_key: 'free:all', p_day: day, p_limit: FREE_DAILY_TOTAL });
    if (all === -1) return json({ error: 'busy' }, 503);
  }

  let tokensIn = 0;
  let tokensOut = 0;
  // One rewrite is allowed when a draft breaks the rules; the second draft must pass or the device shows its own answer.
  const write = async (fix?: string[]) => {
    const response = await anthropic.beta.messages.create({
      model: MODEL[depth],
      max_tokens: depth === 'member' ? 6000 : 2500,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [
        { type: 'text', text: ANSWER_SYSTEM, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: DEPTH_TEXT[depth] },
        ...(fix ? [{ type: 'text' as const, text: `Your last draft broke these rules, so write the answer again without them: ${fix.join('; ')}.` }] : []),
      ],
      output_config: { effort: depth === 'member' ? 'medium' : 'low', format: { type: 'json_schema', schema: ANSWER_SCHEMA } },
      messages: [{ role: 'user', content: answerMessage(parsed) }],
    });
    tokensIn += response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0);
    tokensOut += response.usage.output_tokens;
    if (response.stop_reason === 'refusal') return null;
    const text = response.content.find((b) => b.type === 'text');
    try {
      return cleanAnswer(JSON.parse(text && 'text' in text ? text.text : '') as AnswerReply);
    } catch {
      return null;
    }
  };

  let answer: AnswerReply | null;
  try {
    answer = await write();
    const problems = answer ? answerProblems(answer, parsed.facts) : [];
    if (problems.length) {
      console.warn('answer rewrite', JSON.stringify(problems));
      answer = await write(problems);
      if (answer && answerProblems(answer, parsed.facts).length) answer = null;
    }
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', e.status, e.message);
      return json({ error: 'unavailable' }, 503);
    }
    throw e;
  }
  await admin.rpc('record_oracle_answer_tokens', { p_key: key, p_day: day, p_in: tokensIn, p_out: tokensOut });
  if (!answer) return json({ error: 'unchecked' }, 422);
  return json({ ...answer, depth });
});
