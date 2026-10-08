// The Stripe client, kept apart from clients.ts so functions that don't take payments
// (deep-reading, redeem-code) still start when Stripe isn't configured yet.
import Stripe from 'npm:stripe@17';

const key = Deno.env.get('STRIPE_SECRET_KEY');
export const stripeConfigured = Boolean(key);
// Only used after checking stripeConfigured (or where a Stripe customer already exists).
export const stripe = (key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null) as Stripe;
