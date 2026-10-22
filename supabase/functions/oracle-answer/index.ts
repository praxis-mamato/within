// Writes each Oracle answer for the person who asked, from their whole chart (Claude). Free questions use
// Claude Haiku 5.5; members get Claude Sonnet 5.5 and the deeper sections. The device sends the question, the
// engine's verdict and notes, and calculated chart facts: never a name or birth details. Nothing is stored
// except daily counts (per person, hashed, and the app's total spend), which keep the cost under a cap.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131';
import { admin, callingUser, cors, json } from '../_shared/clients.ts';
import { ANSWER_SCHEMA, ANSWER_SYSTEM, answerMessage, answerProblems, PRICES, validateAnswer, type AnswerReply } from '../_shared/oracleAnswer.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const DAILY_CAP_USD = Number(Deno.env.get('AI_DAILY_CAP_USD') ?? '10');
const FREE_PER_DAY = Number(Deno.env.get('AI_FREE_ANSWERS_PER_DAY') ?? '12');
const MEMBER_PER_DAY = Number(Deno.env.get('AI_MEMBER_ANSWERS_PER_DAY') ?? '150');

const sha = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const parsed = validateAnswer(await req.json().catch(() => null));
  if (typeof parsed === 'string') return json({ error: parsed }, 400);

  // Members by their account; everyone else by a daily hash of their network address (not stored in the clear).
  const user = await callingUser(req).catch(() => null);
  let member = false;
  if (user) {
    const { data: ent } = await admin.from('entitlements').select('status').eq('user_id', user.id).maybeSingle();
    member = !!ent && ['active', 'trialing'].includes(ent.status);
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = user ? `u:${user.id}` : `ip:${await sha(`${ip}:${new Date().toISOString().slice(0, 10)}`)}`;
  const { data: ok } = await admin.rpc('ai_answer_take', { p_key: key, p_limit: member ? MEMBER_PER_DAY : FREE_PER_DAY, p_cap_micro: Math.round(DAILY_CAP_USD * 1e6) });
  // Over a limit: the app shows its own answer instead.
  if (!ok) return json({ fallback: true });

  const model = member ? 'claude-sonnet-5-5' : 'claude-haiku-5-5';
  let micro = 0;
  const write = async (fix?: string[]) => {
    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: member ? 6000 : 2500,
      ...(member ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      system: [
        { type: 'text', text: ANSWER_SYSTEM, cache_control: { type: 'ephemeral' } },
        ...(fix ? [{ type: 'text' as const, text: `Your last draft broke these rules, so write it again without them: ${fix.join('; ')}.` }] : []),
      ],
      output_config: { effort: member ? 'medium' : 'low', format: { type: 'json_schema', schema: ANSWER_SCHEMA } },
      messages: [{ role: 'user', content: answerMessage(parsed, member) }],
    });
    const [pin, pout] = PRICES[model];
    micro += (response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0)) * pin + response.usage.output_tokens * pout;
    if (response.stop_reason === 'refusal') return null;
    const text = response.content.find((b) => b.type === 'text');
    try {
      const r = JSON.parse(text && 'text' in text ? text.text : '') as AnswerReply;
      return { answer: r.answer ?? [], deeper: member ? (r.deeper ?? []) : [], reflection: r.reflection ?? '' };
    } catch {
      return null;
    }
  };

  let reply: AnswerReply | null = null;
  try {
    reply = await write();
    const problems = reply ? answerProblems(reply, parsed) : [];
    if (problems.length) {
      console.warn('answer rewrite', JSON.stringify(problems));
      reply = await write(problems);
      if (reply && answerProblems(reply, parsed).length) reply = null;
    }
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.error('anthropic error', e.status, e.message);
    else console.error('answer failed', e instanceof Error ? e.message : e);
  }
  if (micro) await admin.rpc('ai_spend_add', { p_micro: Math.round(micro) });
  if (!reply) return json({ fallback: true });
  return json({ ...reply, member });
});
