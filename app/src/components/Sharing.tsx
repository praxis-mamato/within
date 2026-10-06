import { useState } from 'react';
import { useStore } from '../state';
import { recent } from '../services/telemetry';

/** The two opt-in switches. Both start off; the app works the same either way. */
export function SharingToggles() {
  const { state, dispatch } = useStore();
  const set = (k: 'usage' | 'crashes', on: boolean) => dispatch({ type: 'sharing/set', sharing: { ...state.sharing, [k]: on } });
  return (
    <div>
      <label className="toggle">
        Share usage counts
        <input type="checkbox" checked={state.sharing.usage} onChange={(e) => set('usage', e.target.checked)} />
      </label>
      <p className="small muted">
        Counts like “finished setup” or “chose a pause”, with a random number for this install so returns can be counted. Never your
        words, names, birth details, or readings, and never linked to your account.
      </p>
      <label className="toggle">
        Send crash reports
        <input type="checkbox" checked={state.sharing.crashes} onChange={(e) => set('crashes', e.target.checked)} />
      </label>
      <p className="small muted">Only the type of error and where in the app’s code it happened. Never the error text, which can include what you typed.</p>
    </div>
  );
}

/** Shows exactly what was sent (or, in demo mode, would have been) this session. */
export function SharingLog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="link small" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Hide what’s been shared' : 'See what’s been shared this session'}
      </button>
      {open &&
        (recent.length ? (
          <pre className="small" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {recent.map((r) => `${r.at} ${r.kind}: ${JSON.stringify(r.body)}`).join('\n')}
          </pre>
        ) : (
          <p className="small muted">Nothing yet.</p>
        ))}
    </>
  );
}
