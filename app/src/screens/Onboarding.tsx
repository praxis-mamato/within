import { forwardRef, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FOCUS_OPTIONS, OUTCOME_OPTIONS, REFLECTIONS } from '../data/fixtures';
import { ChipGroup, PerspectiveCard, SafetyPanel } from '../components/ui';
import { Orbit } from '../components/Illustrations';
import { SAMPLE_BIRTH, useStore, type Birth } from '../state';

const STEPS = 8;

const Heading = forwardRef<HTMLHeadingElement, { children: string }>(function Heading({ children }, ref) {
  return (
    <h1 tabIndex={-1} ref={ref}>
      {children}
    </h1>
  );
});

/** Turns the chosen outcome into a starting purpose the user can edit. */
const PURPOSE_FOR: Record<string, string> = {
  Clarity: 'Notice what I need before I respond',
  'Expressing a need': 'Speak honestly, stay connected',
  'Preparing a conversation': 'Prepare what I want to say, calmly',
  Acceptance: 'Accept what I can’t change, and choose what I can',
  'Defining a boundary': 'Name one boundary and keep it',
};

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
  const [choice, setChoice] = useState<string[]>([]);
  const [remind, setRemind] = useState<boolean | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const r = REFLECTIONS.self;

  // Move focus to each new step's heading so screen-reader users hear where they are.
  useEffect(() => heading.current?.focus(), [step]);

  const next = () => {
    if (step === 2) {
      dispatch({ type: 'onboarding/answers', focus, focusText, outcome: outcome[0] ?? '' });
      setBehavior(PURPOSE_FOR[outcome[0]] ?? 'Speak honestly, stay connected');
    }
    setStep(step + 1);
  };
  const finish = () => {
    dispatch({
      type: 'onboarding/finish',
      birth,
      nickname: mode === 'other' && nickname.trim() ? nickname.trim() : null,
      intention: outcome[0] ?? 'Clarity',
      behavior,
    });
    const picked = choice[0];
    if (picked) {
      const kind = picked.startsWith('Try') ? 'step' : picked.startsWith('Take') ? 'pause' : 'none';
      dispatch({
        type: 'action/choose',
        reflectionId: r.id,
        choice: kind,
        text: kind === 'step' ? r.step : kind === 'pause' ? 'A deliberate pause' : 'Nothing for now',
        followUp: kind === 'none' ? 'none' : remind ? 'in_3_days' : 'none',
      });
    }
    if (remind) dispatch({ type: 'notifications/set', on: true });
    nav('/today');
  };


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
          <p className="sub">Choose any that fit, or describe it in your own words.</p>
          <ChipGroup label="Topics" multi options={FOCUS_OPTIONS} value={focus} onChange={setFocus} />
          <label htmlFor="focus-text">
            In your own words <span className="hint">Optional</span>
          </label>
          <textarea id="focus-text" value={focusText} onChange={(e) => setFocusText(e.target.value)} placeholder="e.g. I say yes and later feel resentful." />
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
          <ChipGroup label="Outcome" options={OUTCOME_OPTIONS} value={outcome} onChange={setOutcome} />
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
          <div className="banner" role="note">
            <strong>Prototype:</strong> sample details are filled in. Please don’t enter your real birth details.
          </div>
          <label htmlFor="b-date">
            Birth date <span className="hint">Both traditions start from the date.</span>
          </label>
          <input id="b-date" type="date" value={birth.date} onChange={(e) => setBirth({ ...birth, date: e.target.value })} />
          <fieldset className="radio-list">
            <legend>
              Birth time <span className="hint">Needed for rising sign, houses, and some timing. We never guess it.</span>
            </legend>
            {(
              [
                ['exact', 'I know it'],
                ['approximate', 'I know roughly'],
                ['unknown', 'I don’t know'],
              ] as const
            ).map(([v, l]) => (
              <label key={v}>
                <input type="radio" name="tp" checked={birth.timePrecision === v} onChange={() => setBirth({ ...birth, timePrecision: v })} />
                {l}
              </label>
            ))}
          </fieldset>
          {birth.timePrecision !== 'unknown' && (
            <>
              <label htmlFor="b-time">Time</label>
              <input id="b-time" type="time" value={birth.time} onChange={(e) => setBirth({ ...birth, time: e.target.value })} />
            </>
          )}
          {birth.timePrecision === 'approximate' && (
            <>
              <label htmlFor="b-win">Give or take</label>
              <select id="b-win" value={birth.windowMinutes} onChange={(e) => setBirth({ ...birth, windowMinutes: Number(e.target.value) })}>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </>
          )}
          <label htmlFor="b-place">
            Birth place <span className="hint">Sets the time zone and the sky’s position.</span>
          </label>
          <input id="b-place" type="text" value={birth.place} onChange={(e) => setBirth({ ...birth, place: e.target.value })} />
          <p className="small muted">We’ll show the time zone we used so you can check it: UTC−07:00 (sample).</p>
          <div className="btn-row">
            <button className="btn" type="button" disabled={!birth.date || !birth.place.trim()} onClick={next}>
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
          {state.lensOrder.map((t) => (
            <PerspectiveCard key={t} p={r.perspectives[t]} reflectionId="onboarding" />
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
          <Heading ref={heading}>{r.question}</Heading>
          <p className="sub">Then choose what you’d like to do. Every option is a real choice.</p>
          <ChipGroup
            label="Next step"
            options={[`Try: ${r.step}`, 'Take a deliberate pause', 'Nothing for now']}
            value={choice}
            onChange={setChoice}
          />
          <label htmlFor="purpose">
            Your purpose <span className="hint">Edit it so it sounds like you.</span>
          </label>
          <input id="purpose" type="text" value={behavior} onChange={(e) => setBehavior(e.target.value)} />
          <div className="btn-row">
            <button className="btn" type="button" disabled={!choice.length || !behavior.trim()} onClick={next}>
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
