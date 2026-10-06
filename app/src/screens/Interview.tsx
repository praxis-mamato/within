import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChipGroup } from '../components/ui';
import { useStore } from '../state';
import { CHECK_QUESTIONS, load, save, start, summary, update, type LensCondition, type Rating } from '../interview/session';

const LENS_LABEL: Record<LensCondition, string> = { both: 'Both lenses', western: 'Western only', vedic: 'Vedic only' };
const RATING_LABEL: Record<Rating, string> = { accurate: 'Accurate', partly: 'Partly', not_yet: 'Not yet' };
const byLabel = <T extends string>(m: Record<T, string>, label: string) => (Object.keys(m) as T[]).find((k) => m[k] === label);

/** Facilitator screen: set up a session, then read and copy its anonymized summary. */
export default function Interview() {
  const { dispatch } = useStore();
  const nav = useNavigate();
  const [session, setSession] = useState(load);
  const [lens, setLens] = useState<LensCondition>('both');
  const [copied, setCopied] = useState('');

  if (!session) {
    return (
      <>
        <h1>Interview mode</h1>
        <p className="sub">For Stage 1 sessions. Timings and ratings stay in this tab and are never sent anywhere.</p>
        <ChipGroup label="Lens condition" options={Object.values(LENS_LABEL)} value={[LENS_LABEL[lens]]} onChange={(v) => v[0] && setLens(byLabel(LENS_LABEL, v[0]) ?? 'both')} />
        <p className="small muted">Vary the condition across participants (PRD §11). Order within “Both” is already randomized.</p>
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              dispatch({ type: 'reset' });
              setSession(start(lens));
              nav('/');
            }}
          >
            Start a fresh session
          </button>
        </div>
        <p className="small muted">This erases anything entered on this device before the participant starts.</p>
      </>
    );
  }

  const text = summary(session);
  return (
    <>
      <h1>Session {session.code}</h1>
      <p className="sub">Paste this into the study notes. It has no birth details and nothing the participant wrote.</p>
      <pre className="card small" style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
      <div className="btn-row">
        <button
          type="button"
          className="btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied('Copied.');
            } catch {
              setCopied('Copying is blocked here; select the text above instead.');
            }
          }}
        >
          Copy summary
        </button>
        <Link className="btn quiet" to="/interview/check">
          Comprehension check
        </Link>
        <button
          type="button"
          className="btn quiet"
          onClick={() => {
            save(null);
            dispatch({ type: 'reset' });
            setSession(null);
          }}
        >
          End and erase this session
        </button>
      </div>
      {copied && (
        <p role="status" className="small">
          {copied}
        </p>
      )}
    </>
  );
}

/** Shown after onboarding in interview mode. The facilitator rates each spoken answer. */
export function ComprehensionCheck() {
  const nav = useNavigate();
  const [ratings, setRatings] = useState(() => load()?.ratings ?? {});
  useEffect(() => update((s) => ({ ...s, ratings })), [ratings]);
  if (!load()) return <p>Interview mode is off. <Link to="/interview">Set up a session</Link>.</p>;
  return (
    <>
      <h1>Three quick questions</h1>
      <p className="sub">Ask each one out loud. Rate the answer; don’t write it down here.</p>
      {CHECK_QUESTIONS.map((q) => (
        <fieldset key={q.id} className="card">
          <legend>{q.text}</legend>
          <ChipGroup
            label={`Rating: ${q.text}`}
            options={Object.values(RATING_LABEL)}
            value={ratings[q.id] ? [RATING_LABEL[ratings[q.id]!]] : []}
            onChange={(v) => setRatings({ ...ratings, [q.id]: v[0] ? byLabel(RATING_LABEL, v[0]) : undefined })}
          />
        </fieldset>
      ))}
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => nav('/interview')}>
          See the summary
        </button>
        <Link className="btn quiet" to="/today">
          Let them keep exploring
        </Link>
      </div>
    </>
  );
}

/** A small facilitator bar with the elapsed time, shown on every screen during a session. */
export function InterviewBar() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = load();
  if (!s) return null;
  const sec = Math.floor((now - s.startedAt) / 1000);
  return (
    <div className="proto-banner" role="note">
      Interview {s.code} · {LENS_LABEL[s.lens]} · {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')} ·{' '}
      <Link to="/interview" style={{ color: 'inherit' }}>
        Facilitator
      </Link>
    </div>
  );
}
