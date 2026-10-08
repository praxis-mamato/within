/**
 * Sign-in (Apple, Google), the email-link second step, and subscription status.
 * One interface, two implementations: live (Supabase + Stripe) and demo (simulated, on this device).
 */
import { LIVE, siteUrl } from './config';
import { supabase } from './supabase';

export type Provider = 'google' | 'apple';
export type Plan = 'monthly' | 'yearly';

export interface Account {
  id: string;
  email: string;
  provider: Provider | 'email';
  /** True once this device has passed the email-link check for this account. */
  deviceVerified: boolean;
}

export interface Entitlement {
  active: boolean;
  status: 'none' | 'active' | 'trialing' | 'past_due' | 'canceled';
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  source: 'stripe' | 'app_store' | 'play_store' | 'comp' | 'demo' | null;
  plan?: Plan | null;
}

export const NO_ENTITLEMENT: Entitlement = { active: false, status: 'none', renewsAt: null, cancelAtPeriodEnd: false, source: null };

export interface AccountService {
  mode: 'live' | 'demo';
  current(): Promise<Account | null>;
  onChange(cb: (a: Account | null) => void): () => void;
  signIn(provider: Provider): Promise<void>;
  sendEmailLink(): Promise<{ sentTo: string }>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  entitlement(): Promise<Entitlement>;
  startCheckout(plan: Plan): Promise<void>;
  manageSubscription(): Promise<void>;
  /** Tester access: redeems a code for full access without payment. */
  redeemCode(code: string): Promise<string>;
}

// ─── Device trust (the email link as a second factor on each new device) ──────────────────
const TRUST = 'within.trusted.';
const PENDING = 'within.pendingStepUp';
const APPLE = 'within.appleToken.';
const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage blocked: device simply stays unverified */
    }
  },
  del: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

/** Reads the auth methods from a Supabase access token (the `amr` claim). */
export function authMethods(accessToken: string): string[] {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return (payload.amr ?? []).map((x: { method: string }) => x.method);
  } catch {
    return [];
  }
}

/** The function's own message (not set up, already subscribed, …) is in the response body. */
async function serverMessage(error: unknown, fallback: string): Promise<string> {
  const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
  return typeof body?.error === 'string' ? body.error : fallback;
}

// ─── Live ──────────────────────────────────────────────────────────────────────────────────
function live(): AccountService {
  const sb = supabase()!;
  const toAccount = (session: { access_token: string; provider_token?: string | null; provider_refresh_token?: string | null; user: { id: string; email?: string; app_metadata: { provider?: string } } } | null): Account | null => {
    if (!session) return null;
    const { user } = session;
    const methods = authMethods(session.access_token);
    // Coming back from the email link we sent for this account marks this device as trusted.
    if (ls.get(PENDING) === user.id && methods.some((m) => m === 'otp' || m === 'magiclink')) {
      ls.set(TRUST + user.id, new Date().toISOString());
      ls.del(PENDING);
    }
    // Apple's tokens arrive only once, right after sign-in. Keep one on this device so deleting
    // the account can revoke it (App Store 5.1.1(v)); it's never sent anywhere else.
    if (user.app_metadata.provider === 'apple' && (session.provider_refresh_token || session.provider_token)) {
      ls.set(APPLE + user.id, JSON.stringify(session.provider_refresh_token ? { t: session.provider_refresh_token, k: 'refresh_token' } : { t: session.provider_token, k: 'access_token' }));
    }
    const p = user.app_metadata.provider;
    return { id: user.id, email: user.email ?? '', provider: p === 'google' || p === 'apple' ? p : 'email', deviceVerified: Boolean(ls.get(TRUST + user.id)) };
  };
  return {
    mode: 'live',
    current: async () => toAccount((await sb.auth.getSession()).data.session),
    onChange: (cb) => sb.auth.onAuthStateChange((_e, s) => cb(toAccount(s))).data.subscription.unsubscribe,
    signIn: async (provider) => {
      // Always show Google's account chooser, so people with several accounts can pick the right one.
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: siteUrl(), queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined } });
      if (error) throw error;
    },
    sendEmailLink: async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user?.email) throw new Error('This account has no email address to send a link to.');
      ls.set(PENDING, data.user.id);
      const { error } = await sb.auth.signInWithOtp({ email: data.user.email, options: { shouldCreateUser: false, emailRedirectTo: siteUrl() } });
      if (error) throw error;
      return { sentTo: data.user.email };
    },
    signOut: async () => void (await sb.auth.signOut()),
    deleteAccount: async () => {
      const { data } = await sb.auth.getUser();
      const key = data.user ? APPLE + data.user.id : '';
      const apple = key ? (JSON.parse(ls.get(key) ?? 'null') as { t: string; k: string } | null) : null;
      const { error } = await sb.functions.invoke('delete-account', { method: 'POST', body: apple ? { appleToken: apple.t, appleTokenType: apple.k } : {} });
      if (error) throw error;
      if (key) ls.del(key);
      await sb.auth.signOut();
    },
    entitlement: async () => {
      const { data } = await sb.from('entitlements').select('status, current_period_end, cancel_at_period_end, source, plan').maybeSingle();
      if (!data) return NO_ENTITLEMENT;
      return {
        active: ['active', 'trialing'].includes(data.status),
        status: data.status,
        renewsAt: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        source: data.source,
        plan: data.plan,
      };
    },
    startCheckout: async (plan) => {
      const { data, error } = await sb.functions.invoke('create-checkout', { body: { plan, returnUrl: siteUrl() } });
      if (error) throw new Error(await serverMessage(error, 'Checkout couldn’t start. Try again.'));
      if (!data?.url) throw new Error('Checkout couldn’t start. Try again.');
      location.assign(data.url);
    },
    manageSubscription: async () => {
      const { data, error } = await sb.functions.invoke('billing-portal', { body: { returnUrl: siteUrl() } });
      if (error) throw new Error(await serverMessage(error, 'Couldn’t open subscription settings.'));
      if (!data?.url) throw new Error('Couldn’t open subscription settings.');
      location.assign(data.url);
    },
    redeemCode: async (code) => {
      const { data, error } = await sb.functions.invoke('redeem-code', { body: { code } });
      if (error) throw new Error(await serverMessage(error, 'The code couldn’t be checked right now. Try again.'));
      return (data?.message as string) ?? 'Tester access is on.';
    },
  };
}

