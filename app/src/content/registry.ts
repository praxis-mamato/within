/**
 * Every reviewable text fragment in the interpretation libraries, with a stable ID, so the approver
 * can sign off on each one (next-features A1) and approvals can be checked in CI.
 *
 * A fragment's ID is its path in the library, e.g. `western.PLANET_IN_SIGN.Moon.Taurus`.
 * Only prose is listed: single words (sign names, gana, element keys) are lookup data, not text.
 */
import * as T from './templates';
import * as W from './western';
import * as V from './vedic';
import * as P from './topics';
import * as D from './deep';
import committed from './approvals.json';
import { lint } from './lint';

export interface Group {
  key: string;
  label: string;
  section: string;
}
export interface Fragment {
  id: string;
  group: string;
  text: string;
  hash: string;
  /** Where the text lives, so an approved edit can replace it at runtime. */
  holder: Record<string | number, unknown>;
  key: string | number;
}

const SOURCES: [section: string, module: string, Record<string, unknown>, [name: string, label: string][]][] = [
  ['Short reflections', 'templates', T as Record<string, unknown>, [
    ['WESTERN_SIGN', 'Western signs'],
    ['VEDIC_RASHI', 'Vedic rashis'],
    ['DIGNITY', 'Dignity notes'],
    ['NAKSHATRA', 'Nakshatras'],
    ['DASHA_THEME', 'Dasha themes'],
    ['TRANSIT_PLANET', 'Transit planets'],
    ['TRANSIT_ASPECT', 'Transit aspects'],
    ['TARGET', 'Transit targets'],
    ['ASPECT_QUALITY', 'Synastry aspects'],
    ['PLANET_ROLE', 'Planet roles'],
    ['ELEMENT_THEME', 'Together: element themes'],
    ['STEPS', 'Steps'],
    ['QUESTIONS', 'Questions'],
    ['OTHER_STEPS', 'Steps with the other person'],
  ]],
  ['Western full reading', 'western', W as Record<string, unknown>, [
    ['PLANET_FUNCTION', 'Planet meanings'],
    ['PLANET_IN_SIGN', 'Planets in signs'],
    ['RISING', 'Rising signs'],
    ['HOUSE', 'Houses'],
    ['SIGN_KEYWORD', 'Sign keywords'],
    ['ASPECT_MEANING', 'Aspects'],
    ['PAIR', 'Planet pairs'],
    ['LUNAR_PHASE', 'Lunar phases'],
    ['ELEMENT_BALANCE', 'Element balance'],
    ['MODALITY_BALANCE', 'Mode balance'],
  ]],
  ['Vedic full reading', 'vedic', V as Record<string, unknown>, [
    ['GRAHA', 'Grahas'],
    ['DIGNITY_TEXT', 'Dignities'],
    ['LAGNA', 'Lagnas'],
    ['LAGNA_LORD_IN', 'Lagna lord by house'],
    ['BHAVA', 'Bhavas'],
    ['NAKSHATRA_DETAIL', 'Nakshatra qualities'],
    ['GANA_TEXT', 'Ganas'],
    ['YOGA_TEXT', 'Yogas'],
    ['DASHA_DETAIL', 'Dasha periods'],
  ]],
  ['Subscriber deep reading', 'deep', D as Record<string, unknown>, [
    ['PLANET_IN_HOUSE', 'Planets in houses'],
    ['PATTERN_TEXT', 'Aspect patterns'],
    ['LUNATION_TEXT', 'New and Full Moons'],
    ['STATION_TEXT', 'Stations'],
    ['DRISHTI_TEXT', 'Graha drishti'],
    ['LORDSHIP_TEXT', 'Lordship yogas'],
    ['OVERLAY_TEXT', 'House overlays'],
  ]],
  ['Questions and steps', 'topics', P as Record<string, unknown>, [
    ['TOPICS', 'Topics: questions, answers, steps'],
    ['OUTCOME_STEPS', 'Steps by outcome'],
    ['ELEMENT_STYLE', 'Step styles'],
  ]],
];

/** FNV-1a, enough to notice that a fragment's text changed after it was decided. */
export function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

const isProse = (s: string) => /\s/.test(s.trim());

function walk(x: unknown, path: string, group: string, out: Fragment[]) {
  if (!x || typeof x !== 'object') return;
  for (const [k, v] of Object.entries(x)) {
    const key = Array.isArray(x) ? Number(k) : k;
    if (typeof v === 'string') {
      if (isProse(v)) out.push({ id: `${path}.${k}`, group, text: v, hash: hashText(v), holder: x as Record<string, unknown>, key });
    } else walk(v, `${path}.${k}`, group, out);
  }
}

export const GROUPS: Group[] = [];
export const FRAGMENTS: Fragment[] = [];
for (const [section, module, lib, names] of SOURCES)
  for (const [name, label] of names) {
    const key = `${module}.${name}`;
    GROUPS.push({ key, label, section });
    walk(lib[name], key, key, FRAGMENTS);
  }
export const FRAGMENT_BY_ID = new Map(FRAGMENTS.map((f) => [f.id, f]));

// ---------- Decisions ----------

export type Status = 'draft' | 'approved' | 'rejected' | 'changed';
export interface Decision {
  status: 'approved' | 'rejected';
  /** Revision number, counting every decision made on this fragment. */
  rev: number;
  /** Hash of the library text the decision was made against. */
  hash: string;
  /** The approved wording, when the approver edited it. */
  text?: string;
  note?: string;
  by: string;
  at: string;
}
export interface Approvals {
  version: 1;
  decisions: Record<string, Decision>;
}

export const COMMITTED = committed as Approvals;

/** A decision only counts while the library text is the text it was made on. */
export function statusOf(f: Fragment, d: Decision | undefined): Status {
  if (!d) return 'draft';
  if (d.hash !== f.hash) return 'changed';
  return d.status;
}

/** Problems that make an approvals file invalid: unknown IDs, edited text that fails the lint. */
export function problems(a: Approvals): string[] {
  const out: string[] = [];
  for (const [id, d] of Object.entries(a.decisions)) {
    if (!FRAGMENT_BY_ID.has(id)) out.push(`${id}: no such fragment`);
    if (d.text !== undefined) for (const why of lint(d.text)) out.push(`${id}: edited text fails the lint (${why})`);
  }
  return out;
}

/** Puts approved edits from the committed file into the libraries, so readings use the approved wording. */
export function applyApprovedEdits(a: Approvals = COMMITTED) {
  for (const f of FRAGMENTS) {
    const d = a.decisions[f.id];
    if (d?.text !== undefined && statusOf(f, d) === 'approved' && !lint(d.text).length) f.holder[f.key] = d.text;
  }
}
