import { useMemo, useState } from 'react';
import { BirthFields } from '../components/BirthFields';
import { Link } from 'react-router-dom';
import { useCharts } from '../astro/useCharts';
import { AiDeepDive } from '../components/AiDeepDive';
import { Paywall } from '../components/Paywall';
import { SynastryWheel } from '../components/SynastryWheel';
import { Back } from '../components/ui';
import { biWheel, relationshipReading } from '../content/relationship';
import { SAMPLE_BIRTH, useStore, type Birth } from '../state';
import { ReadingBlock } from './Reading';
import { MiniOrb } from '../components/OracleBoard';

/** Everyone added, as chips: tap one to switch whose chart is read with yours. */
export function PeopleSwitch() {
  const { state, dispatch } = useStore();
  const people = state.people.filter((p) => p.status === 'active');
  if (people.length < 2) return null;
  return (
    <div className="people-switch" role="group" aria-label="Choose whose chart to read with yours">
      {people.map((p) => (
        <button key={p.id} type="button" className={p.id === state.activePersonId ? 'on' : ''} aria-pressed={p.id === state.activePersonId} onClick={() => dispatch({ type: 'person/select', id: p.id })}>
          {p.nickname}
        </button>
      ))}
    </div>
  );
}

/** Two charts together: the synastry wheel and the relationship's dynamics free; the full reading for subscribers. */
export default function RelationshipChart() {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState<Birth>({ ...SAMPLE_BIRTH, date: '' });
  const { me, other } = useCharts();
  const p = state.person;
  const theirs = p?.birth;
  const place = { lat: state.birth.lat, lon: state.birth.lon };
  const data = useMemo(() => {
    if (!me || !other || !theirs) return null;
    const tp = { lat: theirs.lat, lon: theirs.lon };
    return { sections: relationshipReading(me, place, other, tp, p!.nickname), wheel: biWheel(me, place, other, tp) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, other, theirs, state.birth.lat, state.birth.lon, p?.nickname]);

  if (!p)
    return (
      <div className="night">
        <Back to="/relationships" label="Relationships" />
        <h1>Two charts together</h1>
        <p className="sub">Add someone to see your synastry.</p>
        <Link className="btn" to="/relationships">
          Add someone
        </Link>
      </div>
    );
  if (!data)
    return (
      <div className="night">
        <Back to="/relationships" label="Your people" />
        <PeopleSwitch />
        <div className="orb-head" aria-hidden="true">
          <MiniOrb />
        </div>
        <p className="kicker">Synastry</p>
        <h1>You and {p.nickname}</h1>
        <p className="sub">Add {p.nickname}’s birth details to see your chart together. A birth time adds houses and angles.</p>
        <div className="card">
          <BirthFields value={draft} onChange={setDraft} idPrefix="syn" />
          <p className="small muted">Saved only on this device. Adding them doesn’t mean {p.nickname} agreed to this, so keep it respectful.</p>
          <button type="button" className="btn" disabled={!draft.date || !draft.tz} onClick={() => dispatch({ type: 'person/birth', birth: draft })}>
            See our synastry
          </button>
        </div>
      </div>
    );
  const [first, ...rest] = data.sections;
  return (
    <div className="night">
      <Back to="/relationships" label="Your people" />
      <PeopleSwitch />
      <p className="kicker">The Oracle · Synastry</p>
      <h1>You and {p.nickname}</h1>
      <SynastryWheel mine={data.wheel.mine} theirs={data.wheel.theirs} aspects={data.wheel.aspects} asc={data.wheel.asc} name={p.nickname} />
      <ReadingBlock s={first} tab="together" />
      <Paywall where="relationship" what="The full relationship reading">
        {rest.map((s) => (
          <ReadingBlock key={s.id} s={s} tab={s.id === 'r-vedic' ? 'vedic' : 'together'} />
        ))}
        <AiDeepDive kind="together" sections={data.sections} />
      </Paywall>
      <p className="small muted">Possible dynamics between two charts, never what the other person feels or intends. No compatibility number.</p>
      <Link className="btn secondary" to="/relationship/relationship" style={{ marginTop: 8 }}>
        Milestones and reflections with {p.nickname}
      </Link>
    </div>
  );
}
