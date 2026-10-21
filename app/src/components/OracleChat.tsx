import { useEffect, useRef, useState } from 'react';
import { CHAT_LIMITS, talkToOracle, type ChatTurn } from '../services/oracleChat';
import { screen } from '../lib/screener';
import { track } from '../services/telemetry';
import { useStore } from '../state';
import { SafetyPanel } from './ui';

/**
 * "Talk to the Oracle": a conversation about what the person is living through, under the Oracle's answer.
 * The conversation lives only in this component, so it is gone when the page closes.
 */
export function OracleChat({ question, answer, facts }: { question: string; answer: string[]; facts: () => string[] }) {
  const { state, dispatch } = useStore();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [followups, setFollowups] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flagged, setFlagged] = useState(false);
  const factsRef = useRef<string[] | null>(null);
  const end = useRef<HTMLDivElement>(null);

  // A new question starts a new conversation.
  useEffect(() => {
    setTurns([]);
    setFollowups([]);
    setError('');
    setFlagged(false);
    factsRef.current = null;
  }, [question]);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), [turns.length, busy]);

  if (!state.aiConsent) {
    return (
      <div className="oracle-chat">
        <p className="small oracle-muted">
          Tell the Oracle what’s going on and it answers you personally, from your chart and today’s sky. What you write is sent with your chart placements to Claude, an AI model, to write the reply. Never your name or birth details. Within doesn’t store any of it.
        </p>
        <button type="button" className="btn secondary" onClick={() => dispatch({ type: 'ai/consent', on: true })}>
          Turn on talking with the Oracle
        </button>
      </div>
    );
  }

  const send = async (said = text) => {
    const msg = said.trim();
    if (!msg || busy) return;
    // Safety first: fear, danger, or self-harm is never sent for interpretation.
    if (screen(msg).flagged) {
      dispatch({ type: 'text/screen', text: msg });
      setFlagged(true);
      return;
    }
    const first = turns.length === 0;
    const next: ChatTurn[] = [...turns, { role: 'user', text: first ? `My question was: “${question}”\n\n${msg}` : msg }];
    setTurns(next);
    setText('');
    setFollowups([]);
    setBusy(true);
    setError('');
    try {
      factsRef.current ??= facts();
      const r = await talkToOracle(factsRef.current, answer, next);
      setTurns([...next, { role: 'assistant', text: r.reply }]);
      setFollowups(r.followups);
      track('oracle_chat', { turn: next.length });
    } catch (e) {
      setTurns(turns);
      setText(msg);
      setError(e instanceof Error ? e.message : 'The Oracle couldn’t answer right now.');
    } finally {
      setBusy(false);
    }
  };

  const full = turns.length >= CHAT_LIMITS.turns - 1;
  return (
    <div className="oracle-chat" aria-busy={busy}>
      {turns.map((t, i) => (
        <p key={i} className={`chat-bubble ${t.role === 'user' ? 'chat-me' : 'chat-oracle'}`}>
          {t.role === 'user' && i === 0 ? t.text.replace(/^My question was: “[^]*?”\n\n/, '') : t.text}
        </p>
      ))}
      {busy && <p className="chat-bubble chat-oracle chat-thinking">The Oracle is reading your chart…</p>}
      <div ref={end} />
      {flagged && <SafetyPanel />}
      {!busy && followups.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {followups.map((f) => (
            <button key={f} type="button" className="chip" onClick={() => void send(f)}>
              {f}
            </button>
          ))}
        </div>
      )}
      {full ? (
        <p className="small oracle-muted">This conversation is full. Ask a new question above to start another.</p>
      ) : (
        <>
          <label htmlFor="oracle-chat-in" className="sr-only">
            Tell the Oracle
          </label>
          <textarea
            id="oracle-chat-in"
            value={text}
            maxLength={CHAT_LIMITS.turnChars - 120}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={turns.length ? 'Say more, or ask what it means…' : 'Tell the Oracle what’s going on. For example: “It’s my mom’s birthday and the tears came out of nowhere.”'}
          />
          <button type="button" className="btn" disabled={busy || !text.trim()} onClick={() => void send()}>
            {busy ? 'Listening…' : turns.length ? 'Send' : 'Talk to the Oracle'}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="small oracle-note">
          {error}
        </p>
      )}
      <p className="small oracle-muted" style={{ marginTop: 8 }}>
        Written with AI help from your chart, never your name or birth details · Within doesn’t store this conversation · for reflection, not prediction
      </p>
    </div>
  );
}
