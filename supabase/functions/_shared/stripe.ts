// The Stripe client, kept apart from clients.ts so functions that don't take payments
// (deep-reading, redeem-code) still start when Stripe isn't configured yet.
import Stripe from 'npm:stripe@17';

// STRIPE_SECRET_KEY is the documented name. Any secret whose name mentions Stripe and whose value
// looks like a Stripe secret or restricted key is accepted too, so a differently named secret works.
const env = Deno.env.toObject();
const key =
  env.STRIPE_SECRET_KEY ||
  Object.entries(env).find(([n, v]) => /stripe/i.test(n) && /^(sk|rk)_(test|live)_/.test(v.trim()))?.[1]?.trim();
export const stripeConfigured = Boolean(key);
// Names only (never values), so a misnamed secret can be spotted in the function logs.
if (!key) console.warn('stripe key not found; secret names containing "stripe":', JSON.stringify(Object.keys(env).filter((n) => /stripe/i.test(n))));
// Only used after checking stripeConfigured (or where a Stripe customer already exists).
export const stripe = (key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null) as Stripe;
