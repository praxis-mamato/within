// Pure mapping from a Stripe subscription to an entitlements row. No imports, so it runs in
// both Deno (edge functions) and Node (the app's tests).

export interface StripeSubscriptionLike {
  id: string;
  customer: string | { id: string };
  status: string;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items: { data: { current_period_end?: number; price: { id: string; recurring?: { interval?: string } | null } }[] };
}

export interface EntitlementRow {
  user_id: string;
  status: 'none' | 'active' | 'trialing' | 'past_due' | 'canceled';
  plan: 'monthly' | 'yearly' | null;
  source: 'stripe';
  stripe_customer_id: string;
  stripe_subscription_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
}

const STATUS: Record<string, EntitlementRow['status']> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled',
  incomplete: 'none',
  paused: 'canceled',
};

export function toEntitlement(sub: StripeSubscriptionLike, userId: string, yearlyPriceId?: string, now = new Date()): EntitlementRow {
  const item = sub.items.data[0];
  // Newer Stripe API versions put the period on the subscription item.
  const end = item?.current_period_end ?? sub.current_period_end;
  const yearly = item && (item.price.id === yearlyPriceId || item.price.recurring?.interval === 'year');
  return {
    user_id: userId,
    status: STATUS[sub.status] ?? 'none',
    plan: item ? (yearly ? 'yearly' : 'monthly') : null,
    source: 'stripe',
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: now.toISOString(),
  };
}

/** Only allow Stripe to send people back to our own site. */
export function safeReturnUrl(requested: unknown, allowed: string[]): string {
  const fallback = allowed[0];
  if (typeof requested !== 'string') return fallback;
  try {
    const u = new URL(requested);
    return allowed.some((a) => u.origin === new URL(a).origin && u.pathname.startsWith(new URL(a).pathname)) ? `${u.origin}${u.pathname}` : fallback;
  } catch {
    return fallback;
  }
}
