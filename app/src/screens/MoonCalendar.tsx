import { useMemo, useState } from 'react';
import { useCharts } from '../astro/useCharts';
import { Paywall } from '../components/Paywall';
import { Back } from '../components/ui';
import { MOON_CAL_TEXT, moonCalendar, type MoonCalendarOptions } from '../content/moonCalendar';
import { downloadIcs, toIcs } from '../lib/ics';
import { track } from '../services/telemetry';
import { useStore } from '../state';

const OPTIONS: [keyof MoonCalendarOptions, string, string][] = [
  ['phases', 'New, Full, and quarter Moons', 'With the house each lands in for you, the birth planets it touches, and eclipses'],
  ['signs', 'The Moon changing sign', 'Every two to three days, with what that house tends to stir for you'],
  ['voidOfCourse', 'Void-of-course Moon', 'The hours before each sign change, traditionally a time to rest rather than start'],
  ['retrogrades', 'Mercury, Venus, and Mars retrograde', 'Whole-day periods, with the part of your chart they fall in'],
];

/** The Moon mapped to the person's own calendar, as a file their calendar app imports. */
export default function MoonCalendar() {
  const { state } = useStore();
  const { me } = useCharts();
  const [opt, setOpt] = useState<MoonCalendarOptions>({ phases: true, signs: true, voidOfCourse: false, retrogrades: true });
  const [months, setMonths] = useState(12);
  const [done, setDone] = useState('');
  const place = { lat: state.birth.lat, lon: state.birth.lon };
  const preview = useMemo(() => (me ? moonCalendar(me, place, new Date(), 1, opt).slice(0, 6) : []), [me, opt.phases, opt.signs, opt.voidOfCourse, opt.retrogrades]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me) return <p className="banner">These birth details can’t be calculated. Check them in Settings.</p>;
  const save = () => {
    const events = moonCalendar(me, place, new Date(), months, opt);
    downloadIcs(toIcs(events, MOON_CAL_TEXT.name), `within-moon-${months}-months.ics`);
    track('moon_calendar', { months });
    setDone(`${events.length} events saved. Open the file to add them to your calendar.`);
  };
  const fmt = (d: Date) => d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <>
      <Back to="/today" label="Today" />
      <p className="kicker">Your Moon calendar</p>
      <h1>The Moon, in your calendar</h1>
      <p className="sub">Every phase and sign change, mapped to your own chart, in the calendar you already use. Made on this device from your chart; nothing is uploaded.</p>
        <section aria-labelledby="mc-prev">
          <h2 id="mc-prev">Your next Moons</h2>
          <ul className="moon-preview">
            {preview.map((e) => (
              <li key={e.uid} className="card">
                <strong>{e.title}</strong>
                <span className="small muted" style={{ display: 'block' }}>
                  {e.allDay ? `${e.start.toLocaleDateString()} – ${e.end.toLocaleDateString()}` : fmt(e.start)}
                </span>
                <span className="small" style={{ display: 'block', marginTop: 4 }}>
                  {e.description.split('\n')[1] ?? e.description.split('\n')[0]}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <h2>Add them all to your calendar</h2>
      <Paywall where="reading" what="Adding your Moon calendar">
        <form className="card" onSubmit={(e) => (e.preventDefault(), save())}>
          <fieldset className="moon-options">
            <legend>What to include</legend>
            {OPTIONS.map(([k, label, hint]) => (
              <label key={k} className="toggle">
                <span>
                  {label}
                  <span className="small muted" style={{ display: 'block' }}>
                    {hint}
                  </span>
                </span>
                <input type="checkbox" checked={opt[k]} onChange={(e) => setOpt({ ...opt, [k]: e.target.checked })} />
              </label>
            ))}
          </fieldset>
          <label htmlFor="mc-months">How far ahead</label>
          <select id="mc-months" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
          <button type="submit" className="btn" disabled={!Object.values(opt).some(Boolean)}>
            Add to my calendar
          </button>
          {done && (
            <p className="small" role="status">
              {done}
            </p>
          )}
          <details className="small">
            <summary>How to add it</summary>
            <ul>
              <li>iPhone or iPad: tap Add to my calendar, then Add All.</li>
              <li>Google Calendar: on a computer, open Settings, then Import & export, and choose the file.</li>
              <li>Outlook: open the file, or use Add calendar, then Upload from file.</li>
              <li>Add it again in a few months to extend it; repeated events replace themselves.</li>
            </ul>
          </details>
        </form>
      </Paywall>
    </>
  );
}
