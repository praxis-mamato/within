// Gift memberships: anyone can buy a year of membership for someone else ($100, one payment), and gets a
// one-time code to give. The code is derived from the paid Checkout session (HMAC with GIFT_SECRET), so the
// thank-you page can show it again on reload; only its SHA-256 hash is stored, as a 366-day, single-use
// access code that the recipient redeems after signing in.
import { admin, cors, json, SITE_URLS } from '../_shared/clients.ts';
import { stripe, stripeConfigured } from '../_shared/stripe.ts';
import { safeReturnUrl } from '../_shared/entitlement.ts';

const PRICE_CENTS = Number(Deno.env.get('GIFT_PRICE_CENTS') ?? '10000');
// The HMAC key: GIFT_SECRET if set, otherwise the server-only service key (always present). If the key
// changes, codes already shown stay valid (their hashes are stored); only re-showing an old link differs.
const SECRET = Deno.env.get('GIFT_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function codeFor(sessionId: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sessionId)));
  const chars = [...mac.slice(0, 12)].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  return `GIFT-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

const sha256 = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!stripeConfigured || !SECRET) return json({ error: 'Gifts aren’t set up yet.' }, 503);
  const body = await req.json().catch(() => ({}));

  if (body.action === 'buy') {
    const back = safeReturnUrl(body.returnUrl, SITE_URLS).split('#')[0];
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: PRICE_CENTS, product_data: { name: 'Within: a year with the Oracle (gift)', description: 'A one-year membership to give. You get a gift code to share right after paying.' } } }],
        metadata: { kind: 'gift' },
        payment_intent_data: { metadata: { kind: 'gift' } },
        success_url: `${back}#/gift?session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${back}#/gift`,
      });
      return json({ url: session.url });
    } catch (e) {
      console.error('gift checkout', e instanceof Error ? e.message : e);
      return json({ error: 'Checkout couldn’t start. Try again.' }, 502);
    }
  }

  if (body.action === 'code') {
    const id = typeof body.session === 'string' && /^cs_[A-Za-z0-9_]{10,200}$/.test(body.session) ? body.session : null;
    if (!id) return json({ error: 'That gift link isn’t valid.' }, 400);
    const s = await stripe.checkout.sessions.retrieve(id).catch(() => null);
    if (!s || s.metadata?.kind !== 'gift') return json({ error: 'That gift link isn’t valid.' }, 400);
    if (s.payment_status !== 'paid') return json({ error: 'The payment hasn’t gone through yet. Refresh in a minute.' }, 409);
    const code = await codeFor(s.id);
    const { error } = await admin.from('access_codes').upsert({ code_hash: await sha256(code), label: `gift ${s.id.slice(-10)}`, days: 366, max_uses: 1 }, { onConflict: 'code_hash', ignoreDuplicates: true });
    if (error) {
      console.error('gift code', error.message);
      return json({ error: 'The gift code couldn’t be made right now. Refresh to try again.' }, 500);
    }
    return json({ code });
  }

  return json({ error: 'Unknown request.' }, 400);
});
