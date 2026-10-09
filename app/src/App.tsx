import { lazy, Suspense, useEffect, useRef } from 'react';
import { HashRouter, Link, MemoryRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './state';
import { TabBar } from './components/ui';
import { LogoMark } from './components/Illustrations';
import Onboarding from './screens/Onboarding';
import Today from './screens/Today';
import Oracle from './screens/Oracle';
import Astrologer from './screens/Astrologer';
import MoonCalendar from './screens/MoonCalendar';
import Reflection from './screens/Reflection';
import { MilestoneDetail, MilestoneForm, RelationshipHome, RelationshipsList, YouChart, YouCycles, YouPatterns, YouReading, YouSpace } from './screens/Relationships';
import Growth, { FollowUp } from './screens/Growth';
import Settings from './screens/Settings';
import AccountScreen from './screens/Account';
import { AccountProvider } from './services/AccountContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { track } from './services/telemetry';
import Interview, { ComprehensionCheck, InterviewBar } from './screens/Interview';
import { interviewRequested, load as loadInterview } from './interview/session';

// The template review console is for the approver only: not linked anywhere, loaded on demand.
const ReviewConsole = lazy(() => import('./screens/Review'));

function Routed() {
  return (
    <Routes>
      <Route
        path="/review/*"
        element={
          <Suspense fallback={<p className="review">Loading…</p>}>
            <ReviewConsole />
          </Suspense>
        }
      />
      <Route path="*" element={<Shell />} />
    </Routes>
  );
}

function Shell() {
  const { state } = useStore();
  const loc = useLocation();
  const main = useRef<HTMLElement>(null);

  // On navigation, scroll to top and move focus to the page so screen readers announce it.
  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus();
  }, [loc.pathname]);

  // ?interview in the address opens the facilitator setup (Stage 1 interviews).
  const nav = useNavigate();
  useEffect(() => {
    if (interviewRequested() && !loadInterview()) nav('/interview');
  }, [nav]);

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
      <div className="proto-banner">Your entries stay on this device</div>
      <InterviewBar />
      <header className="topbar">
        <Link className="wordmark" to={state.onboarded ? '/today' : '/'}>
          <LogoMark />
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
              <Route path="/interview" element={<Interview />} />
              <Route path="/interview/check" element={<ComprehensionCheck />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/today" element={<Today />} />
              <Route path="/reflection/:pillar" element={<Reflection />} />
              <Route path="/relationships" element={<RelationshipsList />} />
              <Route path="/you/chart" element={<YouChart />} />
              <Route path="/you/reading" element={<YouReading />} />
              <Route path="/you/patterns" element={<YouPatterns />} />
              <Route path="/you/cycles" element={<YouCycles />} />
              <Route path="/you/:pillar" element={<YouSpace />} />
              <Route path="/relationship/:pillar" element={<RelationshipHome />} />
              <Route path="/milestone/new" element={<MilestoneForm />} />
              <Route path="/milestone/:id/edit" element={<MilestoneForm />} />
              <Route path="/milestone/:id" element={<MilestoneDetail />} />
              <Route path="/growth" element={<Growth />} />
              <Route path="/oracle" element={<Oracle />} />
              <Route path="/astrologer" element={<Astrologer />} />
              <Route path="/moon-calendar" element={<MoonCalendar />} />
              <Route path="/follow-up/:id" element={<FollowUp />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/account" element={<AccountScreen />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/interview/check" element={<ComprehensionCheck />} />
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
          <Routed />
        </MemoryRouter>
      ) : (
        <HashRouter>
          <Routed />
        </HashRouter>
      )}
      </AccountProvider>
    </StoreProvider>
  );
}
