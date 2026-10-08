// Receives Stripe events and keeps public.entitlements in step with each subscription.
import Stripe from 'npm:stripe@17';
import { admin } from '../_shared/clients.ts';
import { priceYearly, stripe, stripeConfigured, webhookSecret } from '../_shared/stripe.ts';
import { toEntitlement, type StripeSubscriptionLike } from '../_shared/entitlement.ts';

const crypto = Stripe.createSubtleCryptoProvider();

async function record(sub: Stripe.Subscription) {
  let userId = sub.metadata?.user_id;
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  if (!userId) {
    const { data } = await admin.from('entitlements').select('user_id').eq('stripe_customer_id', customer).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) throw new Error(`No user for customer ${customer}`);
  const row = toEntitlement(sub as unknown as StripeSubscriptionLike, userId, priceYearly);
  const { error } = await admin.from('entitlements').upsert(row);
  if (error) throw error;
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
