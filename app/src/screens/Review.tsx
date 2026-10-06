/**
 * Template review console (next-features A1). Not linked from the participant app: open #/review.
 *
 * The approver reads each fragment with sample readings that use it, then approves, edits, or rejects it.
 * Decisions are kept on this device until exported as approvals.json, which is committed to
 * app/src/content/approvals.json. Only the committed file changes what participants see.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { COMMITTED, FRAGMENTS, GROUPS, problems, statusOf, type Approvals, type Decision, type Fragment, type Status } from '../content/registry';
import { buildCorpus, samplesFor, type Passage } from '../content/samples';
import { lint } from '../content/lint';

const STORE_KEY = 'within.review.v1';
const STATUS_LABEL: Record<Status, string> = { draft: 'Draft', approved: 'Approved', rejected: 'Rejected', changed: 'Changed since decided' };
const FILTERS: (Status | 'all')[] = ['all', 'draft', 'approved', 'rejected', 'changed'];

interface Local {
  approver: string;
  decisions: Record<string, Decision>;
}

function loadLocal(): Local {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Local;
  } catch {
    /* storage blocked: decisions live only in memory until exported */
  }
  return { approver: 'Maggie', decisions: {} };
}

function useReview() {
  const [local, setLocal] = useState<Local>(loadLocal);
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(local));
    } catch {
      /* see loadLocal */
    }
  }, [local]);
  const decisions = useMemo(() => ({ ...COMMITTED.decisions, ...local.decisions }), [local]);
  const decide = (f: Fragment, d: Omit<Decision, 'rev' | 'hash' | 'by' | 'at'>) =>
    setLocal((l) => ({
      ...l,
      decisions: {
        ...l.decisions,
        [f.id]: { ...d, rev: (decisions[f.id]?.rev ?? 0) + 1, hash: f.hash, by: l.approver.trim() || 'Approver', at: new Date().toISOString().slice(0, 10) },
      },
    }));
  const undo = (id: string) =>
    setLocal((l) => {
      const { [id]: _, ...rest } = l.decisions;
      return { ...l, decisions: rest };
    });
  return { local, setLocal, decisions, decide, undo };
}
type Review = ReturnType<typeof useReview>;

const countBy = (fs: Fragment[], decisions: Record<string, Decision>) => {
  const c: Record<Status, number> = { draft: 0, approved: 0, rejected: 0, changed: 0 };
  for (const f of fs) c[statusOf(f, decisions[f.id])]++;
  return c;
};

export default function ReviewConsole() {
  const review = useReview();
  const [corpus, setCorpus] = useState<Passage[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setCorpus(buildCorpus()), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="review">
      <header className="review-top">
        <Link to="/review" className="wordmark">
          WITHIN · Template review
        </Link>
        <Link to="/" className="link small">
          Back to the app
        </Link>
      </header>
      <Routes>
        <Route index element={<Home review={review} />} />
        <Route path=":group" element={<GroupView review={review} corpus={corpus} />} />
      </Routes>
    </div>
  );
}

