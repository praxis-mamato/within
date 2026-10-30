import { IOS_APP, NATIVE_APP } from './native';
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
  /** The astrologer's Google Calendar booking page; paid clients pick their own time there. */
  bookingUrl: (env.VITE_BOOKING_URL as string | undefined) || '',
  plans: {
    monthly: { label: '$9.99 a month', short: '$9.99/month' },
    yearly: { label: '$100 a year', short: '$100/year', note: 'about $8.33 a month, 17% less' },
    /** Free days on the yearly plan for first-time members (TRIAL_DAYS in the create-checkout function). */
    trialDays: 14,
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
 * True inside the Google Play app (a Trusted Web Activity), which opens the site with an
 * android-app:// referrer. Play's payments policy covers in-app sales, so the Android app sells
 * nothing: members sign in there. Kept for the session only, so the same browser on the web still
 * shows purchases.
 */
export const IN_PLAY_APP_ONLY = (() => {
  try {
    if (typeof document !== 'undefined' && document.referrer.startsWith('android-app://')) sessionStorage.setItem('within.play', '1');
    return sessionStorage.getItem('within.play') === '1';
  } catch {
    return typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
  }
})();

/**
 * Inside an app store's app (Google Play or the iPhone app): store payment rules cover in-app sales, so
 * nothing is sold there; members sign in, and memberships and live readings are bought on the web.
 */
export const IN_PLAY_APP = IN_PLAY_APP_ONLY || IOS_APP;

export const PLAY_APP_TEXT = {
  membership: 'Memberships aren’t sold in this app. If you’re already a member, sign in to unlock everything.',
  live: 'Live readings aren’t booked in this app.',
};

/**
 * Live mode needs the Supabase settings, and either VITE_LIVE=true or a personal ?live=1.
 * The single-file artifact build can't do redirects, so it always uses demo mode.
 */
export const LIVE =
  Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) && env.MODE !== 'artifact' && (personalOverride() ?? env.VITE_LIVE === 'true');

/** Gift memberships ($100, a year as a code to pass on): hidden until VITE_GIFTS=true and the GIFTS_ENABLED function secret is set. */
export const GIFTS = LIVE && env.VITE_GIFTS === 'true';

/** Sign in with Apple needs an Apple Developer account; until VITE_APPLE_SIGN_IN=true, live mode offers Google only. */
export const APPLE_SIGN_IN = !LIVE || env.VITE_APPLE_SIGN_IN === 'true';
/**
 * Google's own sign-in button, run on Within's address, so Google shows "withinoracle.app" instead of the
 * Supabase address. Needs https://withinoracle.app listed under the Google client's Authorized JavaScript
 * origins; until VITE_GOOGLE_GIS=true, sign-in uses the redirect.
 */
export const GOOGLE_CLIENT_ID = LIVE && !NATIVE_APP && env.VITE_GOOGLE_GIS === 'true' ? (env.VITE_GOOGLE_CLIENT_ID ?? '') : '';

/** Our own addresses: sign-in and checkout return to whichever one the person is using. */
const OUR_HOSTS = /(^|\.)withinoracle\.app$|\.workers\.dev$/;

export function siteUrl(): string {
  if (typeof location !== 'undefined' && OUR_HOSTS.test(location.hostname)) return `${location.origin}${location.pathname}`;
  if (CONFIG.siteUrl) return CONFIG.siteUrl;
  if (typeof location === 'undefined') return '';
  return `${location.origin}${location.pathname}`;
}
