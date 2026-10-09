// Starts a one-time Stripe Checkout for sessions with a human astrologer, and saves the intake.
// The price comes from the shared catalog, never from the request.
import { admin, callingUser, cors, json, SITE_URLS } from '../_shared/clients.ts';
import { stripe, stripeConfigured } from '../_shared/stripe.ts';
import { safeReturnUrl } from '../_shared/entitlement.ts';
import { packageById } from '../_shared/packages.ts';

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await callingUser(req);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  if (!stripeConfigured) return json({ error: 'Payments aren’t set up yet.' }, 503);

  const body = await req.json().catch(() => ({}));
  const pkg = packageById(body.packageId);
  if (!pkg) return json({ error: 'Choose a package.' }, 400);
  const questions = clip(body.questions, 1500);
  if (questions.length < 10) return json({ error: 'Tell your astrologer a little about what you’d like to explore.' }, 400);
  const availability = clip(body.availability, 400);
  const timezone = clip(body.timezone, 60);
  const birth = body.shareBirth === true ? clip(body.birth, 200) : '';
  const back = safeReturnUrl(body.returnUrl, SITE_URLS);

  try {
    const { data: ent } = await admin.from('entitlements').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    let customer = ent?.stripe_customer_id ?? null;
    if (customer) {
      const found = await stripe.customers.retrieve(customer).catch(() => null);
      if (!found || ('deleted' in found && found.deleted)) customer = null;
    }
    if (!customer) {
      customer = (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id;
      await admin.from('entitlements').upsert({ user_id: user.id, stripe_customer_id: customer, updated_at: new Date().toISOString() });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer,
      client_reference_id: user.id,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: pkg.amount, product_data: { name: `Within: ${pkg.name}`, description: `${pkg.sessions} × ${pkg.minutes}-minute sessions with a Within astrologer` } } }],
      metadata: { kind: 'astrologer', user_id: user.id, package_id: pkg.id },
      payment_intent_data: { metadata: { kind: 'astrologer', user_id: user.id, package_id: pkg.id }, description: `Within astrologer: ${pkg.name}` },
      allow_promotion_codes: true,
      success_url: `${back}?booking=success`,
      cancel_url: back,
    });
    const { error } = await admin.from('astrologer_bookings').insert({
      user_id: user.id,
      email: user.email,
      package_id: pkg.id,
      amount: pkg.amount,
      questions,
      availability,
      timezone,
      birth_details: birth || null,
      stripe_session_id: session.id,
    });
    if (error) console.error('booking insert failed', error.message);
    return json({ url: session.url });
  } catch (e) {
    console.error('booking checkout failed', e instanceof Error ? e.message : e);
    return json({ error: 'Checkout couldn’t start. Try again.' }, 502);
  }
});
