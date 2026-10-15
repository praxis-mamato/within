/**
 * The Oracle's engine: every question about the stars goes through here. It reads what kind of
 * question it is and answers from the right part of Within: the chart, the sky right now, the best
 * days ahead, retrogrades, New and Full Moons, planetary returns, the seasons you are moving through,
 * your patterns, a feeling, the two of you, or a single decision (horary, in oracle.ts).
 *
 * Everything is calculated on the device from the birth chart and the ephemeris, and worded from
 * Within's reviewed libraries. Questions it cannot place are answered from the sky and the chart, and
 * subscribers can ask it to consult the whole chart for a written answer.
 */
import { angleAspectOk, houseOf, placidusCusps, SIGNS, tropicalLongitude } from '../astro/chart';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { allAspects, monthAhead } from '../astro/deep';
import { weekAhead, MOVERS } from '../astro/week';
import { natalPoints, progressions, solarArc } from '../astro/progressions';
import * as P from './progressions';
import { answerFor, feelingIn } from './answer';
import { cycles } from './cycles';
import { findPatterns } from './patternRules';
import { relationshipReading } from './relationship';
import { composite, progressedSynastry } from '../astro/relationship';
import { PLAIN_TEXT, plainChart, simplify } from './plain';
import { chartEnergy, energyLayers } from './energy';
import { healthAnswer } from './health';
import { AREA_SIGNIFICATOR } from './oracleLayers';
import { MOVER_AREA, TARGET_AREAS } from './mirror';
import { HOUSE_AREA } from './week';
import type { Area, Profile } from './mirror';
import { askOracle, areaOf, limitOf, ORACLE_REFRAME, ORACLE_TONE, type Limit, type Tone } from './oracle';
import { chartInBrief, todaySky, type SkyLine } from './today';
import { topicFor } from './topics';
import { WEEK_CONTACT, WEEK_MOVER, WEEK_TARGET, weekReading } from './week';
import * as D from './deep';
import { consulted, dayScores, oracleLayers, type Layer } from './oracleLayers';
import * as V from './vedic';
import * as W from './western';

export type Intent = 'simplify' | 'energy' | 'area' | 'decision' | 'when' | 'return' | 'retro' | 'lunation' | 'together' | 'chart' | 'patterns' | 'feeling' | 'cycle' | 'week' | 'planet' | 'sky' | 'open';

export interface OracleReply {
  intent: Intent;
  question: string;
  day: string;
  /** The headline. */
  label: string;
  /** The words that rise in the orb. */
  orb: string;
  /** The planet or sign the planchette rests on. */
  points: string;
  tone?: Tone;
  lines: SkyLine[];
  /** For subscribers: more of the answer. */
  deeper: SkyLine[];
  limit?: Limit;
  /** True when a written, whole-chart consultation would add the most. */
  consult?: boolean;
  /** The full reading behind the answer, layer by layer (subscribers). */
  layers?: Layer[];
  /** What the Oracle read to answer. */
  consulted?: string[];
}

export interface OracleContext {
  chart: NatalChart;
  place: { lat: number; lon: number };
  now?: Date;
  profile?: Profile | null;
  other?: { chart: NatalChart; place: { lat: number; lon: number }; name: string } | null;
  /** The answer before this one, for 'say it simply' and 'what does that mean'. */
  previous?: OracleReply | null;
  /** Earlier questions and answers, kept only on this device, so the Oracle does not repeat itself. */
  history?: OracleReply[];
}

export const ORACLE_SAYS = {
  welcome: 'Welcome to the Oracle…',
  invite: 'Ask anything. The stars answer, from your own chart.',
  how: 'Ask about your chart, today’s sky, the right time for something, what you are moving through, or what is on your heart. The Oracle reads the sky against your chart, the way astrologers have for centuries, to help you navigate life.',
  lastTime: 'Last time',
  quietWhen: 'The next two months hold no standout window for this, so the Oracle points to the waxing Moon, the traditional time to begin.',
  waxing: 'The Moon is waxing, the traditional time to begin and build.',
  mercuryRx: 'Mercury is retrograde, a traditional time to review rather than sign, launch, or send.',
  venusRx: 'Venus is retrograde, a time tradition reads as better for reflecting on love and money than starting something new in them.',
  noPerson: 'Add the other person in Relationships, with their birth details, and ask again. The Oracle can then read the two charts side by side.',
  noTime: 'This needs an exact birth time. Add it in Settings and ask again.',
  returnNow: 'You are in it now, or close to it: this return is active within a year either side of today.',
  consult: 'For a fuller answer, the Oracle can consult your whole chart and write it out for you.',
};

