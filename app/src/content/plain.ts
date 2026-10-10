/**
 * "Say it simply": rewrites an Oracle answer in plain words. Astrology terms become everyday ones,
 * each point is cut to its first sentence, and the answer ends with one thing to do and the dates
 * that matter.
 */
import type { NatalChart } from '../astro/natal';
import type { SkyLine } from './today';
import * as W from './western';

/** Astrology terms and their everyday equivalents, longest first so phrases win over single words. */
export const PLAIN_WORDS: [RegExp, string][] = [
  [/\bsolar arc\b/gi, 'slow inner growth'],
  [/\bprogressed\b/gi, 'grown-up'],
  [/\bsecondary progressions?\b/gi, 'how you have grown since birth'],
  [/\bsolar return\b/gi, 'birthday chart for this year'],
  [/\bcomposite\b/gi, 'shared'],
  [/\bsynastry\b/gi, 'how your charts meet'],
  [/\bDavison\b/g, 'shared'],
  [/\bnatal\b/gi, 'birth'],
  [/\btransiting\b/gi, 'passing'],
  [/\btransits?\b/gi, 'passing planets'],
  [/\bconjunct(ion)?\b/gi, 'meets'],
  [/\b[Oo]pposition\b|\b[Oo]pposes\b|\b[Oo]pposite(?= (your|their|the|natal|birth|[A-Z]))/g, 'faces'],
  [/\bsquares?\b/gi, 'clashes with'],
  [/\btrines?\b/gi, 'flows with'],
  [/\bsextiles?\b/gi, 'helps'],
  [/\bretrograde\b/gi, 'in review mode'],
  [/\bvoid of course\b/gi, 'between moods'],
  [/\bAscendant\b|\brising sign\b/gi, 'first impression'],
  [/\bMidheaven\b/gi, 'career point'],
  [/\bNorth Node\b/gi, 'growth path'],
  [/\bnakshatra\b/gi, 'birth star'],
  [/\b(maha|antar)?dasha\b/gi, 'life chapter'],
  [/\bantardasha\b/gi, 'sub-chapter'],
  [/\bbhava\b/gi, 'life area'],
  [/\blagna\b/gi, 'rising sign'],
  [/\bgochara\b/gi, 'passing planets'],
  [/\bwithin \d+°\d+′/gi, 'closely'],
  [/\b\d+°\d+′\s*/g, ''],
  [/\borb\b/gi, 'closeness'],
];

const STEP: Record<string, string> = {
  go: 'Take one small step.',
  wait: 'Hold off for now and ask again soon.',
  closer: 'Double-check the details before you commit.',
  again: 'Ask about what you can choose.',
};
/** One thing to do, by the kind of question asked. */
export const TODO: Record<string, string> = {
  when: 'Put the first date in your calendar.',
  retro: 'Plan around the dates below: review before you sign or send.',
  lunation: 'Set one intention, or let one thing go, on that day.',
  return: 'Note the dates below; use the time before to take stock.',
  chart: 'Notice where this shows up for you this week.',
  patterns: 'Catch this pattern once this week, and name it.',
  cycle: 'Ask yourself what this season wants you to build or release.',
  feeling: 'Be gentle with yourself today; this passes.',
  together: 'Talk about one of these together.',
  week: 'Pick the day that matters most and plan for it.',
  energy: 'Pick your strongest tension and try its release once this week.',
  area: 'Mark the best date above, and try one thing from this on that day.',
};

export const PLAIN_TEXT = {
  title: 'In plain words',
  gist: 'The short version',
  forYou: 'What it means for you',
  todo: 'What to do',
  dates: 'Dates to remember',
  noPrevious: 'Here is your chart in three lines.',
  todoGeneric: 'Pick one line above and notice it this week.',
  todoWhen: 'Put it in your calendar.',
};

export function plain(text: string): string {
  let t = text;
  for (const [re, w] of PLAIN_WORDS) t = t.replace(re, w);
  return t.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
}
const first = (text: string) => (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim();
const MONTH_DATE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}(, \d{4})?/g;

/** A plain-words version of an earlier answer: the gist, what it means, what to do, and the dates. */
export function simplify(prev: { label: string; tone?: string; intent: string; lines: SkyLine[]; deeper: SkyLine[]; layers?: { lines: SkyLine[] }[] }): SkyLine[] {
  const main = prev.lines.find((l) => l.text)?.text ?? prev.label;
  const meaning = prev.lines.filter((l) => l.text).slice(1, 2)[0]?.text ?? prev.layers?.[0]?.lines[0]?.text ?? prev.deeper[0]?.text ?? '';
  // Dates from the answer itself (timing answers also look in the full reading), each once, in order.
  const timed = ['when', 'decision', 'retro', 'lunation', 'return'].includes(prev.intent);
  const all = [prev.label, ...prev.lines, ...prev.deeper, ...(timed ? (prev.layers ?? []).slice(0, 2).flatMap((l) => l.lines) : [])].map((x) => (typeof x === 'string' ? x : `${x.heading} ${x.text}`)).join(' ');
  const seen = new Map<string, number>();
  for (const m of all.match(MONTH_DATE) ?? []) {
    const d = new Date(`${m.replace(/,? (\d{4})$/, '')} ${m.match(/\d{4}$/)?.[0] ?? new Date().getUTCFullYear()} 12:00 UTC`);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    if (!seen.has(key)) seen.set(key, d.getTime());
  }
  const dates = [...seen].sort((x, y) => x[1] - y[1]).slice(0, 3).map(([k]) => k);
  const out: SkyLine[] = [{ heading: PLAIN_TEXT.gist, text: plain(`${prev.label}. ${first(main)}`) }];
  if (meaning) out.push({ heading: PLAIN_TEXT.forYou, text: plain(first(meaning)) });
  out.push({ heading: PLAIN_TEXT.todo, text: prev.tone ? STEP[prev.tone] : (TODO[prev.intent] ?? PLAIN_TEXT.todoGeneric) });
  if (dates.length) out.push({ heading: PLAIN_TEXT.dates, text: dates.join(' · ') });
  return out;
}

/** With nothing to simplify yet: the chart in three plain lines. */
export function plainChart(c: NatalChart): SkyLine[] {
  const p = (b: string) => c.western.planets.find((x) => x.body === b)!;
  const out: SkyLine[] = [
    { heading: `At your core: ${p('Sun').sign}`, text: `You come alive through ${W.SIGN_KEYWORD[p('Sun').sign]}.` },
    c.western.moonSign.certain ? { heading: `What you need: ${p('Moon').sign}`, text: `You feel safe with ${W.SIGN_KEYWORD[p('Moon').sign]}.` } : { heading: 'What you need', text: 'Add your birth time to know your Moon sign for sure.' },
  ];
  const asc = c.western.ascendant;
  if (asc.certain && asc.value) out.push({ heading: `First impression: ${asc.value}`, text: `People meet your ${W.SIGN_KEYWORD[asc.value]} first.` });
  return out;
}
