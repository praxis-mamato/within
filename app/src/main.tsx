import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installCrashHandlers } from './services/telemetry';
import { applyApprovedEdits } from './content/registry';

installCrashHandlers();
// Readings use the approver's edited wording from content/approvals.json.
applyApprovedEdits();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