/** What a planetary return asks, in brief. */
export const RETURN_MEANING: Record<string, string> = {
  Saturn: 'Saturn comes back to where it was when you were born about every 29 years. Tradition reads the Saturn return as a coming of age: a time to take stock, let go of what was borrowed, and commit to a life that is truly yours.',
  Jupiter: 'Jupiter comes back to its birth position about every 12 years. Tradition reads the Jupiter return as a fresh cycle of growth: a good time to widen your world and say yes to what fits.',
};

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const fmtDate = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtLong = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const fmtMonth = (s: string) => new Date(`${s.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const signOf = (lon: number) => SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
const signed = (a: number, b: number) => ((a - b + 540) % 360) - 180;
const speed = (b: (typeof MOVERS)[number], t: Date) => signed(tropicalLongitude(b, new Date(t.getTime() + DAY / 2)), tropicalLongitude(b, new Date(t.getTime() - DAY / 2)));
const BODY_RE = /\b(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)\b/i;
const bodyIn = (q: string) => {
  const m = q.match(BODY_RE);
  return m ? cap(m[1].toLowerCase()) : null;
};
/** "Uranus opposite my Sun", "Saturn square Venus", "is Pluto transiting my Moon": a question about a contact. */
const ASPECT_Q = /\b(opposite|opposing|opposes|opposition|squares?|squaring|conjunct(ion|s)?|trines?|trining|sextiles?|transit(ing|s)?|hitting|aspecting)\b/i;
const SLOWEST = ['Pluto', 'Neptune', 'Uranus', 'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
/** Every planet named in the question, slowest first (the slowest is the one doing the transiting). */
const bodiesIn = (q: string) => SLOWEST.filter((b) => new RegExp(`\\b${b}\\b`, 'i').test(q));

/** How close a transit must be to count as in effect now, by the speed of the planet. */
const ACTIVE_ORB: Record<string, number> = { Sun: 1.5, Mercury: 1.5, Venus: 1.5, Mars: 2, Jupiter: 3, Saturn: 3, Uranus: 3, Neptune: 3, Pluto: 3 };
const ASPECT_DEG: [keyof (typeof WEEK_CONTACT)['Sun'], number][] = [['conjunct', 0], ['sextile', 60], ['square', 90], ['trine', 120], ['opposite', 180]];
const sepOf = (a: number, b: number) => Math.abs(signed(a, b));

export interface ActiveContact {
  natal: string;
  aspect: keyof (typeof WEEK_CONTACT)['Sun'];
  orb: number;
  applying: boolean;
  /** The whole span the transit is within orb, including retrograde passes (ISO dates). */
  start: string;
  end: string;
  /** The dates it is exact (one, or three when the planet turns retrograde over the point). */
  exact: string[];
  /** Later passes within orb, when a retrograde brings the planet back over the point (ISO dates). */
  again: { start: string; end: string; exact: string[] }[];
}

/** Every contact a transiting planet is making to the birth chart now, however far from exact, with its full span. */
export function activeContacts(c: NatalChart, place: { lat: number; lon: number }, now: Date, b: (typeof MOVERS)[number]): ActiveContact[] {
  return contactsTo(natalPoints(c, place.lat, place.lon), now, b);
}

/** The same, against any set of points (a composite chart, another person's chart). */
function contactsTo(points: { name: string; lon: number }[], now: Date, b: (typeof MOVERS)[number]): ActiveContact[] {
  const limit = ACTIVE_ORB[b] ?? 2;
  const slow = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(b);
  const step = slow ? 2 : 1;
  const reach = slow ? 600 : 60;
  const lonAt = (d: number) => tropicalLongitude(b, new Date(now.getTime() + d * DAY));
  const here = lonAt(0);
  const out: ActiveContact[] = [];
  for (const pt of points) {
    for (const [aspect, deg] of ASPECT_DEG) {
      if ((pt.name === b && deg === 0 && !slow) || !angleAspectOk(pt.name, aspect)) continue;
      const orbAt = (d: number) => Math.abs(sepOf(lonAt(d), pt.lon) - deg);
      const orb = Math.abs(sepOf(here, pt.lon) - deg);
      if (orb > limit) continue;
      let s = 0;
      while (s > -reach && orbAt(s - step) <= limit) s -= step;
      let e = 0;
      while (e < reach && orbAt(e + step) <= limit) e += step;
      const day = (d: number) => iso(new Date(now.getTime() + d * DAY));
      const exactIn = (a: number, z: number) => {
        const hits: string[] = [];
        for (let d = a; d <= z; d += step) {
          const o = orbAt(d);
          if (o < 0.6 && o <= orbAt(d - step) && o < orbAt(d + step)) hits.push(day(d));
        }
        return hits;
      };
      // A retrograde can bring a slow planet back over the same point months later.
      const again: ActiveContact['again'] = [];
      if (slow) {
        let d = e + step;
        while (d < reach) {
          if (orbAt(d) <= limit) {
            const a = d;
            while (d < reach && orbAt(d + step) <= limit) d += step;
            again.push({ start: day(a), end: day(d), exact: exactIn(a, d) });
          }
          d += step;
        }
      }
      out.push({ natal: pt.name, aspect, orb, applying: orbAt(1) < orb, start: day(s), end: day(e), exact: exactIn(s, e), again: again.slice(0, 2) });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

// ─── Reading the question ─────────────────────────────────────────────────────

const INTENTS: [Intent, RegExp][] = [
  ['return', /\breturn\b/i],
  ['retro', /\bretrograde|\bretro\b|\brx\b|\bstation(ing|s)?\b/i],
  ['lunation', /\b(full|new) moon|\beclipse/i],
  ['when', /^when\b|\bwhen (is|should|will|can|do|does|would|might)\b|\bbest (time|day|week|month)\b|\bgood (time|day|week)\b|\blucky (day|time)\b|\bwhich (day|week|month)\b|\bwhat day\b/i],
  ['together', /\bcompatib|\bsynastry\b|\bour (relationship|charts?|connection|bond)\b|\bthe two of us\b|\bare we\b|\bdo we (fit|match|work)\b|\bus together\b/i],
  ['week', /\bmy week\b|\bweek look\b|\bthis week\b|\bnext week\b|\bthe week\b|\bthis month\b|\bnext month\b|\bcoming (days|weeks)\b|\bweekend\b|\bahead\b/i],
  ['patterns', /\bpatterns?\b|\bwhy do i (always|keep)\b|\bkeep (repeating|doing|attracting)\b|\bstrengths?\b|\bweakness|\bwho am i\b|\bpersonality\b|\bmy gifts?\b|\bwhat am i (like|good at)\b/i],
  ['chart', /\bmy (sun|moon|rising|ascendant|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|north node|node|chart|big three|signs?|nakshatra|dasha|lagna|midheaven|mc|houses?|placements?|birth chart)\b|\bwhat sign am i\b|\bwhat('s| is) my\b|\b(maha)?dasha\b|\bnakshatra\b|\bmy (rising|moon|sun) sign\b/i],
  ['feeling', /\bwhy do i feel\b|\bi('m| am)? feel(ing)?\b|\bfeeling\b/i],
  ['cycle', /\bgoing through\b|\bchapter\b|\bphase of (my )?life\b|\bthis (year|season|chapter)\b|\blife (phase|lesson)\b|\bcycles?\b|\bwhat('s| is) (happening|going on) (to|with|in) (me|my life)\b|\bmy life\b/i],
  ['planet', BODY_RE],
  ['sky', /\bsky\b|\bright now\b|\btoday\b|\btonight\b|\bstars?\b|\bcosmic\b|\benergy\b|\bthe moon\b/i],
  ['decision', /^(should|shall|is it|will|would|can|could|do|does|am i|are|is|must)\b|^(?!what|where|how|who|which)[^?]*\bshould i\b|\byes or no\b/i],
];

/** When a transit is in effect, when it is exact, and when a retrograde brings it back. */
function spanText(x: ActiveContact, now: Date): string {
  const yr = now.getUTCFullYear();
  const dt = (d: string) => `${fmtDate(d)}${Number(d.slice(0, 4)) !== yr ? `, ${d.slice(0, 4)}` : ''}`;
  return (
    `In effect ${dt(x.start)} to ${dt(x.end)}${x.exact.length ? `; exact ${x.exact.map(dt).join(' and ')}` : ''}.` +
    (x.again.length
      ? ` ${x.applying ? 'Still building now' : 'Easing for now'}, and it comes back: ${x.again.map((g) => `${dt(g.start)} to ${dt(g.end)}${g.exact.length ? ` (exact ${g.exact.map(dt).join(', ')})` : ''}`).join('; ')}.`
      : ` ${x.applying ? 'Still building.' : 'Now easing.'}`)
  );
}

const OUTER = ['Pluto', 'Neptune', 'Uranus', 'Saturn'] as const;
const PERSONAL = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Ascendant', 'Midheaven', 'Descendant', 'IC']);
const HARD = new Set(['conjunct', 'opposite', 'square']);

/**
 * The outer planets touching the personal points of the chart right now: the strongest, longest-lasting
 * transits a person lives through. Hard contacts first, then the tightest.
 */
export function outerInEffect(c: NatalChart, place: { lat: number; lon: number }, now: Date): SkyLine[] {
  return OUTER.flatMap((b) => activeContacts(c, place, now, b).filter((x) => PERSONAL.has(x.natal)).map((x) => ({ b, x })))
    .sort((p, q) => Number(HARD.has(q.x.aspect)) - Number(HARD.has(p.x.aspect)) || p.x.orb - q.x.orb)
    .map(({ b, x }) => ({
      heading: `In effect now: ${b} ${x.aspect} your ${x.natal}`,
      text: `${WEEK_CONTACT[b][x.aspect]} Your ${x.natal} is ${WEEK_TARGET[x.natal] ?? W.PLANET_FUNCTION[x.natal] ?? x.natal}. ${spanText(x, now)}`,
      basis: `Within ${fmtDeg(x.orb)} of exact`,
    }));
}

/**
 * The progressed chart and solar arcs in effect now: progressed planets and directed points within 1° of a
 * birth-chart point, strongest first, then the progressed Moon's chapter.
 */
export function progressedInEffect(c: NatalChart, place: { lat: number; lon: number }, now: Date): { contacts: SkyLine[]; moon: SkyLine } {
  const pr = progressions(c, place.lat, place.lon, now);
  const sa = solarArc(c, place.lat, place.lon, now);
  const what = (x: string) => WEEK_TARGET[x] ?? W.PLANET_FUNCTION[x] ?? x;
  const when = (exact: string | null, orb: number) => (exact ? `Exact around ${fmtMonth(exact)}; within ${fmtDeg(orb)} now` : `Within ${fmtDeg(orb)} of exact`);
  const contacts = [
    ...pr.contacts.filter((x) => x.orbNow <= 1).map((x) => ({
      orb: x.orbNow,
      line: { heading: `Progressed: your ${x.progressed} ${x.aspect} your ${x.natal}`, text: `Your progressed ${x.progressed} ${P.CONTACT_HOW[x.aspect]} your ${x.natal}. Your ${x.progressed} is ${what(x.progressed)}; your ${x.natal} is ${what(x.natal)}. Progressions move slowly, so this is a theme of the year, not the week.`, basis: when(x.exact, x.orbNow) },
    })),
    ...sa.contacts.filter((x) => x.orbNow <= 1).map((x) => ({
      orb: x.orbNow,
      line: { heading: `Solar arc: your ${x.directed} ${x.aspect} your ${x.natal}`, text: `Your directed ${x.directed} ${P.CONTACT_HOW[x.aspect]} your ${x.natal}. Your ${x.directed} is ${what(x.directed)}; your ${x.natal} is ${what(x.natal)}. A solar arc marks a turning point that builds over the year around its exact date.`, basis: when(x.exact, x.orbNow) },
    })),
  ]
    .sort((a, b) => a.orb - b.orb)
    .map((x) => x.line);
  const pm = pr.planets.find((p) => p.body === 'Moon')!;
  const moon: SkyLine = {
    heading: `Your progressed Moon is in ${pm.sign}${pm.house ? `, your ${ord(pm.house)} house` : ''}`,
    text: `${P.PROGRESSED_MOON_SIGN[pm.sign]}${pm.house ? ` ${P.PROGRESSED_MOON_HOUSE[pm.house]}` : ''}`,
    basis: `${pr.moon.enteredOn ? `Since ${fmtMonth(pr.moon.enteredOn)}` : `${fmtDeg(pm.degree)} ${pm.sign}`}${pr.moon.nextIngress ? `; into ${pr.moon.nextSign} ${fmtMonth(pr.moon.nextIngress)}` : ''}`,
  };
  return { contacts, moon };
}

const REL_POINTS = new Set(['Sun', 'Moon', 'Venus', 'Mars', 'Ascendant', 'Descendant', 'Midheaven', 'IC']);
const COMPOSITE_ROLE: Record<string, string> = { Sun: 'what the relationship is for', Moon: 'its emotional life and how safe it feels', Venus: 'its affection and pleasure', Mars: 'its desire, drive, and how it handles conflict', Ascendant: 'how the two of you meet the world', Descendant: 'how the relationship meets other people', Midheaven: 'where the relationship is going', IC: 'its home and foundations' };
const THEIR_ROLE: Record<string, string> = { Sun: 'who they are', Moon: 'what they need to feel safe', Venus: 'how they love', Mars: 'how they act and desire', Descendant: 'what they look for in a partner' };

/**
 * What is moving the relationship now: outer planets crossing the composite chart and each person's love points,
 * and progressed planets touching the other's chart. Hard contacts first, then the tightest.
 */
export function relationshipInEffect(ctx: OracleContext): SkyLine[] {
  if (!ctx.other) return [];
  const now = ctx.now ?? new Date();
  const { chart: them, place: theirPlace, name } = ctx.other;
  const comp = composite(ctx.chart, ctx.place, them, theirPlace).points.filter((p) => REL_POINTS.has(p.name));
  const theirs = natalPoints(them, theirPlace.lat, theirPlace.lon).filter((p) => THEIR_ROLE[p.name]);
  const mine = new Set(['Moon', 'Venus', 'Mars', 'Descendant']);
  const rank = (aspect: string, orb: number) => (HARD.has(aspect) ? 0 : 10) + orb;
  const live: { rank: number; line: SkyLine }[] = [];
  for (const b of OUTER) {
    for (const x of contactsTo(comp, now, b))
      live.push({ rank: rank(x.aspect, x.orb) - 2, line: { heading: `In effect now for you two: ${b} ${x.aspect} the composite ${x.natal}`, text: `${WEEK_CONTACT[b][x.aspect]} In your composite chart, the relationship itself, the ${x.natal} is ${COMPOSITE_ROLE[x.natal]}. ${spanText(x, now)}`, basis: `Within ${fmtDeg(x.orb)} of exact` } });
    for (const x of contactsTo(theirs, now, b))
      live.push({ rank: rank(x.aspect, x.orb), line: { heading: `In effect now: ${b} ${x.aspect} ${name}’s ${x.natal}`, text: `${WEEK_CONTACT[b][x.aspect]} ${name}’s ${x.natal} is ${THEIR_ROLE[x.natal]}, so this is moving through them and into what you share. ${spanText(x, now)}`, basis: `Within ${fmtDeg(x.orb)} of exact` } });
    for (const x of activeContacts(ctx.chart, ctx.place, now, b).filter((k) => mine.has(k.natal)))
      live.push({ rank: rank(x.aspect, x.orb), line: { heading: `In effect now: ${b} ${x.aspect} your ${x.natal}`, text: `${WEEK_CONTACT[b][x.aspect]} Your ${x.natal} is ${WEEK_TARGET[x.natal] ?? W.PLANET_FUNCTION[x.natal]}, so you bring this into the relationship. ${spanText(x, now)}`, basis: `Within ${fmtDeg(x.orb)} of exact` } });
  }
  for (const x of progressedSynastry(ctx.chart, ctx.place, them, theirPlace, now).filter((k) => k.orb <= 1)) {
    const who = x.who === 'a' ? `your progressed ${x.progressed}` : `${name}’s progressed ${x.progressed}`;
    const to = x.who === 'a' ? `${name}’s ${x.natal}` : `your ${x.natal}`;
    live.push({ rank: rank(x.aspect, x.orb) + 1, line: { heading: `${who.charAt(0).toUpperCase()}${who.slice(1)} ${x.aspect} ${to}`, text: `${who.charAt(0).toUpperCase()}${who.slice(1)} ${P.CONTACT_HOW[x.aspect]} ${to}. Progressions move slowly: this is how you are growing into each other this year.`, basis: `Within ${fmtDeg(x.orb)}${x.applying ? ', building' : ', easing'}` } });
  }
  return live.sort((a, b) => a.rank - b.rank).map((x) => x.line);
}

/**
 * Everyday answers always name what is strongest and slowest in the chart now: the outer-planet transits
 * and the progressions and solar arcs in effect, unless the answer already does.
 */
const LONG_IN_LINES = new Set<Intent>(['open', 'cycle', 'sky', 'week', 'decision', 'area', 'feeling']);
const PROGRESSED_IN_LINES = new Set<Intent>(['open', 'cycle', 'decision', 'area', 'feeling']);
const LONG_IN_DEEPER = new Set<Intent>(['when']);
function withOuter(r: OracleReply, ctx: OracleContext): OracleReply {
  if (r.limit || !(LONG_IN_LINES.has(r.intent) || LONG_IN_DEEPER.has(r.intent))) return r;
  const now = ctx.now ?? new Date();
  const said = [...r.lines, ...r.deeper].map((l) => `${l.heading} ${l.text}`).join(' | ');
  const named = (l: SkyLine, by = '') => {
    const [, b, natal] = l.heading.match(/: (?:your )?([\w ]+?) \w+ your (\w+)$/)!;
    return new RegExp(`${by}\\b${b}\\b[^.|]{0,40}\\byour ${natal}\\b`, 'i').test(said);
  };
  const outer = outerInEffect(ctx.chart, ctx.place, now).filter((l) => !named(l)).slice(0, 3);
  const pr = progressedInEffect(ctx.chart, ctx.place, now);
  const prog = pr.contacts.filter((l) => !named(l, '(progressed|directed|solar arc)[^.|]{0,12}')).slice(0, 3);
  const moon = /progressed Moon/i.test(said) ? [] : [pr.moon];
  if (LONG_IN_DEEPER.has(r.intent)) return { ...r, deeper: [...outer, ...prog, ...r.deeper] };
  const show = [...outer.slice(0, 1), ...(PROGRESSED_IN_LINES.has(r.intent) ? prog.slice(0, 1) : [])];
  const rest = [...outer.slice(1), ...(PROGRESSED_IN_LINES.has(r.intent) ? prog.slice(1) : prog), ...(['open', 'cycle', 'feeling'].includes(r.intent) ? moon : [])];
  // A love question with someone added also reads what is moving between the two of you.
  const rel = ctx.other && r.intent === 'area' && areaOf(r.question) === 'love' ? relationshipInEffect(ctx).filter((l) => l.heading.includes('composite') || l.heading.includes(ctx.other!.name)).slice(0, 3) : [];
  return { ...r, lines: [...r.lines.slice(0, 1), ...show, ...r.lines.slice(1)], deeper: [...rest, ...rel, ...r.deeper] };
}

export function intentOf(q: string): Intent {
  if (/\btension|\btense\b|\bmy (squares|oppositions|trines|sextiles|aspects)\b|\beffortless|\bwhere (do|does) (my )?energy\b|\bhigh road\b|\blow road\b|\bshow (me )?my (birth )?chart\b|\bmy chart'?s energy\b|\bstuck energy\b|\bwhat (blocks|holds) me\b|\bmy (strengths and )?challenges\b/i.test(q)) return 'energy';
  if (/\bsimplif|\bplain (english|words|language)\b|\beli5\b|\bsimpl(y|er)\b|\bin simple terms\b|\bdon[’']?t (understand|get it)\b|\bdo not understand\b|\bconfus|\bwhat does (that|this|it) mean\b|\btl;?dr\b|\bsum (it|that) up\b|\bin short\b|\bexplain (that|this|it)\b/i.test(q)) return 'simplify';
  // A "should I" question is a decision, even when it mentions the week or the sky.
  if (/^(should|shall)\b|\bshould i\b/i.test(q) && !/^(what|where|how|who|which)\b|\bwhen\b|\b(what|which|best|good) (day|time|week|month)\b|\breturn\b|\bretrograde\b/i.test(q)) return 'decision';
  // A question about a planet in aspect ("Uranus opposite my Sun") is about that transit.
  if (BODY_RE.test(q) && ASPECT_Q.test(q) && !/\bmy (squares|oppositions|trines|sextiles|aspects)\b/i.test(q)) return 'planet';
  for (const [intent, re] of INTENTS) if (re.test(q)) return intent === 'feeling' || !feelingIn(q) || intent === 'retro' || intent === 'return' ? intent : 'feeling';
  return feelingIn(q) ? 'feeling' : 'open';
}

// ─── Answers ──────────────────────────────────────────────────────────────────

function cuspsOf(c: NatalChart, place: { lat: number; lon: number }) {
  return c.timePrecision === 'exact' ? placidusCusps(c.utc, place.lat, place.lon) : null;
}

/** The best days in the next two months for what the question is about (electional astrology). */
export function bestDays(c: NatalChart, place: { lat: number; lon: number }, now: Date, area: Area | null, q: string) {
  const days = dayScores(c, place, now, area, q);
  const talk = /\b(sign|contract|text|talk|email|call|send|launch|buy|sell|interview|apply|ask)\b/i.test(q) || area === 'work' || area === 'money';
  const picked: typeof days = [];
  for (const d of [...days].sort((a, b) => b.score - a.score || a.date.localeCompare(b.date)))
    if (d.score > 1 && d.reasons.length && picked.every((p) => Math.abs(new Date(p.date).getTime() - new Date(d.date).getTime()) > 3 * DAY)) {
      picked.push(d);
      if (picked.length === 3) break;
    }
  return { picked: picked.sort((a, b) => a.date.localeCompare(b.date)), waxing: days.filter((d) => d.waxing).map((d) => d.date), mercuryRx: talk && speed('Mercury', now) < 0 };
}

/** The next time a slow planet returns to its birth position, and whether it is active now. */
export function nextReturn(c: NatalChart, body: 'Saturn' | 'Jupiter', now: Date) {
  const natal = c.western.planets.find((p) => p.body === body)!.longitude;
  const step = 5 * DAY;
  const from = now.getTime() - 400 * DAY;
  let prev = signed(tropicalLongitude(body, new Date(from)), natal);
  const hits: string[] = [];
  for (let t = from + step; t < now.getTime() + 62 * 365 * DAY && hits.length < 6; t += step) {
    const cur = signed(tropicalLongitude(body, new Date(t)), natal);
    if (prev < 0 !== cur < 0 && Math.abs(cur) < 20) hits.push(iso(new Date(t)));
    prev = cur;
  }
  const near = hits.filter((h) => Math.abs(new Date(h).getTime() - now.getTime()) < 365 * DAY);
  const future = hits.filter((h) => h >= iso(now));
  // A return is one to three exact passes within a year or so; group the first run after today.
  const first = near.length ? near : future.slice(0, 1);
  const run = hits.filter((h) => first.length && Math.abs(new Date(h).getTime() - new Date(first[0]).getTime()) < 400 * DAY);
  return { natal, passes: run, active: near.length > 0 };
}

function stationsAhead(now: Date, days = 400) {
  const out: { body: string; date: string; turns: 'retrograde' | 'direct'; lon: number }[] = [];
  for (const b of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const) {
    let prev = speed(b, now);
    for (let i = 1; i <= days; i++) {
      const d = new Date(now.getTime() + i * DAY);
      const s = speed(b, d);
      if (prev >= 0 !== s >= 0) {
        out.push({ body: b, date: iso(d), turns: s < 0 ? 'retrograde' : 'direct', lon: tropicalLongitude(b, d) });
        if (out.filter((o) => o.body === b).length >= 2) break;
      }
      prev = s;
    }
  }
  return out;
}

function natalLines(c: NatalChart, q: string, place: { lat: number; lon: number }): { label: string; orb: string; points: string; lines: SkyLine[]; deeper: SkyLine[] } {
  const p = (b: string) => c.western.planets.find((x) => x.body === b);
  if (/\bnakshatra\b/i.test(q)) {
    const n = c.vedic.nakshatra;
    const d = V.NAKSHATRA_DETAIL[n.name];
    return {
      label: `Your Moon nakshatra: ${n.name}`,
      orb: n.name.toUpperCase(),
      points: 'Moon',
      lines: [{ heading: `${n.name}, pada ${n.pada}`, text: `${d ? cap(d.quality) : ''}${d ? '.' : ''} Its ruling graha is ${n.lord}.`.trim(), basis: c.vedic.moonNakshatra.certain ? 'Vedic, sidereal (Lahiri)' : `Uncertain: ${c.vedic.moonNakshatra.options.join(' or ')}` }],
      deeper: d ? [{ heading: 'Gana', text: `${d.gana} gana, ${d.yoni} yoni.` }] : [],
    };
  }
  if (/\bdasha\b/i.test(q)) {
    const cur = c.vedic.current;
    return cur
      ? {
          label: `Your dasha: ${cur.maha.lord}, with ${cur.antar.lord}`,
          orb: `${cur.maha.lord} DASHA`.toUpperCase(),
          points: ['Rahu', 'Ketu'].includes(cur.maha.lord) ? 'Moon' : cur.maha.lord,
          lines: [
            { heading: `${cur.maha.lord} mahadasha`, text: `${cap(V.DASHA_DETAIL[cur.maha.lord])}.`, basis: `Until ${fmtLong(cur.maha.end.toISOString().slice(0, 10))}` },
            { heading: `${cur.antar.lord} antardasha`, text: `Within it, ${V.DASHA_DETAIL[cur.antar.lord]}.`, basis: `Until ${fmtLong(cur.antar.end.toISOString().slice(0, 10))}` },
          ],
          deeper: [],
        }
      : { label: 'Your dasha', orb: 'DASHA', points: 'Moon', lines: [{ heading: 'Not available', text: ORACLE_SAYS.noTime }], deeper: [] };
  }
  if (/\b(rising|ascendant|lagna)\b/i.test(q)) {
    const asc = c.western.ascendant;
    if (!asc.certain || !asc.value) return { label: 'Your rising sign', orb: 'RISING', points: 'Sun', lines: [{ heading: asc.options.length ? `${asc.options.join(' or ')} rising` : 'Rising sign unknown', text: ORACLE_SAYS.noTime }], deeper: [] };
    const lagna = c.vedic.lagna.value;
    return {
      label: `${asc.value} rising`,
      orb: `${asc.value} RISING`.toUpperCase(),
      points: asc.value,
      lines: [{ heading: `${asc.value} rising`, text: W.RISING[asc.value], basis: c.western.ascendantDegree !== null ? `Ascendant ${fmtDeg(c.western.ascendantDegree % 30)} ${asc.value}` : 'Ascendant' }],
      deeper: lagna && V.LAGNA[lagna] ? [{ heading: `Vedic lagna: ${lagna}`, text: V.LAGNA[lagna], basis: 'Sidereal (Lahiri), whole-sign houses' }] : [],
    };
  }
  const body = /north node|\bnode\b/i.test(q) ? 'Node' : /what sign am i/i.test(q) ? 'Sun' : bodyIn(q);
  if (body && p(body)) {
    const x = p(body)!;
    const name = body === 'Node' ? 'North Node' : body;
    const lines: SkyLine[] = [
      {
        heading: `Your ${name} in ${x.sign}${x.house ? `, ${ord(x.house)} house` : ''}${x.retrograde ? ' (retrograde)' : ''}`,
        text: `${cap(W.PLANET_FUNCTION[body])}. ${W.PLANET_IN_SIGN[body]?.[x.sign] ?? `In ${x.sign}, it takes on ${W.SIGN_KEYWORD[x.sign]}.`}${x.house ? ` ${D.PLANET_IN_HOUSE[body]?.[x.house] ?? `In your ${ord(x.house)} house, it works through ${W.HOUSE[x.house].area}.`}` : ''}`,
        basis: `${fmtDeg(x.degree)} ${x.sign}`,
      },
    ];
    const deeper: SkyLine[] = allAspects(c)
      .filter((a) => a.a === body || a.b === body)
      .filter((a) => a.aspect !== 'quincunx')
      .slice(0, 3)
      .map((a) => ({ heading: `${a.a} ${a.aspect} ${a.b}`, text: `${W.PAIR[`${a.a}-${a.b}`] ? `This links ${W.PAIR[`${a.a}-${a.b}`]}. ` : ''}The two ${W.ASPECT_MEANING[a.aspect]}.`, basis: `Orb ${fmtDeg(a.orb)}` }));
    const v = c.vedic.planets.find((y) => y.body === (body === 'Node' ? 'Rahu' : body));
    if (v) deeper.push({ heading: `In Vedic astrology: ${v.body} in ${v.rashi}${v.house ? `, ${ord(v.house)} bhava` : ''}`, text: `${V.GRAHA[v.body] ? `In Jyotish, ${v.body} signifies ${V.GRAHA[v.body].karaka}. ` : ''}Sidereally, it sits in ${v.rashi} (${v.sign}).`, basis: 'Sidereal (Lahiri)' });
    return { label: `Your ${name} in ${x.sign}`, orb: `YOUR ${name}`.toUpperCase(), points: body === 'Node' ? x.sign : body, lines, deeper };
  }
  const brief = chartInBrief(c);
  void place;
  return { label: 'Your chart, at its core', orb: 'YOUR CHART', points: p('Sun')!.sign, lines: brief.slice(0, 3), deeper: brief.slice(3) };
}

export function consultOracle(question: string, ctx: OracleContext): OracleReply {
  return remember(question, ctx, consultFresh(question, ctx));
}

/**
 * Local memory: the Oracle checks what it already told this person (kept only on their device) so it
 * does not repeat a line given earlier today, varies its wording, and refers back to a related question.
 */
function remember(question: string, ctx: OracleContext, r: OracleReply): OracleReply {
  const history = (ctx.history ?? []).filter((h) => h.lines && h.question.toLowerCase() !== question.trim().toLowerCase());
  if (!history.length || r.intent === 'simplify' || r.limit) return r;
  const day = r.day;
  // 1. Lines already given today are not repeated.
  const said = new Set(history.filter((h) => h.day === day).flatMap((h) => h.lines.map((l) => l.text)));
  let lines = r.lines.filter((l) => !l.text || !said.has(l.text));
  // Never strip an answer down to its framing: keep the substance if too little would remain.
  if (lines.filter((l) => l.text).length < 2) lines = r.lines;
  // 2. A decision does not reuse the exact wording of a recent one.
  if (r.tone && lines[0] && history.slice(-6).some((h) => h.lines[0]?.text === lines[0].text)) {
    const used = new Set(history.slice(-6).map((h) => h.lines[0]?.text));
    const fresh = ORACLE_TONE[r.tone].lines.find((x) => !used.has(x));
    if (fresh) lines = [{ ...lines[0], text: fresh }, ...lines.slice(1)];
  }
  // 3. A related earlier question is brought back.
  const area = areaOf(question);
  const related = [...history].reverse().find((h) => h.day !== day && (area ? areaOf(h.question) === area : h.intent === r.intent && !['open', 'sky'].includes(r.intent)));
  if (related) {
    const when = new Date(`${related.day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    lines = [...lines, { heading: ORACLE_SAYS.lastTime, text: `On ${when} you asked “${related.question}”, and the Oracle said: ${related.label}.` }];
  }
  return { ...r, lines };
}

