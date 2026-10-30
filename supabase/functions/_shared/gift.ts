// Gift memberships: the price and the code, shared by the checkout and the webhook.
export const GIFT_AMOUNT = 10000; // $100, one year
export const GIFT_DAYS = 365;

/** A readable single-use code, 16 characters from an alphabet without look-alikes (never 0/O or 1/I). */
export function newGiftCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const raw = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return raw.match(/.{4}/g)!.join('-');
}

/** The same hash redeem-code stores: SHA-256 of the code with dashes kept, upper case. */
export async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.trim().toUpperCase()));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
