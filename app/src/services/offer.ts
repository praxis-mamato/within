// Black Friday 2026 (Maggie, Oct 30): the yearly plan's first year and gift memberships cost $85 instead
// of $100, from midnight Eastern on Nov 27 to midnight Pacific after Cyber Monday (Dec 1). The same window
// is in supabase/functions/_shared/offer.ts, which applies the price at checkout.
export const BLACK_FRIDAY = { start: Date.parse('2026-11-27T05:00:00Z'), end: Date.parse('2026-12-02T08:00:00Z'), price: '$85' };
export const offerOn = (now = Date.now()) => now >= BLACK_FRIDAY.start && now < BLACK_FRIDAY.end;
