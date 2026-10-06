import { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { MILESTONE_INTERPRETATION, MILESTONE_TYPES, REFLECTIONS, type Milestone, type MilestoneType, type Pillar } from '../data/fixtures';
import { describePrecision, formatFuzzyDate, type DateKind } from '../lib/dates';
import { Landscape, Leaf, Orbit, Venn } from '../components/Illustrations';
import { Paywall } from '../components/Paywall';
import { useAccount } from '../services/AccountContext';
import { Back, ConfirmButton, PromptChips, PurposeCard, SafetyPanel } from '../components/ui';
import { MILESTONE_MEANINGS, MILESTONE_TITLES } from '../data/prompts';
import { personalize, SAMPLE_BIRTH, useStore, type Birth } from '../state';
import { BirthFields } from '../components/BirthFields';
import Chart, { ChartTables } from './Chart';
import Reading from './Reading';
import { useCharts } from '../astro/useCharts';
import { currentTransits } from '../astro/facts';
import { antardashas, vimshottari } from '../astro/chart';

/** List: the "You" space always, plus at most one relationship in the MVP. */
export function RelationshipsList() {
  const { state, dispatch } = useStore();
  const { entitlement } = useAccount();
  const [adding, setAdding] = useState(false);
  const [nick, setNick] = useState('');
  const p = state.person;
  return (
    <>
      <p className="kicker">Relationships</p>
      <h1>Who you’re exploring</h1>
      <ul className="list card" style={{ padding: '4px 16px' }}>
        <li>
          <Link className="list-link" to="/you/self">
            <span>
              <strong>You</strong>
              <span className="small muted" style={{ display: 'block' }}>
                Self and purpose
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        </li>
        {p && (
          <li>
            <Link className="list-link" to="/relationship/self">
              <span>
                <strong>{p.nickname}</strong>{' '}
                {p.status === 'archived' && <span className="pill">Archived</span>}
                <span className="small muted" style={{ display: 'block' }}>
                  {p.milestones.length} milestones · {p.birth ? 'birth details added' : 'no birth details'}
                </span>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          </li>
        )}
      </ul>
      {!p &&
        (adding ? (
          <div className="card">
            <label htmlFor="new-nick">
              A nickname for them <span className="hint">No surname or contact details.</span>
            </label>
            <input id="new-nick" type="text" value={nick} onChange={(e) => setNick(e.target.value)} />
            <div className="btn-row">
              <button
                type="button"
                className="btn"
                disabled={!nick.trim()}
                onClick={() => {
                  dispatch({ type: 'person/add', nickname: nick.trim() });
                  setAdding(false);
                }}
              >
                Add
              </button>
              <button type="button" className="btn quiet" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : !entitlement.active ? (
          <Paywall what="A relationship space">{null}</Paywall>
        ) : (
          <div className="btn-row">
            <button type="button" className="btn secondary" onClick={() => setAdding(true)}>
              Add someone
            </button>
            <p className="small muted">Optional. Within is complete on your own.</p>
          </div>
        ))}
      {p && <p className="small muted">This version supports one relationship at a time.</p>}
    </>
  );
}

const PILLARS: { id: Pillar; label: string }[] = [
  { id: 'self', label: 'Self' },
  { id: 'other', label: 'Other' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'purpose', label: 'Purpose' },
];

/** Pillar content shared by the "You" space and a relationship (decision 1). */
function PillarBody({ pillar }: { pillar: Pillar }) {
  const { state } = useStore();
  const nickname = state.person?.nickname;
  const r = REFLECTIONS[pillar];

  if (pillar === 'relationship') return <Timeline />;

  const illo = pillar === 'self' ? <Orbit /> : pillar === 'other' ? <Venn /> : null;
  return (
    <>
      <p className="kicker">{r.kicker}</p>
      <h1>{personalize(r.heading, nickname)}</h1>
      <p className="sub">{personalize(r.subheading, nickname)}</p>
      {illo}
      {pillar === 'other' && <OtherBirth />}
      {pillar === 'other' && <p className="sub">{personalize(r.question, nickname)}</p>}
      {pillar === 'purpose' && (
        <div className="card soft spread">
          <div>
            <p className="small muted" style={{ margin: 0 }}>
              One small step
            </p>
            <p style={{ margin: 0 }}>{r.step}</p>
          </div>
          <Leaf />
        </div>
      )}
      {pillar !== 'other' && <PurposeCard />}
      <div className="btn-row">
        <Link className={pillar === 'other' ? 'btn secondary' : 'btn'} to={`/reflection/${pillar}`}>
          {pillar === 'self' ? 'Explore my patterns' : pillar === 'other' ? 'Explore this insight' : 'Open the reflection'}
        </Link>
        {pillar === 'purpose' && (
          <Link className="btn quiet" to="/growth">
            Change my purpose
          </Link>
        )}
      </div>
    </>
  );
}

export function YouSpace() {
  const { pillar = 'self' } = useParams();
  const p = (pillar === 'purpose' ? 'purpose' : 'self') as Pillar;
  return (
    <>
      <Back to="/relationships" label="Relationships" />
      <YouNav />
      <PillarBody pillar={p} />
    </>
  );
}

function YouNav() {
  return (
    <nav className="segmented" aria-label="You" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <NavLink to="/you/self">Self</NavLink>
      <NavLink to="/you/purpose">Purpose</NavLink>
      <NavLink to="/you/reading">Reading</NavLink>
      <NavLink to="/you/chart">Chart</NavLink>
    </nav>
  );
}

export function YouReading() {
  return (
    <>
      <Back to="/relationships" label="Relationships" />
      <YouNav />
      <Reading />
    </>
  );
}

export function YouChart() {
  return (
    <>
      <Back to="/relationships" label="Relationships" />
      <YouNav />
      <Chart />
    </>
  );
}

/** The other person's birth details are optional; without them, Other uses only your chart. */
function OtherBirth() {
  const { state, dispatch } = useStore();
  const { other } = useCharts();
  const p = state.person!;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Birth>(p.birth ?? { ...SAMPLE_BIRTH, date: '1992-08-17' });
  if (editing) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{p.nickname}’s birth details</h2>
        <p className="small muted">Optional. Adding them doesn’t mean {p.nickname} agreed to this, so keep it respectful. Saved only on this device, never sent anywhere.</p>
        <BirthFields value={draft} onChange={setDraft} idPrefix="other" />
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            disabled={!draft.date || !draft.tz}
            onClick={() => {
              dispatch({ type: 'person/birth', birth: draft });
              setEditing(false);
            }}
          >
            Save {p.nickname}’s details
          </button>
          {p.birth && (
            <button
              type="button"
              className="btn quiet"
              onClick={() => {
                dispatch({ type: 'person/birth', birth: null });
                setEditing(false);
              }}
            >
              Remove their details
            </button>
          )}
          <button type="button" className="btn quiet" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="stack">
      <p className="small muted" style={{ textAlign: 'center' }}>
        {p.birth ? `Comparing your chart with ${p.nickname}’s (${p.birth.place}).` : `${p.nickname}’s birth details aren’t added, so this uses your chart and what you’ve told us.`}{' '}
        <button type="button" className="link" onClick={() => setEditing(true)}>
          {p.birth ? 'Edit' : `Add ${p.nickname}’s details`}
        </button>
      </p>
      {other && (
        <details>
          <summary className="link">{p.nickname}’s chart</summary>
          <ChartTables chart={other} label={p.nickname} />
        </details>
      )}
    </div>
  );
}

export function RelationshipHome() {
  const { pillar = 'self' } = useParams();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const p = state.person;
  if (!p) {
    return (
      <>
        <Back to="/relationships" label="Relationships" />
        <div className="empty">
          <Leaf />
          <p>No one added yet. Add one person to explore a relationship through both traditions.</p>
          <Link className="btn secondary" to="/relationships">
            Add someone
          </Link>
        </div>
      </>
    );
  }
  return (
    <>
      <Back to="/relationships" label="Relationships" />
      <h2 style={{ margin: '4px 0 0', textAlign: 'center' }}>{p.nickname}</h2>
      <nav className="segmented" aria-label={`Pillars for ${p.nickname}`}>
        {PILLARS.map((x) => (
          <NavLink key={x.id} to={`/relationship/${x.id}`}>
            {x.label}
          </NavLink>
        ))}
      </nav>
      {state.safety.flagged && <SafetyPanel compact />}
      <PillarBody pillar={(PILLARS.find((x) => x.id === pillar)?.id ?? 'self') as Pillar} />
      <hr />
      <details>
        <summary className="link">Manage this relationship</summary>
        <div className="btn-row">
          {p.status === 'active' ? (
            <button type="button" className="btn quiet" onClick={() => dispatch({ type: 'person/archive' })}>
              Archive {p.nickname}
            </button>
          ) : (
            <button type="button" className="btn quiet" onClick={() => dispatch({ type: 'person/unarchive' })}>
              Make active again
            </button>
          )}
          <p className="small muted">Archiving keeps everything readable and exportable. It isn’t a judgement, and you can undo it.</p>
          <ConfirmButton
            label={`Delete ${p.nickname} and their milestones`}
            question={`Delete ${p.nickname} and all their milestones? This can’t be undone.`}
            confirmLabel="Delete permanently"
            onConfirm={() => {
              dispatch({ type: 'person/delete' });
              nav('/relationships');
            }}
          />
        </div>
      </details>
    </>
  );
}

function Node({ m }: { m: Milestone }) {
  const cls = m.date.kind === 'approximate' ? 'approx' : m.date.kind === 'range' ? 'range' : '';
  return <span className={`node ${cls} ${m.excluded ? 'excluded' : ''}`} aria-hidden="true" />;
}

/** Relationship pillar: user-entered milestones only, precision always visible (D5). */
function Timeline() {
  const { state } = useStore();
  const r = REFLECTIONS.relationship;
  const ms = state.person?.milestones ?? [];
  return (
    <>
      <p className="kicker">Relationship</p>
      <h1>{r.heading}</h1>
      <p className="sub">{r.subheading}</p>
      <div className="landscape-wrap">
        <Landscape />
      </div>
      <h2 className="sr-only">Milestones</h2>
      {ms.length === 0 ? (
        <p className="sub muted">No milestones yet. Only dates you add appear here.</p>
      ) : (
        <ol className="timeline">
          {ms.map((m) => (
            <li key={m.id}>
              <Link to={`/milestone/${m.id}`} aria-label={`${m.title}, ${describePrecision(m.date.kind)}: ${formatFuzzyDate(m.date)}${m.excluded ? ', excluded from reflections' : ''}`}>
                <Node m={m} />
                <span className="tl-title">{m.title}</span>
                <span className="tl-date">{formatFuzzyDate(m.date)}</span>
              </Link>
            </li>
          ))}
          <li>
            <span className="node-static">
              <span className="node today" aria-hidden="true" />
              <span className="tl-title">Today</span>
            </span>
          </li>
        </ol>
      )}
      <div className="legend" aria-hidden="true">
        <span>
          <span className="node" /> Exact
        </span>
        <span>
          <span className="node approx" /> Approximate
        </span>
        <span>
          <span className="node range" /> Range
        </span>
      </div>
      <div className="btn-row">
        <Link className="btn" to="/milestone/new">
          Add a meaningful date
        </Link>
        <Link className="btn quiet" to="/reflection/relationship">
          Open this chapter’s reflection
        </Link>
      </div>
    </>
  );
}

export function MilestoneDetail() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const m = state.person?.milestones.find((x) => x.id === id);
  const { me } = useCharts();
  if (!m) {
    return (
      <>
        <Back to="/relationship/relationship" />
        <p>That milestone no longer exists.</p>
      </>
    );
  }
  return (
    <>
      <Back to="/relationship/relationship" label="Timeline" />
      <p className="kicker">{m.type}</p>
      <h1>{m.title}</h1>
      <p className="sub muted">
        {formatFuzzyDate(m.date)} · {describePrecision(m.date.kind)}
      </p>
      <section className="voice user">
        <h3>You told us this happened</h3>
        <p>{m.meaning || 'You didn’t add a description.'}</p>
      </section>
      {m.excluded ? (
        <p className="banner">You’ve excluded this from reflections, so no interpretation is shown.</p>
      ) : (
        <>
          <section className="voice trad">
            <h3>The Western tradition offers</h3>
            <p>
              {MILESTONE_INTERPRETATION.western} <span className="sample-tag">Draft text</span>
            </p>
            {me && <SkyOnDate milestone={m} kind="western" />}
          </section>
          <section className="voice trad" style={{ borderColor: 'var(--sage)' }}>
            <h3>The Vedic tradition offers</h3>
            <p>
              {MILESTONE_INTERPRETATION.vedic} <span className="sample-tag">Draft text</span>
            </p>
            {me && <SkyOnDate milestone={m} kind="vedic" />}
            {m.date.kind !== 'exact' && <p className="unavailable">This date isn’t exact, so interpretations use a broader window.</p>}
          </section>
        </>
      )}
      <section className="voice q">
        <h3>A question to consider</h3>
        <p>{MILESTONE_INTERPRETATION.question}</p>
      </section>
      <div className="btn-row">
        <Link className="btn quiet" to={`/milestone/${m.id}/edit`}>
          Edit or correct
        </Link>
        <ConfirmButton
          label="Delete milestone"
          question="Delete this milestone? This can’t be undone."
          confirmLabel="Delete milestone"
          onConfirm={() => {
            dispatch({ type: 'milestone/delete', id: m.id });
            nav('/relationship/relationship');
          }}
        />
      </div>
    </>
  );
}