function Home({ review }: { review: Review }) {
  const { local, setLocal, decisions } = review;
  const total = countBy(FRAGMENTS, decisions);
  const unsaved = Object.keys(local.decisions).length;
  const [message, setMessage] = useState('');

  const exportFile = () => {
    const out: Approvals = { version: 1, decisions: Object.fromEntries(Object.entries(decisions).sort(([a], [b]) => a.localeCompare(b))) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2) + '\n'], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'approvals.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Downloaded approvals.json. Commit it as app/src/content/approvals.json (or send it to Claude in the project) to publish these decisions.');
  };
  const importFile = async (file: File) => {
    try {
      const a = JSON.parse(await file.text()) as Approvals;
      const bad = problems(a);
      if (a.version !== 1 || bad.length) throw new Error(bad[0] ?? 'Not an approvals file.');
      setLocal((l) => ({ ...l, decisions: { ...l.decisions, ...a.decisions } }));
      setMessage(`Imported ${Object.keys(a.decisions).length} decisions.`);
    } catch (e) {
      setMessage(`Couldn’t import that file: ${(e as Error).message}`);
    }
  };

  return (
    <>
      <h1>Template review</h1>
      <p className="sub">Every reading is built from these fragments. Approve, edit, or reject each one.</p>
      <div className="card">
        <div className="progress" role="img" aria-label={`${total.approved} of ${FRAGMENTS.length} approved`}>
          <span style={{ width: `${(100 * total.approved) / FRAGMENTS.length}%` }} />
        </div>
        <p className="small">
          <strong>{total.approved}</strong> of {FRAGMENTS.length} approved · {total.draft} draft · {total.rejected} rejected
          {total.changed ? ` · ${total.changed} changed since decided` : ''}
        </p>
        <label htmlFor="approver">Approver</label>
        <input id="approver" type="text" value={local.approver} onChange={(e) => setLocal((l) => ({ ...l, approver: e.target.value }))} />
        <div className="btn-row">
          <button type="button" className="btn" onClick={exportFile}>
            Export approvals.json{unsaved ? ` (${unsaved} new on this device)` : ''}
          </button>
          <label className="btn quiet file-btn">
            Import a file
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          </label>
        </div>
        {message && (
          <p className="small" role="status">
            {message}
          </p>
        )}
        <p className="small muted">Decisions are saved on this device as you go. Participants see them only after approvals.json is committed.</p>
      </div>
      {[...new Set(GROUPS.map((g) => g.section))].map((section) => (
        <section key={section}>
          <h2>{section}</h2>
          {GROUPS.filter((g) => g.section === section).map((g) => {
            const c = countBy(
              FRAGMENTS.filter((f) => f.group === g.key),
              decisions,
            );
            const n = c.draft + c.approved + c.rejected + c.changed;
            return (
              <Link key={g.key} className="card soft list-link" to={`/review/${g.key}`} style={{ textDecoration: 'none' }}>
                <span>
                  <strong>{g.label}</strong>
                  <span className="small muted" style={{ display: 'block' }}>
                    {c.approved} of {n} approved{c.rejected ? ` · ${c.rejected} rejected` : ''}
                    {c.changed ? ` · ${c.changed} changed` : ''}
                  </span>
                </span>
                <span aria-hidden="true">{c.approved === n ? '✓' : '›'}</span>
              </Link>
            );
          })}
        </section>
      ))}
    </>
  );
}

function GroupView({ review, corpus }: { review: Review; corpus: Passage[] | null }) {
  const { group } = useParams();
  const g = GROUPS.find((x) => x.key === group);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  if (!g) return <p>No such group. <Link to="/review">All templates</Link></p>;
  const fs = FRAGMENTS.filter((f) => f.group === g.key);
  const c = countBy(fs, review.decisions);
  const shown = fs.filter((f) => filter === 'all' || statusOf(f, review.decisions[f.id]) === filter);
  return (
    <>
      <Link to="/review" className="link small">
        ‹ All templates
      </Link>
      <h1>{g.label}</h1>
      <p className="sub muted">{g.section}</p>
      <div className="chips" role="group" aria-label="Filter by status">
        {FILTERS.map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {s === 'all' ? `All ${fs.length}` : `${STATUS_LABEL[s]} ${c[s]}`}
          </button>
        ))}
      </div>
      {shown.map((f) => (
        <FragmentCard key={f.id} f={f} review={review} corpus={corpus} />
      ))}
      {!shown.length && <p className="muted">Nothing here with that status.</p>}
    </>
  );
}

