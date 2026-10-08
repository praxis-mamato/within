import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCharts } from '../astro/useCharts';
import { findPatterns, strengthLabel, type FoundPattern } from '../content/patternRules';
import { cycles, type Contact, type Cycle } from '../content/cycles';
import { AREAS, mirrorFor, PATTERN_AREAS, RECHARGE, SEASONS, type Area, type PatternCheck, type Profile } from '../content/mirror';
import { Paywall } from '../components/Paywall';
import { ChipGroup } from '../components/ui';
import { useStore } from '../state';
import { track } from '../services/telemetry';

const fmt = (iso: string, withYear = true) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const AREA_KEYS = Object.keys(AREAS) as Area[];
const FIT_ORDER: Record<string, number> = { yes: 0, none: 1, partly: 2, no: 3 };

/** A few questions so readings can reflect the person back to themselves. Answers stay on the device. */
export function MirrorIntake({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useStore();
  const p = state.profile;
  const [editing, setEditing] = useState(!p && !compact);
  const [season, setSeason] = useState<string[]>(p?.season ? [p.season] : []);
  const [onMind, setOnMind] = useState<string[]>((p?.onMind ?? []).map((a) => AREAS[a]));
  const [recharge, setRecharge] = useState<string[]>(p?.recharge ? [p.recharge] : []);

  if (!editing) {
    if (!p)
      return (
        <div className="card soft mirror-card">
          <p style={{ margin: 0 }}>
            <strong>Make this more you.</strong> Three quick questions help Within mirror your life, not just your chart.
          </p>
          <button type="button" className="btn quiet" onClick={() => setEditing(true)}>
            Answer three questions
          </button>
        </div>
      );
    return (
      <p className="small muted mirror-line">
        Reflecting: <strong>{p.season}</strong>
        {p.onMind.length > 0 && <> · on your mind: {p.onMind.map((a) => AREAS[a].toLowerCase()).join(', ')}</>}
        {p.recharge && <> · recharges: {p.recharge.toLowerCase()}</>}{' '}
        <button type="button" className="link" onClick={() => setEditing(true)}>
          Change
        </button>
      </p>
    );
  }
  const save = () => {
    const profile: Profile = { season: season[0] ?? '', onMind: AREA_KEYS.filter((k) => onMind.includes(AREAS[k])).slice(0, 3), recharge: recharge[0] ?? '' };
    dispatch({ type: 'profile/set', profile });
    setEditing(false);
  };
  return (
    <section className="card mirror-card" aria-labelledby="mirror-h">
      <h2 id="mirror-h" style={{ marginTop: 0 }}>
        Help Within mirror you
      </h2>
      <p className="small muted">Your answers stay on this device. They change which patterns and cycles come first, and what each one says to you.</p>
      {state.focusText && (
        <p className="small">
          You told us at the start: “{state.focusText.slice(0, 160)}
          {state.focusText.length > 160 ? '…' : ''}”
        </p>
      )}
      <p className="q">What season of life are you in?</p>
      <ChipGroup label="Season of life" options={Object.keys(SEASONS)} value={season} onChange={setSeason} />
      <p className="q">
        What’s most on your mind? <span className="hint">Up to three</span>
      </p>
      <ChipGroup label="On your mind" multi options={Object.values(AREAS)} value={onMind} onChange={(v) => setOnMind(v.slice(-3))} />
      <p className="q">How do you recharge?</p>
      <ChipGroup label="Recharge" options={[...RECHARGE]} value={recharge} onChange={setRecharge} />
      <div className="btn-row">
        <button type="button" className="btn" disabled={!season.length && !onMind.length} onClick={save}>
          Save
        </button>
        {p && (
          <button type="button" className="btn quiet" onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}

/** Plain-language themes that synthesize the whole chart, checked against the person's own experience. */
export function Patterns() {
  const { state } = useStore();
  const { me } = useCharts();
  const found = useMemo(() => (me ? findPatterns(me, state.birth.lat, state.birth.lon) : []), [me, state.birth.lat, state.birth.lon]);
  useEffect(() => track('reading_opened', { tradition: 'patterns' }), []);
  if (!me) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;

  const onMind = new Set(state.profile?.onMind ?? []);
  const touches = (p: FoundPattern) => Object.keys(PATTERN_AREAS[p.id] ?? {}).some((a) => onMind.has(a as Area));
  const list = [...found].sort(
    (a, b) =>
      FIT_ORDER[state.patternChecks[a.id]?.fit ?? 'none'] - FIT_ORDER[state.patternChecks[b.id]?.fit ?? 'none'] ||
      Number(touches(b)) - Number(touches(a)) ||
      b.strength - a.strength,
  );
  const shown = list.filter((p) => state.patternChecks[p.id]?.fit !== 'no');
  const notYou = list.filter((p) => state.patternChecks[p.id]?.fit === 'no');
  const free = 2;
  return (
    <>
      <p className="kicker">Your patterns</p>
      <h1>What shapes you</h1>
      <p className="sub">Your chart, read as a whole. Tell Within which ones ring true, and the reading sharpens around you.</p>
      <MirrorIntake />
      {shown.slice(0, free).map((p) => (
        <PatternCard key={p.id} p={p} />
      ))}
      <Paywall where="reading" what="Reading all your patterns">
        {shown.slice(free).map((p) => (
          <PatternCard key={p.id} p={p} />
        ))}
        {notYou.length > 0 && (
          <details className="card soft">
            <summary>Patterns you didn’t recognize ({notYou.length})</summary>
            {notYou.map((p) => (
              <PatternCard key={p.id} p={p} />
            ))}
          </details>
        )}
      </Paywall>
      <p className="small muted">Patterns use Western placements, with Vedic yogas where noted. Draft text awaiting the approver’s review.</p>
    </>
  );
}

function PatternCard({ p }: { p: FoundPattern }) {
  const { state, dispatch } = useStore();
  const check = state.patternChecks[p.id];
  const [editing, setEditing] = useState(false);
  const onMind = state.profile?.onMind ?? [];
  const areaLines = Object.entries(PATTERN_AREAS[p.id] ?? {}) as [Area, string][];
  const mine = areaLines.filter(([a]) => onMind.includes(a));
  const lines = (mine.length ? mine : areaLines).slice(0, 2);
  const setCheck = (c: PatternCheck | null) => dispatch({ type: 'pattern/check', id: p.id, check: c });
  const asking = !check || editing;

  return (
    <article className={`card pattern${check ? ` fit-${check.fit}` : ''}`} aria-labelledby={`pt-${p.id}`}>
      <p className="pattern-strength">{check?.fit === 'yes' ? 'You said: this is me' : check?.fit === 'partly' ? 'You said: partly' : strengthLabel(p.strength)}</p>
      <h2 id={`pt-${p.id}`}>{p.title}</h2>
      <p className="pattern-summary">{p.summary}</p>

      <div className="pattern-areas">
        {lines.map(([a, t]) => (
          <p key={a}>
            <span className="area-tag">{AREAS[a]}</span>
            {t}
          </p>
        ))}
      </div>

      {asking ? (
        <div className="pattern-check">
          <p className="q">Does this sound like you?</p>
          <div className="chips" role="radiogroup" aria-label="Does this sound like you?">
            {(
              [
                ['yes', 'Yes, very'],
                ['partly', 'Partly'],
                ['no', 'Not really'],
              ] as const
            ).map(([fit, label]) => (
              <button key={fit} type="button" role="radio" className="chip" aria-checked={check?.fit === fit} onClick={() => (setEditing(fit !== 'no'), setCheck({ fit, noticed: check?.noticed ?? [] }))}>
                {label}
              </button>
            ))}
          </div>
          {check && check.fit !== 'no' && (
            <>
              <p className="q">Which of these happen for you?</p>
              <ChipGroup label="Which of these happen for you?" multi options={p.notice} value={check.noticed} onChange={(noticed) => setCheck({ ...check, noticed })} />
            </>
          )}
          {check && (
            <button type="button" className="btn quiet" onClick={() => setEditing(false)}>
              Done
            </button>
          )}
        </div>
      ) : (
        <div className="pattern-mirror">
          <p>{mirrorFor(check, p.notice, p.helps)}</p>
          <button type="button" className="link small" onClick={() => setEditing(true)}>
            Change my answer
          </button>
        </div>
      )}

      <details>
        <summary>Go deeper</summary>
        <div className="light-shadow">
          <div>
            <h3>The light</h3>
            <p>{p.gift}</p>
          </div>
          <div>
            <h3>The shadow</h3>
            <p>{p.edge}</p>
          </div>
        </div>
        <h3>How it shows up</h3>
        <p>{p.shows}</p>
        {(!check || check.fit === 'no') && (
          <>
            <h3>What tends to help</h3>
            <p>{p.helps}</p>
          </>
        )}
        <blockquote className="pattern-question">{p.question}</blockquote>
        <h3>Why your chart says this</h3>
        <ul className="evidence">
          {p.evidence.map((e) => (
            <li key={e.text}>
              <strong>{e.text}.</strong> {e.why}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

/** The seasons you are in, one card per planet, then a dated list of what is coming. */
export function Cycles() {
  const { state } = useStore();
  const { me } = useCharts();
  const now = useMemo(() => new Date(), []);
  const c = useMemo(() => (me ? cycles(me, state.birth.lat, state.birth.lon, now, state.profile) : null), [me, state.birth.lat, state.birth.lon, now, state.profile]);
  useEffect(() => track('reading_opened', { tradition: 'cycles' }), []);
  if (!me || !c) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;
  const today = now.toISOString().slice(0, 10);
  return (
    <>
      <p className="kicker">Your cycles</p>
      <h1>What you’re moving through</h1>
      <p className="sub">The longer seasons in your life right now, when each peaks and eases, and what’s ahead. Themes to notice, not events to expect.</p>
      <MirrorIntake />
      <h2>Now</h2>
      {c.now.slice(0, 1).map((x) => (
        <CycleCard key={x.id} x={x} today={today} />
      ))}
      <Paywall where="reading" what="Seeing all your cycles, with dates">
        {c.now.slice(1).map((x) => (
          <CycleCard key={x.id} x={x} today={today} />
        ))}
        <h2>Coming up</h2>
        {c.next.length ? (
          <ol className="upcoming">
            {c.next.slice(0, 14).map((x) => (
              <UpcomingRow key={`${x.transiting}-${x.natal}-${x.start}`} x={x} />
            ))}
          </ol>
        ) : (
          <p className="small muted">No new slow cycles begin in the next twelve months.</p>
        )}
        <p className="small">
          For every date, including progressions, solar arcs, and your solar return, see <Link to="/you/reading">Reading → Timing</Link>.
        </p>
      </Paywall>
    </>
  );
}

function UpcomingRow({ x }: { x: Contact }) {
  return (
    <li className={x.forYou ? 'for-you' : ''}>
      <span className="upcoming-date">
        {fmt(x.start, false)} – {fmt(x.end)}
      </span>
      <span className="upcoming-what">
        <strong>
          {x.transiting} and {x.touches}
        </strong>
        {x.forYou && <span className="area-tag">On your mind</span>}
      </span>
      <span className="upcoming-line">{x.line}</span>
    </li>
  );
}

function Timeline({ x, today }: { x: Cycle; today: string }) {
  const s = new Date(x.start).getTime();
  const e = new Date(x.end).getTime();
  const pos = (iso: string) => Math.min(100, Math.max(0, ((new Date(iso).getTime() - s) / Math.max(1, e - s)) * 100));
  return (
    <>
      <div className="timeline" role="img" aria-label={`From ${fmt(x.start)} to ${fmt(x.end)}${x.peaks.length ? `, strongest ${x.peaks.map((p) => fmt(p)).join(' and ')}` : ''}`}>
        <div className="timeline-bar" />
        {x.peaks.map((p) => (
          <span key={p} className="timeline-peak" style={{ left: `${pos(p)}%` }} />
        ))}
        {today >= x.start && today <= x.end && <span className="timeline-today" style={{ left: `${pos(today)}%` }} />}
      </div>
      <div className="timeline-dates small muted">
        <span>{fmt(x.start)}</span>
        {x.peaks.length > 0 && <span>Peak {x.peaks.slice(0, 3).map((p) => fmt(p, false)).join(', ')}</span>}
        <span>{fmt(x.end)}</span>
      </div>
    </>
  );
}

export function CycleCard({ x, today, compact = false }: { x: Cycle; today: string; compact?: boolean }) {
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
      <Timeline x={x} today={today} />
      {compact ? (
        <p>{x.forYou[0] ?? x.contacts[0]?.line ?? x.feel}</p>
      ) : (
        <>
          <p>{x.feel}</p>
          {x.forYou.length > 0 && (
            <div className="for-you-box">
              <p className="q">For what’s on your mind</p>
              {x.forYou.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          )}
          {x.contacts.length > 1 && (
            <ul className="contacts">
              {x.contacts.map((ct) => (
                <li key={`${ct.natal}-${ct.aspect}`}>
                  <strong>{ct.touches.charAt(0).toUpperCase() + ct.touches.slice(1)}.</strong> {ct.line}{' '}
                  <span className="small muted">
                    {fmt(ct.start, false)} – {fmt(ct.end, false)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {x.contacts.length === 1 && <p>{x.contacts[0].line}</p>}
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
