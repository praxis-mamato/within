import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCharts } from '../astro/useCharts';
import { consultOracle, ORACLE_SAYS, type OracleReply } from '../content/oracleEngine';
import { ORACLE_TEXT } from '../content/oracle';
import type { SkyLine } from '../content/today';
import { OracleBoard, useShake } from '../components/OracleBoard';
import { Paywall } from '../components/Paywall';
import { Back, SafetyPanel } from '../components/ui';
import { screen } from '../lib/screener';
import { useAccount } from '../services/AccountContext';
import { factSheet, requestDeepReading, type DeepResult } from '../services/aiReading';
import { track } from '../services/telemetry';
import { useStore } from '../state';

const FREE_PER_DAY = 3;
const EXAMPLES = [
  'What’s my rising sign?',
  'When is a good day to ask for a raise?',
  'Is Mercury retrograde?',
  'Should I reach out to them this week?',
  'What am I moving through this year?',
  'When is my Saturn return?',
  'Why do I feel restless?',
  'When is the next Full Moon?',
];

const Lines = ({ items }: { items: SkyLine[] }) => (
  <div className="lines">
    {items.map((l, i) => (
      <div key={`${l.heading}-${i}`}>
        {l.heading && <h3>{l.heading}</h3>}
        {l.text && <p>{l.text}</p>}
        {l.basis && <p className="basis">{l.basis}</p>}
      </div>
    ))}
  </div>
);

