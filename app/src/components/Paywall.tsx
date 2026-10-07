import { useEffect, useState, type ReactNode } from 'react';
import { track } from '../services/telemetry';
import { Link } from 'react-router-dom';
import { accountService, type Plan, type Provider } from '../services/account';
import { useAccount } from '../services/AccountContext';
import { APPLE_SIGN_IN, CONFIG } from '../services/config';
import { useStore } from '../state';

export function SignInButtons() {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState('');
  const go = async (p: Provider) => {
    setBusy(p);
    setError('');
    try {
      await accountService().signIn(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in didn’t work. Try again.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="btn-row">
      {APPLE_SIGN_IN && (
        <button type="button" className="btn auth apple" disabled={!!busy} onClick={() => go('apple')}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.2zM14 5.3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z" />
          </svg>
          {busy === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
        </button>
      )}
      <button type="button" className="btn auth google" disabled={!!busy} onClick={() => go('google')}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8C3.9 20.6 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.8 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.8z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.4 2.1 7l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
        </svg>
        {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
      </button>
      {error && (
        <p role="alert" className="small">
          {error}
        </p>
      )}
    </div>
  );
}

export function VerifyDevice() {
  const { account, refresh } = useAccount();
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  if (!account) return null;
  return (
    <div className="card soft">
      <p style={{ margin: 0 }}>
        <strong>Confirm it’s you on this device.</strong> We’ll email a one-time link to {account.email}. It expires in 15 minutes.
      </p>
      {sent ? (
        <p role="status" className="small">
          Link sent to {sent}. Open it on this device to finish.
        </p>
      ) : (
        <button
          type="button"
          className="btn secondary"
          style={{ marginTop: 10 }}
          onClick={async () => {
            setError('');
            try {
              const r = await accountService().sendEmailLink();
              setSent(r.sentTo);
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Couldn’t send the link.');
            }
          }}
        >
          Email me a link
        </button>
      )}
      {error && <p role="alert" className="small">{error}</p>}
    </div>
  );
}

/**
 * Wraps paid content. Free: onboarding, the first reflection, Today, the chart, the first reading
 * section, safety, privacy, export, and delete. Never shows a sales pitch in a session that
 * raised a safety flag (PRD §10).
 */
export function Paywall({ children, what, where }: { children: ReactNode; what: string; where: 'reflection' | 'reading' | 'relationship' | 'check_ins' | 'account' }) {
  const { entitlement, account, loading } = useAccount();
  const { state } = useStore();
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<Plan>('yearly');
  const pitch = !entitlement.active && !loading && !state.safety.flagged;
  useEffect(() => {
    if (pitch) track('paywall_shown', { where });
  }, [pitch, where]);
  if (entitlement.active) return <>{children}</>;
  if (loading) return null;
  if (state.safety.flagged) {
    return (
      <div className="card soft">
        <p style={{ margin: 0 }}>{what} is part of a subscription. There’s no rush; it’ll be here whenever you want it.</p>
      </div>
    );
  }
  return (
    <section className="card paywall" aria-labelledby="pw-h">
      <h2 id="pw-h" style={{ marginTop: 0 }}>
        Keep going with Within
      </h2>
      <p>
        {what} is included in a subscription, along with weekly chapters, your full history, check-ins, and a relationship space.
      </p>
      <fieldset className="plans">
        <legend className="sr-only">Choose a plan</legend>
        {(['yearly', 'monthly'] as const).map((p) => (
          <label key={p} className={`plan ${plan === p ? 'on' : ''}`}>
            <input type="radio" name="plan" checked={plan === p} onChange={() => setPlan(p)} />
            <span>
              <strong>{CONFIG.plans[p].label}</strong>
              {p === 'yearly' && <span className="hint">{CONFIG.plans.yearly.note}</span>}
              {p === 'monthly' && <span className="hint">renews monthly</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="small muted">Cancel any time in two taps. You keep access until the end of the period you paid for.</p>
      {!account ? (
        <>
          <p className="small muted">Sign in first, so your subscription follows you to your other devices.</p>
          <SignInButtons />
        </>
      ) : !account.deviceVerified ? (
        <VerifyDevice />
      ) : (
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            onClick={async () => {
              setError('');
              track('checkout_started', { plan });
              try {
                await accountService().startCheckout(plan);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Checkout couldn’t start.');
              }
            }}
          >
            Subscribe: {CONFIG.plans[plan].short}
          </button>
          {error && <p role="alert" className="small">{error}</p>}
        </div>
      )}
      <p className="small muted" style={{ marginTop: 12 }}>
        Safety resources, privacy controls, export, and delete are always free. <Link to="/account">Account</Link>
      </p>
    </section>
  );
}

export function ModeBanner() {
  const { mode } = useAccount();
  if (mode === 'live') return null;
  return (
    <p className="demo-note" role="note">
      Demo mode: sign-in and payment are simulated on this device. No real account or charge.
    </p>
  );
}
