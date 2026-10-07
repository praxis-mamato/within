import { useMemo, useState } from 'react';
import { useCharts } from '../astro/useCharts';
import type { ReadingSection } from '../content/fullReading';
import { factSheet, requestDeepReading, sourceLines, type Kind } from '../services/aiReading';
import { screen } from '../lib/screener';
import { useStore } from '../state';
import { SafetyPanel } from './ui';

const LABEL: Record<Kind, string> = {
  western: 'your Western chart',
  vedic: 'your Vedic chart',
  timing: 'your month ahead',
  together: 'the two of you',
  question: 'your question',
};

/** Hash of the facts, so a saved reading is reused until the chart (or the month) changes. */
const keyOf = (kind: string, facts: string[]) => {
  let h = 0;
  for (const ch of kind + facts.join('|')) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return `${kind}:${(h >>> 0).toString(36)}`;
};

export function AiDeepDive({ kind, sections }: { kind: Exclude<Kind, 'question'>; sections: ReadingSection[] }) {
  const { state, dispatch } = useStore();
  const { me, other } = useCharts();
  const [busy, setBusy] = useState<'reading' | 'question' | null>(null);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [answerKey, setAnswerKey] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);

  const place = { lat: state.birth.lat, lon: state.birth.lon };
  const theirs = state.person?.birth;
  const facts = useMemo(
    () => (me ? factSheet(kind, me, place, other && theirs ? { chart: other, place: { lat: theirs.lat, lon: theirs.lon } } : null) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me, other, kind, state.birth.lat, state.birth.lon, theirs],
  );
  const source = useMemo(() => sourceLines(sections), [sections]);
  const key = keyOf(kind, facts);
  const saved = state.aiReadings[key];
  const answer = answerKey ? state.aiReadings[answerKey] : null;

  if (!me) return null;

  if (!state.aiConsent) {
    return (
      <section className="card ai-card" aria-labelledby="ai-h">
        <h2 id="ai-h" style={{ marginTop: 0 }}>
          Go deeper with AI
        </h2>
        <p>Get a connected reading of {LABEL[kind]} that ties your placements together, and ask your own questions about your chart.</p>
        <ul className="small">
          <li>Written by Claude, an AI model, from your calculated placements and Within’s reviewed interpretations.</li>
          <li>Only the placements are sent (for example “Venus in Libra, 7th house”). Never your name, birth date, time, place, journal, or notes about anyone.</li>
          <li>Within doesn’t store what’s sent. The reading is saved only on this device.</li>
          <li>Every reading is checked against Within’s rules before you see it. It can still be wrong; tell us if it is.</li>
        </ul>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'ai/consent', on: true })}>
          Turn on AI readings
        </button>
        <p className="small muted" style={{ marginTop: 8 }}>
          You can turn this off any time in Settings.
        </p>
      </section>
    );
  }

  const write = async () => {
    setBusy('reading');
    setError('');
    try {
      const r = await requestDeepReading(kind, facts, source);
      dispatch({ type: 'ai/save', key, reading: { at: new Date().toISOString(), sections: r.sections, reflection_question: r.reflection_question } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The reading couldn’t be written right now.');
    } finally {
      setBusy(null);
    }
  };

  const ask = async () => {
    const q = question.trim();
    if (!q) return;
    // Safety first: a question about fear, danger, or self-harm is never sent for interpretation.
    if (screen(q).flagged) {
      dispatch({ type: 'text/screen', text: q });
      setFlagged(true);
      return;
    }
    setBusy('question');
    setError('');
    try {
      const qFacts = [...facts, ...(kind === 'western' && me ? factSheet('vedic', me, place) : [])].slice(0, 220);
      const r = await requestDeepReading('question', qFacts, source, q);
      const k = keyOf(`q:${q}`, qFacts);
      dispatch({ type: 'ai/save', key: k, reading: { at: new Date().toISOString(), sections: r.sections, reflection_question: r.reflection_question } });
      setAnswerKey(k);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your question couldn’t be answered right now.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="card ai-card" aria-labelledby="ai-h" aria-busy={!!busy}>
      <div className="lens-label">
        <span className="dot" aria-hidden="true" />
        AI-written from your chart
      </div>
      <h2 id="ai-h" style={{ marginTop: 0 }}>
        A deeper reading of {LABEL[kind]}
      </h2>
      {!saved ? (
        <button type="button" className="btn" disabled={!!busy} onClick={write}>
          {busy === 'reading' ? 'Writing your reading…' : 'Write my deeper reading'}
        </button>
      ) : (
        <>
          <AiSections reading={saved} />
          <p className="small muted">
            Written {new Date(saved.at).toLocaleDateString()} · saved on this device ·{' '}
            <button type="button" className="link small" disabled={!!busy} onClick={write}>
              {busy === 'reading' ? 'Rewriting…' : 'Write it again'}
            </button>
          </p>
        </>
      )}

      <hr />
      <h3>Ask about your chart</h3>
      <label htmlFor={`ai-q-${kind}`} className="sr-only">
        Your question
      </label>
      <textarea id={`ai-q-${kind}`} value={question} maxLength={500} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Why do I hold back what I need in relationships?" />
      <button type="button" className="btn secondary" disabled={!!busy || !question.trim()} onClick={ask}>
        {busy === 'question' ? 'Thinking about your chart…' : 'Ask'}
      </button>
      {flagged && <SafetyPanel />}
      {answer && <AiSections reading={answer} />}
      {error && (
        <p role="alert" className="banner">
          {error}
        </p>
      )}
    </section>
  );
}

function AiSections({ reading }: { reading: { sections: { title: string; body: string; tradition: string }[]; reflection_question: string } }) {
  return (
    <div className="reading-items" style={{ marginTop: 12 }}>
      {reading.sections.map((s) => (
        <article key={s.title} className="reading-item">
          <h3>{s.title}</h3>
          <p>{s.body}</p>
          <p className="basis">{s.tradition === 'both' ? 'Western and Vedic' : s.tradition === 'vedic' ? 'Vedic' : 'Western'}</p>
        </article>
      ))}
      <p>
        <strong>To reflect on:</strong> {reading.reflection_question}
      </p>
    </div>
  );
}
