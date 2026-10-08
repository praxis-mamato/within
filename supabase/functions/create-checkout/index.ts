// Starts a Stripe Checkout session for the signed-in user ($9.99/month or $100/year).
import { admin, callingUser, cors, json, SITE_URLS } from '../_shared/clients.ts';
import { priceMonthly, priceYearly, stripe, stripeConfigured } from '../_shared/stripe.ts';
import { safeReturnUrl } from '../_shared/entitlement.ts';

/** A message the person (or the owner testing) can act on, from Stripe's error. */
function stripeProblem(e: unknown): string {
  const msg = e instanceof Error ? e.message : '';
  if (/similar object exists in (live|test) mode/i.test(msg)) return 'Payments are set up in the wrong Stripe mode (test vs live). The prices and the key must both be test or both be live.';
  if (/No such price/i.test(msg)) return 'This plan’s price wasn’t found in Stripe.';
  if (/Invalid API Key/i.test(msg)) return 'The Stripe key isn’t valid.';
  return 'Checkout couldn’t start. Try again.';
}

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
  try {
    let customer = row?.stripe_customer_id;
    // A customer saved under test keys doesn't exist under live keys (and vice versa): start fresh.
    if (customer) {
      const found = await stripe.customers.retrieve(customer).catch(() => null);
      if (!found || ('deleted' in found && found.deleted)) customer = null;
    }
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
  } catch (e) {
    console.error('checkout failed', e instanceof Error ? e.message : e);
    return json({ error: stripeProblem(e) }, 502);
  }
});
