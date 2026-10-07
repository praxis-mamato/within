// Writes an AI deep reading for a subscriber from their calculated chart facts (Claude Sonnet 5.5).
// The device sends only calculated placements and Within's approved interpretations for them:
// no name, birth details, place, journal, or relationship notes. Nothing is stored except a usage count.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131';
import { admin, callingUser, cors, json } from '../_shared/clients.ts';
import { checkResult, OUTPUT_SCHEMA, SYSTEM_PROMPT, userMessage, validateRequest, type DeepResult } from '../_shared/deepReading.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const MONTHLY_LIMIT = Number(Deno.env.get('AI_MONTHLY_LIMIT') ?? '30');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);

  // Subscribers only.
  const { data: ent } = await admin.from('entitlements').select('status').eq('user_id', user.id).maybeSingle();
  if (!ent || !['active', 'trialing'].includes(ent.status)) return json({ error: 'AI deep readings are part of a subscription.' }, 402);

  const parsed = validateRequest(await req.json().catch(() => null));
  if (typeof parsed === 'string') return json({ error: parsed }, 400);

  // Monthly limit per person.
  const period = new Date().toISOString().slice(0, 7);
  const { data: usage } = await admin.from('ai_usage').select('count').eq('user_id', user.id).eq('period', period).maybeSingle();
  if ((usage?.count ?? 0) >= MONTHLY_LIMIT) return json({ error: `You’ve used this month’s ${MONTHLY_LIMIT} AI readings. They reset on the 1st.` }, 429);

  let response;
  try {
    response = await anthropic.beta.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      messages: [{ role: 'user', content: userMessage(parsed) }],
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'Too many requests right now. Try again in a minute.' }, 429);
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', e.status);
      return json({ error: 'The reading couldn’t be written right now. Try again later.' }, 502);
    }
    throw e;
  }

  if (response.stop_reason === 'refusal') return json({ error: 'This reading couldn’t be written. Try rephrasing your question.' }, 422);
  const text = response.content.find((b) => b.type === 'text');
  let raw: DeepResult;
  try {
    raw = JSON.parse(text && 'text' in text ? text.text : '');
  } catch {
    return json({ error: 'The reading came back incomplete. Try again.' }, 502);
  }
  const { result, dropped } = checkResult(raw, parsed.facts);
  if (dropped.length) console.warn('dropped sections', JSON.stringify(dropped));
  if (!result.sections.length) return json({ error: 'The reading didn’t pass Within’s checks. Try again.' }, 502);

  await admin.rpc('record_ai_usage', {
    p_user: user.id,
    p_period: period,
    p_in: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0),
    p_out: response.usage.output_tokens,
  });

  return json({ ...result, model: response.model, dropped: dropped.length });
});