// ─── Demo ──────────────────────────────────────────────────────────────────────────────────
const DEMO = 'within.demoAccount';
const DEMO_ENT = 'within.demoEntitlement';
function demo(): AccountService {
  const listeners = new Set<(a: Account | null) => void>();
  const read = (): Account | null => {
    const raw = ls.get(DEMO);
    if (!raw) return null;
    const a = JSON.parse(raw) as Account;
    return { ...a, deviceVerified: Boolean(ls.get(TRUST + a.id)) };
  };
  const emit = () => listeners.forEach((l) => l(read()));
  return {
    mode: 'demo',
    current: async () => read(),
    onChange: (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    signIn: async (provider) => {
      ls.set(DEMO, JSON.stringify({ id: `demo-${provider}`, email: provider === 'apple' ? 'demo@privaterelay.appleid.com' : 'demo@gmail.com', provider, deviceVerified: false }));
      emit();
    },
    sendEmailLink: async () => {
      const a = read();
      if (!a) throw new Error('Sign in first.');
      // Demo: the "link" is followed immediately.
      ls.set(TRUST + a.id, new Date().toISOString());
      emit();
      return { sentTo: a.email };
    },
    signOut: async () => {
      ls.del(DEMO);
      emit();
    },
    deleteAccount: async () => {
      const a = read();
      if (a) ls.del(TRUST + a.id);
      ls.del(DEMO);
      ls.del(DEMO_ENT);
      emit();
    },
    entitlement: async () => {
      const raw = ls.get(DEMO_ENT);
      return raw ? (JSON.parse(raw) as Entitlement) : NO_ENTITLEMENT;
    },
    startCheckout: async (plan) => {
      const renews = new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 86400000).toISOString();
      ls.set(DEMO_ENT, JSON.stringify({ active: true, status: 'active', renewsAt: renews, cancelAtPeriodEnd: false, source: 'demo', plan } satisfies Entitlement));
      emit();
    },
    manageSubscription: async () => {
      const raw = ls.get(DEMO_ENT);
      if (!raw) return;
      const e = JSON.parse(raw) as Entitlement;
      ls.set(DEMO_ENT, JSON.stringify({ ...e, cancelAtPeriodEnd: !e.cancelAtPeriodEnd }));
      emit();
    },
    redeemCode: async (code) => {
      if (code.trim().length < 8) throw new Error('That code isn’t valid.');
      const ends = new Date(Date.now() + 90 * 86400000).toISOString();
      ls.set(DEMO_ENT, JSON.stringify({ active: true, status: 'active', renewsAt: ends, cancelAtPeriodEnd: true, source: 'comp' } satisfies Entitlement));
      emit();
      return 'Tester access is on (demo).';
    },
  };
}

let service: AccountService | null = null;
export function accountService(): AccountService {
  service ??= LIVE ? live() : demo();
  return service;
}