function consultFresh(question: string, ctx: OracleContext): OracleReply {
  // 'Say it simply': rewrite the last answer in plain words (or, with none yet, the chart in three lines).
  if (intentOf(question.trim()) === 'simplify' && !limitOf(question.trim())?.match(/health|others|legal|gamble/)) {
    const prev = ctx.previous && ctx.previous.intent !== 'simplify' ? ctx.previous : null;
    return {
      intent: 'simplify',
      question: question.trim(),
      day: iso(ctx.now ?? new Date()),
      label: PLAIN_TEXT.title,
      orb: 'IN SHORT',
      points: prev?.points ?? 'Sun',
      lines: prev ? simplify(prev) : [{ heading: '', text: PLAIN_TEXT.noPrevious }, ...plainChart(ctx.chart)],
      deeper: [],
    };
  }
  if (intentOf(question.trim()) === 'energy') {
    const e = chartEnergy(ctx.chart, ctx.place, ctx.now ?? new Date());
    const layers = energyLayers(e);
    const t = e.aspects.filter((x) => x.kind === 'tension');
    const f = e.aspects.filter((x) => x.kind === 'flow');
    return {
      intent: 'energy',
      question: question.trim(),
      day: iso(ctx.now ?? new Date()),
      label: 'Your chart’s energy',
      orb: 'YOUR ENERGY',
      points: t[0]?.a ?? 'Sun',
      lines: [
        ...(t[0] ? [{ heading: `Your strongest tension: ${t[0].a} ${t[0].aspect} ${t[0].b}`, text: `${t[0].about} To release it: ${t[0].release.charAt(0).toLowerCase()}${t[0].release.slice(1)}` }] : []),
        ...(f[0] ? [{ heading: `Your easiest flow: ${f[0].a} ${f[0].aspect} ${f[0].b}`, text: f[0].about }] : []),
      ],
      deeper: [],
      layers,
      consulted: [`${t.length} tensions`, `${f.length} flows`, `${e.aspects.filter((x) => x.kind === 'fusion').length} fusions`, 'your progressed chart', 'a year of slow transits', `${e.natalRx.length} birth retrogrades`, 'retrogrades in the sky now'],
    };
  }
  const reply = withOuter(answerOnly(question, ctx), ctx);
  if (reply.limit) return reply;
  // The full reading: the question's life area (or the one on the person's mind), or the planet it names.
  const q = question.trim();
  const body = reply.intent === 'chart' || reply.intent === 'planet' || reply.intent === 'retro' ? (/north node|\bnode\b/i.test(q) ? 'Node' : bodyIn(q)) : null;
  const area = body ? null : (areaOf(q) ?? (['decision', 'when', 'feeling', 'cycle', 'open', 'week', 'sky'].includes(reply.intent) ? (ctx.profile?.onMind[0] ?? null) : null));
  let layers = oracleLayers(ctx.chart, ctx.place, area, body && body !== 'Moon' ? body : body === 'Moon' ? 'Moon' : null, ctx.now ?? new Date());
  // With someone added, love and relationship questions also read the two charts together.
  if (ctx.other && (reply.intent === 'together' || area === 'love')) {
    const rel = relationshipReading(ctx.chart, ctx.place, ctx.other.chart, ctx.other.place, ctx.other.name, ctx.now ?? new Date())
      .filter((s) => reply.intent === 'together' || ['r-dynamics', 'r-progressed', 'r-timeline'].includes(s.id))
      .map((s) => ({ title: s.title, tradition: (s.id === 'r-vedic' ? 'Vedic' : 'Western') as Layer['tradition'], lines: s.items.map((i) => ({ heading: i.heading, text: i.text, basis: i.basis })) }));
    layers = reply.intent === 'together' ? rel : [...rel, ...layers];
  }
  const read = consulted(ctx.chart, layers);
  if (ctx.other && (reply.intent === 'together' || area === 'love')) read.unshift(`${ctx.other.name}’s chart`, 'synastry both ways', 'composite and Davison charts', 'progressed synastry', 'the relationship’s year', 'ashtakoota, factor by factor');
  return layers.length ? { ...reply, layers, consulted: read } : reply;
}

