import { useEffect, useState } from 'react';
import { SignInButtons } from '../components/Paywall';
import { MiniOrb } from '../components/OracleBoard';
import { Back } from '../components/ui';
import { useAccount } from '../services/AccountContext';
import { bookAstrologer, fmtUsd, myBookings, PACKAGES, packageById, type Booking } from '../services/astrologer';
import { track } from '../services/telemetry';
import { useStore } from '../state';

const STATUS: Record<string, string> = { paid: 'Paid: your astrologer will email you to set a time', scheduled: 'Scheduled', completed: 'Completed', refunded: 'Refunded', cancelled: 'Cancelled' };

/** Sessions with a human astrologer: packages, a short intake, and Stripe Checkout. */
export default function Astrologer() {
  const { state } = useStore();
  const { account } = useAccount();
  const [pick, setPick] = useState(PACKAGES[0].id);
  const [questions, setQuestions] = useState('');
  const [availability, setAvailability] = useState('');
  const [shareBirth, setShareBirth] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const justPaid = typeof location !== 'undefined' && /[?&]booking=success/.test(location.search);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const b = state.birth;
  const birth = `${b.date}${b.time && b.timePrecision !== 'unknown' ? ` at ${b.time}${b.timePrecision === 'approximate' ? ' (approximate)' : ''}` : ', birth time unknown'}, ${b.place}`;

  useEffect(() => {
    if (account) void myBookings().then(setBookings);
  }, [account, justPaid]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      track('astrologer_checkout', { package: pick });
      await bookAstrologer({ packageId: pick, questions, availability, timezone: tz, shareBirth, birth });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout couldn’t start. Try again.');
      setBusy(false);
    }
  };
  const chosen = packageById(pick)!;

  return (
    <div className="oracle-scene live-scene">
      <Back to="/oracle" label="The Oracle" />
      <p className="kicker">The Oracle · Live readings</p>
      <h1 className="oracle-welcome">Seeking a live reading…</h1>
      <p className="sub">Face to face, on video, with a Within astrologer.</p>
      <div className="live-orb" aria-hidden="true">
        <MiniOrb />
      </div>

      {justPaid && (
        <div className="card soft" role="status">
          <h2 style={{ marginTop: 0 }}>The Oracle has heard you</h2>
          <p style={{ margin: 0 }}>Your astrologer will email you within one business day to set the time of your first reading. A receipt is on its way from Stripe.</p>
        </div>
      )}

      {bookings.length > 0 && (
        <section aria-labelledby="bk-h">
          <h2 id="bk-h">Your live readings</h2>
          <ul className="booking-list">
            {bookings.map((x) => (
              <li key={x.id} className="card">
                <strong>{packageById(x.package_id)?.name ?? x.package_id}</strong> · {fmtUsd(x.amount)}
                <span className="small muted" style={{ display: 'block' }}>
                  {new Date(x.created_at).toLocaleDateString()} · {STATUS[x.status] ?? x.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="pk-h">
        <h2 id="pk-h">Choose your readings</h2>
        <fieldset className="packages">
          <legend className="sr-only">Package</legend>
          {PACKAGES.map((p) => (
            <label key={p.id} className={`card package ${pick === p.id ? 'on' : ''}`}>
              <input type="radio" name="package" checked={pick === p.id} onChange={() => setPick(p.id)} />
              <span>
                <span className="package-head">
                  <strong>{p.name}</strong>
                  <span className="package-price">{fmtUsd(p.amount)}</span>
                </span>
                <span className="small muted" style={{ display: 'block' }}>
                  {p.sessions === 1 ? `One ${p.minutes}-minute session` : `${p.sessions} × ${p.minutes}-minute sessions · ${fmtUsd(Math.round(p.amount / p.sessions))} a session`}
                </span>
                <span style={{ display: 'block', marginTop: 4 }}>{p.summary}</span>
                <ul className="small">
                  {p.includes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      {!account ? (
        <div className="card">
          <p>Sign in to book, so your readings and receipts stay with your account.</p>
          <SignInButtons />
        </div>
      ) : (
        <form className="card" onSubmit={submit}>
          <h2 style={{ marginTop: 0 }}>Before you sit with the Oracle</h2>
          <label htmlFor="as-q">What do you seek?</label>
          <textarea id="as-q" rows={4} maxLength={1500} required minLength={10} value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="A decision, a relationship, a transition, your timing this year…" />
          <label htmlFor="as-a">When are you usually free?</label>
          <input id="as-a" maxLength={400} value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. weekday evenings, Saturday mornings" />
          <p className="small muted">Your time zone: {tz}</p>
          <label className="toggle">
            <span>
              Share my birth details with my astrologer
              <span className="small muted" style={{ display: 'block' }}>
                {birth}. Only for preparing your sessions; everything else stays on this device.
              </span>
            </span>
            <input type="checkbox" checked={shareBirth} onChange={(e) => setShareBirth(e.target.checked)} />
          </label>
          {error && (
            <p className="banner" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy || questions.trim().length < 10}>
            {busy ? 'Opening checkout…' : `Book your live reading: ${fmtUsd(chosen.amount)}`}
          </button>
          <p className="small muted">Secure payment by Stripe. Sessions are for reflection and guidance, not medical, legal, financial, or mental health care. Unused sessions can be refunded within 30 days of purchase.</p>
        </form>
      )}
    </div>
  );
}
