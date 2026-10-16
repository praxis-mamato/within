/**
 * Reading what a question carries besides the question: someone's birth details typed into it
 * ("my friend Mariya 6/6/86 17:40 Billings MT"), and the dates of an event ("Nov 9-15").
 * Everything is parsed on the device; nothing is sent anywhere.
 */
import { searchPlaces, type Place } from '../geo/places';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';
const monthOf = (m: string) => MONTHS.indexOf(m.slice(0, 3).toLowerCase()) + 1;
const pad = (n: number) => String(n).padStart(2, '0');

/** US states and Canadian provinces: the town list keeps them as codes, so a full name is turned into its code. */
const REGION: Record<string, string> = {
  al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas', ca: 'california', co: 'colorado', ct: 'connecticut', de: 'delaware', fl: 'florida', ga: 'georgia', hi: 'hawaii', id: 'idaho', il: 'illinois', in: 'indiana', ia: 'iowa', ks: 'kansas', ky: 'kentucky', la: 'louisiana', me: 'maine', md: 'maryland', ma: 'massachusetts', mi: 'michigan', mn: 'minnesota', ms: 'mississippi', mo: 'missouri', mt: 'montana', ne: 'nebraska', nv: 'nevada', nh: 'new hampshire', nj: 'new jersey', nm: 'new mexico', ny: 'new york', nc: 'north carolina', nd: 'north dakota', oh: 'ohio', ok: 'oklahoma', or: 'oregon', pa: 'pennsylvania', ri: 'rhode island', sc: 'south carolina', sd: 'south dakota', tn: 'tennessee', tx: 'texas', ut: 'utah', vt: 'vermont', va: 'virginia', wa: 'washington', wv: 'west virginia', wi: 'wisconsin', wy: 'wyoming', dc: 'district of columbia',
  ab: 'alberta', bc: 'british columbia', mb: 'manitoba', nb: 'new brunswick', nl: 'newfoundland', ns: 'nova scotia', on: 'ontario', pe: 'prince edward', qc: 'quebec', sk: 'saskatchewan',
};

/** A birth date in the question: 6/6/86, 6/6/1986, 1986-06-06, June 6 1986, 6 June 1986. */
const BIRTH_DATE = new RegExp(
  [
    '\\b(\\d{1,2})[/.-](\\d{1,2})[/.-](\\d{2}|\\d{4})\\b',
    '\\b(\\d{4})-(\\d{2})-(\\d{2})\\b',
    `\\b${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`,
    `\\b(\\d{1,2})\\s+${MONTH},?\\s+(\\d{4})\\b`,
  ].join('|'),
  'i',
);
const TIME = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?(?=[\s,]|$)/i;

/** Whether a question looks like it carries someone's birth date (so the place list is worth loading). */
export const hasBirthDate = (q: string) => BIRTH_DATE.test(q);

export interface Subject {
  name: string | null;
  date: string;
  time: string | null;
  place: Place | null;
  /** The question with the birth details taken out. */
  rest: string;
}

