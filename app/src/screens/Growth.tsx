import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { OUTCOME_OPTIONS } from '../data/fixtures';
import { Back, ChipGroup, PromptChips, PurposeCard } from '../components/ui';
import { Paywall } from '../components/Paywall';
import { FOLLOW_UP_NOTES, JOURNAL_STARTERS, OBSERVED, PURPOSES } from '../data/prompts';
import { useStore, type Action, type Attempt, type Usefulness } from '../state';

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const ATTEMPT_LABEL: Record<Attempt, string> = { attempted: 'Tried it', not_attempted: 'Didn’t try', paused: 'Chose to pause' };

/** My Growth: goals, journal, actions, and the user's own observed changes. No scores or streaks. */
export default function Growth() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string[]>([]);
  const [behavior, setBehavior] = useState('');
  const [entry, setEntry] = useState('');
  const [observed, setObserved] = useState('');

  return (
    <>
      <p className="kicker">My Growth</p>
      <h1>Who am I becoming?</h1>
      <PurposeCard />

      <section aria-labelledby="goal-h">
        <div className="spread">
          <h2 id="goal-h">Purpose</h2>
          {!editing && (
            <button type="button" className="link" onClick={() => setEditing(true)}>
              Change
            </button>
          )}
        </div>
        {editing && (
          <div className="card">
            <fieldset>
              <legend>What matters to you now?</legend>
              <ChipGroup label="Value" options={OUTCOME_OPTIONS} value={value} onChange={setValue} />
            </fieldset>
            <label htmlFor="g-beh">The behavior you want to practise</label>
            <PromptChips label="Ideas" options={PURPOSES} value={behavior} onChange={setBehavior} mode="replace" />
            <input id="g-beh" type="text" value={behavior} onChange={(e) => setBehavior(e.target.value)} />
            <div className="btn-row">
              <button
                type="button"
                className="btn"
                disabled={!value.length || !behavior.trim()}
                onClick={() => {
                  dispatch({ type: 'intention/set', value: value[0], behavior: behavior.trim() });
                  setEditing(false);
                  setBehavior('');
                  setValue([]);
                }}
              >
                Save purpose
              </button>
              <button type="button" className="btn quiet" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {state.intentions.length > 1 && (
          <details>
            <summary className="link">Earlier purposes</summary>
            <ul className="list">
              {state.intentions
                .filter((i) => i.status === 'changed')
                .map((i) => (
                  <li key={i.id}>
                    {i.behavior} <span className="small muted">· set {fmt(i.createdAt)}</span>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </section>

      <section aria-labelledby="act-h">
        <h2 id="act-h">Steps and pauses</h2>
        {state.actions.length === 0 ? (
          <p className="muted">Nothing chosen yet. Choices you make in a reflection appear here.</p>
        ) : (
          <ul className="list">
            {state.actions.map((a) => (
              <ActionRow key={a.id} a={a} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="obs-h">
        <h2 id="obs-h">Changes I’ve noticed</h2>
        <p className="small muted">In your words. This is the record that matters most.</p>
        <label htmlFor="obs" className="sr-only">
          Something you noticed
        </label>
        <PromptChips label="Tap one, or write your own" options={OBSERVED} value={observed} onChange={setObserved} mode="replace" />
        <textarea id="obs" value={observed} onChange={(e) => setObserved(e.target.value)} />
        <button
          type="button"
          className="btn quiet"
          disabled={!observed.trim()}
          onClick={() => {
            dispatch({ type: 'observed/add', body: observed.trim() });
            setObserved('');
          }}
        >
          Add
        </button>
        <ul className="list">
          {state.observed.map((o) => (
            <li key={o.id}>
              {o.body} <span className="small muted">· {fmt(o.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="jr-h">
        <h2 id="jr-h">Journal</h2>
        <p className="small muted">Private. Never shared or used to train anything.</p>
        <label htmlFor="jr" className="sr-only">
          New journal entry
        </label>
        <PromptChips label="Start from a prompt" options={JOURNAL_STARTERS} value={entry} onChange={setEntry} />
        <textarea id="jr" value={entry} onChange={(e) => setEntry(e.target.value)} />
        <button
          type="button"
          className="btn quiet"
          disabled={!entry.trim()}
          onClick={() => {
            dispatch({ type: 'journal/add', body: entry.trim() });
            setEntry('');
          }}
        >
          Save entry
        </button>
        <ul className="list">
          {state.journal.map((j) => (
            <li key={j.id} style={{ whiteSpace: 'pre-line' }}>
              {j.body} <span className="small muted">· {fmt(j.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function ActionRow({ a }: { a: Action }) {
  return (
    <li>
      <div className="spread">
        <span>{a.text}</span>
        {a.outcome ? <span className="pill">{ATTEMPT_LABEL[a.outcome.attempt]}</span> : a.choice !== 'none' && <Link to={`/follow-up/${a.id}`}>Check in</Link>}
      </div>
      {a.outcome?.notes && <p className="small muted">{a.outcome.notes}</p>}
    </li>
  );
}

/** Follow-up: attempted / not / paused → helpful / neutral / unhelpful → notes → next (PRD §5E). */
export function FollowUp() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const a = state.actions.find((x) => x.id === id);
  const [attempt, setAttempt] = useState<string[]>([]);
  const [useful, setUseful] = useState<string[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [next, setNext] = useState<string[]>([]);

  if (!a) {
    return (
      <>
        <Back />
        <p>Nothing to check in on.</p>
      </>
    );
  }

  const ATT: Record<string, Attempt> = { 'I tried it': 'attempted', 'I didn’t': 'not_attempted', 'I chose to pause': 'paused' };
  const USE: Record<string, Usefulness> = { Helpful: 'helpful', Neutral: 'neutral', Unhelpful: 'unhelpful' };
  const NEXT = { 'Keep my purpose': 'keep', 'Adjust it': 'adjust', 'Set a new one': 'new', 'Nothing for now': 'nothing' } as const;

  return (
    <>
      <Back />
      <p className="kicker">Check in</p>
<h1>How did it go?</h1>
      <Paywall what="Check-ins">

      <p className="sub">“{a.text}”</p>
      <fieldset>
        <legend>Did you try it?</legend>
        <ChipGroup label="Did you try it?" options={Object.keys(ATT)} value={attempt} onChange={setAttempt} />
      </fieldset>
      {attempt.length > 0 && (
        <>
          <fieldset>
            <legend>How was it?</legend>
            <ChipGroup label="How was it?" options={Object.keys(USE)} value={useful} onChange={setUseful} />
          </fieldset>
          <fieldset>
            <legend>What did you learn?</legend>
            <ChipGroup
              label="Quick answer"
              options={['More clarity', 'Still exploring']}
              value={quick}
              onChange={(v) => {
                setQuick(v);
                if (v[0] && !notes) setNotes(`${v[0]}. `);
              }}
            />
          </fieldset>
          <label htmlFor="fu-notes">
            What happened? What would you change? <span className="hint">Optional</span>
          </label>
          <PromptChips label="Tap any that fit" options={FOLLOW_UP_NOTES} value={notes} onChange={setNotes} />
          <textarea id="fu-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <fieldset>
            <legend>What’s next?</legend>
            <ChipGroup label="What's next?" options={Object.keys(NEXT)} value={next} onChange={setNext} />
          </fieldset>
        </>
      )}
      <div className="btn-row">
        <button
          type="button"
          className="btn"
          disabled={!attempt.length || !next.length}
          onClick={() => {
            dispatch({
              type: 'action/followUp',
              id: a.id,
              outcome: {
                attempt: ATT[attempt[0]],
                usefulness: useful[0] ? USE[useful[0]] : undefined,
                notes: notes.trim(),
                next: NEXT[next[0] as keyof typeof NEXT],
              },
            });
            nav(next[0] === 'Adjust it' || next[0] === 'Set a new one' ? '/growth' : '/today');
          }}
        >
          Save my reflection
        </button>
      </div>
      </Paywall>
    </>
  );
}
