// Receives Stripe events and keeps public.entitlements in step with each subscription.
import Stripe from 'npm:stripe@17';
import { admin } from '../_shared/clients.ts';
import { priceYearly, stripe, stripeConfigured, webhookSecret } from '../_shared/stripe.ts';
import { toEntitlement, type StripeSubscriptionLike } from '../_shared/entitlement.ts';

const crypto = Stripe.createSubtleCryptoProvider();

/** Event order isn't guaranteed and events can be resent, so read the customer's current state from Stripe. */
async function record(sub: Stripe.Subscription) {
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = sub.metadata?.user_id;
  if (!userId) {
    const { data } = await admin.from('entitlements').select('user_id').eq('stripe_customer_id', customer).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) throw new Error(`No user for customer ${customer}`);
  // Prefer a subscription that grants access; otherwise the most recent one.
  const all = (await stripe.subscriptions.list({ customer, status: 'all', limit: 20 })).data;
  const rank = (s: Stripe.Subscription) => (['active', 'trialing'].includes(s.status) ? 2 : ['past_due', 'unpaid'].includes(s.status) ? 1 : 0);
  const best = [...all].sort((a, b) => rank(b) - rank(a) || b.created - a.created)[0] ?? sub;
  const row = toEntitlement(best as unknown as StripeSubscriptionLike, userId, priceYearly);
  const { error } = await admin.from('entitlements').upsert(row);
  if (error) throw error;
  console.log('entitlement', JSON.stringify({ subscription: best.id, status: best.status, considered: all.length }));
}

Deno.serve(async (req) => {
  if (!stripeConfigured) return new Response('Payments aren’t set up yet.', { status: 503 });
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret ?? '', undefined, crypto);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) await record(await stripe.subscriptions.retrieve(typeof s.subscription === 'string' ? s.subscription : s.subscription.id));
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await record(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (e) {
    // A 500 makes Stripe retry later.
    console.error(e);
    return new Response('Webhook handling failed', { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
