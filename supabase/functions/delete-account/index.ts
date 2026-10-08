// Deletes the signed-in person's account: cancels any Stripe subscription immediately,
// then deletes the user (their entitlements row goes with it). Required in-app by App Store 5.1.1(v).
import { admin, callingUser, cors, json } from '../_shared/clients.ts';
import { stripe, stripeConfigured } from '../_shared/stripe.ts';
import { revokeAppleToken } from '../_shared/apple.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);

  const { data } = await admin.from('entitlements').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  if (data?.stripe_customer_id && stripeConfigured) {
    const subs = await stripe.subscriptions.list({ customer: data.stripe_customer_id, status: 'all' });
    for (const s of subs.data) if (!['canceled', 'incomplete_expired'].includes(s.status)) await stripe.subscriptions.cancel(s.id);
    await stripe.customers.del(data.stripe_customer_id);
  }
  // Apple requires revoking its tokens when the account is deleted. The app keeps the refresh token
  // Apple issued at sign-in on the device and sends it only with this request; we never store it.
  let appleRevoked: boolean | null = null;
  if (user.app_metadata?.provider === 'apple' || user.app_metadata?.providers?.includes('apple')) {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.appleToken === 'string' ? body.appleToken : '';
    const hint = body.appleTokenType === 'access_token' ? 'access_token' : 'refresh_token';
    appleRevoked = await revokeAppleToken(token, hint).catch(() => false);
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: 'Couldn’t delete the account. Try again.' }, 500);
  return json({ deleted: true, appleRevoked });
});