const TONE_LEAD: Record<Tone, string> = { go: 'Yes, gently.', wait: 'Not yet.', closer: 'Look closer first.', again: 'Ask it another way.' };
const AREA_WORD: Record<Area, string> = { love: 'love', work: 'your work', money: 'money', family: 'home and family', health: 'your body and energy', creativity: 'what you make', friends: 'your friendships', purpose: 'your direction' };

/** A decision answered from this chart and this question: the tone, the planets behind it, and a date to act on. */
function decisionLines(a: ReturnType<typeof askOracle>, area: Area | null, ctx: OracleContext): SkyLine[] {
  const now = ctx.now ?? new Date();
  const fmt = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const lead = TONE_LEAD[a.tone];
  const k = a.contact;
  const out: SkyLine[] = [];
  if (k) {
    const verb = k.aspect === 'opposite' ? 'opposes' : k.aspect === 'conjunct' ? 'meets' : `${k.aspect}s`;
    const where = k.house ? `, crossing your ${ord(k.house)} house of ${W.HOUSE[k.house].area}` : '';
    // Area advice only when the contact flows; a hard contact is read from its own aspect.
    const flows = ['trine', 'sextile', 'conjunct'].includes(k.aspect) && a.tone === 'go';
    const forArea = area && flows ? MOVER_AREA[k.mover]?.[area] : undefined;
    const ties = area && ((TARGET_AREAS[k.natal] ?? []).includes(area) || (k.house && HOUSE_AREA[k.house] === area));
    out.push({
      heading: '',
      text: `${lead} ${k.mover === 'Sun' ? 'The Sun' : k.mover} ${verb} your ${k.natal} ${k.date === iso(now) ? 'today' : `on ${fmt(k.date)}`}${where}. Your ${k.natal} is ${WEEK_TARGET[k.natal] ?? W.PLANET_FUNCTION[k.natal]}${ties ? `, and this is the part of your chart ${AREA_WORD[area!]} runs through` : ''}. ${forArea ?? WEEK_CONTACT[k.mover][k.aspect as keyof (typeof WEEK_CONTACT)[string]]}`,
    });
  } else out.push({ heading: '', text: `${lead} ${a.because}` });
  // A date to act on, from this chart's best days for the question.
  const days = dayScores(ctx.chart, ctx.place, now, area, a.question, 30);
  const best = days.filter((d) => d.score > 1 && d.reasons.length).sort((x, y) => y.score - x.score)[0];
  if (a.tone === 'wait') out.push({ heading: 'When', text: a.voidUntil ? `Ask again after ${a.voidUntil}.` : k ? `Let ${fmt(k.date)} pass, then ask again${best && best.date > k.date ? `; ${fmt(best.date)} looks clearer` : ''}.` : best ? `${fmt(best.date)} looks clearer.` : 'Ask again in a few days.' });
  else if (best) out.push({ heading: a.tone === 'go' ? 'Best day to act' : 'A clearer day', text: `${fmt(best.date)}: ${best.reasons[0]}.` });
  return out;
}