/** Someone's birth details typed into the question. The place is matched against the town list when given. */
export function subjectIn(q: string, places: Place[] | null, now = new Date()): Subject | null {
  const m = q.match(BIRTH_DATE);
  if (!m || m.index === undefined) return null;
  let y: number, mo: number, d: number;
  if (m[1]) {
    mo = Number(m[1]);
    d = Number(m[2]);
    y = Number(m[3]);
    if (mo > 12 && d <= 12) [mo, d] = [d, mo];
  } else if (m[4]) [y, mo, d] = [Number(m[4]), Number(m[5]), Number(m[6])];
  else if (m[7]) [mo, d, y] = [monthOf(m[7]), Number(m[8]), Number(m[9])];
  else [d, mo, y] = [Number(m[10]), monthOf(m[11]), Number(m[12])];
  if (y < 100) y += y > now.getUTCFullYear() % 100 ? 1900 : 2000;
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31) || y < 1900 || y > now.getUTCFullYear()) return null;
  const date = `${y}-${pad(mo)}-${pad(d)}`;

  // The time, if one follows the date.
  let after = q.slice(m.index + m[0].length);
  let time: string | null = null;
  const t = after.match(TIME);
  if (t && t.index !== undefined && t.index <= 4 && (t[2] || t[3])) {
    let h = Number(t[1]);
    const pm = /^p/i.test(t[3] ?? '');
    const am = /^a/i.test(t[3] ?? '');
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    if (h <= 23 && Number(t[2] ?? 0) <= 59) time = `${pad(h)}:${t[2] ?? '00'}`;
    after = after.slice(t.index + t[0].length);
  }

  // The place: the longest run of the next few words that names a town in the list.
  let place: Place | null = null;
  let used = 0;
  const words = after.replace(/^[\s,]+/, '').split(/\s+/);
  if (places)
    for (let n = Math.min(5, words.length); n >= 1 && !place; n--) {
      let query = words
        .slice(0, n)
        .map((w) => w.replace(/[,.]/g, ''))
        .join(' ');
      // The list keeps US states and Canadian provinces as codes: "Billings Montana" becomes "Billings mt".
      for (const [code, full] of Object.entries(REGION)) query = query.replace(new RegExp(`(?<=\\S\\s)${full}$`, 'i'), code);
      const hit = searchPlaces(places, query, 1)[0];
      if (hit) {
        place = hit;
        used = words.slice(0, n).join(' ').length;
      }
    }

  // The name: the capitalised word just before the date ("my friend Mariya 6/6/86").
  const before = q.slice(0, m.index).trim();
  const nm = before.match(/([A-Z][\p{L}'-]+)$/u);
  const name = nm && !/^(Will|Is|Does|Should|Can|When|What|How|My|Born|On|For)$/.test(nm[1]) ? nm[1] : null;
  const rest = `${before} ${after.replace(/^[\s,]+/, '').slice(used)}`.replace(/\s+/g, ' ').trim();
  return { name, date, time, place, rest };
}

export interface Window {
  start: string;
  end: string;
}

/** The dates of an event in the question: "Nov 9-15", "November 9 to 15", "Nov 9 - Dec 2", "on Nov 12", "11/9-11/15". */
export function windowIn(q: string, now = new Date()): Window | null {
  const year = (mo: number, d: number) => {
    const y = now.getUTCFullYear();
    return `${y}-${pad(mo)}-${pad(d)}` < now.toISOString().slice(0, 10) ? y + 1 : y;
  };
  const day = (mo: number, d: number, y?: number) => `${y ?? year(mo, d)}-${pad(mo)}-${pad(d)}`;
  const range = new RegExp(`\\b${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:-|–|to|through|thru|until)\\s*(?:${MONTH}\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
  const r = q.match(range);
  if (r) {
    const m1 = monthOf(r[1]);
    const m2 = r[3] ? monthOf(r[3]) : m1;
    const start = day(m1, Number(r[2]));
    let end = day(m2, Number(r[4]), Number(start.slice(0, 4)));
    if (end < start) end = day(m2, Number(r[4]), Number(start.slice(0, 4)) + 1);
    return { start, end };
  }
  const numeric = q.match(/(?<![\d/])(\d{1,2})\/(\d{1,2})\s*(?:-|–|to)\s*(?:(\d{1,2})\/)?(\d{1,2})(?![\d/])/);
  if (numeric) {
    const m1 = Number(numeric[1]);
    const m2 = numeric[3] ? Number(numeric[3]) : m1;
    if (m1 <= 12 && m2 <= 12) {
      const start = day(m1, Number(numeric[2]));
      return { start, end: day(m2, Number(numeric[4]), Number(start.slice(0, 4))) };
    }
  }
  const one = q.match(new RegExp(`\\b(?:on|at|for|by)?\\s*${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!,?\\s*\\d{4})`, 'i'));
  if (one) {
    const d = day(monthOf(one[1]), Number(one[2]));
    return { start: d, end: d };
  }
  return null;
}
