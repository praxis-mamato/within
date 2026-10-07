// Redeems a tester access code for the signed-in person: full access for the code's number of days.
// Codes are long and random; only their SHA-256 hash is stored.
import { admin, callingUser, cors, json } from '../_shared/clients.ts';

const MESSAGES: Record<string, [string, number]> = {
  ok: ['Tester access is on.', 200],
  invalid: ['That code isn’t valid.', 400],
  used_up: ['That code has been used the maximum number of times.', 400],
  already: ['You’ve already used this code.', 409],
  subscribed: ['You already have a subscription.', 409],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  const { code } = await req.json().catch(() => ({}));
  const clean = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (clean.length < 8 || clean.length > 64) return json({ error: 'That code isn’t valid.' }, 400);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clean));
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await admin.rpc('redeem_access_code', { p_user: user.id, p_hash: hash });
  if (error) {
    console.error('redeem error', error.message);
    return json({ error: 'The code couldn’t be checked right now. Try again.' }, 500);
  }
  const [message, status] = MESSAGES[data as string] ?? MESSAGES.invalid;
  return status === 200 ? json({ ok: true, message }) : json({ error: message }, status);
});
