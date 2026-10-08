// The Stripe client and settings, kept apart from clients.ts so functions that don't take payments
// (deep-reading, redeem-code) still start when Stripe isn't configured yet.
import Stripe from 'npm:stripe@17';

// Secrets may be saved as STRIPE_SECRET_KEY or with other spacing or capitals ("stripe secret key").
const env = Deno.env.toObject();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const named = (...names: string[]) => {
  for (const name of names) {
    const hit = Object.entries(env).find(([n]) => norm(n) === norm(name));
    if (hit?.[1]?.trim()) return hit[1].trim();
  }
  return undefined;
};
const stripeSecrets = Object.entries(env).filter(([n]) => /stripe/i.test(n)).map(([n, v]) => [n, v.trim()] as const);
const byShape = (re: RegExp) => stripeSecrets.find(([, v]) => re.test(v))?.[1];

// The key itself, even if it was pasted with quotes or other text around it.
const KEY = /(sk|rk)_(test|live)_[A-Za-z0-9]+/;
const key = [named('STRIPE_SECRET_KEY', 'stripe'), ...stripeSecrets.map(([, v]) => v)].map((v) => v?.match(KEY)?.[0]).find(Boolean);
export const stripeConfigured = Boolean(key);
export const priceMonthly = named('STRIPE_PRICE_MONTHLY') ?? stripeSecrets.find(([n, v]) => /month/i.test(n) && v.startsWith('price_'))?.[1];
export const priceYearly = named('STRIPE_PRICE_YEARLY') ?? stripeSecrets.find(([n, v]) => /year|annual/i.test(n) && v.startsWith('price_'))?.[1];
export const webhookSecret = named('STRIPE_WEBHOOK_SECRET') ?? byShape(/^whsec_/);

// Names and key types only (never values), so a misconfigured secret can be spotted in the logs.
if (!key) {
  // Shape only: length, whether it starts with a letter or symbol, and which known prefixes appear.
  const kind = (v: string) =>
    v.match(/^(sk_test|sk_live|rk_test|rk_live|pk_test|pk_live|whsec|price|prod|acct)_/)?.[1] ??
    `unrecognized (${v.length} chars, starts with ${/^[A-Za-z]/.test(v) ? 'a letter' : /^\d/.test(v) ? 'a digit' : 'a symbol'}${/pk_(test|live)/.test(v) ? ', contains a publishable key' : ''}${/mk_|ek_/.test(v) ? ', looks like a different Stripe key type' : ''})`;
  console.warn('stripe key not found:', JSON.stringify(stripeSecrets.map(([n, v]) => `${n} → ${kind(v)}`)));
}
// Only used after checking stripeConfigured (or where a Stripe customer already exists).
export const stripe = (key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null) as Stripe;
