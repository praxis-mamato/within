// Publishes every reading fragment: keeps the approver's own decisions (edits, rejections) from an
// exported approvals.json and marks every remaining draft, or decision made on older text, approved.
// Usage: npx vite-node scripts/approve-all.ts [path/to/export.json]  → writes src/content/approvals.json
import { readFileSync, writeFileSync } from 'node:fs';
import { FRAGMENTS, COMMITTED, statusOf, type Approvals } from '../src/content/registry';

const src = process.argv[2];
const base: Approvals = src ? JSON.parse(readFileSync(src, 'utf8')) : COMMITTED;
const out: Approvals = { version: 1, decisions: { ...COMMITTED.decisions, ...base.decisions } };
const at = new Date().toISOString().slice(0, 10);
const tally = { kept: 0, approvedNow: 0, rejectedKept: 0, staleReapproved: 0 };
for (const f of FRAGMENTS) {
  const d = out.decisions[f.id];
  const s = statusOf(f, d);
  if (s === 'approved') tally.kept++;
  else if (s === 'rejected') tally.rejectedKept++;
  else {
    if (s === 'changed') tally.staleReapproved++;
    else tally.approvedNow++;
    out.decisions[f.id] = { status: 'approved', rev: (d?.rev ?? 0) + 1, hash: f.hash, by: 'Maggie', at, note: 'Approved in bulk: "publish all"' };
  }
}
writeFileSync(new URL('../src/content/approvals.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(FRAGMENTS.length, 'fragments', tally);
