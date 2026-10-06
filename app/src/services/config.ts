/**
 * Live services switch on when the build has these values (GitHub repo variables → Pages build).
 * Without them the app runs in demo mode: every screen works, sign-in and payment are simulated.
 * The Supabase anon key is safe to ship in a web app; access is limited by row-level security.
 */
const env = import.meta.env ?? {};
export const CONFIG = {
  supabaseUrl: (env.VITE_SUPABASE_URL as string | undefined) || '',
  supabaseAnonKey: (env.VITE_SUPABASE_ANON_KEY as string | undefined) || '',
  /** Where OAuth, email links, and Stripe return to. Defaults to the current page. */
  siteUrl: (env.VITE_SITE_URL as string | undefined) || '',
  plans: {
    monthly: { label: '$9.99 a month', short: '$9.99/month' },
    yearly: { label: '$100 a year', short: '$100/year', note: 'about $8.33 a month, 17% less' },
  },
};

/** The single-file artifact build can't do redirects, so it always uses demo mode. */
export const LIVE = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) && env.MODE !== 'artifact';

export function siteUrl(): string {
  if (CONFIG.siteUrl) return CONFIG.siteUrl;
  if (typeof location === 'undefined') return '';
  return `${location.origin}${location.pathname}`;
}
