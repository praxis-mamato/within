import { useEffect, useState } from 'react';
import { SignInButtons } from '../components/Paywall';
import { MiniOrb } from '../components/OracleBoard';
import { Back } from '../components/ui';
import { useAccount } from '../services/AccountContext';
import { IN_PLAY_APP, PLAY_APP_TEXT } from '../services/config';
import { bookAstrologer, fmtUsd, myBookings, PACKAGES, packageById, pickSlot, readingSlots, takenSlots, type Booking } from '../services/astrologer';
import { track } from '../services/telemetry';
import { useStore } from '../state';

const STATUS: Record<string, string> = { paid: 'Paid', scheduled: 'Scheduled', completed: 'Completed', refunded: 'Refunded', cancelled: 'Cancelled' };

const when = (d: Date, tz?: string) => d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: tz });

/** After paying: choose the first reading's time from the astrologer's open hours. */
function SlotPicker({ booking, onPicked }: { booking: Booking; onPicked: () => void }) {
  const [slots, setSlots] = useState<Date[] | null>(null);
  const [chosen, setChosen] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => void takenSlots().then((t) => setSlots(readingSlots(new Date(), t)));
  useEffect(load, []);
  if (!slots) return <p className="small muted">Finding open times…</p>;
  const days = [...new Set(slots.map((d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })))];
  const confirm = async () => {
    if (!chosen) return;
    setBusy(true);
    setError('');
    try {
      await pickSlot(booking.id, chosen);
      onPicked();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That time couldn’t be saved.');
      setChosen(null);
      load();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="slot-picker">
      <p style={{ marginTop: 8 }}>
        <strong>Choose the time of your first reading.</strong> Times are shown in your time zone. 45 minutes, voice only.
      </p>
      {slots.length === 0 ? (
        <p className="small">No open times right now. Your astrologer will email you to arrange one.</p>
      ) : (
        days.slice(0, 8).map((day) => (
          <div key={day} className="slot-day">
            <p className="small muted" style={{ margin: '10px 0 4px' }}>{day}</p>
            <div className="btn-row">
              {slots
                .filter((d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) === day)
                .map((d) => (
                  <button key={d.getTime()} type="button" className={`chip${chosen?.getTime() === d.getTime() ? ' on' : ''}`} aria-pressed={chosen?.getTime() === d.getTime()} onClick={() => setChosen(d)}>
                    {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </button>
                ))}
            </div>
          </div>
        ))
      )}
      {error && (
        <p role="alert" className="small">
          {error}
        </p>
      )}
      {chosen && (
        <button type="button" className="btn" disabled={busy} onClick={confirm} style={{ marginTop: 12 }}>
          {busy ? 'Saving…' : `Book ${when(chosen)}`}
        </button>
      )}
    </div>
  );
}

/** Sessions with a human astrologer: packages, a short intake, and Stripe Checkout. */
/** The astrologer behind the live readings, in the Oracle's voice. No names; only what is true. */
export const READER = {
  intro:
    'Five years in the old arts, the Western wheel and the Vedic sky: studying them, and sitting with people who wanted to know themselves more deeply, and with people at the turning points of their lives: love that changed shape, work that called louder, seasons that asked for something new.',
  how: 'No scripts and no cold predictions. Your chart is opened between you, planet by planet, and read as a map of the energy within you and how it moves through your life. You leave with clarity, your own dates, and the next step that fits.',
  facts: ['Five years of astrological study and live readings', 'Western and Vedic, in one reading', 'Prepared in advance from your exact birth details, if you choose to share them', 'Private and live: cameras off for your first reading, on from the second'],
};

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

  const reload = () => void myBookings().then(setBookings);
  useEffect(() => {
    if (!account) return;
    reload();
    // Back from Stripe: the payment confirmation can take a few seconds to arrive.
    if (!justPaid) return;
    const timers = [2, 5, 9, 15].map((s) => window.setTimeout(reload, s * 1000));
    return () => timers.forEach(clearTimeout);
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
      <p className="sub">To know yourself more deeply, or to meet a turning point with clarity. Live and one to one: your first reading is voice only, cameras off; cameras come on from the second.</p>
      <div className="live-orb" aria-hidden="true">
        <MiniOrb />
      </div>

      <section className="card reader" aria-labelledby="rd-h">
        <p className="oracle-card-kicker">The one who reads for you</p>
        <h2 id="rd-h" style={{ marginTop: 4 }}>Before the Oracle, there was a reader</h2>
        <p>{READER.intro}</p>
        <p>{READER.how}</p>
        <ul className="reader-facts">
          {READER.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      {justPaid && (
        <div className="card soft" role="status">
          <h2 style={{ marginTop: 0 }}>The Oracle has heard you</h2>
          <p style={{ margin: 0 }}>Your reading is paid. Choose the time of your first reading below; the calendar invite with your call link follows within a day. A receipt is on its way from Stripe.</p>
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
                {x.first_slot ? (
                  <p className="small" style={{ margin: '6px 0 0' }}>
                    First reading: <strong>{when(new Date(x.first_slot))}</strong> (your time). {x.status === 'scheduled' ? 'Your calendar invite has the call link.' : 'Your calendar invite with the call link follows within a day.'} To change it, write to privacy@praxisglobal.ai.
                  </p>
                ) : x.status === 'paid' ? (
                  <SlotPicker booking={x} onPicked={reload} />
                ) : null}
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
                  {p.sessions} × {p.minutes}-minute sessions · {fmtUsd(Math.round(p.amount / p.sessions))} a session
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

      {IN_PLAY_APP ? (
        <div className="card">
          <p>{PLAY_APP_TEXT.live}</p>
        </div>
      ) : !account ? (
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
