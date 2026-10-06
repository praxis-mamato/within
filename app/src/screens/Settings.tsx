import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { METHOD } from '../data/fixtures';
import { Back, SafetyPanel } from '../components/ui';
import { useStore, type Birth } from '../state';

export default function Settings() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [birth, setBirth] = useState<Birth>(state.birth);
  const [saved, setSaved] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), note: 'Prototype sample data', data: state }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'within-export.json';
    a.click();
    URL.revokeObjectURL(url);
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
        <label htmlFor="s-date">Birth date</label>
        <input id="s-date" type="date" value={birth.date} onChange={(e) => setBirth({ ...birth, date: e.target.value })} />
        <label htmlFor="s-tp">Birth time</label>
        <select id="s-tp" value={birth.timePrecision} onChange={(e) => setBirth({ ...birth, timePrecision: e.target.value as Birth['timePrecision'] })}>
          <option value="exact">I know it</option>
          <option value="approximate">I know roughly</option>
          <option value="unknown">I don’t know</option>
        </select>
        {birth.timePrecision !== 'unknown' && (
          <>
            <label htmlFor="s-time">Time</label>
            <input id="s-time" type="time" value={birth.time} onChange={(e) => setBirth({ ...birth, time: e.target.value })} />
          </>
        )}
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
          <button type="button" className="btn quiet" onClick={exportData}>
            Export my data
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (window.confirm('Delete everything? In this prototype, this resets the demo.')) {
                dispatch({ type: 'reset' });
                nav('/');
              }
            }}
          >
            Delete my account and data
          </button>
        </div>
      </section>

      <section aria-labelledby="sr-h">
        <h2 id="sr-h">Safety and support</h2>
        <p className="small">Always free. Never a premium feature.</p>
        <SafetyPanel compact />
      </section>

      <hr />
      <p className="small muted">Prototype 0.1 · sample data only · nothing leaves this browser tab.</p>
    </>
  );
}
