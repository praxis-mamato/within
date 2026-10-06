import { Link } from 'react-router-dom';
import { REFLECTIONS } from '../data/fixtures';
import { HorizonSun } from '../components/Illustrations';
import { PurposeCard, SafetyPanel } from '../components/ui';
import { useStore } from '../state';

/** Today: current intention, one reflection, one next step, and a clear finish (PRD §4). */
export default function Today() {
  const { state, dispatch } = useStore();
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

      {action ? (
        <div className="card">
          <p className="small muted">Your next step</p>
          <p>{action.text}</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => dispatch({ type: 'today/finish' })}>
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
