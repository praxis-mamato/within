import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCharts } from '../astro/useCharts';
import { findPatterns, strengthLabel, type FoundPattern } from '../content/patternRules';
import { cycles, type Cycle } from '../content/cycles';
import { Paywall } from '../components/Paywall';
import { useStore } from '../state';
import { track } from '../services/telemetry';

const fmt = (iso: string, withYear = true) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });

/** Plain-language themes that synthesize the whole chart. The astrology behind each is one tap away. */
export function Patterns() {
  const { state } = useStore();
  const { me } = useCharts();
  const list = useMemo(() => (me ? findPatterns(me, state.birth.lat, state.birth.lon) : []), [me, state.birth.lat, state.birth.lon]);
  useEffect(() => track('reading_opened', { tradition: 'patterns' }), []);
  if (!me) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;
  const free = 2;
  return (
    <>
      <p className="kicker">Your patterns</p>
      <h1>What shapes you</h1>
      <p className="sub">Themes drawn from your whole chart, in plain words. Each one combines several placements; tap to see the astrology behind it. Possibilities to reflect on, not verdicts.</p>
      {list.slice(0, free).map((p) => (
        <PatternCard key={p.id} p={p} />
      ))}
      <Paywall where="reading" what="Reading all your patterns">
        {list.slice(free).map((p) => (
          <PatternCard key={p.id} p={p} />
        ))}
      </Paywall>
      <p className="small muted">Patterns use Western placements, with Vedic yogas where noted. Draft text awaiting the approver’s review.</p>
    </>
  );
}

function PatternCard({ p }: { p: FoundPattern }) {
  return (
    <article className="card pattern" aria-labelledby={`pt-${p.id}`}>
      <p className="pattern-strength">{strengthLabel(p.strength)}</p>
      <h2 id={`pt-${p.id}`}>{p.title}</h2>
      <p className="pattern-summary">{p.summary}</p>
      <details>
        <summary>Read the full pattern</summary>
        <h3>How it can show up</h3>
        <p>{p.shows}</p>
        <h3>The gift in it</h3>
        <p>{p.gift}</p>
        <h3>Where it can get hard</h3>
        <p>{p.edge}</p>
        <h3>What tends to help</h3>
        <p>{p.helps}</p>
        <h3>You might notice</h3>
        <ul>
          {p.notice.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <blockquote className="pattern-question">{p.question}</blockquote>
        <h3>The astrology behind this</h3>
        <ul className="evidence">
          {p.evidence.map((e) => (
            <li key={e.text}>{e.text}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

/** The periods you are in now and those coming up, with dates, phase, and a timeline. */
export function Cycles() {
  const { state } = useStore();
  const { me } = useCharts();
  const now = useMemo(() => new Date(), []);
  const c = useMemo(() => (me ? cycles(me, state.birth.lat, state.birth.lon, now) : null), [me, state.birth.lat, state.birth.lon, now]);
  useEffect(() => track('reading_opened', { tradition: 'cycles' }), []);
  if (!me || !c) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;
  const today = now.toISOString().slice(0, 10);
  return (
    <>
      <p className="kicker">Your cycles</p>
      <h1>What you’re moving through</h1>
      <p className="sub">The longer periods in your life right now and in the year ahead, with when each one starts, peaks, and eases. Themes to notice, not events to expect.</p>
      <h2>Now</h2>
      {c.now.slice(0, 1).map((x) => (
        <CycleCard key={x.id} x={x} today={today} />
      ))}
      <Paywall where="reading" what="Seeing all your cycles, with dates">
        {c.now.slice(1).map((x) => (
          <CycleCard key={x.id} x={x} today={today} />
        ))}
        <h2>Coming up</h2>
        {c.next.length ? c.next.slice(0, 12).map((x) => <CycleCard key={x.id} x={x} today={today} />) : <p className="small muted">No new slow cycles begin in the next twelve months.</p>}
        <p className="small">
          For every date, including progressions, solar arcs, and your solar return, see <Link to="/you/reading">Reading → Timing</Link>.
        </p>
      </Paywall>
    </>
  );
}

export function CycleCard({ x, today, compact = false }: { x: Cycle; today: string; compact?: boolean }) {
  const s = new Date(x.start).getTime();
  const e = new Date(x.end).getTime();
  const pos = (iso: string) => Math.min(100, Math.max(0, ((new Date(iso).getTime() - s) / Math.max(1, e - s)) * 100));
  const showToday = today >= x.start && today <= x.end;
  return (
    <article className={`card cycle ${x.tradition === 'Vedic' ? 'vedic' : 'western'}`} aria-labelledby={`cy-${x.id}`}>
      <div className="cycle-top">
        <span className={`status-tag phase-${x.phase.replace(/\s/g, '-').toLowerCase()}`}>{x.phase}</span>
        <span className="cycle-intensity" aria-label={`Intensity ${x.intensity} of 3`} title={`Intensity ${x.intensity} of 3`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={i <= x.intensity ? 'on' : ''} aria-hidden="true" />
          ))}
        </span>
      </div>
      <h3 id={`cy-${x.id}`}>{x.title}</h3>
      <p className="cycle-touch">Touching {x.touches}</p>
      <div className="timeline" role="img" aria-label={`From ${fmt(x.start)} to ${fmt(x.end)}${x.peaks.length ? `, strongest ${x.peaks.map((p) => fmt(p)).join(' and ')}` : ''}`}>
        <div className="timeline-bar" />
        {x.peaks.map((p) => (
          <span key={p} className="timeline-peak" style={{ left: `${pos(p)}%` }} />
        ))}
        {showToday && <span className="timeline-today" style={{ left: `${pos(today)}%` }} />}
      </div>
      <div className="timeline-dates small muted">
        <span>{fmt(x.start)}</span>
        {x.peaks.length > 0 && <span>Peak {x.peaks.map((p) => fmt(p, false)).join(', ')}</span>}
        <span>{fmt(x.end)}</span>
      </div>
      {!compact && (
        <>
          <p>{x.feel}</p>
          <p>
            <strong>What helps:</strong> {x.helps}
          </p>
          <p className="basis">
            {x.basis} · {x.tradition}
          </p>
        </>
      )}
    </article>
  );
}