const AREA_LABEL: Record<Area, [string, string]> = {
  love: ['Your love life', 'LOVE'],
  work: ['Your work and career', 'WORK'],
  money: ['Your money', 'MONEY'],
  family: ['Your home and family', 'HOME'],
  health: ['Your health and energy', 'YOUR BODY'],
  creativity: ['Your creativity', 'CREATE'],
  friends: ['Your friends and community', 'FRIENDS'],
  purpose: ['Your purpose and direction', 'PURPOSE'],
};

/** A question about a part of life, answered from that part of the chart, with dates. */
function areaAnswer(area: Area, ctx: OracleContext, base: { question: string; day: string }, boundary = false): OracleReply {
  const now = ctx.now ?? new Date();
  const [label, orb] = AREA_LABEL[area];
  if (area === 'health') {
    const h = healthAnswer(ctx.chart, ctx.place, now, boundary);
    return { ...base, intent: 'area', label, orb, points: 'Mars', lines: h.lines, deeper: h.deeper };
  }
  const layers = oracleLayers(ctx.chart, ctx.place, area, null, now);
  const pick = (title: string, n: number) => layers.find((l) => l.title.startsWith(title))?.lines.filter((l) => l.text).slice(0, n) ?? [];
  const lines = [...pick('Your birth chart', 2), ...pick('The next 30 days', 1).filter((l) => !/^Quiet$/.test(l.heading)), ...pick('Your best and hardest', 2).filter((l) => l.heading.startsWith('Best'))].slice(0, 4);
  const deeper = [...pick('The year ahead', 2), ...pick('The Vedic view', 1)];
  return { ...base, intent: 'area', label, orb, points: AREA_SIGNIFICATOR[area], lines, deeper };
}

