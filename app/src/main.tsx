import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installCrashHandlers } from './services/telemetry';
import { applyApprovedEdits } from './content/registry';
import { keepFresh } from './lib/freshness';

installCrashHandlers();
keepFresh();
// Back from paying for astrologer sessions: show the booking page.
if (/[?&]booking=success/.test(location.search) && !location.hash.startsWith('#/astrologer')) location.hash = '#/astrologer';
// Readings use the approver's edited wording from content/approvals.json.
applyApprovedEdits();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
