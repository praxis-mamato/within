import { ENGINE } from '../astro/chart';
import { currentTransits } from '../astro/facts';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { useCharts } from '../astro/useCharts';
import { METHOD } from '../data/fixtures';
import { useStore } from '../state';

const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Full Western and Vedic placements, calculated live. Facts only: no interpretation here. */
export function ChartTables({ chart, label }: { chart: NatalChart; label: string }) {
  const now = new Date();
  const transits = currentTransits(chart, now);
  const w = chart.western;
  const v = chart.vedic;
  return (
    <>
      <p className="small muted">
        {label} · {chart.timePrecision === 'unknown' ? 'birth time unknown (local noon used for positions)' : `${chart.utc.toISOString().slice(0, 16).replace('T', ' ')} UTC`} · {chart.offsetLabel}
      </p>

      <section className="card lens western" aria-labelledby={`${label}-w`}>
        <div className="lens-label">
          <span className="dot" aria-hidden="true" />
          <span id={`${label}-w`}>Western · tropical</span>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Western placements</caption>
            <thead>
              <tr>
                <th scope="col">Body</th>
                <th scope="col">Sign</th>
                <th scope="col">Degree</th>
                {w.houseSystem && <th scope="col">House</th>}
              </tr>
            </thead>
            <tbody>
              {w.planets.map((p) => (
                <tr key={p.body}>
                  <th scope="row">
                    {p.body === 'Node' ? 'North Node (mean)' : p.body}
                    {p.retrograde && <abbr title="retrograde"> ℞</abbr>}
                  </th>
                  <td>{p.sign}</td>
                  <td className="num">{fmtDeg(p.degree)}</td>
                  {w.houseSystem && <td className="num">{p.house ?? '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="facts">
          <dt>Rising sign</dt>
          <dd>{w.ascendant.certain ? `${w.ascendant.value}${w.ascendantDegree !== null ? ` ${fmtDeg(w.ascendantDegree)}` : ''}` : w.ascendant.options.length ? `${w.ascendant.options.join(' or ')} (uncertain)` : 'Not included'}</dd>
          <dt>Midheaven</dt>
          <dd>{w.midheaven ?? 'Not included'}</dd>
          <dt>Houses</dt>
          <dd>{w.houseSystem ?? 'Not included'}</dd>
        </dl>
        {w.unavailable.map((u) => (
          <p className="unavailable" key={u}>
            {u}
          </p>
        ))}
        <h3 className="mini">Slow planets now (within 2°)</h3>
        {transits.length ? (
          <ul className="small">
            {transits.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : (
          <p className="small muted">None aspecting your Sun, Moon, or Venus today.</p>
        )}
      </section>

      <section className="card lens vedic" aria-labelledby={`${label}-v`}>
        <div className="lens-label">
          <span className="dot" aria-hidden="true" />
          <span id={`${label}-v`}>Vedic · sidereal (Lahiri {fmtDeg(v.ayanamsa)})</span>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Vedic placements</caption>
            <thead>
              <tr>
                <th scope="col">Graha</th>
                <th scope="col">Rashi</th>
                <th scope="col">Degree</th>
                {v.lagna.certain && <th scope="col">House</th>}
              </tr>
            </thead>
            <tbody>
              {v.planets.map((p) => (
                <tr key={p.body}>
                  <th scope="row">
                    {p.body}
                    {p.retrograde && !['Rahu', 'Ketu'].includes(p.body) && <abbr title="retrograde"> ℞</abbr>}
                  </th>
                  <td>
                    {p.rashi} <span className="muted">({p.sign})</span>
                  </td>
                  <td className="num">{fmtDeg(p.degree)}</td>
                  {v.lagna.certain && <td className="num">{p.house}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="facts">
          <dt>Lagna</dt>
          <dd>{v.lagna.certain ? v.lagna.value : v.lagna.options.length ? `${v.lagna.options.join(' or ')} (uncertain)` : 'Not included'}</dd>
          <dt>Moon nakshatra</dt>
          <dd>{v.moonNakshatra.certain ? `${v.nakshatra.name}, pada ${v.nakshatra.pada} (lord ${v.nakshatra.lord})` : `${v.moonNakshatra.options.join(' or ')} (uncertain)`}</dd>
          <dt>Current dasha</dt>
          <dd>{v.current ? `${v.current.maha.lord} mahadasha, ${v.current.antar.lord} antardasha (until ${fmtDate(v.current.antar.end)})` : 'Not included'}</dd>
        </dl>
        {v.unavailable.map((u) => (
          <p className="unavailable" key={u}>
            {u}
          </p>
        ))}
        {v.dashas && (
          <details>
            <summary className="link">Vimshottari mahadashas</summary>
            <ul className="small">
              {v.dashas.map((d) => (
                <li key={d.lord + d.start.toISOString()}>
                  {d.lord}: {fmtDate(d.start)} – {fmtDate(d.end)}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </>
  );
}

export default function Chart() {
  const { state } = useStore();
  const { me } = useCharts();
  return (
    <>
      <p className="kicker">Your chart</p>
      <h1>Two skies, one birth</h1>
      <p className="sub">
        Calculated live from your birth details: {state.birth.place}, {state.birth.date}
        {state.birth.timePrecision !== 'unknown' ? ` at ${state.birth.time}` : ''}.
      </p>
      {me ? <ChartTables chart={me} label="You" /> : <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>}
      <details className="small muted">
        <summary className="link">How this is calculated</summary>
        <p>
          Planet positions come from {ENGINE.name} ({ENGINE.license}), an open-source astronomy library running in your browser. Houses, ayanamsa, nakshatras, and
          dashas are calculated by Within and checked against Swiss Ephemeris reference charts to within 0.01°. Nothing is sent anywhere.
        </p>
        <p>
          {METHOD.western.version} · {METHOD.vedic.version}
        </p>
      </details>
    </>
  );
}
