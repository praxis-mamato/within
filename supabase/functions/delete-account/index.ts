// Deletes the signed-in person's account: cancels any Stripe subscription immediately,
// then deletes the user (their entitlements row goes with it). Required in-app by App Store 5.1.1(v).
import { admin, callingUser, cors, json, stripe } from '../_shared/clients.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);

  const { data } = await admin.from('entitlements').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  if (data?.stripe_customer_id) {
    const subs = await stripe.subscriptions.list({ customer: data.stripe_customer_id, status: 'all' });
    for (const s of subs.data) if (!['canceled', 'incomplete_expired'].includes(s.status)) await stripe.subscriptions.cancel(s.id);
    await stripe.customers.del(data.stripe_customer_id);
  }
  // TODO before App Store release: revoke the Sign in with Apple token (needs the Apple client secret).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: 'Couldn’t delete the account. Try again.' }, 500);
  return json({ deleted: true });
});
