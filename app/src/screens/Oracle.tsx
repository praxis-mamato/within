import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCharts } from '../astro/useCharts';
import { askOracle, ORACLE_TEXT, type OracleAnswer } from '../content/oracle';
import { OracleBoard, useShake } from '../components/OracleBoard';
import { Paywall } from '../components/Paywall';
import { Back, SafetyPanel } from '../components/ui';
import { screen } from '../lib/screener';
import { useAccount } from '../services/AccountContext';
import { track } from '../services/telemetry';
import { useStore } from '../state';

const FREE_PER_DAY = 3;
const EXAMPLES = ['Should I reach out to them this week?', 'Is now a good time to ask for a raise?', 'Should I start the project I keep putting off?'];

/** The Oracle: one question, answered by the sky at this moment, read against your chart. */
export default function Oracle() {
  const { state, dispatch } = useStore();
  const { me } = useCharts();
  const { entitlement } = useAccount();
  const [q, setQ] = useState('');
  const [phase, setPhase] = useState<'idle' | 'seeking' | 'answered'>('idle');
  const [answer, setAnswer] = useState<OracleAnswer | null>(null);
  const [note, setNote] = useState('');
  const [flagged, setFlagged] = useState(false);
  const day = new Date().toISOString().slice(0, 10);
  const asked = state.oracle.filter((a) => a.day === day);
  const board = useRef<HTMLDivElement>(null);
  // Questions the Oracle declines to answer do not use up a free question.
  const left = entitlement.active ? Infinity : Math.max(0, FREE_PER_DAY - asked.filter((a) => !a.limit).length);

  const ask = () => {
    const question = q.trim();
    if (!me || !question || phase === 'seeking') return;
    setNote('');
    if (screen(question).flagged) {
      dispatch({ type: 'text/screen', text: question });
      setFlagged(true);
      return;
    }
    // The same question gets the same answer all day, and does not count again.
    const same = asked.find((a) => a.question.toLowerCase() === question.toLowerCase());
    if (!same && left <= 0) {
      setNote(ORACLE_TEXT.limit);
      return;
    }
    const a = same ?? askOracle(question, me, { lat: state.birth.lat, lon: state.birth.lon });
    if (same) setNote(ORACLE_TEXT.sameDay);
    else {
      dispatch({ type: 'oracle/ask', answer: a });
      track('oracle_asked', { tone: a.tone });
    }
    setAnswer(a);
    setPhase('seeking');
    board.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => setPhase('answered'), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 2600);
  };
  const enableShake = useShake(ask);

  if (!me) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;
  const past = [...state.oracle].reverse().filter((a) => a !== answer).slice(0, 8);

  return (
    <div className="oracle-scene">
      <Back to="/today" label="Today" />
      <p className="kicker">The Oracle</p>
      <h1>Ask the Oracle</h1>
      <p className="sub">{ORACLE_TEXT.intro}</p>

      <OracleBoard phase={phase} points={answer?.points} tone={answer?.tone} boardRef={board} />

      {answer && phase === 'answered' && (
        <section className="oracle-answer" aria-live="polite" aria-labelledby="oa-h">
          <p className="small oracle-muted">“{answer.question}”</p>
          <h2 id="oa-h">{answer.label}</h2>
          <p>{answer.line}</p>
          {answer.because && <p className="oracle-because">{answer.because}</p>}
          <h3>The reading behind it</h3>
          <Paywall where="reading" what="The reading behind each answer">
            <ul className="small">
              {answer.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="small oracle-muted">
              <Link to="/you/reading?tab=timing">See your whole week, planet by planet</Link>
            </p>
          </Paywall>
        </section>
      )}

      {flagged ? (
        <SafetyPanel />
      ) : (
        <form
          className="oracle-ask"
          onSubmit={(e) => {
            e.preventDefault();
            void enableShake();
            ask();
          }}
        >
          <label htmlFor="oracle-q">Your question</label>
          <textarea id="oracle-q" rows={2} maxLength={300} value={q} placeholder="Should I…?" onChange={(e) => (setQ(e.target.value), phase === 'answered' && setPhase('idle'))} />
          <div className="chips">
            {EXAMPLES.map((x) => (
              <button key={x} type="button" className="chip" onClick={() => setQ(x)}>
                {x}
              </button>
            ))}
          </div>
          <button type="submit" className="btn" disabled={!q.trim() || phase === 'seeking'}>
            {phase === 'seeking' ? 'The Oracle is reading the sky…' : 'Ask'}
          </button>
          <p className="small oracle-muted">
            Or shake your phone once your question is written. {Number.isFinite(left) ? `${left} of ${FREE_PER_DAY} free questions left today.` : 'Unlimited questions with your subscription.'}
          </p>
          {note && <p className="small oracle-note">{note}</p>}
        </form>
      )}

      {past.length > 0 && (
        <section aria-labelledby="op-h">
          <h2 id="op-h">Your past questions</h2>
          <ul className="oracle-past">
            {past.map((a) => (
              <li key={`${a.day}-${a.question}`}>
                <span className="small oracle-muted">{new Date(`${a.day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span> {a.question} <strong>{a.label}</strong>
              </li>
            ))}
          </ul>
          <p className="small oracle-muted">Kept only on this device.</p>
        </section>
      )}
      <p className="small oracle-muted">Astrology for reflection, not prediction. The Oracle offers a way to look at a question, not a ruling on it.</p>
    </div>
  );
}
