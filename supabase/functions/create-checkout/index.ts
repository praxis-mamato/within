// Starts a Stripe Checkout session for the signed-in user ($9.99/month or $100/year).
import { admin, callingUser, cors, json, SITE_URLS } from '../_shared/clients.ts';
import { priceMonthly, priceYearly, stripe, stripeConfigured } from '../_shared/stripe.ts';
import { safeReturnUrl } from '../_shared/entitlement.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  if (!stripeConfigured) return json({ error: 'Payments aren’t set up yet.' }, 503);

  const { plan, returnUrl } = await req.json().catch(() => ({}));
  const price = plan === 'yearly' ? priceYearly : priceMonthly;
  if (!price) return json({ error: 'This plan isn’t set up yet.' }, 500);
  const back = safeReturnUrl(returnUrl, SITE_URLS);

  // Reuse the person's Stripe customer if they've subscribed before.
  const { data: row } = await admin.from('entitlements').select('stripe_customer_id, status').eq('user_id', user.id).maybeSingle();
  if (row && ['active', 'trialing'].includes(row.status)) return json({ error: 'You already have an active subscription.' }, 409);
  let customer = row?.stripe_customer_id;
  if (!customer) {
    customer = (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id;
    await admin.from('entitlements').upsert({ user_id: user.id, stripe_customer_id: customer, updated_at: new Date().toISOString() });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${back}?checkout=success`,
    cancel_url: back,
  });
  return json({ url: session.url });
});
