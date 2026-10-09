import { Link } from 'react-router-dom';
import { track } from '../services/telemetry';
import { REFLECTIONS } from '../data/fixtures';
import { HorizonSun } from '../components/Illustrations';
import { PurposeCard, SafetyPanel } from '../components/ui';
import { useStore } from '../state';
import { useMemo } from 'react';
import { useCharts } from '../astro/useCharts';
import { cycles } from '../content/cycles';
import { CycleCard } from './Patterns';
import { chartInBrief, todaySky, TODAY_TEXT, type SkyLine } from '../content/today';
import { useAccount } from '../services/AccountContext';
import { MiniOrb } from '../components/OracleBoard';

/** Today: current intention, one reflection, one next step, and a clear finish (PRD §4). */
export default function Today() {
  const { state, dispatch } = useStore();
  const { me } = useCharts();
  const today = new Date().toISOString().slice(0, 10);
  const nowCycle = useMemo(() => (me ? cycles(me, state.birth.lat, state.birth.lon, new Date(), state.profile).now[0] : undefined), [me, state.birth.lat, state.birth.lon, state.profile]);
  const r = REFLECTIONS.self;
  const action = [...state.actions].reverse().find((a) => a.reflectionId === r.id);
  // Check-ins are for earlier steps; today's own step isn't due yet. (Prototype: no real clock.)
  const dueFollowUp = state.actions.find((a) => a.followUp !== 'none' && !a.outcome && a.id !== action?.id);

  if (state.todayDone) {
    return (
      <div className="done">
        <HorizonSun />
        <h1>You’re done for today</h1>
        <p className="sub">Nothing else needs your attention. Come back whenever you like.</p>
        <DeeperLinks />
        <Link className="link" to="/growth">
          See your growth
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="kicker">Self</p>
      <h1>{r.heading}</h1>
      <p className="sub">{r.subheading}</p>
      <HorizonSun />
      {state.safety.flagged && <SafetyPanel compact />}
      <OracleCard />
      <SkyToday />
      <ChartBrief />
      <PurposeCard />
      <DeeperLinks />

      {dueFollowUp && (
        <div className="card soft">
          <p>
            <strong>Check in:</strong> {dueFollowUp.text}
          </p>
          <Link className="btn secondary" to={`/follow-up/${dueFollowUp.id}`}>
            How did it go?
          </Link>
        </div>
      )}

      {nowCycle && (
        <section aria-labelledby="now-cycle-h">
          <h2 id="now-cycle-h">What you’re moving through</h2>
          <CycleCard x={nowCycle} today={today} compact />
          <div className="btn-row">
            <Link className="btn quiet" to="/you/cycles">
              All your cycles
            </Link>
            <Link className="btn quiet" to="/you/patterns">
              Your patterns
            </Link>
          </div>
        </section>
      )}

      {action ? (
        <div className="card">
          <p className="small muted">Your next step</p>
          <p>{action.text}</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => (dispatch({ type: 'today/finish' }), track('today_finished'))}>
              Finish for today
            </button>
            <Link className="btn quiet" to="/reflection/self">
              Revisit the reflection
            </Link>
          </div>
        </div>
      ) : (
        <div className="btn-row">
          <Link className="btn" to="/reflection/self">
            Explore my patterns
          </Link>
        </div>
      )}
    </>
  );
}

const Lines = ({ items }: { items: SkyLine[] }) => (
  <div className="reading-items">
    {items.map((i) => (
      <div className="reading-item" key={i.heading}>
        <h3>{i.heading}</h3>
        <p>{i.text}</p>
        {i.basis && <p className="basis">{i.basis}</p>}
      </div>
    ))}
  </div>
);

/** The way into the Oracle: a night card that warms into dawn. */
function OracleCard() {
  return (
    <Link to="/oracle" className="oracle-card" aria-label="The Oracle: your guide to the energy within you">
      <MiniOrb />
      <span>
        <span className="oracle-card-kicker">The Oracle</span>
        <strong>Navigate life with the Oracle</strong>
        <span className="small">Your guide to the energy within you and how it shows up in the world. Ask it anything.</span>
      </span>
      <span aria-hidden="true">›</span>
    </Link>
  );
}

/** Free: the sky right now, read against this person's chart, plus what the rest of the week holds. */
function SkyToday() {
  const { state } = useStore();
  const { me } = useCharts();
  const { entitlement } = useAccount();
  const sky = useMemo(() => (me ? todaySky(me, { lat: state.birth.lat, lon: state.birth.lon }) : null), [me, state.birth.lat, state.birth.lon]);
  if (!sky) return null;
  return (
    <section className="card" aria-labelledby="sky-h">
      <h2 id="sky-h" style={{ marginTop: 0 }}>
        The sky today, for you
      </h2>
      <Lines items={[sky.moon, ...sky.now]} />
      {sky.retrograde.length > 0 && (
        <p className="small muted" style={{ marginTop: 12 }}>
          {TODAY_TEXT.retro} {sky.retrograde.join(', ')}.
        </p>
      )}
      {sky.later.length > 0 && (
        <>
          <h3 style={{ marginBottom: 4 }}>Later this week</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {sky.later.slice(0, 5).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {!entitlement.active && <p className="small muted">Each of these is read in full, with what it means for you, in a subscription.</p>}
        </>
      )}
      <Link className="btn secondary" to="/you/reading?tab=timing" style={{ marginTop: 12 }}>
        Your week, planet by planet
      </Link>
    </section>
  );
}

/** Free: the core of the birth chart, read in full. */
function ChartBrief() {
  const { me } = useCharts();
  const lines = useMemo(() => (me ? chartInBrief(me) : []), [me]);
  if (!lines.length) return null;
  return (
    <section className="card" aria-labelledby="brief-h">
      <h2 id="brief-h" style={{ marginTop: 0 }}>
        Your chart, at its core
      </h2>
      <Lines items={lines} />
      <Link className="btn quiet" to="/you/reading" style={{ marginTop: 12 }}>
        Every placement, Western and Vedic
      </Link>
    </section>
  );
}

/** The deeper material, one tap from Today: patterns, cycles, and the full reading with AI deep dives. */
function DeeperLinks() {
  const links = [
    { to: '/you/reading?tab=timing', title: 'Your week, planet by planet', text: 'Every transit to your chart, dated, with the New and Full Moons' },
    { to: '/you/patterns', title: 'Your patterns', text: 'What shapes you, read from your whole chart' },
    { to: '/you/cycles', title: 'Your cycles', text: 'What you’re moving through now, with dates' },
    { to: '/you/reading', title: 'Your full reading', text: 'Western, Vedic, timing, and connected deep readings' },
  ];
  return (
    <nav className="deeper" aria-label="Go deeper">
      <h2>Go deeper</h2>
      {links.map((l) => (
        <Link key={l.to} className="card soft list-link" to={l.to} style={{ textDecoration: 'none' }}>
          <span>
            <strong>{l.title}</strong>
            <span className="small muted" style={{ display: 'block' }}>
              {l.text}
            </span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
      ))}
    </nav>
  );
}
