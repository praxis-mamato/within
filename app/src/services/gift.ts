// Gift memberships: buying one (Stripe Checkout, no sign-in needed) and showing the gift code afterwards.
import { siteUrl } from './config';
import { supabase } from './supabase';

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const sb = supabase();
  if (!sb) throw new Error('Gifts work on withinoracle.app.');
  const { data, error } = await sb.functions.invoke('gift', { body });
  if (error) {
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(detail?.error ?? 'Something went wrong. Try again.');
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const buyGift = async () => {
  const { url } = await call<{ url: string }>({ action: 'buy', returnUrl: siteUrl() });
  window.location.assign(url);
};

export const giftCode = (session: string) => call<{ code: string }>({ action: 'code', session }).then((r) => r.code);
