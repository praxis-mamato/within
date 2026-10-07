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

/** Lets one browser try live mode before it's on for everyone: visit with ?live=1 (or ?live=0 to undo). */
function personalOverride(): boolean | null {
  try {
    const q = new URLSearchParams(location.search).get('live');
    if (q === '1' || q === '0') localStorage.setItem('within.live', q);
    const v = localStorage.getItem('within.live');
    return v === '1' ? true : v === '0' ? false : null;
  } catch {
    return null;
  }
}

/**
 * Live mode needs the Supabase settings, and either VITE_LIVE=true or a personal ?live=1.
 * The single-file artifact build can't do redirects, so it always uses demo mode.
 */
export const LIVE =
  Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) && env.MODE !== 'artifact' && (personalOverride() ?? env.VITE_LIVE === 'true');

/** Sign in with Apple needs an Apple Developer account; until VITE_APPLE_SIGN_IN=true, live mode offers Google only. */
export const APPLE_SIGN_IN = !LIVE || env.VITE_APPLE_SIGN_IN === 'true';

export function siteUrl(): string {
  if (CONFIG.siteUrl) return CONFIG.siteUrl;
  if (typeof location === 'undefined') return '';
  return `${location.origin}${location.pathname}`;
}