/** The Oracle: ask the stars anything. Answered from the sky at this moment and your chart. */
export default function Oracle() {
  const { state, dispatch } = useStore();
  const { me, other } = useCharts();
  const { entitlement } = useAccount();
  const [q, setQ] = useState('');
  const [phase, setPhase] = useState<'idle' | 'seeking' | 'answered'>('idle');
  const [answer, setAnswer] = useState<OracleReply | null>(null);
  const [note, setNote] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [consult, setConsult] = useState<{ q: string; result?: DeepResult; busy?: boolean; error?: string } | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const place = { lat: state.birth.lat, lon: state.birth.lon };
  const day = new Date().toISOString().slice(0, 10);
  const asked = state.oracle.filter((a) => a.day === day);
  // Questions the Oracle declines to answer do not use up a free question.
  const left = entitlement.active ? Infinity : Math.max(0, FREE_PER_DAY - asked.filter((a) => !a.limit).length);
  const welcome = useMemo(() => [...ORACLE_SAYS.welcome].map((ch, i) => <span key={i} style={{ animationDelay: `${i * 0.07}s` }}>{ch}</span>), []);

  const ask = (text = q) => {
    const question = text.trim();
    if (!me || !question || phase === 'seeking') return;
    setNote('');
    setConsult(null);
    if (screen(question).flagged) {
      dispatch({ type: 'text/screen', text: question });
      setFlagged(true);
      return;
    }
    // The same question gets the same answer all day, and does not count again.
    const same = asked.find((a) => a.question.toLowerCase() === question.toLowerCase() && a.lines);
    if (!same && left <= 0) {
      setNote(ORACLE_TEXT.limit);
      return;
    }
    const theirs = state.person?.birth;
    const a = same ?? consultOracle(question, { chart: me, place, profile: state.profile, other: other && theirs ? { chart: other, place: { lat: theirs.lat, lon: theirs.lon }, name: state.person!.nickname } : null });
    if (same) setNote(ORACLE_TEXT.sameDay);
    else {
      dispatch({ type: 'oracle/ask', answer: a });
      track('oracle_asked', { intent: a.intent });
    }
    setAnswer(a);
    setPhase('seeking');
    board.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => setPhase('answered'), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 2600);
  };
  const enableShake = useShake(() => ask());

  const runConsult = async (a: OracleReply) => {
    if (!me) return;
    setConsult({ q: a.question, busy: true });
    try {
      const facts = [...factSheet('western', me, place), ...factSheet('vedic', me, place), ...factSheet('timing', me, place)].slice(0, 220);
      const source = [...a.lines, ...a.deeper].map((l) => `${l.heading}${l.heading && l.text ? ': ' : ''}${l.text}`.slice(0, 600)).filter(Boolean);
      const result = await requestDeepReading('question', facts, source, a.question);
      setConsult({ q: a.question, result });
    } catch (e) {
      setConsult({ q: a.question, error: e instanceof Error ? e.message : 'The Oracle couldn’t consult your chart right now.' });
    }
  };

  if (!me) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;
  const past = [...state.oracle].reverse().filter((a) => a !== answer).slice(0, 8);

  return (
    <div className="oracle-scene">
      <Back to="/today" label="Today" />
      <p className="kicker">The Oracle</p>
      <h1 className="oracle-welcome" aria-label={ORACLE_SAYS.welcome}>
        {welcome}
      </h1>
      <p className="sub">{ORACLE_SAYS.invite}</p>

      <OracleBoard phase={phase} points={answer?.points} tone={answer?.tone} orb={answer?.orb} boardRef={board} />

      {answer && phase === 'answered' && (
        <section className="oracle-answer" aria-live="polite" aria-labelledby="oa-h">
          <p className="small oracle-muted">“{answer.question}”</p>
          <h2 id="oa-h">{answer.label}</h2>
          <Lines items={answer.lines} />
          {(answer.deeper.length > 0 || !answer.limit) && (
            <>
              <h3 style={{ marginTop: 16 }}>{answer.deeper.length ? 'The Oracle goes deeper' : 'Consult your whole chart'}</h3>
              <Paywall where="reading" what="The Oracle’s deeper answers">
                {answer.deeper.length > 0 && <Lines items={answer.deeper} />}
                {!answer.limit && (
                  <div className="oracle-consult">
                    <p className="small oracle-muted">{ORACLE_SAYS.consult}</p>
                    {!state.aiConsent ? (
                      <>
                        <p className="small oracle-muted">The meanings come from centuries of astrological tradition, reviewed by Within. Claude, an AI model, weaves them into one answer from your calculated placements only, never your name or birth details.</p>
                        <button type="button" className="btn secondary" onClick={() => dispatch({ type: 'ai/consent', on: true })}>
                          Turn on connected readings
                        </button>
                      </>
                    ) : consult?.q === answer.question && consult.result ? (
                      <>
                        {consult.result.sections.map((s) => (
                          <div key={s.title} style={{ marginTop: 10 }}>
                            <h3>{s.title}</h3>
                            <p>{s.body}</p>
                          </div>
                        ))}
                        <p>
                          <em>{consult.result.reflection_question}</em>
                        </p>
                        <p className="small oracle-muted">Written with AI help from your chart and Within’s reviewed interpretations · kept on this device only while this page is open</p>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn secondary" disabled={consult?.busy} onClick={() => void runConsult(answer)}>
                          {consult?.busy ? 'The Oracle is consulting your chart…' : 'Consult my whole chart'}
                        </button>
                        {consult?.error && <p className="small oracle-note">{consult.error}</p>}
                      </>
                    )}
                  </div>
                )}
              </Paywall>
            </>
          )}
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
          <label htmlFor="oracle-q">Ask the stars</label>
          <textarea id="oracle-q" rows={2} maxLength={300} value={q} placeholder="Ask anything about your chart, the sky, or your timing…" onChange={(e) => (setQ(e.target.value), phase === 'answered' && setPhase('idle'))} />
          <div className="chips">
            {EXAMPLES.map((x) => (
              <button key={x} type="button" className="chip" onClick={() => (setQ(x), ask(x))}>
                {x}
              </button>
            ))}
          </div>
          <button type="submit" className="btn" disabled={!q.trim() || phase === 'seeking'}>
            {phase === 'seeking' ? 'The Oracle is reading the sky…' : 'Ask the Oracle'}
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
            {past.map((a, i) => (
              <li key={`${a.day}-${a.question}-${i}`}>
                <button type="button" className="link" onClick={() => (setQ(a.question), ask(a.question))}>
                  <span className="small oracle-muted">{new Date(`${a.day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span> {a.question} <strong>{a.label}</strong>
                </button>
              </li>
            ))}
          </ul>
          <p className="small oracle-muted">Kept only on this device.</p>
        </section>
      )}
      <p className="small oracle-muted">
        Astrology for reflection, not prediction. The Oracle offers a way to look at a question, not a ruling on it. <Link to="/you/reading?tab=timing">Your week, planet by planet</Link>
      </p>
    </div>
  );
}
