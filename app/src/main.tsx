import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installCrashHandlers } from './services/telemetry';
import { applyApprovedEdits } from './content/registry';
import { keepFresh } from './lib/freshness';
import { captureReferral } from './lib/referral';
import { moveIn } from './lib/moveIn';
import { moveReviewIn, reviewMoveTarget } from './lib/moveReview';
import { startNative } from './services/native';
import { supabase } from './services/supabase';

installCrashHandlers();
keepFresh();
// Affiliate links (?ref=code): credit the partner if this visitor subscribes within 60 days.
captureReferral();
// Back from paying for astrologer sessions: show the booking page.
if (/[?&]booking=success/.test(location.search) && !location.hash.startsWith('#/astrologer')) location.hash = '#/astrologer';
// Readings use the approver's edited wording from content/approvals.json.
applyApprovedEdits();

// In the iPhone app: finish sign-in when Safari hands back, and match the status bar to the sky.
void startNative(async (code) => supabase()?.auth.exchangeCodeForSession(code));
// The app's old GitHub Pages address hands its saved data to withinoracle.app, like the old workers.dev link.
// The review console's old link goes straight to the console there, with its saved decisions.
const onOldPages = location.hostname.endsWith('github.io') && !location.search;
const reviewTarget = onOldPages ? reviewMoveTarget(location.hash) : null;
if (reviewTarget) location.replace(reviewTarget);
else if (onOldPages) location.replace('./bridge.html');
// Arriving from an old address with saved data: store it before the app loads its state.
else {
  moveReviewIn();
  void moveIn().finally(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
}
