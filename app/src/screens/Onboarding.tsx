import { forwardRef, startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { BirthFields } from '../components/BirthFields';
import { computeNatal } from '../astro/natal';
import { factsFor } from '../astro/facts';
import { composeReflection } from '../content/compose';
import { useNavigate } from 'react-router-dom';
import { FOCUS_OPTIONS, REFLECTIONS } from '../data/fixtures';
import { OUTCOMES, PURPOSES } from '../data/prompts';
import { planFor, SITUATION_GROUPS } from '../content/topics';
import { skyNotes } from '../content/fullReading';
import { SIGN_ELEMENT } from '../content/templates';
import { ChipGroup, PerspectiveCard, PromptChips, SafetyPanel } from '../components/ui';
import { Orbit } from '../components/Illustrations';
import { SharingToggles } from '../components/Sharing';
import { track } from '../services/telemetry';
import { load as loadInterview, markStep, update as updateInterview, visibleLenses } from '../interview/session';
import { SAMPLE_BIRTH, useStore, type Birth } from '../state';

const STEPS = 8;

const Heading = forwardRef<HTMLHeadingElement, { children: string }>(function Heading({ children }, ref) {
  return (
    <h1 tabIndex={-1} ref={ref}>
      {children}
    </h1>
  );
});


export default function Onboarding() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [focus, setFocus] = useState<string[]>([]);
  const [focusText, setFocusText] = useState('');
  const [outcome, setOutcome] = useState<string[]>([]);
  const [birth, setBirth] = useState<Birth>(SAMPLE_BIRTH);
  const [mode, setMode] = useState<'self' | 'other' | null>(null);
  const [nickname, setNickname] = useState('Alex');
  const [behavior, setBehavior] = useState('');
  const [choice, setChoice] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [remind, setRemind] = useState<boolean | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const r = REFLECTIONS.self;
  const chart = useMemo(() => {
    try {
      return step >= 6 ? computeNatal(birth) : null;
    } catch {
      return null;
    }
  }, [birth, step]);
  const composed = useMemo(() => (chart ? composeReflection('self', chart, null) : null), [chart]);
  // Step 7 comes from the person's own answers in steps 1–2; the chart only suggests a style.
  const moonSign = chart?.western.moonSign.value ?? chart?.western.planets.find((p) => p.body === 'Moon')?.sign;
  const plan = useMemo(
    () => planFor(focusText, focus, outcome[0] ?? '', moonSign ? SIGN_ELEMENT[moonSign] : null, chart ? skyNotes(chart) : []),
    [focusText, focus, outcome, moonSign, chart],
  );
  const stepOptions = plan.steps.filter((x) => !(state.safety.suppressContactActions && x.involvesOther));

  // Move focus to each new step's heading so screen-reader users hear where they are.
  useEffect(() => heading.current?.focus(), [step]);
  useEffect(() => {
    track('onboarding_step', { step });
    markStep(step);
  }, [step]);

  const next = () => {
    if (step === 2) {
      dispatch({ type: 'onboarding/answers', focus, focusText, outcome: outcome[0] ?? '' });
      setBehavior(OUTCOMES[outcome[0]] ?? 'Speak honestly, stay connected');
    }
    setStep(step + 1);
  };
  // One transition for the state change and the navigation (the router's updates are transitions),
  // so the signed-in routes never render at the old address and redirect away from the check.
  const finish = () => startTransition(() => {
    dispatch({
      type: 'onboarding/finish',
      birth,
      nickname: mode === 'other' && nickname.trim() ? nickname.trim() : null,
      intention: outcome[0] ?? 'Clarity',
      behavior,
    });
    if (answer.trim()) dispatch({ type: 'journal/add', body: `${plan.question}\n${answer.trim()}` });
    if (choice) {
      const kind = choice === 'pause' ? 'pause' : choice === 'none' ? 'none' : 'step';
      dispatch({
        type: 'action/choose',
        reflectionId: r.id,
        choice: kind,
        text: kind === 'step' ? choice : kind === 'pause' ? 'A deliberate pause' : 'Nothing for now',
        followUp: kind === 'none' ? 'none' : remind ? 'in_3_days' : 'none',
      });
    }
    if (remind) dispatch({ type: 'notifications/set', on: true });
    track('onboarding_finished', { self_only: !(mode === 'other' && nickname.trim()), time_precision: birth.timePrecision, reminder: !!remind });
    if (choice) track('step_chosen', { pillar: 'onboarding', choice: choice === 'pause' || choice === 'none' ? choice : 'step' });
    if (loadInterview()) {
      updateInterview((s) => ({ ...s, finishedAt: Date.now(), choice: choice === 'pause' || choice === 'none' ? choice : choice ? 'step' : null }));
      nav('/interview/check');
    } else nav('/today');
  });


  return (
    <>
      <div className="progress" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step}>
        <div style={{ width: `${(step / STEPS) * 100}%` }} />
      </div>
      <p className="small muted">
        Step {step} of {STEPS}
        {step > 1 && (
          <>
            {' · '}
            <button type="button" className="link" onClick={() => setStep(step - 1)}>
              Back
            </button>
          </>
        )}
      </p>

      {step === 1 && (
        <>
          <Orbit />
          <Heading ref={heading}>What would you like help understanding?</Heading>
          <p className="sub">About you, the sky right now, the people around you, or a relationship. Choose any that fit.</p>
          <ChipGroup label="Topics" multi options={FOCUS_OPTIONS} value={focus} onChange={setFocus} />
          <label htmlFor="focus-text">
            What’s happening? <span className="hint">Tap one below or write your own. You can edit it.</span>
          </label>
          {SITUATION_GROUPS.map((g) => (
            <PromptChips key={g.label} label={g.label} options={Object.keys(g.items)} value={focusText} onChange={setFocusText} mode="replace" limit={4} />
          ))}
          <textarea id="focus-text" value={focusText} onChange={(e) => setFocusText(e.target.value)} placeholder="In your own words" />
          <div className="btn-row">
            <button className="btn" type="button" disabled={!focus.length && !focusText.trim()} onClick={next}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Heading ref={heading}>What would a useful outcome look like?</Heading>
          <p className="sub">This becomes your starting purpose. You can change it any time.</p>
          <ChipGroup label="Outcome" options={Object.keys(OUTCOMES)} value={outcome} onChange={setOutcome} />
          <div className="btn-row">
            <button className="btn" type="button" disabled={!outcome.length} onClick={next}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          {state.safety.flagged && <SafetyPanel />}
          <Heading ref={heading}>How Within works</Heading>
          <div className="card">
            <p>You’ll see two astrology traditions, Western and Vedic, side by side, next to what you tell us about your life.</p>
            <p>They are <strong>interpretations, not predictions</strong>. They can’t tell you what someone else thinks, or what will happen.</p>
            <p>You choose your purpose and your next step, including choosing to pause. Your entries are private.</p>
            <p className="small muted">Within isn’t therapy, medical, or legal advice, and isn’t an emergency service.</p>
          </div>
          <details className="card soft">
            <summary>Help improve Within (optional, off unless you turn it on)</summary>
            <SharingToggles />
          </details>
          <div className="btn-row">
            <button className="btn" type="button" onClick={next}>
              I understand
            </button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <Heading ref={heading}>Your birth details</Heading>
          <p className="sub">Calculated on this device and saved there, encrypted. Never sent to us.</p>
          <BirthFields value={birth} onChange={setBirth} idPrefix="ob" />
          <div className="btn-row">
            <button className="btn" type="button" disabled={!birth.date || !birth.tz} onClick={next}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <Heading ref={heading}>Just you, or someone too?</Heading>
          <p className="sub">Within works fully on your own. You can add someone later.</p>
          <fieldset className="radio-list">
            <legend className="sr-only">Who to explore</legend>
            <label>
              <input type="radio" name="mode" checked={mode === 'self'} onChange={() => setMode('self')} />
              Just me for now
            </label>
            <label>
              <input type="radio" name="mode" checked={mode === 'other'} onChange={() => setMode('other')} />
              Me and one other person
            </label>
          </fieldset>
          {mode === 'other' && (
            <>
              <label htmlFor="nick">
                A nickname for them <span className="hint">No surname or contact details. Their birth details are optional and can wait.</span>
              </label>
              <input id="nick" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <p className="small muted">Adding someone’s details doesn’t mean they’ve agreed to this. Keep what you add about them respectful and private.</p>
            </>
          )}
          <div className="btn-row">
            <button className="btn" type="button" disabled={!mode || (mode === 'other' && !nickname.trim())} onClick={next}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 6 && (
        <>
          <Heading ref={heading}>Your first reflection</Heading>
          <p className="sub muted">{r.subheading}</p>
          <p className="small muted" style={{ textAlign: 'center' }}>
            Placements are calculated from your details.
          </p>
          {visibleLenses(state.lensOrder).map((t) => (
            <PerspectiveCard key={t} p={r.perspectives[t]} reflectionId="onboarding" facts={chart ? factsFor('self', t, chart, null) : null} composed={composed?.[t]} />
          ))}
          <div className="btn-row">
            <button className="btn" type="button" onClick={next}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 7 && (
        <>
          <div className="card soft recap">
            <p className="small muted" style={{ margin: 0 }}>
              You told us
            </p>
            <p style={{ margin: 0 }}>{focusText.trim() ? `“${focusText.trim()}”` : focus.join(', ')}</p>
            {outcome[0] && (
              <p className="small" style={{ margin: 0 }}>
                You’d like: <strong>{outcome[0].toLowerCase()}</strong>
              </p>
            )}
          </div>
          <Heading ref={heading}>{plan.question}</Heading>
          <label htmlFor="ob-answer">
            Your answer <span className="hint">Optional. Saved to your private journal.</span>
          </label>
          <PromptChips label="Ideas to start from" options={plan.answers} value={answer} onChange={setAnswer} />
          <textarea id="ob-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />

          <fieldset className="radio-list">
            <legend>What would you like to do next?</legend>
            {stepOptions.map((x) => (
              <label key={x.text}>
                <input type="radio" name="ob-step" checked={choice === x.text} onChange={() => setChoice(x.text)} />
                <span>
                  <strong>Try:</strong> {x.text}
                  <span className="hint">{x.source === 'situation' ? 'Based on what’s happening' : `Based on your goal: ${outcome[0]?.toLowerCase()}`}</span>
                </span>
              </label>
            ))}
            <label>
              <input type="radio" name="ob-step" checked={choice === 'pause'} onChange={() => setChoice('pause')} />
              <span>
                <strong>Take a deliberate pause.</strong> Notice, don’t act yet.
              </span>
            </label>
            <label>
              <input type="radio" name="ob-step" checked={choice === 'none'} onChange={() => setChoice('none')} />
              <span>Nothing for now</span>
            </label>
          </fieldset>
          {plan.style && (
            <p className="small muted">
              Your chart suggests a style that may come easily: <strong>{plan.style}</strong>.
            </p>
          )}

          <label htmlFor="purpose">
            Your purpose <span className="hint">From the outcome you chose. Edit it, or pick another.</span>
          </label>
          <PromptChips label="Other purposes" options={PURPOSES.filter((x) => x !== behavior)} value={behavior} onChange={setBehavior} mode="replace" limit={4} />
          <input id="purpose" type="text" value={behavior} onChange={(e) => setBehavior(e.target.value)} />
          <div className="btn-row">
            <button
              className="btn"
              type="button"
              disabled={!choice || !behavior.trim()}
              onClick={() => {
                if (answer.trim()) dispatch({ type: 'text/screen', text: answer });
                next();
              }}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === 8 && (
        <>
          <Heading ref={heading}>Want a reminder to check in?</Heading>
          <p className="sub">Optional. Reminders never include names or relationship details.</p>
          <ChipGroup
            label="Reminder"
            options={['Yes, remind me', 'No reminders']}
            value={remind === null ? [] : [remind ? 'Yes, remind me' : 'No reminders']}
            onChange={(v) => setRemind(v.length ? v[0] === 'Yes, remind me' : null)}
          />
          {remind && <p className="small muted">In the real app, your device asks for permission only now, after you chose this.</p>}
          <div className="btn-row">
            <button className="btn" type="button" onClick={finish}>
              Save and go to Today
            </button>
          </div>
        </>
      )}
    </>
  );
}
