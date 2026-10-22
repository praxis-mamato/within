import { useState, type FormEvent } from 'react';
import { IN_PLAY_APP_ONLY as IN_PLAY_APP } from '../services/config';
import { askLater, markReviewed, PLAY_REVIEW_URL, shouldAsk, submitReview } from '../services/reviews';

export const REVIEW_TEXT = {
  ask: 'Would you leave the Oracle a few words?',
  why: 'Honest reviews, good or critical, help others find it and help us make it better.',
  write: 'Leave a review',
  later: 'Not now',
  stars: 'Your rating',
  body: 'Your review',
  bodyHint: 'What did the Oracle get right, or wrong?',
  name: 'First name or initials (optional)',
  consent: 'You may show this review on the Within website with the name above',
  free: 'I received free access to Within',
  send: 'Send review',
  thanks: 'Thank you. The Oracle hears you.',
};

/**
 * Asks for a review at a natural pause: shown to everyone who reaches it (never only to happy users).
 * In the Android app it opens the Play Store review page; on the web it opens a short form.
 * `always` shows it regardless of timing (Settings).
 */
export function ReviewPrompt({ answers = 0, always = false }: { answers?: number; always?: boolean }) {
  const [show, setShow] = useState(() => always || shouldAsk(answers));
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [free, setFree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  if (!show) return null;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await submitReview({ rating, body, name, consentPublic: consent, freeAccess: free });
      markReviewed();
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your review couldn’t be sent.');
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <section className="card review-ask" aria-live="polite">
        <p>{REVIEW_TEXT.thanks}</p>
      </section>
    );

  return (
    <section className="card review-ask" aria-labelledby="rv-h">
      <h2 id="rv-h">{REVIEW_TEXT.ask}</h2>
      <p className="small muted">{REVIEW_TEXT.why}</p>
      {!open ? (
        <div className="btn-row">
          {IN_PLAY_APP ? (
            <a className="btn" href={PLAY_REVIEW_URL} onClick={markReviewed}>
              {REVIEW_TEXT.write}
            </a>
          ) : (
            <button type="button" className="btn" onClick={() => setOpen(true)}>
              {REVIEW_TEXT.write}
            </button>
          )}
          {!always && (
            <button type="button" className="btn quiet" onClick={() => (askLater(answers), setShow(false))}>
              {REVIEW_TEXT.later}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={send}>
          <fieldset className="stars">
            <legend>{REVIEW_TEXT.stars}</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={n <= rating ? 'on' : ''}>
                <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
                <span aria-hidden="true">★</span>
                <span className="sr-only">{n} of 5</span>
              </label>
            ))}
          </fieldset>
          <label htmlFor="rv-body">{REVIEW_TEXT.body}</label>
          <textarea id="rv-body" rows={4} minLength={10} maxLength={600} required value={body} onChange={(e) => setBody(e.target.value)} placeholder={REVIEW_TEXT.bodyHint} />
          <label htmlFor="rv-name">{REVIEW_TEXT.name}</label>
          <input id="rv-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          <label className="toggle">
            <span>{REVIEW_TEXT.consent}</span>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          </label>
          <label className="toggle">
            <span>{REVIEW_TEXT.free}</span>
            <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
          </label>
          {error && (
            <p role="alert" className="small">
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy || !rating || body.trim().length < 10}>
            {busy ? 'Sending…' : REVIEW_TEXT.send}
          </button>
        </form>
      )}
    </section>
  );
}
