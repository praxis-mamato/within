/**
 * The Within tools Claude calls through the connector. Each one calculates the chart with the same
 * engine as the app (app/src/astro) and returns two things: the calculated facts, and Within's
 * reviewed interpretations for exactly those facts. Claude writes the reading from them, following
 * the plugin's skill. Nothing here stores or logs birth details.
 */
import { computeNatal, type NatalChart, type TimePrecision } from '../../app/src/astro/natal';
import { formatOffset, loadPlaces, offsetMinutes, placeLabel, searchPlaces, isValidZone, type Place } from '../../app/src/geo/places';
import { chartInBrief, todaySky, type SkyLine } from '../../app/src/content/today';
import { vedicReading, westernReading, type ReadingSection } from '../../app/src/content/fullReading';
import { timingReading, vedicDeep, westernDeep } from '../../app/src/content/deepReading';
import { westernPlacements } from '../../app/src/content/chartReading';
import { relationshipReading } from '../../app/src/content/relationship';
import { cycles } from '../../app/src/content/cycles';
import { findPatterns } from '../../app/src/content/patternRules';
import { consultOracle } from '../../app/src/content/oracleEngine';
import { factSheet } from '../../app/src/content/factSheet';
import { screen, isUrgent } from '../../app/src/lib/screener';
import { GLOBAL_DIRECTORY } from '../../app/src/safety/resources';

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface BirthArgs {
  date: string;
  time?: string;
  time_accuracy?: TimePrecision;
  place?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface Resolved {
  chart: NatalChart;
  place: { lat: number; lon: number };
  /** One line saying which place and time zone were used, so Claude can confirm it with the person. */
  used: string;
}

export class InputError extends Error {}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function resolveBirth(b: BirthArgs | undefined, label = 'birth'): Promise<Resolved> {
  if (!b || typeof b !== 'object') throw new InputError(`Missing ${label} details.`);
  if (typeof b.date !== 'string' || !DATE.test(b.date) || Number.isNaN(Date.parse(b.date))) throw new InputError(`The ${label} date must be YYYY-MM-DD.`);
  const year = Number(b.date.slice(0, 4));
  if (year < 1800 || year > 2100) throw new InputError('Within calculates charts for 1800 to 2100.');
  const precision: TimePrecision = b.time_accuracy ?? (b.time ? 'exact' : 'unknown');
  if (!['exact', 'approximate', 'unknown'].includes(precision)) throw new InputError('time_accuracy must be exact, approximate, or unknown.');
  if (precision !== 'unknown' && (typeof b.time !== 'string' || !TIME.test(b.time))) throw new InputError(`The ${label} time must be HH:MM (24-hour), or set time_accuracy to unknown.`);

  let lat: number, lon: number, tz: string, where: string;
  if (typeof b.latitude === 'number' && typeof b.longitude === 'number' && typeof b.timezone === 'string') {
    if (Math.abs(b.latitude) > 90 || Math.abs(b.longitude) > 180) throw new InputError('Latitude or longitude is out of range.');
    if (!isValidZone(b.timezone)) throw new InputError('Unknown time zone. Use an IANA name such as America/Denver.');
    [lat, lon, tz] = [b.latitude, b.longitude, b.timezone];
    where = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } else if (typeof b.place === 'string' && b.place.trim()) {
    const hit = searchPlaces(await loadPlaces(), b.place, 1)[0];
    if (!hit) throw new InputError(`No town matched “${b.place}”. Try find_place, or give latitude, longitude, and timezone.`);
    [lat, lon, tz, where] = [hit.lat, hit.lon, hit.tz, placeLabel(hit)];
  } else throw new InputError(`Give the ${label} place (a town name) or latitude, longitude, and timezone.`);

  const chart = computeNatal({ date: b.date, time: precision === 'unknown' ? '' : b.time!, timePrecision: precision, windowMinutes: 60, lat, lon, tz });
  const time = precision === 'unknown' ? 'time unknown' : `${b.time}${precision === 'approximate' ? ' (approximate, ±1 hour)' : ''}`;
  return { chart, place: { lat, lon }, used: `${where}, ${b.date} ${time}, ${chart.offsetLabel}` };
}

// ─── Output ───────────────────────────────────────────────────────────────────

const item = (heading: string, text: string, basis?: string) => `- ${heading ? `${heading}: ` : ''}${text}${basis ? ` [${basis}]` : ''}`;
const lines = (xs: SkyLine[]) => xs.map((l) => item(l.heading, l.text, l.basis)).join('\n');
const sections = (xs: ReadingSection[]) =>
  xs
    .filter((s) => s.items.length)
    .map((s) => `### ${s.title}\n${s.intro ? `${s.intro}\n` : ''}${s.items.map((i) => item(i.heading, i.text, i.basis)).join('\n')}`)
    .join('\n\n');
const facts = (xs: string[]) => xs.map((f) => `- ${f}`).join('\n');

function doc(title: string, used: string, parts: [string, string][]): string {
  return [`# ${title}`, `Chart used: ${used}`, ...parts.filter(([, body]) => body.trim()).map(([h, body]) => `## ${h}\n${body}`)].join('\n\n');
}

// ─── Tools ────────────────────────────────────────────────────────────────────

export async function findPlace(query: string): Promise<string> {
  if (typeof query !== 'string' || !query.trim()) throw new InputError('Give a town name to search for.');
  const hits: Place[] = searchPlaces(await loadPlaces(), query, 6);
  if (!hits.length) return `No town matched “${query}”. Try the nearest larger town, or ask for latitude, longitude, and time zone.`;
  const now = new Date();
  return hits.map((p) => `- ${placeLabel(p)}: latitude ${p.lat}, longitude ${p.lon}, timezone ${p.tz} (${formatOffset(offsetMinutes(p.tz, now))} today)`).join('\n');
}

export async function chartOverview(b: BirthArgs, now = new Date()): Promise<string> {
  const r = await resolveBirth(b);
  const c = r.chart;
  const big3 = [
    `Western (tropical): Sun in ${c.western.planets[0].sign}, Moon in ${c.western.moonSign.certain ? c.western.moonSign.value : c.western.moonSign.options.join(' or ')}, ${c.western.ascendant.certain ? `${c.western.ascendant.value} rising` : c.western.ascendant.options.length ? `rising ${c.western.ascendant.options.join(' or ')}` : 'rising sign unknown (no birth time)'}`,
    `Vedic (sidereal, Lahiri): Moon in ${c.vedic.moonRashi.value ?? c.vedic.moonRashi.options.join(' or ')}, nakshatra ${c.vedic.moonNakshatra.certain ? `${c.vedic.nakshatra.name} pada ${c.vedic.nakshatra.pada}` : c.vedic.moonNakshatra.options.join(' or ')}, lagna ${c.vedic.lagna.certain ? c.vedic.lagna.value : 'unknown or uncertain'}`,
  ];
  const sky = todaySky(c, r.place, now);
  return doc('Chart overview', r.used, [
    ['Core placements', facts(big3)],
    ['Within’s reading of the core', lines(chartInBrief(c))],
    ['Today for this chart', lines([sky.moon, ...sky.now])],
    ['Also in Within membership', 'Full natal readings in both traditions, timing (week, month, year ahead, progressions, dashas), relationship readings, and answers to the person’s own questions.'],
  ]);
}

export async function skyToday(b: BirthArgs, now = new Date()): Promise<string> {
  const r = await resolveBirth(b);
  const sky = todaySky(r.chart, r.place, now);
  return doc(`The sky on ${now.toISOString().slice(0, 10)}`, r.used, [
    ['Today', lines([sky.moon, ...sky.now])],
    ['Retrograde now', sky.retrograde.join(', ')],
    ['Later this week (titles; the timing tool reads them in full)', sky.later.map((x) => `- ${x}`).join('\n')],
  ]);
}

export async function natalReading(b: BirthArgs, tradition: 'western' | 'vedic', now = new Date()): Promise<string> {
  const r = await resolveBirth(b);
  if (tradition === 'vedic')
    return doc('Vedic natal reading (sidereal, Lahiri)', r.used, [
      ['Calculated facts', facts(factSheet('vedic', r.chart, r.place))],
      ['Within’s interpretations', sections([...vedicReading(r.chart, b.date, now), ...vedicDeep(r.chart)])],
    ]);
  const patterns = findPatterns(r.chart, r.place.lat, r.place.lon).slice(0, 8);
  return doc('Western natal reading (tropical, Placidus)', r.used, [
    ['Calculated facts', facts(factSheet('western', r.chart, r.place))],
    ['Placements', sections([westernPlacements(r.chart, r.place)])],
    ['Patterns (themes scored from the chart)', patterns.map((p) => `- ${p.title}: ${p.summary} Evidence: ${p.evidence.slice(0, 3).map((e) => e.text).join('; ')}.`).join('\n')],
    ['Within’s interpretations', sections([...westernReading(r.chart, now), ...westernDeep(r.chart, r.place)])],
  ]);
}

export async function timing(b: BirthArgs, now = new Date()): Promise<string> {
  const r = await resolveBirth(b);
  const cy = cycles(r.chart, r.place.lat, r.place.lon, now);
  return doc(`Timing from ${now.toISOString().slice(0, 10)}`, r.used, [
    ['Calculated facts (week, month, year ahead, progressions, dashas)', facts(factSheet('timing', r.chart, r.place))],
    [
      'Cycles now (named periods)',
      cy.now.map((x) => `- ${x.title} (${x.tradition}, ${x.phase}, ${x.start} to ${x.end}${x.peaks.length ? `, peaks ${x.peaks.join(', ')}` : ''}): ${x.feel} Touches ${x.touches}. What helps: ${x.helps} [${x.basis}]`).join('\n'),
    ],
    ['Within’s interpretations', sections(timingReading(r.chart, r.place, now))],
  ]);
}

export async function relationship(b: BirthArgs, other: BirthArgs, now = new Date()): Promise<string> {
  const me = await resolveBirth(b);
  const them = await resolveBirth(other, 'second person’s birth');
  return doc('Relationship reading (two charts)', `${me.used}; second chart: ${them.used}`, [
    ['Calculated facts', facts(factSheet('together', me.chart, me.place, { chart: them.chart, place: them.place }))],
    ['Within’s interpretations', sections(relationshipReading(me.chart, me.place, them.chart, them.place, 'them', now))],
  ]);
}

/** Within's safety rule: a question about fear, danger, coercion, or self-harm gets resources, not astrology. */
export function safetyReply(text: string): string | null {
  const s = screen(text);
  if (!s.flagged) return null;
  return [
    '# Safety first',
    'Within does not read charts for this question. Your safety matters more than any reading.',
    isUrgent(s.category) ? 'If you are in danger right now, call your local emergency number.' : '',
    `${GLOBAL_DIRECTORY.name} (${GLOBAL_DIRECTORY.url}): ${GLOBAL_DIRECTORY.description}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function askQuestion(b: BirthArgs, question: string, now = new Date()): Promise<string> {
  if (typeof question !== 'string' || !question.trim() || question.length > 500) throw new InputError('Ask a question of up to 500 characters.');
  const safe = safetyReply(question);
  if (safe) return safe;
  const r = await resolveBirth(b);
  const a = consultOracle(question, { chart: r.chart, place: r.place, now });
  return doc(`Within’s answer: “${question.trim()}”`, r.used, [
    ['Headline', `${a.label}${a.limit ? ' (this question asks for something astrology can’t answer; reframe it)' : ''}`],
    ['Answer', lines(a.lines)],
    ['More', lines(a.deeper)],
    ...(a.layers ?? []).map((l): [string, string] => [`${l.title} (${l.tradition})`, lines(l.lines)]),
    ['What Within read', (a.consulted ?? []).map((x) => `- ${x}`).join('\n')],
  ]);
}
