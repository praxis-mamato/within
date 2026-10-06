import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { METHOD } from '../data/fixtures';
import { Back, ConfirmButton, SafetyPanel } from '../components/ui';
import { BirthFields } from '../components/BirthFields';
import { useStore, type Birth } from '../state';

export default function Settings() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [birth, setBirth] = useState<Birth>(state.birth);
  const [saved, setSaved] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const exportJson = JSON.stringify({ exportedAt: new Date().toISOString(), note: 'Prototype sample data', data: state }, null, 2);
  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied('Copied.');
    } catch {
      (document.getElementById('export-json') as HTMLTextAreaElement | null)?.select();
      setCopied('Copying is blocked here. The text is selected; copy it with your keyboard.');
    }
  };

  return (
    <>
      <Back />
      <h1>Settings</h1>

      <section aria-labelledby="m-h">
        <h2 id="m-h">How the readings work</h2>
        {(['western', 'vedic'] as const).map((t) => (
          <div className="card" key={t}>
            <h3>{METHOD[t].name}</h3>
            <p className="small">{METHOD[t].summary}</p>
            <p className="small muted">
              Version <code>{METHOD[t].version}</code>
            </p>
          </div>
        ))}
        <p className="small muted">Every reading keeps a record of the method, version, and reviewer used to make it.</p>
      </section>

      <section aria-labelledby="b-h">
        <h2 id="b-h">Birth details</h2>
        <BirthFields value={birth} onChange={setBirth} idPrefix="set" />
        <p className="small muted">Changing these marks existing reflections out of date until you refresh them. Your notes stay as they are.</p>
        <button
          type="button"
          className="btn quiet"
          onClick={() => {
            dispatch({ type: 'birth/update', birth });
            setSaved(true);
          }}
        >
          Save birth details
        </button>
        {saved && (
          <p role="status" className="small">
            Saved. Affected reflections are marked out of date.
          </p>
        )}
      </section>

      <section aria-labelledby="n-h">
        <h2 id="n-h">Notifications</h2>
        <label className="toggle">
          Check-in reminders
          <input type="checkbox" checked={state.notifications} onChange={(e) => dispatch({ type: 'notifications/set', on: e.target.checked })} />
        </label>
        <p className="small muted">Reminders say only “You have a reflection waiting.” No names or relationship details.</p>
      </section>

      <section aria-labelledby="p-h">
        <h2 id="p-h">Privacy</h2>
        <ul className="small">
          <li>No public profile, no address-book access, no advertising.</li>
          <li>Your journal and milestones are never used to train models.</li>
          <li>Adding someone’s details doesn’t mean they agreed. Keep it to a nickname.</li>
        </ul>
        <div className="btn-row">
          <button type="button" className="btn quiet" aria-expanded={exportOpen} onClick={() => setExportOpen(!exportOpen)}>
            {exportOpen ? 'Hide my data' : 'Export my data'}
          </button>
          {exportOpen && (
            <div>
              <label htmlFor="export-json">
                Everything you’ve entered, with every reflection <span className="hint">JSON. The real app also offers a readable copy.</span>
              </label>
              <textarea id="export-json" readOnly value={exportJson} style={{ minHeight: 180, fontFamily: 'monospace', fontSize: '0.8125rem' }} />
              <button type="button" className="btn quiet" onClick={copyExport}>
                Copy
              </button>
              {copied && (
                <p role="status" className="small">
                  {copied}
                </p>
              )}
            </div>
          )}
          <ConfirmButton
            label="Delete my account and data"
            question="Delete everything? In this prototype, this resets the demo."
            confirmLabel="Delete everything"
            onConfirm={() => {
              dispatch({ type: 'reset' });
              nav('/');
            }}
          />
        </div>
      </section>

      <section aria-labelledby="sr-h">
        <h2 id="sr-h">Safety and support</h2>
        <p className="small">Always free. Never a premium feature.</p>
        <SafetyPanel compact />
      </section>

      <hr />
      <p className="small muted">Prototype 0.2 · charts calculated in your browser · nothing is saved or sent.</p>
      <p className="small muted">
        Place data © GeoNames (CC BY 4.0). Planet positions: Astronomy Engine (MIT).
      </p>
    </>
  );
}
