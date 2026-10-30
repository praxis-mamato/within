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

/**
 * Affiliates earn their share of every paid invoice in a referred member's first year. Recorded once
 * per invoice (resent events are ignored); paid out by Maggie from the affiliate_earnings table.
 */
async function creditAffiliate(inv: Stripe.Invoice) {
  // Older Stripe API versions put the subscription on the invoice; newer ones under parent.subscription_details.
  const raw = (inv as unknown as { subscription?: string | { id: string }; parent?: { subscription_details?: { subscription?: string | { id: string } } } });
  const ref = raw.subscription ?? raw.parent?.subscription_details?.subscription;
  const subId = typeof ref === 'string' ? ref : ref?.id;
  if (!subId || !inv.amount_paid) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  const code = sub.metadata?.affiliate;
  if (!code) return;
  const paidAt = (inv.status_transitions?.paid_at ?? inv.created) * 1000;
  if (paidAt - sub.start_date * 1000 > 366 * 86400000) return;
  const { data: aff } = await admin.from('affiliates').select('share_pct').eq('code', code).maybeSingle();
  if (!aff) return;
  const { error } = await admin.from('affiliate_earnings').upsert(
    { invoice_id: inv.id, affiliate_code: code, subscription_id: subId, amount_paid: inv.amount_paid, commission: Math.round((inv.amount_paid * aff.share_pct) / 100), paid_at: new Date(paidAt).toISOString() },
    { onConflict: 'invoice_id', ignoreDuplicates: true },
  );
  if (error) throw error;
  console.log('affiliate credited', JSON.stringify({ code, invoice: inv.id }));
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
        // Sessions with a human astrologer: mark the booking paid.
        if (s.metadata?.kind === 'astrologer' && s.payment_status === 'paid') {
          const { error } = await admin.from('astrologer_bookings').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('stripe_session_id', s.id);
          if (error) throw error;
          console.log('astrologer booking paid', JSON.stringify({ session: s.id, package: s.metadata.package_id }));
          break;
        }
        if (s.subscription) await record(await stripe.subscriptions.retrieve(typeof s.subscription === 'string' ? s.subscription : s.subscription.id));
        break;
      }
      case 'invoice.paid':
        await creditAffiliate(event.data.object as Stripe.Invoice);
        break;
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
