// Black Friday 2026: $85 instead of $100 for the yearly plan's first year and for gifts, Nov 27 00:00 ET to
// Dec 2 00:00 PT. Mirrors app/src/services/offer.ts, which shows the price.
import type Stripe from 'npm:stripe@17';

export const BLACK_FRIDAY = { start: Date.parse('2026-11-27T05:00:00Z'), end: Date.parse('2026-12-02T08:00:00Z'), cents: 8500, coupon: 'BLACKFRIDAY2026', off: 1500 };
export const offerOn = (now = Date.now()) => now >= BLACK_FRIDAY.start && now < BLACK_FRIDAY.end;

/** The $15-off-once coupon for the yearly plan, created in Stripe the first time it's needed. */
export async function blackFridayCoupon(stripe: Stripe): Promise<string> {
  try {
    return (await stripe.coupons.retrieve(BLACK_FRIDAY.coupon)).id;
  } catch {
    return (await stripe.coupons.create({ id: BLACK_FRIDAY.coupon, name: 'Black Friday', amount_off: BLACK_FRIDAY.off, currency: 'usd', duration: 'once', redeem_by: Math.floor(BLACK_FRIDAY.end / 1000) })).id;
  }
}
