// Opens Stripe's customer portal so people can change plan, update their card, or cancel.
import { admin, callingUser, cors, json, SITE_URLS, stripe } from '../_shared/clients.ts';
import { safeReturnUrl } from '../_shared/entitlement.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  const { returnUrl } = await req.json().catch(() => ({}));
  const { data } = await admin.from('entitlements').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  if (!data?.stripe_customer_id) return json({ error: 'No subscription found for this account.' }, 404);
  const session = await stripe.billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: safeReturnUrl(returnUrl, SITE_URLS) });
  return json({ url: session.url });
});
