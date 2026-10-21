import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCharts } from '../astro/useCharts';
import { computeNatal } from '../astro/natal';
import { boardInfo, consultOracle, intentOf, ORACLE_SAYS, skyToday, type BoardInfo, type OracleReply } from '../content/oracleEngine';
import { ORACLE_TEXT } from '../content/oracle';
import type { SkyLine } from '../content/today';
import { OracleBoard, useShake } from '../components/OracleBoard';
import { EnergyWheel } from '../components/EnergyWheel';
import { chartEnergy } from '../content/energy';
import { ascendantAndMidheaven } from '../astro/chart';
import { OracleChat } from '../components/OracleChat';
import { Paywall } from '../components/Paywall';
import { ReviewPrompt } from '../components/ReviewPrompt';
import { datesIn, LiveReadingNudge, LockedSummary } from '../components/SalesCloser';
import { Back, SafetyPanel } from '../components/ui';
import { screen } from '../lib/screener';
import { hasBirthDate } from '../content/askedAbout';
import { loadPlaces, type Place } from '../geo/places';
import { useAccount } from '../services/AccountContext';
import { factSheet, requestDeepReading, type DeepResult } from '../services/aiReading';
import { writeOracleAnswer, type WrittenAnswer } from '../services/oracleAnswer';
import { track } from '../services/telemetry';
import { useStore } from '../state';

