import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { REFLECTIONS, type Pillar } from '../data/fixtures';
import { Back, ChipGroup, PerspectiveCard, SafetyPanel, TogetherCard } from '../components/ui';
import { factsFor } from '../astro/facts';
import { useCharts } from '../astro/useCharts';
import { activeIntention, personalize, useStore, type Action, type Choice } from '../state';

const FOLLOW_UPS: Record<string, Action['followUp']> = {
  Tomorrow: 'tomorrow',
  'In 3 days': 'in_3_days',
  'In a week': 'in_a_week',
  'No reminder': 'none',
};

export default function Reflection() {
  const { pillar = 'self' } = useParams<{ pillar: Pillar }>();
  const r = REFLECTIONS[pillar as Pillar] ?? REFLECTIONS.self;
  const { state, dispatch } = useStore();
  const nickname = state.person?.nickname;
  const intention = activeIntention(state);
  const existing = state.actions.find((a) => a.reflectionId === r.id);
  const { me, other } = useCharts();

  const [situation, setSituation] = useState(pillar === 'self' && state.focusText ? state.focusText : r.situation);
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [choice, setChoice] = useState<Choice | null>(null);
  const [followUp, setFollowUp] = useState<string[]>(['In 3 days']);

  // Safety: steps involving the other person are never offered after a flag (PRD §6, build spec §8.1).
  const stepHidden = state.safety.suppressContactActions && r.stepInvolvesOther;
  const step = personalize(r.step, nickname);

  const save = () => {
    if (!choice) return;
    if (answer.trim()) dispatch({ type: 'journal/add', body: `${personalize(r.question, nickname)}\n${answer.trim()}` });
    dispatch({
      type: 'action/choose',
      reflectionId: r.id,
      choice,
      text: choice === 'step' ? step : choice === 'pause' ? 'A deliberate pause' : 'Nothing for now',
      followUp: choice === 'none' ? 'none' : FOLLOW_UPS[followUp[0] ?? 'No reminder'],
    });
  };

  return (
    <>
      <Back />
      <p className="kicker">{r.kicker} · Reflection</p>
      <h1>{personalize(r.heading, nickname)}</h1>
      <p className="sub muted">About three minutes</p>

      {state.stale && (
        <div className="banner" role="status">
          <strong>Your birth details changed.</strong> This reflection was made with the old details.{' '}
          <button type="button" className="link" onClick={() => dispatch({ type: 'stale/refresh' })}>
            Refresh this reflection
          </button>
        </div>
      )}
      {state.safety.flagged && <SafetyPanel compact />}

      <section aria-labelledby="sit-h">
        <h2 id="sit-h">Your situation</h2>
        {editing ? (
          <>
            <label htmlFor="sit" className="sr-only">
              Your situation
            </label>
            <textarea id="sit" value={situation} onChange={(e) => setSituation(e.target.value)} />
            <button
              type="button"
              className="btn quiet"
              onClick={() => {
                dispatch({ type: 'text/screen', text: situation });
                setEditing(false);
              }}
            >
              Done
            </button>
          </>
        ) : (
          <div className="spread">
            <p style={{ margin: 0 }}>“{situation}”</p>
            <button type="button" className="link" onClick={() => setEditing(true)}>
              Edit
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="pur-h">
        <h2 id="pur-h">Your purpose</h2>
        <p>{intention ? intention.behavior : 'No purpose set yet.'}</p>
      </section>

      <section aria-labelledby="persp-h">
        <h2 id="persp-h">Two perspectives</h2>
        <p className="small muted">
          Interpretations, not predictions or facts about anyone. Each tradition is shown on its own; you decide what fits.
        </p>
        {state.lensOrder.map((t) => (
          <PerspectiveCard key={t} p={r.perspectives[t]} reflectionId={r.id} nickname={nickname} facts={me ? factsFor(r.pillar, t, me, other, nickname) : null} />
        ))}
        <TogetherCard text={r.together} reflectionId={r.id} nickname={nickname} />
      </section>

      <section aria-labelledby="q-h">
        <h2 id="q-h">Reflection</h2>
        <label htmlFor="answer">
          {personalize(r.question, nickname)}
          <span className="hint">Optional. Saved to your private journal.</span>
        </label>
        <textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!existing} />
      </section>

      <section aria-labelledby="step-h">
        <h2 id="step-h">Next step</h2>
        {existing ? (
          <div className="card soft" role="status">
            <p>
              <strong>Saved:</strong> {existing.text}
            </p>
            {existing.followUp !== 'none' && !existing.outcome && (
              <Link className="btn secondary" to={`/follow-up/${existing.id}`}>
                Check in on this now
              </Link>
            )}
            <div className="btn-row">
              <Link className="btn" to="/today">
                Back to Today
              </Link>
            </div>
          </div>
        ) : (
          <>
            <fieldset className="radio-list">
              <legend className="sr-only">Choose what to do next</legend>
              {stepHidden ? (
                <p className="small muted">A step involving {nickname ?? 'the other person'} isn’t offered right now. A pause is a real choice.</p>
              ) : (
                <label>
                  <input type="radio" name="choice" checked={choice === 'step'} onChange={() => setChoice('step')} />
                  <span>
                    <strong>Try a step:</strong> {step}
                  </span>
                </label>
              )}
              <label>
                <input type="radio" name="choice" checked={choice === 'pause'} onChange={() => setChoice('pause')} />
                <span>
                  <strong>Take a deliberate pause.</strong> Notice, don’t act yet.
                </span>
              </label>
              <label>
                <input type="radio" name="choice" checked={choice === 'none'} onChange={() => setChoice('none')} />
                <span>Nothing for now</span>
              </label>
            </fieldset>
            {choice && choice !== 'none' && (
              <fieldset>
                <legend>When should we check in?</legend>
                <ChipGroup label="Follow-up time" options={Object.keys(FOLLOW_UPS)} value={followUp} onChange={setFollowUp} />
              </fieldset>
            )}
            <div className="btn-row">
              <button type="button" className="btn" disabled={!choice} onClick={save}>
                Save my choice
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