export function MilestoneForm() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const existing = state.person?.milestones.find((x) => x.id === id);
  const [type, setType] = useState<MilestoneType>(existing?.type ?? 'Custom');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [meaning, setMeaning] = useState(existing?.meaning ?? '');
  const [kind, setKind] = useState<DateKind>(existing?.date.kind ?? 'exact');
  const [start, setStart] = useState(existing?.date.start ?? '');
  const [end, setEnd] = useState(existing?.date.end ?? '');
  const [excluded, setExcluded] = useState(existing?.excluded ?? false);

  // Month inputs give YYYY-MM; store as the first of the month.
  const monthToIso = (v: string) => (v.length === 7 ? `${v}-01` : v);
  const valid = title.trim() && start && (kind !== 'range' || (end && end >= start));

  const save = () => {
    dispatch({
      type: 'milestone/save',
      milestone: {
        id: existing?.id ?? Math.random().toString(36).slice(2, 10),
        type,
        title: title.trim(),
        meaning: meaning.trim(),
        date: { kind, start: monthToIso(start), end: kind === 'range' ? monthToIso(end) : undefined },
        excluded,
      },
    });
    nav('/relationship/relationship');
  };

  return (
    <>
      <Back />
      <h1>{existing ? 'Edit milestone' : 'Add a meaningful date'}</h1>
      <p className="sub muted">You decide what this moment meant. Nothing is added for you.</p>
      <label htmlFor="m-type">Kind of moment</label>
      <select id="m-type" value={type} onChange={(e) => setType(e.target.value as MilestoneType)}>
        {MILESTONE_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <label htmlFor="m-title">Name it</label>
      <PromptChips label="Suggestions" options={MILESTONE_TITLES[type]} value={title} onChange={setTitle} mode="replace" />
      <input id="m-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      <fieldset className="radio-list">
        <legend>How sure are you of the date?</legend>
        {(
          [
            ['exact', 'I know the exact date'],
            ['approximate', 'Roughly (month and year)'],
            ['range', 'It happened over a period'],
          ] as const
        ).map(([v, l]) => (
          <label key={v}>
            <input
              type="radio"
              name="dk"
              checked={kind === v}
              onChange={() => {
                setKind(v);
                setStart('');
                setEnd('');
              }}
            />
            {l}
          </label>
        ))}
      </fieldset>
      <label htmlFor="m-start">{kind === 'range' ? 'From' : 'When'}</label>
      <input
        id="m-start"
        type={kind === 'exact' ? 'date' : 'month'}
        value={kind === 'exact' ? start : start.slice(0, 7)}
        onChange={(e) => setStart(e.target.value)}
      />
      {kind === 'range' && (
        <>
          <label htmlFor="m-end">To</label>
          <input id="m-end" type="month" value={end.slice(0, 7)} onChange={(e) => setEnd(e.target.value)} />
        </>
      )}
      <label htmlFor="m-meaning">
        What it meant to you <span className="hint">Optional. Private.</span>
      </label>
      <PromptChips label="Tap any that fit" options={MILESTONE_MEANINGS} value={meaning} onChange={setMeaning} />
      <textarea id="m-meaning" value={meaning} onChange={(e) => setMeaning(e.target.value)} />
      <label className="toggle" style={{ marginTop: 16 }}>
        Leave this out of future reflections
        <input type="checkbox" checked={excluded} onChange={(e) => setExcluded(e.target.checked)} />
      </label>
      <div className="btn-row">
        <button type="button" className="btn" disabled={!valid} onClick={save}>
          Save
        </button>
      </div>
    </>
  );
}