/** What a shake asks when no question is written. */
const SHAKE_QUESTION = 'What do I need to know today?';
const FREE_PER_DAY = 3;
/** Around the Oracle's written answer. */
const WRITTEN = {
  writing: 'The Oracle is reading your chart and writing to you…',
  free: 'Written for you by the Oracle with AI help (Claude), from your chart and today’s sky. Not your name or birth details. For reflection, not prediction.',
  deep: 'Your deep answer, written by the Oracle with AI help (Claude) from your whole chart, what is moving now, and your timing. Not your name or birth details. For reflection, not prediction.',
  deeper: 'Members get a much deeper answer to every question: the whole chart, what is moving now, and the timing, woven together, and a conversation that remembers you.',
  read: 'What the Oracle read in your chart',
};
const EXAMPLES = [
  'Show my chart’s energy',
  'What’s my archetype?',
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

/** Today's planets, each with its sign, degree, and your house; tap one to ask about it. */
function SkyStrip({ onAsk }: { onAsk: (q: string) => void }) {
  const { state } = useStore();
  const { me } = useCharts();
  const rows = useMemo(() => (me ? skyToday(me, { lat: state.birth.lat, lon: state.birth.lon }) : []), [me, state.birth.lat, state.birth.lon]);
  if (!rows.length) return null;
  return (
    <section className="sky-strip" aria-labelledby="sky-strip-h">
      <h2 id="sky-strip-h">The sky right now</h2>
      <ul>
        {rows.map((r) => (
          <li key={r.body}>
            <button type="button" onClick={() => onAsk(r.body === 'Moon' ? 'What’s the sky doing tonight?' : `Where is ${r.body} right now?`)}>
              <span className="sky-glyph" aria-hidden="true">
                {r.glyph}
              </span>
              <span>
                <strong>{r.body}</strong> {r.deg} {r.sign}
                {r.rx && ' ℞'}
                <span className="small oracle-muted">{r.house ? ` · your ${r.house}` : ''}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
  const input = useRef<HTMLTextAreaElement>(null);
  const [info, setInfo] = useState<BoardInfo | null>(null);
  const [prompt, setPrompt] = useState<string | undefined>(undefined);
  const [talkPitch, setTalkPitch] = useState(false);
  // The Oracle's answer in its own words, written by Claude from the chart; the engine's answer is the fallback.
  const [written, setWritten] = useState<{ key: string; a?: WrittenAnswer | null; busy?: boolean } | null>(null);
  const writtenCache = useRef(new Map<string, WrittenAnswer>());
  const place = { lat: state.birth.lat, lon: state.birth.lon };
  const day = new Date().toISOString().slice(0, 10);
  const asked = state.oracle.filter((a) => a.day === day);
  // Questions the Oracle declines to answer do not use up a free question.
  const left = entitlement.active ? Infinity : Math.max(0, FREE_PER_DAY - asked.filter((a) => !a.limit).length);
  const welcome = useMemo(() => [...ORACLE_SAYS.welcome].map((ch, i) => <span key={i} style={{ animationDelay: `${i * 0.07}s` }}>{ch}</span>), []);

  // The town list loads only when a question carries someone's birth date ("Mariya 6/6/86 17:40 Billings MT").
  const places = useRef<Place[] | null>(null);
  const ask = (text = q) => {
    const question = text.trim();
    if (!me || !question || phase === 'seeking') return;
    if (hasBirthDate(question) && !places.current) {
      void loadPlaces()
        .catch(() => [] as Place[])
        .then((p) => {
          places.current = p;
          ask(text);
        });
      return;
    }
    setNote('');
    setConsult(null);
    if (screen(question).flagged) {
      dispatch({ type: 'text/screen', text: question });
      setFlagged(true);
      return;
    }
    // Asking for it simply never uses a free question.
    if (intentOf(question) === 'simplify') {
      sayItSimply(question);
      return;
    }
    // The same question gets the same answer all day, and does not count again.
    const same = asked.find((a) => a.question.toLowerCase() === question.toLowerCase());
    if (!same && left <= 0) {
      setNote(ORACLE_TEXT.limit);
      return;
    }
    // The person the question names, or the one currently open in Relationships.
    const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const named = state.people.find((p) => p.birth && new RegExp(`\\b${esc(p.nickname)}\\b`, 'i').test(question));
    const who = named ?? state.person;
    let theirChart = who === state.person ? other : null;
    if (who?.birth && !theirChart) {
      try {
        theirChart = computeNatal(who.birth);
      } catch {
        theirChart = null;
      }
    }
    const a = consultOracle(question, { chart: me, place, profile: state.profile, history: state.oracle, places: places.current, other: who?.birth && theirChart ? { chart: theirChart, place: { lat: who.birth.lat, lon: who.birth.lon }, name: who.nickname } : null });
    if (same) setNote(ORACLE_TEXT.sameDay);
    else {
      // History keeps the answer itself; the full reading is recalculated when asked again.
      dispatch({ type: 'oracle/ask', answer: { ...a, layers: undefined, consulted: undefined } });
      track('oracle_asked', { intent: a.intent });
    }
    setAnswer(a);
    void writeFor(a);
    setPhase('seeking');
    setInfo(null);
    board.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => setPhase('answered'), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 2600);
  };
  // Shake with a question to ask it; shake with none for today's message, like an oracle's ball.
  const enableShake = useShake(() => (q.trim() ? ask() : ask(SHAKE_QUESTION)));
  const energy = useMemo(() => {
    if (!me || answer?.intent !== 'energy') return null;
    const asc = me.timePrecision === 'exact' ? ascendantAndMidheaven(me.utc, place.lat, place.lon).asc : null;
    return { aspects: chartEnergy(me, place).aspects, asc };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, answer?.intent, state.birth.lat, state.birth.lon]);

  /** Rewrites the current answer in plain words, in place. */
  const sayItSimply = (question = 'Say it simply') => {
    if (!me) return;
    const s2 = consultOracle(question, { chart: me, place, previous: answer });
    track('oracle_asked', { intent: 'simplify' });
    setAnswer(s2);
    setPhase('answered');
  };

  // Arriving from the intro with a question: the Oracle answers it straight away.
  const loc = useLocation();
  const navTo = useNavigate();
  const asked0 = useRef(false);
  useEffect(() => {
    const first = (loc.state as { ask?: string } | null)?.ask;
    if (!first || !me || asked0.current) return;
    asked0.current = true;
    setQ(first);
    ask(first);
    navTo('/oracle', { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  /** Everything the AI may draw on: natal Western and Vedic, plus timing (today's sky, progressions, periods). */
  const wholeChart = () => (me ? [...factSheet('western', me, place), ...factSheet('vedic', me, place), ...factSheet('timing', me, place)].slice(0, 220) : []);
  const answerText = (a: OracleReply) => [...a.lines, ...a.deeper].map((l) => `${l.heading}${l.heading && l.text ? ': ' : ''}${l.text}`.slice(0, 600)).filter(Boolean);

  /** Asks Claude to write the answer to this question, from the chart and what the engine found. */
  const writeFor = async (a: OracleReply) => {
    if (!me || a.limit || a.intent === 'simplify') return setWritten(null);
    const key = `${a.day}|${a.question.toLowerCase()}|${entitlement.active ? 'm' : 'f'}`;
    const cached = writtenCache.current.get(key);
    if (cached) return setWritten({ key, a: cached });
    setWritten({ key, busy: true });
    const asked = state.oracle.filter((h) => h.question.toLowerCase() !== a.question.toLowerCase()).slice(-8).map((h) => `${h.day}: ${h.question} (the Oracle said: ${h.label})`);
    const { on, notes } = state.oracleMemory;
    const memory = entitlement.active && on ? notes.map((n) => `${n.at.slice(0, 10)}: ${n.text}`) : [];
    const w = await writeOracleAnswer(a.question, wholeChart(), [a.label, ...answerText(a)], asked, memory, entitlement.active);
    if (w) writtenCache.current.set(key, w);
    track('oracle_answer', { depth: entitlement.active ? 'member' : 'free', ok: !!w });
    setWritten((cur) => (cur?.key === key ? { key, a: w } : cur));
  };
  const writtenNow = answer && written?.key.startsWith(`${answer.day}|${answer.question.toLowerCase()}|`) ? written : null;

  const runConsult = async (a: OracleReply) => {
    if (!me) return;
    setConsult({ q: a.question, busy: true });
    try {
      const facts = wholeChart();
      const source = answerText(a);
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

      <OracleBoard
        phase={phase}
        points={answer?.points}
        tone={answer?.tone}
        orb={answer?.orb}
        boardRef={board}
        prompt={prompt}
        onPick={(p) => setInfo(boardInfo(p.kind, p.name, me, place))}
        onOrb={() => {
          void enableShake();
          if (q.trim()) ask();
          else {
            setPrompt('ASK ME');
            input.current?.focus({ preventScroll: true });
          }
        }}
      />
      <p className="small oracle-muted oracle-hint">Touch the ball to ask · tap the stars to explore</p>
      <p className="small oracle-hint">
        <Link to="/astrologer">Seeking a live reading… ›</Link>
      </p>
      {info && (
        <section className="oracle-info" aria-live="polite">
          <h3>{info.title}</h3>
          <p>{info.text}</p>
          {info.ask && (
            <button type="button" className="btn secondary" onClick={() => (setQ(info.ask!), ask(info.ask))}>
              Ask the Oracle about this
            </button>
          )}
        </section>
      )}
      {answer && phase === 'answered' && (
        <section className="oracle-answer" aria-live="polite" aria-labelledby="oa-h">
          <p className="small oracle-muted">“{answer.question}”</p>
          {writtenNow?.a ? (
            <>
              <p className="kicker">{answer.label}</p>
              <h2 id="oa-h">{writtenNow.a.headline}</h2>
              {answer.intent === 'energy' && energy && <EnergyWheel planets={me.western.planets} aspects={energy.aspects} asc={energy.asc} />}
              <div className="oracle-written">
                {writtenNow.a.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {writtenNow.a.followups.length > 0 && (
                <div className="chips">
                  {writtenNow.a.followups.map((f) => (
                    <button key={f} type="button" className="chip" onClick={() => (setQ(f), ask(f))}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
              <p className="small oracle-muted">{writtenNow.a.depth === 'member' ? WRITTEN.deep : WRITTEN.free}</p>
              {writtenNow.a.depth === 'free' && !entitlement.active && <p className="small">{WRITTEN.deeper}</p>}
              <details className="oracle-layer">
                <summary>{WRITTEN.read}</summary>
                <Lines items={answer.lines} />
              </details>
            </>
          ) : (
            <>
              <h2 id="oa-h">{answer.label}</h2>
              {answer.intent !== 'simplify' && (
                <button type="button" className="chip say-simply" onClick={() => sayItSimply()}>
                  Say it simply
                </button>
              )}
              {writtenNow?.busy && <p className="small oracle-muted chat-thinking">{WRITTEN.writing}</p>}
              {answer.intent === 'energy' && energy && <EnergyWheel planets={me.western.planets} aspects={energy.aspects} asc={energy.asc} />}
              {!writtenNow?.busy && <Lines items={answer.lines} />}
            </>
          )}
          {answer.consulted && (
            <div className="oracle-consulted">
              <p className="small">The Oracle read</p>
              <ul>
                {answer.consulted.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          {answer.layers && answer.layers.length > 0 && (
            <div className="oracle-layers">
              <h3>The full reading</h3>
              {!entitlement.active && (
                <>
                  <LockedSummary layers={answer.layers} />
                  <ol className="oracle-locked">
                    {answer.layers.map((l) => {
                      const d = datesIn(l.lines);
                      return (
                        <li key={l.title}>
                          {l.title} <span>· {d ? `${d} of your dates` : `${l.lines.length} findings`}</span>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
              <Paywall where="reading" what="The Oracle’s full reading">
                {answer.layers.map((l) => (
                  <details key={l.title} className="oracle-layer" open={l === answer.layers![0]}>
                    <summary>
                      <span>{l.title}</span> <span className="oracle-trad">{l.tradition}</span>
                    </summary>
                    <Lines items={l.lines} />
                  </details>
                ))}
              </Paywall>
            </div>
          )}
          {(answer.deeper.length > 0 || !answer.limit) && (entitlement.active || !answer.layers?.length) && (
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

      {answer && phase === 'answered' && answer.intent !== 'simplify' && (
        <section className="oracle-answer oracle-talk" aria-labelledby="ot-h">
          <h2 id="ot-h">Talk it through with the Oracle</h2>
          <p className="small oracle-muted">Tell it what’s really going on, and it answers you, not just your chart.</p>
          {entitlement.active ? (
            <OracleChat question={answer.question} answer={writtenNow?.a ? writtenNow.a.paragraphs : answerText(answer)} facts={wholeChart} />
          ) : talkPitch ? (
            <Paywall where="reading" what="Talking with the Oracle">
              {null}
            </Paywall>
          ) : (
            <>
              <p>Members can talk it through: tell the Oracle what happened, how it feels, who it’s about, and it answers you personally from your chart and today’s sky, with follow-up questions.</p>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  // The membership offer is already on the page with the full reading: go there rather than show it twice.
                  const pay = document.querySelector('.oracle-answer:not(.oracle-talk) .paywall');
                  if (pay) pay.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else setTalkPitch(true);
                }}
              >
                See membership
              </button>
            </>
          )}
        </section>
      )}
      {answer && !flagged && <LiveReadingNudge key={`${answer.day}-${answer.question}`} intent={answer.intent} />}
      {answer && <ReviewPrompt key={state.oracle.length} answers={state.oracle.length} />}
      <SkyStrip onAsk={(x) => (setQ(x), ask(x))} />
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
          <textarea ref={input} id="oracle-q" rows={2} maxLength={300} value={q} placeholder="Ask anything about your chart, the sky, or your timing…" onChange={(e) => (setQ(e.target.value), phase === 'answered' && setPhase('idle'))} />
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
            Or shake your phone: with a question to ask it, or with none for today’s message. {Number.isFinite(left) ? `${left} of ${FREE_PER_DAY} free questions left today.` : 'Unlimited questions with your subscription.'}
          </p>
          {note && <p className="small oracle-note">{note}</p>}
        </form>
      )}
      {/* Out of free questions is the moment of most intent: offer the subscription right here, not just a note. */}
      {!flagged && note === ORACLE_TEXT.limit && !entitlement.active && (
        <Paywall where="reading" what="Unlimited questions">
          {null}
        </Paywall>
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
