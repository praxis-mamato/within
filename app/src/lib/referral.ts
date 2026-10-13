/**
 * Affiliate links: a partner shares ...?ref=their-code. The code is kept on this device for 60 days
 * (the last link clicked wins) and sent with checkout, where the server checks it against the
 * affiliates table. Nothing personal is stored: only the partner's code and when the link was opened.
 */
const KEY = 'within.ref';
const DAYS = 60;
const CODE = /^[a-z0-9-]{2,32}$/;

export function captureReferral(search = typeof location === 'undefined' ? '' : location.search, now = Date.now()) {
  try {
    const code = new URLSearchParams(search).get('ref')?.trim().toLowerCase();
    if (code && CODE.test(code)) localStorage.setItem(KEY, JSON.stringify({ code, at: now }));
  } catch {
    // storage unavailable: the visit simply isn't credited
  }
}

export function referralCode(now = Date.now()): string | undefined {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { code?: string; at?: number } | null;
    if (v?.code && CODE.test(v.code) && typeof v.at === 'number' && now - v.at < DAYS * 86400000) return v.code;
  } catch {
    // ignore
  }
  return undefined;
}
