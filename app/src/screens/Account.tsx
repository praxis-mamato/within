import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Back, ConfirmButton } from '../components/ui';
import { ModeBanner, Paywall, SignInButtons, VerifyDevice } from '../components/Paywall';
import { accountService } from '../services/account';
import { useAccount } from '../services/AccountContext';
import { useStore } from '../state';
import { CONFIG } from '../services/config';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');

export default function AccountScreen() {
  const { account, entitlement, refresh } = useAccount();
  const { dispatch } = useStore();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const run = (fn: () => Promise<void>) => async () => {
    setError('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  };

  return (
    <>
      <Back />
      <h1>Account</h1>
      <ModeBanner />

      <section aria-labelledby="acc-h">
        <h2 id="acc-h">Sign-in</h2>
        {account ? (
          <div className="card">
            <p style={{ margin: 0 }}>
              Signed in with <strong>{account.provider === 'apple' ? 'Apple' : account.provider === 'google' ? 'Google' : 'email'}</strong> as {account.email}
            </p>
            <p className="small" style={{ margin: '4px 0 0' }}>
              This device: {account.deviceVerified ? <strong>confirmed</strong> : 'not confirmed yet'}
            </p>
          </div>
        ) : (
          <>
            <p className="muted">You can use Within without an account. Sign in to subscribe and to use more than one device.</p>
            <SignInButtons />
          </>
        )}
        {account && !account.deviceVerified && <VerifyDevice />}
      </section>

      <section aria-labelledby="sub-h">
        <h2 id="sub-h">Subscription</h2>
        {entitlement.active ? (
          <div className="card">
            <p style={{ margin: 0 }}>
              <strong>Active{entitlement.plan ? ` · ${entitlement.plan === 'yearly' ? CONFIG.plans.yearly.short : CONFIG.plans.monthly.short}` : ''}</strong>
              {entitlement.renewsAt && (entitlement.cancelAtPeriodEnd ? ` · ends ${fmt(entitlement.renewsAt)}, won’t renew` : ` · renews ${fmt(entitlement.renewsAt)}`)}
            </p>
            {account?.deviceVerified ? (
              <button type="button" className="btn quiet" style={{ marginTop: 10 }} onClick={run(() => accountService().manageSubscription())}>
                {entitlement.source === 'demo' ? (entitlement.cancelAtPeriodEnd ? 'Resume subscription' : 'Cancel subscription') : 'Manage or cancel subscription'}
              </button>
            ) : (
              <p className="small muted">Confirm this device to change your subscription.</p>
            )}
          </div>
        ) : (
          <Paywall what="Everything beyond your first reflection">{null}</Paywall>
        )}
      </section>

      {account && (
        <section aria-labelledby="del-h">
          <h2 id="del-h">Sign out or delete</h2>
          <div className="btn-row">
            <button type="button" className="btn quiet" onClick={run(() => accountService().signOut())}>
              Sign out
            </button>
            {account.deviceVerified ? (
              <ConfirmButton
                label="Delete my account"
                question="Delete your account, cancel any subscription, and erase everything on this device? This can’t be undone."
                confirmLabel="Delete account and data"
                onConfirm={run(async () => {
                  await accountService().deleteAccount();
                  dispatch({ type: 'reset' });
                  nav('/');
                })}
              />
            ) : (
              <p className="small muted">Confirm this device by email to delete your account.</p>
            )}
          </div>
        </section>
      )}
      {error && (
        <p role="alert" className="banner">
          {error}
        </p>
      )}
      <p className="small muted">We store only your sign-in and subscription status. Your entries stay on your device.</p>
    </>
  );
}
