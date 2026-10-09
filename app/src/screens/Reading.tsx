import { useEffect, useMemo, useState } from 'react';
import { track } from '../services/telemetry';
import { useCharts } from '../astro/useCharts';
import { READING_VERSION, vedicReading, westernReading, type ReadingSection } from '../content/fullReading';
import { timingReading, vedicDeep, westernDeep } from '../content/deepReading';
import { relationshipReading } from '../content/relationship';
import { useStore } from '../state';
import { Paywall } from '../components/Paywall';
import { AiDeepDive } from '../components/AiDeepDive';
import { vedicPlacements, westernPlacements } from '../content/chartReading';

type Tab = 'western' | 'vedic' | 'timing' | 'together';

const TITLES: Record<Tab, { h1: string; sub: string }> = {
  western: { h1: 'The Western view', sub: 'Every placement in your chart, read through Western (tropical) astrology.' },
  vedic: { h1: 'The Vedic view', sub: 'Every placement in your chart, read through Jyotish, Vedic (sidereal) astrology, including the navamsa and dashamsa.' },
  timing: { h1: 'Your timing', sub: 'Your week planet by planet, the next 30 days of transits, New and Full Moons, and planets changing direction, plus your dasha calendar.' },
  together: { h1: 'The two of you', sub: 'Your chart read alongside theirs: aspects, where you land in each other’s houses, and the relationship’s own chart.' },
};

/** The full traditional reading. Long by design; reflections stay short and link here. */
export default function Reading({ initial = 'western' }: { initial?: Tab }) {
  const { state } = useStore();
  const { me, other } = useCharts();
  const [tab, setTab] = useState<Tab>(initial);
  const place = { lat: state.birth.lat, lon: state.birth.lon };
  const theirBirth = state.person?.birth;
  const tabs: Tab[] = other && theirBirth ? ['western', 'vedic', 'timing', 'together'] : ['western', 'vedic', 'timing'];

  const sections = useMemo<ReadingSection[]>(() => {
    if (!me) return [];
    // Deep sections go before "the sky now", which stays last.
    const merge = (base: ReadingSection[], deep: ReadingSection[]) => [...base.slice(0, -1), ...deep, base[base.length - 1]];
    if (tab === 'western') return [westernPlacements(me, place), ...merge(westernReading(me), westernDeep(me, place))];
    if (tab === 'vedic') return [vedicPlacements(me), ...merge(vedicReading(me, state.birth.date), vedicDeep(me))];
    if (tab === 'timing') return timingReading(me, place, new Date(), state.profile);
    if (other && theirBirth) return relationshipReading(me, place, other, { lat: theirBirth.lat, lon: theirBirth.lon }, state.person!.nickname);
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, other, tab, state.profile, state.birth.date, state.birth.lat, state.birth.lon, theirBirth]);
  useEffect(() => track('reading_opened', { tradition: tab }), [tab]);

  if (!me) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;

  // Western and Vedic show the placements table and the first reading section free; Timing shows the week's
  // first planet free; Together is for subscribers.
  const free = tab === 'western' || tab === 'vedic' || tab === 'timing' ? 2 : 0;
  return (
    <>
      <p className="kicker">Your full reading</p>
      <h1>{TITLES[tab].h1}</h1>
      <p className="sub">{TITLES[tab].sub} Interpretations, not predictions.</p>
      <div className="segmented" role="tablist" aria-label="Reading" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'seg-on' : ''} onClick={() => setTab(t)}>
            {t === 'western' ? 'Western' : t === 'vedic' ? 'Vedic' : t === 'timing' ? 'Timing' : 'Together'}
          </button>
        ))}
      </div>
      <nav className="toc" aria-label="Sections">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }))}>
            {s.title}
          </a>
        ))}
      </nav>
      {sections.slice(0, free).map((s) => (
        <ReadingBlock key={s.id} s={s} tab={tab} />
      ))}
      <Paywall where="reading" what={free ? tab === 'timing' ? 'The rest of your week and your timing' : `The rest of your ${tab === 'western' ? 'Western' : 'Vedic'} reading` : tab === 'timing' ? 'Your timing' : 'Reading the two of you together'}>
        {sections.slice(free).map((s) => (
          <ReadingBlock key={s.id} s={s} tab={tab} />
        ))}
        <AiDeepDive kind={tab} sections={sections} />
      </Paywall>
      <p className="small muted">
        Reading version <code>{READING_VERSION}</code>
      </p>
    </>
  );
}

export function ReadingBlock({ s, tab }: { s: ReadingSection; tab: string }) {
  return (
    <section id={s.id} className={`card lens ${tab === 'vedic' ? 'vedic' : tab === 'western' ? 'western' : 'together'}`} aria-labelledby={`${s.id}-h`}>
      <h2 id={`${s.id}-h`} style={{ marginTop: 0 }}>
        {s.title}
      </h2>
      {s.intro && <p className="small muted">{s.intro}</p>}
      {s.tables?.map((t) => (
        <div className="chart-table-wrap" key={t.caption} tabIndex={0} role="region" aria-label={t.caption}>
          <table className="chart-table">
            <caption>{t.caption}</caption>
            <thead>
              <tr>
                {t.columns.map((col) => (
                  <th key={col} scope="col">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) =>
                    j === 0 ? (
                      <th key={j} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={j}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <div className="reading-items">
        {s.items.map((it) => (
          <article key={it.heading} className="reading-item">
            <h3>{it.heading}</h3>
            <p>{it.text}</p>
            {it.basis && <p className="basis">{it.basis}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
