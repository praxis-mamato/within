import { startTransition, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthFields } from '../components/BirthFields';
import { CrystalOrb } from '../components/CrystalOrb';
import { track } from '../services/telemetry';
import { SAMPLE_BIRTH, useStore, type Birth } from '../state';

const ASK = ['When is a good day to ask for a raise?', 'What’s my rising sign?', 'Should I reach out to them?', 'What am I moving through this year?'];

/** The way in: the Oracle greets you, asks when you were born, and asks what you seek. */
export default function OracleIntro() {
  const { dispatch } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState<'welcome' | 'birth' | 'ask'>('welcome');
  const [birth, setBirth] = useState<Birth>(SAMPLE_BIRTH);
  const [q, setQ] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    track('onboarding_step', { step: step === 'welcome' ? 0 : step === 'birth' ? 1 : 2 });
  }, [step]);

  const begin = (question: string) =>
    startTransition(() => {
      dispatch({ type: 'onboarding/answers', focus: [], focusText: question, outcome: 'Clarity' });
      dispatch({ type: 'onboarding/finish', birth, nickname: null, intention: 'Clarity', behavior: 'Ask, listen, and choose' });
      track('onboarding_finished', { self_only: true, time_precision: birth.timePrecision, reminder: false });
      nav('/oracle', { state: { ask: question } });
    });

  return (
    <div className="oracle-scene intro-scene">
      <div className="intro-orb" aria-hidden="true">
        <CrystalOrb phase={step === 'ask' && q.trim() ? 'seeking' : 'idle'} />
      </div>

      {step === 'welcome' && (
        <>
          <h1 ref={heading} tabIndex={-1} className="oracle-welcome">
            Welcome to the Oracle…
          </h1>
          <p className="intro-line">Ask anything. The stars answer, from your own chart.</p>
          <button type="button" className="btn intro-btn" onClick={() => setStep('birth')}>
            Begin
          </button>
          <p className="small oracle-muted intro-fine">Free · 30 seconds · your chart stays on your phone</p>
        </>
      )}

      {step === 'birth' && (
        <>
          <h1 ref={heading} tabIndex={-1} className="oracle-welcome">
            When were you born?
          </h1>
          <p className="intro-line">The Oracle reads the sky at that moment.</p>
          <div className="intro-form">
            <BirthFields value={birth} onChange={setBirth} idPrefix="ob" />
          </div>
          <button type="button" className="btn intro-btn" disabled={!birth.date || !birth.tz} onClick={() => setStep('ask')}>
            Continue
          </button>
          <p className="small oracle-muted intro-fine">For reflection, not prediction. Not medical, legal, or mental health advice.</p>
        </>
      )}

      {step === 'ask' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) begin(q.trim());
          }}
        >
          <h1 ref={heading} tabIndex={-1} className="oracle-welcome">
            What do you seek?
          </h1>
          <label htmlFor="intro-q" className="sr-only">
            Your question
          </label>
          <textarea id="intro-q" className="intro-q" rows={2} maxLength={300} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the Oracle…" />
          <div className="chips">
            {ASK.map((x) => (
              <button key={x} type="button" className="chip" onClick={() => begin(x)}>
                {x}
              </button>
            ))}
          </div>
          <button type="submit" className="btn intro-btn" disabled={!q.trim()}>
            Ask the Oracle
          </button>
        </form>
      )}
    </div>
  );
}