function FragmentCard({ f, review, corpus }: { f: Fragment; review: Review; corpus: Passage[] | null }) {
  const d = review.decisions[f.id];
  const status = statusOf(f, d);
  const isLocal = !!review.local.decisions[f.id];
  const current = status === 'approved' && d?.text !== undefined ? d.text : f.text;
  const [mode, setMode] = useState<'view' | 'edit' | 'reject'>('view');
  const [draft, setDraft] = useState(current);
  const [note, setNote] = useState('');
  const [showSamples, setShowSamples] = useState(false);
  const samples = useMemo(() => (corpus && showSamples ? samplesFor(f, corpus) : []), [corpus, showSamples, f]);
  const libraryLint = lint(f.text);
  const draftLint = lint(draft);
  const decided = status === 'approved' || status === 'rejected';

  return (
    <article className={`card fragment ${status}`} aria-labelledby={`${f.id}-h`}>
      <div className="spread">
        <code id={`${f.id}-h`} className="frag-id">
          {f.id.split('.').slice(2).join(' · ')}
        </code>
        <span className={`status-tag ${status}`}>{STATUS_LABEL[status]}</span>
      </div>
      <p className="frag-text">{current}</p>
      {d?.text !== undefined && status === 'approved' && <p className="small muted">Library text before the edit: “{f.text}”</p>}
      {status === 'changed' && <p className="small banner">The library text changed after rev {d!.rev} was {d!.status}. Review it again.</p>}
      <p className={`small ${libraryLint.length ? 'lint-fail' : 'muted'}`}>
        {libraryLint.length ? `Content lint flags: ${libraryLint.join('; ')}. Check whether it’s a false alarm before approving.` : 'Content lint: passes'}
      </p>
      {decided && (
        <p className="small muted">
          {STATUS_LABEL[status]} by {d!.by} on {d!.at} · rev {d!.rev}
          {d!.note ? ` · “${d!.note}”` : ''}
          {isLocal ? ' · on this device, not yet exported' : ''}
        </p>
      )}

      <button type="button" className="link small" aria-expanded={showSamples} onClick={() => setShowSamples(!showSamples)}>
        {showSamples ? 'Hide sample readings' : 'Show sample readings'}
      </button>
      {showSamples && (
        <div className="samples">
          {!corpus && <p className="small muted">Preparing sample readings…</p>}
          {corpus && !samples.length && <p className="small muted">None of the sample charts uses this fragment.</p>}
          {samples.map((s, i) => (
            <blockquote key={i}>
              <span className="small muted">{s.source}</span>
              <Highlight text={s.text} needle={f.text.replaceAll('{name}', 'Alex')} />
            </blockquote>
          ))}
        </div>
      )}

      {mode === 'view' && (
        <div className="row frag-actions">
          {status !== 'approved' && (
            <button type="button" className="btn" onClick={() => review.decide(f, { status: 'approved' })}>
              Approve
            </button>
          )}
          <button type="button" className="btn quiet" onClick={() => (setDraft(current), setMode('edit'))}>
            Edit
          </button>
          {status !== 'rejected' && (
            <button type="button" className="btn danger" onClick={() => setMode('reject')}>
              Reject
            </button>
          )}
          {isLocal && (
            <button type="button" className="link small" onClick={() => review.undo(f.id)}>
              Undo
            </button>
          )}
        </div>
      )}

      {mode === 'edit' && (
        <div>
          <label htmlFor={`${f.id}-edit`}>New wording</label>
          <textarea id={`${f.id}-edit`} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <p className={`small ${draftLint.length ? 'lint-fail' : 'muted'}`} role="status">
            {draftLint.length ? `Fails the content lint: ${draftLint.join('; ')}` : 'Passes the content lint'}
          </p>
          <div className="row frag-actions">
            <button
              type="button"
              className="btn"
              disabled={!draft.trim() || draftLint.length > 0 || draft.trim() === current}
              onClick={() => {
                const text = draft.trim();
                review.decide(f, text === f.text ? { status: 'approved' } : { status: 'approved', text });
                setMode('view');
              }}
            >
              Approve new wording
            </button>
            <button type="button" className="btn quiet" onClick={() => setMode('view')}>
              Cancel
            </button>
          </div>
          {f.text.includes('{name}') && <p className="small muted">Keep {'{name}'} where the other person’s name goes.</p>}
        </div>
      )}

      {mode === 'reject' && (
        <div>
          <label htmlFor={`${f.id}-note`}>What needs to change?</label>
          <textarea id={`${f.id}-note`} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="row frag-actions">
            <button
              type="button"
              className="btn danger"
              disabled={!note.trim()}
              onClick={() => {
                review.decide(f, { status: 'rejected', note: note.trim() });
                setMode('view');
              }}
            >
              Reject with this note
            </button>
            <button type="button" className="btn quiet" onClick={() => setMode('view')}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Highlight({ text, needle }: { text: string; needle: string }) {
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return <p>{text}</p>;
  return (
    <p>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + needle.length)}</mark>
      {text.slice(i + needle.length)}
    </p>
  );
}
