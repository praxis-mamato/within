import { useEffect, useMemo, useState } from 'react';
import { track } from '../services/telemetry';
import { composeReflection } from '../content/compose';
import { OUTCOME_STEPS, planFor, SITUATIONS } from '../content/topics';
import { skyNotes } from '../content/fullReading';
import { SIGN_ELEMENT } from '../content/templates';
import { PILLAR_ANSWERS } from '../data/prompts';
import { Link, useParams } from 'react-router-dom';
import { REFLECTIONS, type Pillar } from '../data/fixtures';
import { Paywall } from '../components/Paywall';
import { Back, ChipGroup, PerspectiveCard, PromptChips, SafetyPanel, TogetherCard } from '../components/ui';
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
  const composed = useMemo(() => (me ? composeReflection(r.pillar, me, other, nickname) : null), [me, other, nickname, r.pillar]);

  const [situation, setSituation] = useState(pillar === 'self' && state.focusText ? state.focusText : r.situation);
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string[]>(['In 3 days']);

  // Self follows the person's own situation and outcome (same logic as onboarding step 7);
  // other pillars use the chart-based question and step, plus the outcome's step where it fits.
  const moonSign = me?.western.moonSign.value ?? me?.western.planets.find((x) => x.body === 'Moon')?.sign;
  const plan = useMemo(
    () => planFor(situation, state.focus, state.outcome, moonSign ? SIGN_ELEMENT[moonSign] : null, me ? skyNotes(me) : []),
    [situation, state.focus, state.outcome, moonSign, me],
  );
  const question = pillar === 'self' ? plan.question : (composed?.question ?? personalize(r.question, nickname));
  const answerIdeas = pillar === 'self' ? plan.answers : PILLAR_ANSWERS[r.pillar];
  const allSteps =
    pillar === 'self'
      ? plan.steps
      : [
          { text: composed?.step ?? personalize(r.step, nickname), involvesOther: composed?.stepInvolvesOther ?? r.stepInvolvesOther, source: 'situation' as const },
          ...(pillar === 'purpose' && OUTCOME_STEPS[state.outcome] ? [{ ...OUTCOME_STEPS[state.outcome], text: OUTCOME_STEPS[state.outcome].step, involvesOther: OUTCOME_STEPS[state.outcome].stepInvolvesOther, source: 'outcome' as const }] : []),
        ];
  // Safety: steps involving the other person are never offered after a flag (PRD §6, build spec §8.1).
  const steps = allSteps.filter((x) => !(state.safety.suppressContactActions && x.involvesOther));
  const stepHidden = steps.length < allSteps.length;

  const save = () => {
    if (!choice) return;
    if (answer.trim()) dispatch({ type: 'journal/add', body: `${question}\n${answer.trim()}` });
    const kind: Choice = choice === 'pause' ? 'pause' : choice === 'none' ? 'none' : 'step';
    dispatch({
      type: 'action/choose',
      reflectionId: r.id,
      choice: kind,
      text: kind === 'step' ? choice : kind === 'pause' ? 'A deliberate pause' : 'Nothing for now',
      followUp: choice === 'none' ? 'none' : FOLLOW_UPS[followUp[0] ?? 'No reminder'],
    });
    track('step_chosen', { pillar: r.pillar, choice: kind });
  };
  useEffect(() => track('reflection_opened', { pillar: r.pillar }), [r.pillar]);

  const reflectionBody = (
    <>
      <section aria-labelledby="persp-h">
        <h2 id="persp-h">Two perspectives</h2>
        <p className="small muted">
          Interpretations, not predictions or facts about anyone. Each tradition is shown on its own; you decide what fits.
        </p>
        {state.lensOrder.map((t) => (
          <PerspectiveCard key={t} p={r.perspectives[t]} reflectionId={r.id} nickname={nickname} facts={me ? factsFor(r.pillar, t, me, other, nickname) : null} composed={composed?.[t]} />
        ))}
        <TogetherCard text={composed?.together.body ?? r.together} reflectionId={r.id} nickname={nickname} />
      </section>

      <section aria-labelledby="q-h">
        <h2 id="q-h">Reflection</h2>
        <label htmlFor="answer">
          {question}
          <span className="hint">Optional. Saved to your private journal.</span>
        </label>
        {!existing && <PromptChips label="Ideas to start from" options={answerIdeas} value={answer} onChange={setAnswer} />}
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
              {stepHidden && <p className="small muted">A step involving {nickname ?? 'the other person'} isn’t offered right now. A pause is a real choice.</p>}
              {steps.map((x) => (
                <label key={x.text}>
                  <input type="radio" name="choice" checked={choice === x.text} onChange={() => setChoice(x.text)} />
                  <span>
                    <strong>Try:</strong> {x.text}
                    {steps.length > 1 && <span className="hint">{x.source === 'situation' ? 'Based on what’s happening' : `Based on your goal: ${state.outcome.toLowerCase()}`}</span>}
                  </span>
                </label>
              ))}
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
            {pillar === 'self' && plan.style && <p className="small muted">Your chart suggests a style that may come easily: <strong>{plan.style}</strong>.</p>}
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
            <PromptChips label="Or pick one" options={SITUATIONS} value={situation} onChange={setSituation} mode="replace" />
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

      {pillar === 'self' ? reflectionBody : <Paywall where="reflection" what="This reflection">{reflectionBody}</Paywall>}
    </>
  );
}
