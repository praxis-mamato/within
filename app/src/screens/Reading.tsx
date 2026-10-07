import { useEffect, useMemo, useState } from 'react';
import { track } from '../services/telemetry';
import { useCharts } from '../astro/useCharts';
import { READING_VERSION, vedicReading, westernReading, type ReadingSection } from '../content/fullReading';
import { useStore } from '../state';
import { Paywall } from '../components/Paywall';

/** The full traditional reading. Long by design; reflections stay short and link here. */
export default function Reading({ initial = 'western' }: { initial?: 'western' | 'vedic' }) {
  const { state } = useStore();
  const { me } = useCharts();
  const [tab, setTab] = useState<'western' | 'vedic'>(initial);
  const sections = useMemo<ReadingSection[]>(() => (me ? (tab === 'western' ? westernReading(me) : vedicReading(me, state.birth.date)) : []), [me, tab, state.birth.date]);
  useEffect(() => track('reading_opened', { tradition: tab }), [tab]);

  if (!me) return <p className="banner">These birth details can’t be calculated. Check the date, place, and time zone in Settings.</p>;
  return (
    <>
      <p className="kicker">Your full reading</p>
      <h1>{tab === 'western' ? 'The Western view' : 'The Vedic view'}</h1>
      <p className="sub">
        Every placement in your chart, read through {tab === 'western' ? 'Western (tropical) astrology' : 'Jyotish, Vedic (sidereal) astrology'}. Interpretations, not predictions.
      </p>
      <div className="segmented" role="tablist" aria-label="Tradition" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {(['western', 'vedic'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'seg-on' : ''} onClick={() => setTab(t)}>
            {t === 'western' ? 'Western' : 'Vedic'}
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
      {sections.map((s, i) => {
        const body = (
        <section key={s.id} id={s.id} className={`card lens ${tab}`} aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`} style={{ marginTop: 0 }}>
            {s.title}
          </h2>
          {s.intro && <p className="small muted">{s.intro}</p>}
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
        if (i === 0) return body;
        if (i === 1)
          return (
            <Paywall key="paywall" where="reading" what={`The rest of your ${tab === 'western' ? 'Western' : 'Vedic'} reading`}>
              {sections.slice(1).map((x) => (
                <ReadingBlock key={x.id} s={x} tab={tab} />
              ))}
            </Paywall>
          );
        return null;
      })}
      <p className="small muted">
        Reading version <code>{READING_VERSION}</code>
      </p>
    </>
  );
}

function ReadingBlock({ s, tab }: { s: ReadingSection; tab: string }) {
  return (
    <section id={s.id} className={`card lens ${tab}`} aria-labelledby={`${s.id}-h`}>
      <h2 id={`${s.id}-h`} style={{ marginTop: 0 }}>
        {s.title}
      </h2>
      {s.intro && <p className="small muted">{s.intro}</p>}
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
