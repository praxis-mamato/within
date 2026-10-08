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

      <Link className="card soft list-link" to="/you/reading" style={{ textDecoration: 'none' }}>
        <span>
          <strong>Your full reading</strong>
          <span className="small muted" style={{ display: 'block' }}>
            Every placement in both traditions, and what the sky is doing for you now
          </span>
        </span>
        <span aria-hidden="true">›</span>
      </Link>

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