/** Placements on a milestone's date (midpoint for ranges), calculated live. */
function SkyOnDate({ milestone, kind }: { milestone: Milestone; kind: 'western' | 'vedic' }) {
  const { me } = useCharts();
  if (!me) return null;
  const d = milestone.date;
  const at = new Date(d.kind === 'range' && d.end ? (Date.parse(d.start) + Date.parse(d.end)) / 2 : Date.parse(d.start) + (d.kind === 'approximate' ? 14 * 86400000 : 43200000));
  if (kind === 'western') {
    const t = currentTransits(me, at);
    return (
      <ul className="details">
        {t.length ? t.map((x) => <li key={x}>{x.replace(' now ', ' then ')}</li>) : <li>No slow-planet transits to your Sun, Moon, or Venus within 2° around then.</li>}
        {d.kind !== 'exact' && <li>Slow planets move little in a month, so an approximate date still works here.</li>}
      </ul>
    );
  }
  const moon = me.vedic.planets.find((p) => p.body === 'Moon')!;
  if (me.timePrecision !== 'exact') return <p className="small muted">The dasha running then needs an exact birth time.</p>;
  const maha = vimshottari(me.utc, moon.longitude).find((p) => p.start <= at && at < p.end);
  const antar = maha && antardashas(maha).find((p) => p.start <= at && at < p.end);
  return maha ? (
    <ul className="details">
      <li>
        Dasha then: {maha.lord} mahadasha{antar ? `, ${antar.lord} antardasha` : ''}
      </li>
    </ul>
  ) : null;
}
