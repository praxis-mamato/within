/**
 * Gift a membership: anyone can buy a year with the Oracle for someone else and gets a code to give,
 * with a card to print or send. Public page (no chart or sign-in needed). Hidden in the store apps,
 * which can't sell outside the store.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LogoMark } from '../components/Illustrations';
import { IN_PLAY_APP } from '../services/config';
import { buyGift, giftCode } from '../services/gift';
import { track } from '../services/telemetry';

export const GIFT_TEXT = {
  title: 'Give a year with the Oracle',
  lede: 'For the person who reads their horoscope twice: a full year of Within, the astrology app that answers their own questions from their exact birth chart, Western and Vedic, with the dates that matter for them.',
  includes: ['Unlimited personal answers from their whole chart', 'Talk it through with the Oracle, who remembers them if they let it', 'Full readings, timing, relationships and the Moon calendar', 'Their birth details stay on their phone'],
  price: '$100 for a full year · one payment, no renewal',
  card: 'A year with the Oracle',
  how: 'Open withinoracle.app, make your chart, sign in, tap Become a member, and enter this code under “Have a code?”.',
};

export function Gift() {
  const [params] = useSearchParams();
  const session = params.get('session');
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    giftCode(session).then(
      (c) => (setCode(c), track('gift_bought')),
      (e) => setError(e instanceof Error ? e.message : 'Something went wrong.'),
    );
  }, [session]);

  const buy = async () => {
    setBusy(true);
    setError(null);
    track('gift_checkout');
    try {
      await buyGift();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout couldn’t start.');
      setBusy(false);
    }
  };

  return (
    <div className="app gift">
      <header className="topbar no-print">
        <Link className="wordmark" to="/">
          <LogoMark />
          WITHIN
        </Link>
      </header>
      <main id="main">
        {session ? (
          <>
            <h1 className="no-print">Your gift is ready</h1>
            {error && <p role="alert">{error}</p>}
            {!code && !error && <p>Making the gift code…</p>}
            {code && (
              <>
                <section className="gift-card" aria-label="Gift card">
                  <LogoMark />
                  <p className="kicker">WITHIN · THE ORACLE</p>
                  <h2>{GIFT_TEXT.card}</h2>
                  <p className="gift-code">{code}</p>
                  <p className="small">{GIFT_TEXT.how}</p>
                </section>
                <p className="no-print small">Save this page or the code: it is the gift. It works once, for one person, for a year from when they use it.</p>
                <div className="no-print row">
                  <button className="btn" onClick={() => navigator.clipboard?.writeText(`${GIFT_TEXT.card} 🔮\nYour code: ${code}\n${GIFT_TEXT.how}`)}>
                    Copy the gift message
                  </button>
                  <button className="btn quiet" onClick={() => window.print()}>
                    Print the card
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <h1>{GIFT_TEXT.title}</h1>
            <p className="lede">{GIFT_TEXT.lede}</p>
            <ul>
              {GIFT_TEXT.includes.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            {IN_PLAY_APP ? (
              <p>Gifts are bought on withinoracle.app.</p>
            ) : (
              <>
                <p>
                  <strong>{GIFT_TEXT.price}</strong>
                </p>
                <button className="btn" onClick={buy} disabled={busy}>
                  {busy ? 'Opening checkout…' : 'Give a year'}
                </button>
                <p className="small">You get the code and a card to print or send right after paying. No account needed to buy.</p>
              </>
            )}
            {error && <p role="alert">{error}</p>}
          </>
        )}
      </main>
    </div>
  );
}
