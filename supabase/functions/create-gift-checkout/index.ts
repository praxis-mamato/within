// Starts a one-time Stripe Checkout for a gift membership ($100, a year of full access).
// Off until the GIFTS_ENABLED secret is "true". The price is set here, never taken from the request.
import { callingUser, cors, json, SITE_URLS } from '../_shared/clients.ts';
import { stripe, stripeConfigured } from '../_shared/stripe.ts';
import { safeReturnUrl } from '../_shared/entitlement.ts';
import { GIFT_AMOUNT } from '../_shared/gift.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (Deno.env.get('GIFTS_ENABLED') !== 'true') return json({ error: 'Gift memberships aren’t available yet.' }, 503);
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  if (!stripeConfigured) return json({ error: 'Payments aren’t set up yet.' }, 503);

  const body = await req.json().catch(() => ({}));
  const back = safeReturnUrl(body.returnUrl, SITE_URLS);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: GIFT_AMOUNT, product_data: { name: 'Within: a year as a gift', description: 'One year of full Within access for someone you choose. You receive a code to pass on.' } } }],
      metadata: { kind: 'gift', user_id: user.id },
      payment_intent_data: { metadata: { kind: 'gift', user_id: user.id }, description: 'Within gift membership' },
      success_url: `${back}?gift=success`,
      cancel_url: back,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('gift checkout failed', e instanceof Error ? e.message : e);
    return json({ error: 'Checkout couldn’t start. Try again.' }, 502);
  }
});
