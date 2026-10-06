import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { accountService, NO_ENTITLEMENT, type Account, type Entitlement } from './account';

interface Ctx {
  mode: 'live' | 'demo';
  account: Account | null;
  entitlement: Entitlement;
  loading: boolean;
  refresh: () => Promise<void>;
}
const AccountCtx = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const svc = accountService();
  const [account, setAccount] = useState<Account | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>(NO_ENTITLEMENT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const a = await svc.current();
      setAccount(a);
      setEntitlement(a ? await svc.entitlement() : NO_ENTITLEMENT);
    } catch {
      setEntitlement(NO_ENTITLEMENT);
    } finally {
      setLoading(false);
    }
  }, [svc]);

  useEffect(() => {
    refresh();
    const off = svc.onChange(() => refresh());
    // Back from Stripe: the webhook may take a few seconds to record the subscription.
    if (typeof location !== 'undefined' && /[?&]checkout=success/.test(location.search)) {
      let n = 0;
      const t = setInterval(async () => {
        n++;
        const e = await svc.entitlement().catch(() => NO_ENTITLEMENT);
        setEntitlement(e);
        if (e.active || n > 10) {
          clearInterval(t);
          history.replaceState(null, '', location.pathname + location.hash);
        }
      }, 2000);
      return () => (off(), clearInterval(t));
    }
    return off;
  }, [svc, refresh]);

  const value = useMemo(() => ({ mode: svc.mode, account, entitlement, loading, refresh }), [svc.mode, account, entitlement, loading, refresh]);
  return <AccountCtx.Provider value={value}>{children}</AccountCtx.Provider>;
}

export function useAccount() {
  const v = useContext(AccountCtx);
  if (!v) throw new Error('useAccount outside AccountProvider');
  return v;
}
