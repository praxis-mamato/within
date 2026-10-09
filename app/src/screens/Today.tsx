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

/** The deeper material, one tap from Today: patterns, cycles, and the full reading with AI deep dives. */
function DeeperLinks() {
  const links = [
    { to: '/you/reading?tab=timing', title: 'Your week, planet by planet', text: 'Every transit to your chart, dated, with the New and Full Moons' },
    { to: '/you/patterns', title: 'Your patterns', text: 'What shapes you, read from your whole chart' },
    { to: '/you/cycles', title: 'Your cycles', text: 'What you’re moving through now, with dates' },
    { to: '/you/reading', title: 'Your full reading', text: 'Western, Vedic, timing, and AI deep dives' },
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
