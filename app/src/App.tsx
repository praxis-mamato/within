import { useEffect, useRef } from 'react';
import { HashRouter, Link, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './state';
import { TabBar } from './components/ui';
import Onboarding from './screens/Onboarding';
import Today from './screens/Today';
import Reflection from './screens/Reflection';
import { MilestoneDetail, MilestoneForm, RelationshipHome, RelationshipsList, YouChart, YouReading, YouSpace } from './screens/Relationships';
import Growth, { FollowUp } from './screens/Growth';
import Settings from './screens/Settings';
import AccountScreen from './screens/Account';
import { AccountProvider } from './services/AccountContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { track } from './services/telemetry';

function Shell() {
  const { state } = useStore();
  const loc = useLocation();
  const main = useRef<HTMLElement>(null);

  // On navigation, scroll to top and move focus to the page so screen readers announce it.
  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus();
  }, [loc.pathname]);

  // Counted once per launch, only with the person's consent (lets the pilot measure returns).
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || !state.sharing.usage) return;
    opened.current = true;
    track('app_opened');
  }, [state.sharing.usage]);

  return (
    <div className="app">
      <a className="skip" href="#main" onClick={(e) => (e.preventDefault(), main.current?.focus())}>
        Skip to content
      </a>
      <div className="proto-banner">Prototype · draft interpretations · your entries stay on this device</div>
      <header className="topbar">
        <Link className="wordmark" to={state.onboarded ? '/today' : '/'}>
          WITHIN
        </Link>
        {state.onboarded && (
          <Link className="icon-btn" to="/settings" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
          </Link>
        )}
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        <ErrorBoundary resetKey={loc.pathname}>
        <Routes>
          {!state.onboarded ? (
            <>
              <Route path="/" element={<Onboarding />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/today" element={<Today />} />
              <Route path="/reflection/:pillar" element={<Reflection />} />
              <Route path="/relationships" element={<RelationshipsList />} />
              <Route path="/you/chart" element={<YouChart />} />
              <Route path="/you/reading" element={<YouReading />} />
              <Route path="/you/:pillar" element={<YouSpace />} />
              <Route path="/relationship/:pillar" element={<RelationshipHome />} />
              <Route path="/milestone/new" element={<MilestoneForm />} />
              <Route path="/milestone/:id/edit" element={<MilestoneForm />} />
              <Route path="/milestone/:id" element={<MilestoneDetail />} />
              <Route path="/growth" element={<Growth />} />
              <Route path="/follow-up/:id" element={<FollowUp />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/account" element={<AccountScreen />} />
              <Route path="*" element={<Navigate to="/today" replace />} />
            </>
          )}
        </Routes>
        </ErrorBoundary>
      </main>
      {state.onboarded && <TabBar />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AccountProvider>
      {/* Hash routing so the static build works on any host without rewrites; memory routing
          for the single-file artifact build, whose host frame doesn't pass hash state through. */}
      {import.meta.env.MODE === 'artifact' ? (
        <MemoryRouter>
          <Shell />
        </MemoryRouter>
      ) : (
        <HashRouter>
          <Shell />
        </HashRouter>
      )}
      </AccountProvider>
    </StoreProvider>
  );
}