function answerOnly(question: string, ctx: OracleContext): OracleReply {
  const { chart: c, place } = ctx;
  const now = ctx.now ?? new Date();
  const q = question.trim();
  const day = iso(now);
  const base = { question: q, day };
  const limit = limitOf(q);
  if (limit === 'health') return areaAnswer('health', ctx, base, true);
  if (limit && limit !== 'unclear') return { ...base, intent: 'decision', label: ORACLE_TONE.again.label, orb: 'ASK AGAIN', tone: 'again', points: 'Moon', lines: [{ heading: 'Ask it another way', text: ORACLE_REFRAME[limit] }], deeper: [], limit };
  const i0 = intentOf(q);
  // A question that names the other person is about the two of you (unless it asks a decision or a date).
  const named = !!ctx.other && new RegExp(`\\b${ctx.other.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q);
  const intent: Intent = named && !['decision', 'when'].includes(i0) ? 'together' : i0;
  if (limit === 'unclear' && (intent === 'open' || intent === 'decision')) return { ...base, intent: 'decision', label: ORACLE_TONE.again.label, orb: 'ASK AGAIN', tone: 'again', points: 'Moon', lines: [{ heading: 'Ask it another way', text: ORACLE_REFRAME.unclear }], deeper: [], limit };
  const cusps = cuspsOf(c, place);
  const area = areaOf(q);
  // A question about a part of life gets that part of the chart, not a general reading.
  const specific = /\b(rising|ascendant|lagna|nakshatra|dasha|north node|node|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)\b/i.test(q);
  if (area && (['open', 'sky', 'cycle'].includes(intent) || (intent === 'chart' && !specific))) return areaAnswer(area, ctx, base);

  switch (intent) {
    case 'decision': {
      const a = askOracle(q, c, place, now);
      return { ...base, intent, label: a.label, orb: '', tone: a.tone, points: a.points, lines: decisionLines(a, area, ctx), deeper: a.why.map((w) => ({ heading: '', text: w })), limit: a.limit };
    }
    case 'when': {
      if (/\b(saturn|jupiter)\b/i.test(q) && /\breturn\b/i.test(q)) break;
      const b = bestDays(c, place, now, area, q);
      const lines: SkyLine[] = b.picked.length
        ? b.picked.map((d) => ({ heading: fmtLong(d.date), text: `${cap(d.reasons.slice(0, 2).join('; '))}.${d.waxing ? ` ${ORACLE_SAYS.waxing}` : ''}`, basis: 'Transits to your chart, ±1 day' }))
        : [{ heading: 'The waxing Moon', text: `${ORACLE_SAYS.quietWhen} Next: ${b.waxing.slice(0, 3).map(fmtDate).join(', ')}.` }];
      const deeper: SkyLine[] = [];
      if (b.mercuryRx) deeper.push({ heading: 'Mercury is retrograde now', text: ORACLE_SAYS.mercuryRx });
      deeper.push({ heading: 'How the Oracle chose', text: `Electional astrology, the old art of choosing a moment: days when Venus, Jupiter, or the Sun make easy contacts to the part of your chart this is about${area ? ` (${area === 'health' ? 'body and energy' : area})` : ''}, under a waxing Moon, away from hard Saturn, Mars, Pluto, and Uranus contacts${b.mercuryRx || /sign|contract|launch|send/i.test(q) ? ' and Mercury retrograde' : ''}.` });
      const first = b.picked[0]?.date ?? b.waxing[0];
      return { ...base, intent, label: b.picked.length ? `Look to ${fmtDate(first)}` : 'Begin with the waxing Moon', orb: `LOOK TO ${fmtDate(first).toUpperCase()}`, points: b.picked[0]?.reasons[0]?.split(' ')[0] ?? 'Moon', lines, deeper };
    }
    case 'return':
      break;
    case 'retro': {
      const st = stationsAhead(now);
      const rxNow = (['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const).filter((b) => speed(b, now) < 0);
      const asked = bodyIn(q) ?? 'Mercury';
      const mine = st.filter((s) => s.body === asked);
      const isRx = rxNow.includes(asked as (typeof rxNow)[number]);
      const lines: SkyLine[] = [
        {
          heading: isRx ? `${asked} is retrograde now` : `${asked} is direct now`,
          text: `${isRx ? cap(D.STATION_TEXT[asked]?.retrograde ?? 'its themes turn inward, toward review') : `${asked} is moving forward`}.${mine[0] ? ` It turns ${mine[0].turns} on ${fmtLong(mine[0].date)} at ${fmtDeg(mine[0].lon % 30)} ${signOf(mine[0].lon)}${cusps ? `, in your ${ord(houseOf(mine[0].lon, cusps))} house, ${W.HOUSE[houseOf(mine[0].lon, cusps)].area}` : ''}.` : ''}`,
          basis: 'Apparent motion from Earth',
        },
      ];
      if (mine[1]) lines.push({ heading: `Then ${mine[1].turns} on ${fmtDate(mine[1].date)}`, text: `${cap(D.STATION_TEXT[asked]?.[mine[1].turns] ?? (mine[1].turns === 'direct' ? 'the themes move forward again' : 'the themes turn inward'))}.` });
      const deeper: SkyLine[] = [{ heading: 'Retrograde right now', text: rxNow.length ? `${rxNow.join(', ')}.` : 'No planet is retrograde right now.' }];
      for (const s of st.filter((x) => x.body !== asked).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)) deeper.push({ heading: `${fmtDate(s.date)}: ${s.body} turns ${s.turns}`, text: `In ${signOf(s.lon)}${cusps ? `, your ${ord(houseOf(s.lon, cusps))} house` : ''}.` });
      return { ...base, intent, label: lines[0].heading, orb: isRx ? `${asked} RX`.toUpperCase() : `${asked} DIRECT`.toUpperCase(), points: asked, lines, deeper };
    }
    case 'lunation': {
      const m = monthAhead(c, now, 60, place.lat, place.lon);
      const want = /full/i.test(q) ? 'Full Moon' : /new/i.test(q) ? 'New Moon' : null;
      const list = m.lunar.filter((l) => !want || l.kind === want).slice(0, 2);
      const w = weekAhead(c, place.lat, place.lon, now, 45);
      const lines: SkyLine[] = list.map((l) => {
        const asp = w.lunations.find((x) => x.date === l.date)?.aspects.slice(0, 2) ?? [];
        return {
          heading: `${fmtLong(l.date)}: ${l.kind} in ${l.sign}${l.house ? `, your ${ord(l.house)} house` : ''}`,
          text: `${cap(D.LUNATION_TEXT[l.kind])}${l.house ? `, around ${W.HOUSE[l.house].area}` : ''}.${asp.length ? ` It ${asp.map((a) => `is ${a.aspect} your ${a.natal}`).join(' and ')}.` : ''}${l.eclipse ? ` ${D.LUNATION_TEXT.eclipse}` : ''}`,
          basis: l.house ? 'Placidus house of the lunation' : 'House needs an exact birth time',
        };
      });
      return { ...base, intent, label: list[0] ? `The ${list[0].kind}, ${fmtDate(list[0].date)}` : 'The Moon', orb: list[0] ? `${list[0].kind} ${fmtDate(list[0].date)}`.toUpperCase() : 'THE MOON', points: list[0]?.sign ?? 'Moon', lines: lines.slice(0, 1), deeper: lines.slice(1) };
    }
    case 'together': {
      if (!ctx.other) return { ...base, intent, label: 'The two of you', orb: 'TWO CHARTS', points: 'Venus', lines: [{ heading: 'Add them first', text: ORACLE_SAYS.noPerson }], deeper: [] };
      const dyn = relationshipReading(c, place, ctx.other.chart, ctx.other.place, ctx.other.name, now)[0];
      const items = dyn.items.map((i) => ({ heading: i.heading, text: i.text, basis: i.basis }));
      // What is moving between you now comes right after the core dynamic.
      const live = relationshipInEffect(ctx);
      return { ...base, intent, label: `You and ${ctx.other.name}`, orb: 'TWO CHARTS', points: 'Venus', lines: [...items.slice(0, 1), ...live.slice(0, 2), ...items.slice(1, 2)], deeper: [...live.slice(2, 8), ...items.slice(2)] };
    }
    case 'chart': {
      const r = natalLines(c, q, place);
      return { ...base, intent, ...r };
    }
    case 'patterns': {
      const ps = findPatterns(c, place.lat, place.lon).slice(0, 3);
      return {
        ...base,
        intent,
        label: `Your strongest pattern: ${ps[0].title}`,
        orb: 'YOUR PATTERNS',
        points: 'Saturn',
        lines: ps.map((p) => ({ heading: p.title, text: `${p.summary} ${p.gift}` })),
        deeper: ps.flatMap((p) => [{ heading: `${p.title}: the edge`, text: `${p.edge} ${p.helps}` }, ...p.evidence.slice(0, 2).map((e) => ({ heading: e.text, text: e.why }))]),
      };
    }
    case 'feeling': {
      const a = answerFor(q, topicFor(q, []), c, place, now, ctx.profile ?? null);
      if (a) {
        const secs = a.sections.map((s) => ({ heading: s.title, text: [...s.paragraphs, ...(s.points ?? [])].join(' '), basis: s.basis }));
        return { ...base, intent, label: a.title, orb: 'THE MOON', points: 'Moon', lines: [{ heading: a.title, text: a.intro }, ...secs.slice(0, 1)], deeper: [...secs.slice(1), ...(a.care ? [{ heading: '', text: a.care }] : [])] };
      }
      break;
    }
    case 'cycle': {
      const cy = cycles(c, place.lat, place.lon, now, ctx.profile ?? null);
      const top = cy.now.slice(0, 3);
      return {
        ...base,
        intent,
        label: top[0] ? `You are moving through: ${top[0].title}` : 'Your cycles',
        orb: 'YOUR SEASON',
        points: top[0]?.title.split(' ')[0] ?? 'Saturn',
        lines: top.slice(0, 2).map((x) => ({ heading: `${x.title} · ${x.phase}`, text: `${x.feel} What helps: ${x.helps}`, basis: x.basis })),
        deeper: [...top.slice(2).map((x) => ({ heading: x.title, text: `${x.feel} What helps: ${x.helps}`, basis: x.basis })), ...cy.next.slice(0, 4).map((n) => ({ heading: 'Coming up', text: n.line }))],
      };
    }
    case 'week': {
      const secs = weekReading(c, place, now, ctx.profile ?? null).filter((s) => s.id !== 'w-intro');
      const items = secs.flatMap((s) => s.items.map((i) => ({ heading: i.heading, text: i.text, basis: i.basis })));
      return { ...base, intent, label: 'Your week, planet by planet', orb: 'YOUR WEEK', points: secs[0]?.id.replace('w-', '').replace(/^./, (x) => x.toUpperCase()) ?? 'Moon', lines: items.slice(0, 3), deeper: items.slice(3, 12) };
    }
    case 'planet': {
      // In "Uranus opposite my Sun", the slowest planet named is the one transiting; the other is the point it touches.
      const named = bodiesIn(q);
      const b = (named[0] ?? bodyIn(q)!) as (typeof MOVERS)[number] | 'Moon';
      const target = named[1];
      if (b === 'Moon') {
        const s = todaySky(c, place, now);
        return { ...base, intent, label: s.moon.heading, orb: 'THE MOON', points: 'Moon', lines: [s.moon], deeper: [] };
      }
      const lon = tropicalLongitude(b, now);
      const rx = speed(b, now) < 0;
      const h = cusps ? houseOf(lon, cusps) : null;
      const verb = (a: string) => a;
      const span = (x: ActiveContact) => spanText(x, now);
      const active = activeContacts(c, place, now, b).sort((x, y) => Number(y.natal === target) - Number(x.natal === target) || x.orb - y.orb);
      const activeLines: SkyLine[] = active.map((x) => ({
        heading: `Now: ${b} ${verb(x.aspect)} your ${x.natal}`,
        text: `${WEEK_CONTACT[b][x.aspect]} Your ${x.natal} is ${WEEK_TARGET[x.natal] ?? W.PLANET_FUNCTION[x.natal] ?? x.natal}. ${span(x)}`,
        basis: `Within ${fmtDeg(x.orb)} of exact`,
      }));
      // Contacts coming up in the next 30 days that are not already in effect.
      const w = weekAhead(c, place.lat, place.lon, now, 30).movers.find((m) => m.mover === b);
      const coming: SkyLine[] = (w?.contacts ?? [])
        .filter((x) => !active.some((a) => a.natal === x.natal && a.aspect === x.aspect))
        .slice(0, 3)
        .map((x) => ({ heading: `${fmtDate(x.date)}: ${b} ${x.aspect} your ${x.natal}`, text: `${WEEK_CONTACT[b][x.aspect]} Your ${x.natal} is ${WEEK_TARGET[x.natal] ?? W.PLANET_FUNCTION[x.natal]}.`, basis: `Within ${fmtDeg(x.orb)}` }));
      // In the birth chart itself: the aspects this planet makes.
      const natalAspects: SkyLine[] = allAspects(c)
        .filter((x) => x.a === b || x.b === b)
        .sort((x, y) => Number(target ? [x.a, x.b].includes(target) : 0) * -1 + Number(target ? [y.a, y.b].includes(target) : 0) || x.orb - y.orb)
        .slice(0, 3)
        .map((x) => ({ heading: `In your birth chart: ${x.a} ${x.aspect} ${x.b}`, text: `${W.PAIR[`${x.a}-${x.b}`] ? `This links ${W.PAIR[`${x.a}-${x.b}`]}. ` : ''}${cap(W.PLANET_FUNCTION[x.a] ?? x.a)} and ${W.PLANET_FUNCTION[x.b] ?? x.b} ${W.ASPECT_MEANING[x.aspect] ?? ''}.`, basis: `Orb ${fmtDeg(x.orb)}` }));
      const where: SkyLine = { heading: `${b} is at ${fmtDeg(lon % 30)} ${signOf(lon)}${rx ? ', retrograde' : ''}`, text: `${cap(WEEK_MOVER[b])}.${h ? ` For you it is moving through your ${ord(h)} house, ${W.HOUSE[h].area}.` : ''}${rx && D.STATION_TEXT[b] ? ` Retrograde: ${D.STATION_TEXT[b].retrograde}.` : ''}`, basis: 'Tropical, geocentric' };
      const top = activeLines[0];
      return {
        ...base,
        intent,
        label: top ? top.heading.replace(/^Now: /, '') : `${b} in ${signOf(lon)}${rx ? ', retrograde' : ''}`,
        orb: top ? `${b} ${verb(active[0].aspect)} ${active[0].natal}`.toUpperCase() : `${b} IN ${signOf(lon)}`.toUpperCase(),
        points: b,
        lines: [...activeLines.slice(0, 2), where, ...(activeLines.length ? [] : coming.slice(0, 1))],
        deeper: [...activeLines.slice(2), ...(activeLines.length ? coming : coming.slice(1)), ...natalAspects],
      };
    }
    case 'sky':
    case 'open':
      break;
  }

  // Returns.
  if (intent === 'return' || (intent === 'when' && /\breturn\b/i.test(q))) {
    const body = /jupiter/i.test(q) ? 'Jupiter' : 'Saturn';
    const r = nextReturn(c, body, now);
    const lines: SkyLine[] = [
      {
        heading: r.passes.length ? `${body} return: ${r.passes.map(fmtLong).join(', ')}` : `${body} return`,
        text: `${RETURN_MEANING[body]}${r.active ? ` ${ORACLE_SAYS.returnNow}` : ''}`,
        basis: `Your natal ${body} at ${fmtDeg(r.natal % 30)} ${signOf(r.natal)}${r.passes.length > 1 ? `; ${body} crosses it ${r.passes.length} times as it turns retrograde and direct` : ''}`,
      },
    ];
    return { ...base, intent: 'return', label: `Your ${body} return`, orb: `${body} RETURN`.toUpperCase(), points: body, lines, deeper: [] };
  }

  // A question the Oracle cannot place: answer from what is on the person's mind, or from what their
  // chart is working on right now, never from a general reading.
  if (intent === 'open') {
    const focus = ctx.profile?.onMind[0];
    if (focus) return areaAnswer(focus, ctx, base);
    const season = cycles(c, place.lat, place.lon, now, ctx.profile ?? null).now[0];
    const sky = todaySky(c, place, now);
    const lines: SkyLine[] = [
      ...(season ? [{ heading: `What you are moving through: ${season.title}`, text: `${season.feel} What helps: ${season.helps}`, basis: season.basis }] : []),
      ...sky.now.slice(0, 1),
      sky.moon,
    ];
    return { ...base, intent: 'open', label: 'What your chart is working on now', orb: 'RIGHT NOW', points: season?.title.split(' ')[0] ?? 'Moon', lines, deeper: sky.now.slice(1, 4), consult: true };
  }

  // The sky now, read against this chart.
  const s = todaySky(c, place, now);
  const deeper: SkyLine[] = [...s.now.slice(3), ...s.later.slice(0, 5).map((l) => ({ heading: l, text: '' }))];
  if (s.retrograde.length) deeper.push({ heading: 'Retrograde now', text: `${s.retrograde.join(', ')}.` });
  return {
    ...base,
    intent: 'sky',
    label: 'The sky right now, for you',
    orb: 'THE SKY NOW',
    points: s.now[0]?.heading.match(BODY_RE)?.[0] ?? 'Moon',
    lines: [s.moon, ...s.now.slice(0, 3)],
    deeper,
  };
}


const GLYPHS: Record<string, string> = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };

/** Every planet right now: sign, degree, retrograde, and the person's house it is moving through. */
export function skyToday(c: NatalChart, place: { lat: number; lon: number }, now = new Date()) {
  const cusps = cuspsOf(c, place);
  return (['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const).map((b) => {
    const lon = tropicalLongitude(b, now);
    return { body: b, glyph: `${GLYPHS[b]}\uFE0E`, sign: signOf(lon), deg: fmtDeg(lon % 30), rx: b !== 'Sun' && b !== 'Moon' && speed(b, now) < 0, house: cusps ? `${ord(houseOf(lon, cusps))} house` : null };
  });
}
// ─── The board, explored by touch ───────────────────────────────────────────

/** What each answer on the board means. */
export const TONE_MEANING: Record<Tone, string> = {
  go: 'The sky supports this. Take the next small step, at a pace that feels like yours.',
  wait: 'The timing looks better soon. The Oracle often names the day to come back.',
  closer: 'Something here is not yet clear. Check the details, and your own motives, before you act.',
  again: 'The question cannot be read as it stands, or it rests on someone else’s choices. Ask about what you can choose.',
};
export const MOON_MEANING = 'mood, needs, and what feels safe today';

export interface BoardInfo {
  title: string;
  text: string;
  /** A question to ask the Oracle about it. */
  ask?: string;
}

/** What the pointer is resting on: a planet in today's sky, a sign, or one of the four answers. */
export function boardInfo(kind: 'planet' | 'sign' | 'tone', name: string, c: NatalChart, place: { lat: number; lon: number }, now = new Date()): BoardInfo {
  if (kind === 'tone') {
    const t = (Object.keys(ORACLE_TONE) as Tone[]).find((k) => k === name) ?? 'again';
    return { title: ORACLE_TONE[t].label, text: TONE_MEANING[t] };
  }
  const cusps = cuspsOf(c, place);
  if (kind === 'planet') {
    const b = name as (typeof MOVERS)[number] | 'Moon';
    const lon = tropicalLongitude(b, now);
    const h = cusps ? houseOf(lon, cusps) : null;
    const rx = b !== 'Sun' && b !== 'Moon' && speed(b, now) < 0;
    return {
      title: `${b} in ${signOf(lon)}${rx ? ', retrograde' : ''}`,
      text: `${cap(b === 'Moon' ? MOON_MEANING : WEEK_MOVER[b])}.${h ? ` For you, it is moving through your ${ord(h)} house: ${W.HOUSE[h].area}.` : ''}`,
      ask: b === 'Moon' ? 'What’s the sky doing tonight?' : `Where is ${b} right now?`,
    };
  }
  const mine = c.western.planets.filter((p) => p.sign === name).map((p) => (p.body === 'Node' ? 'North Node' : p.body));
  const rising = c.western.ascendant.certain && c.western.ascendant.value === name;
  const first = mine.find((m) => m !== 'North Node');
  return {
    title: name,
    text: `${cap(W.SIGN_KEYWORD[name])}.${mine.length ? ` In your chart: your ${mine.join(', ')}.` : ' None of your birth planets are here.'}${rising ? ' It is also your rising sign.' : ''}`,
    ask: rising ? 'What’s my rising sign?' : first ? `What does my ${first} mean?` : undefined,
  };
}
