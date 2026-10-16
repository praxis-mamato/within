/**
 * The consent page for "Within for Claude" (mcp/ and plugin/). Supabase Auth's OAuth 2.1 server sends
 * people here with an authorization_id when they connect Within in Claude; they sign in, see what
 * Claude will be able to do, and allow or cancel.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LogoMark } from '../components/Illustrations';
import { SignInButtons } from '../components/Paywall';
import { useAccount } from '../services/AccountContext';
import { LIVE } from '../services/config';
import { supabase } from '../services/supabase';

/** Kept for the tab only, so the request survives the round trip through Google or Apple sign-in (App.tsx resumes it). */
const PENDING_CONSENT = 'within.oauthConsent';
const session = {
  get: () => {
    try {
      return sessionStorage.getItem(PENDING_CONSENT);
    } catch {
      return null;
    }
  },
  set: (v: string | null) => {
    try {
      if (v) sessionStorage.setItem(PENDING_CONSENT, v);
      else sessionStorage.removeItem(PENDING_CONSENT);
    } catch {
      /* storage blocked: the person reconnects from Claude after signing in */
    }
  },
};

export const CONSENT_TEXT = {
  title: 'Connect Within to Claude',
  asks: 'wants to use your Within account.',
  can: [
    'Calculate Western and Vedic charts from birth details you give Claude, and return Within’s readings for them.',
    'See whether you have a Within membership, to open member readings.',
  ],
  privacy: 'Birth details are used to calculate the chart and are not stored by Within. Claude keeps the conversation under your Claude settings. You can disconnect any time in Claude’s connector settings.',
  allow: 'Allow',
  cancel: 'Cancel',
  signIn: 'Sign in to Within to continue.',
  missing: 'This link is incomplete. Start again from Claude: open the Within connector and select Connect.',
  demo: 'Connecting to Claude needs the live Within site.',
};

interface Details {
  client: { name?: string; client_name?: string };
  redirect_uri: string;
}

export default function ConnectClaude() {
  const [params] = useSearchParams();
  const id = params.get('authorization_id') ?? session.get();
  const { account, loading } = useAccount();
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => session.set(id), [id]);

  useEffect(() => {
    const sb = supabase();
    if (!sb || !id || !account) return;
    sb.auth.oauth.getAuthorizationDetails(id).then(({ data, error: e }) => {
      if (e || !data) return (session.set(null), setError(e?.message ?? CONSENT_TEXT.missing));
      // Already allowed earlier: go straight back to Claude.
      if ('redirect_url' in data && data.redirect_url) return (session.set(null), location.assign(data.redirect_url));
      setDetails(data as unknown as Details);
    });
  }, [id, account]);

  const decide = async (allow: boolean) => {
    const sb = supabase();
    if (!sb || !id) return;
    setBusy(true);
    const { data, error: e } = allow ? await sb.auth.oauth.approveAuthorization(id, { skipBrowserRedirect: true }) : await sb.auth.oauth.denyAuthorization(id, { skipBrowserRedirect: true });
    session.set(null);
    if (e || !data?.redirect_url) return (setBusy(false), setError(e?.message ?? 'Something went wrong. Start again from Claude.'));
    location.assign(data.redirect_url);
  };

  const client = details?.client.client_name ?? details?.client.name ?? 'Claude';
  const host = (() => {
    try {
      return details ? new URL(details.redirect_uri).host : '';
    } catch {
      return '';
    }
  })();

  return (
    <div className="app">
      <header className="topbar">
        <span className="wordmark">
          <LogoMark />
          WITHIN
        </span>
      </header>
      <main id="main">
        <h1>{CONSENT_TEXT.title}</h1>
        {!LIVE ? (
          <p>{CONSENT_TEXT.demo}</p>
        ) : !id ? (
          <p>{CONSENT_TEXT.missing}</p>
        ) : loading ? (
          <p className="muted">Loading…</p>
        ) : !account ? (
          <>
            <p>{CONSENT_TEXT.signIn}</p>
            <SignInButtons />
          </>
        ) : details ? (
          <div className="card">
            <p style={{ marginTop: 0 }}>
              <strong>{client}</strong> {CONSENT_TEXT.asks}
              {host && <span className="small"> It will return you to {host}.</span>}
            </p>
            <ul>
              {CONSENT_TEXT.can.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="small">{CONSENT_TEXT.privacy}</p>
            <p className="small">Signed in as {account.email}</p>
            <div className="btn-row">
              <button type="button" className="btn" disabled={busy} onClick={() => decide(true)}>
                {CONSENT_TEXT.allow}
              </button>
              <button type="button" className="btn quiet" disabled={busy} onClick={() => decide(false)}>
                {CONSENT_TEXT.cancel}
              </button>
            </div>
          </div>
        ) : (
          !error && <p className="muted">Loading…</p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
