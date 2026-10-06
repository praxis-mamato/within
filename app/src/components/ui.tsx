import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { SAFETY_RESOURCES, METHOD, type Perspective, type Tradition } from '../data/fixtures';
import type { Facts } from '../astro/facts';
import type { Composed } from '../content/compose';
import { isUrgent } from '../lib/screener';
import { useStore, personalize } from '../state';

export function ChipGroup({
  label,
  options,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multi?: boolean;
}) {
  const toggle = (o: string) => {
    if (multi) onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
    else onChange(value[0] === o ? [] : [o]);
  };
  return (
    <div role={multi ? 'group' : 'radiogroup'} aria-label={label} className="chips">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className="chip"
          role={multi ? undefined : 'radio'}
          aria-pressed={multi ? value.includes(o) : undefined}
          aria-checked={multi ? undefined : value[0] === o}
          onClick={() => toggle(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Back({ to, label = 'Back' }: { to?: string; label?: string }) {
  const nav = useNavigate();
  return to ? (
    <Link className="back" to={to}>
      ‹ {label}
    </Link>
  ) : (
    <button className="back" type="button" onClick={() => nav(-1)}>
      ‹ {label}
    </button>
  );
}

export function TabBar() {
  const icon = (d: ReactNode) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
  return (
    <nav className="tabbar" aria-label="Main">
      <NavLink to="/today">
        {icon(<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Zm0 0 7-7" />)}
        Today
      </NavLink>
      <NavLink to="/relationships">
        {icon(
          <>
            <circle cx="8" cy="8" r="3" />
            <circle cx="16" cy="8" r="3" />
            <path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M10 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
          </>,
        )}
        Relationships
      </NavLink>
      <NavLink to="/growth">
        {icon(<path d="M12 21V11m0 0c0-4 3-7 8-7 0 4-3 7-8 7Zm0 3c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5Z" />)}
        My Growth
      </NavLink>
    </nav>
  );
}

/** Region resources and the "not an emergency service" line (build spec §8.1). */
export function SafetyPanel({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  const urgent = isUrgent(state.safety.category);
  return (
    <section className="banner safety" aria-labelledby="safety-h" role={urgent ? 'alert' : undefined}>
      <h2 id="safety-h">{urgent ? 'Your safety comes first' : 'Support is available'}</h2>
      {!compact && (
        <p>
          {urgent
            ? 'If you are in danger right now, please contact your local emergency number.'
            : 'Something you wrote suggests things may be hard or frightening. Suggestions to talk with the other person are switched off.'}
        </p>
      )}
      <ul className="small">
        {SAFETY_RESOURCES.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="small muted">{SAFETY_RESOURCES.note}</p>
      <p className="small">Within is not an emergency service and is not monitored around the clock.</p>
    </section>
  );
}

const LENS_NAME: Record<Tradition | 'together', string> = { western: 'Western perspective', vedic: 'Vedic perspective', together: 'Together' };

export function PerspectiveCard({ p, reflectionId, nickname, facts, composed }: { p: Perspective; reflectionId: string; nickname?: string; facts: Facts | null; composed?: Composed }) {
  const title = composed?.title ?? personalize(p.title, nickname);
  const body = composed?.body ?? personalize(p.body, nickname);
  const [open, setOpen] = useState(false);
  const detailsId = `${reflectionId}-${p.tradition}-details`;
  return (
    <article className={`card lens ${p.tradition}`} aria-labelledby={`${detailsId}-h`}>
      <div className="lens-label">
        <span className="dot" aria-hidden="true" />
        {LENS_NAME[p.tradition]}
        <span className="sample-tag" title="The interpretation text is a draft. The placements are calculated from your details.">Draft text</span>
      </div>
      <h3 id={`${detailsId}-h`}>{title}</h3>
      <p>{body}</p>
      {facts?.unavailable.map((u) => (
        <p className="unavailable" key={u}>
          {u}
        </p>
      ))}
      {!facts && <p className="unavailable">These birth details can’t be calculated, so no placements are shown.</p>}
      {p.limitation && <p className="small muted">{p.limitation}</p>}
      <div className="spread">
        <button type="button" className="link" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)}>
          {open ? 'Hide the placements' : 'Show the placements'}
        </button>
        <FeedbackButton reflectionId={reflectionId} tradition={p.tradition} />
      </div>
      <div id={detailsId} hidden={!open}>
        <ul className="details">
          {facts?.facts.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="small muted">
          {METHOD[p.tradition].summary} Method version: <code>{METHOD[p.tradition].version}</code>.
        </p>
        {composed && (
          <p className="small muted">
            Draft templates, awaiting approval: <code>{composed.templateIds.join(', ')}</code>
          </p>
        )}
      </div>
    </article>
  );
}

export function TogetherCard({ text, reflectionId, nickname }: { text: string; reflectionId: string; nickname?: string }) {
  // text may already be personalized by the composer; personalize() is a no-op then.
  return (
    <article className="card lens together" aria-labelledby={`${reflectionId}-together`}>
      <div className="lens-label">
        <span className="dot" aria-hidden="true" />
        <span id={`${reflectionId}-together`}>Together</span>
        <span className="sample-tag">Draft text</span>
      </div>
      <p>{personalize(text, nickname)}</p>
      <p className="small muted">Agreement between traditions isn’t proof, and disagreement isn’t averaged away.</p>
      <div className="spread">
        <span />
        <FeedbackButton reflectionId={reflectionId} tradition="together" />
      </div>
    </article>
  );
}

function FeedbackButton({ reflectionId, tradition }: { reflectionId: string; tradition: Tradition | 'together' }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string[]>(['This doesn’t fit']);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const kinds = { 'This doesn’t fit': 'does_not_fit', 'It’s unclear': 'unclear', 'It upset me': 'harmful' } as const;
  if (sent) return <span className="small muted" role="status">Thanks, noted.</span>;
  return (
    <>
      <button type="button" className="link" onClick={() => setOpen(true)}>
        This doesn’t fit
      </button>
      {open && (
        <div className="card soft" style={{ flexBasis: '100%' }}>
          <fieldset>
            <legend>What’s wrong with the {LENS_NAME[tradition].toLowerCase()}?</legend>
            <ChipGroup label="Kind of feedback" options={Object.keys(kinds)} value={kind} onChange={(v) => setKind(v.length ? v : kind)} />
          </fieldset>
          <label htmlFor={`fb-${reflectionId}-${tradition}`}>
            Anything to add? <span className="hint">Optional</span>
          </label>
          <textarea id={`fb-${reflectionId}-${tradition}`} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              onClick={() => {
                dispatch({ type: 'feedback/add', feedback: { reflectionId, tradition, kind: kinds[kind[0] as keyof typeof kinds], note } });
                setSent(true);
              }}
            >
              Send feedback
            </button>
            <button type="button" className="btn quiet" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function PurposeCard() {
  const { state } = useStore();
  const i = state.intentions.find((x) => x.status === 'active');
  if (!i) return null;
  return (
    <div className="purpose-card">
      <span className="small muted">My purpose</span>
      <strong>{i.behavior}</strong>
    </div>
  );
}

/** Two-step destructive button. In-page, because browser confirm dialogs are blocked in some hosts. */
export function ConfirmButton({ label, question, confirmLabel, onConfirm }: { label: string; question: string; confirmLabel: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="btn danger" onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <div className="card soft" role="group" aria-label={question}>
      <p>{question}</p>
      <div className="btn-row">
        <button type="button" className="btn danger" onClick={onConfirm} autoFocus>
          {confirmLabel}
        </button>
        <button type="button" className="btn quiet" onClick={() => setAsking(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
