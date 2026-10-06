import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { applyApprovedEdits } from './content/registry';

// Readings use the approver's edited wording from content/approvals.json.
applyApprovedEdits();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
