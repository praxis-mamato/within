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
import { houseOf, placidusCusps, SIGNS, tropicalLongitude } from '../astro/chart';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { allAspects, monthAhead } from '../astro/deep';
import { weekAhead, MOVERS } from '../astro/week';
import { answerFor, feelingIn } from './answer';
import { cycles } from './cycles';
import { findPatterns } from './patternRules';
import { togetherReading } from './deepReading';
import type { Area, Profile } from './mirror';
import { askOracle, areaOf, limitOf, ORACLE_REFRAME, ORACLE_TONE, type Limit, type Tone } from './oracle';
import { chartInBrief, todaySky, type SkyLine } from './today';
import { topicFor } from './topics';
import { WEEK_CONTACT, WEEK_MOVER, WEEK_TARGET, weekReading } from './week';
import * as D from './deep';
import { consulted, dayScores, oracleLayers, type Layer } from './oracleLayers';
import * as V from './vedic';
import * as W from './western';

export type Intent = 'decision' | 'when' | 'return' | 'retro' | 'lunation' | 'together' | 'chart' | 'patterns' | 'feeling' | 'cycle' | 'week' | 'planet' | 'sky' | 'open';

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
}

export const ORACLE_SAYS = {
  welcome: 'Welcome to the Oracle…',
  invite: 'Ask anything. The stars answer, from your own chart.',
  how: 'Ask about your chart, today’s sky, the right time for something, what you are moving through, or what is on your heart. The Oracle reads the sky against your chart, the way astrologers have for centuries, to help you navigate life.',
  open: 'The Oracle hears a question it cannot place on one star, so it reads the sky at this moment against your chart.',
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

export function intentOf(q: string): Intent {
  // A "should I" question is a decision, even when it mentions the week or the sky.
  if (/^(should|shall)\b|\bshould i\b/i.test(q) && !/^(what|where|how|who|which)\b|\bwhen\b|\b(what|which|best|good) (day|time|week|month)\b|\breturn\b|\bretrograde\b/i.test(q)) return 'decision';
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
  const reply = answerOnly(question, ctx);
  if (reply.limit) return reply;
  // The full reading: the question's life area (or the one on the person's mind), or the planet it names.
  const q = question.trim();
  const body = reply.intent === 'chart' || reply.intent === 'planet' || reply.intent === 'retro' ? (/north node|\bnode\b/i.test(q) ? 'Node' : bodyIn(q)) : null;
  const area = body ? null : (areaOf(q) ?? (['decision', 'when', 'feeling', 'cycle', 'open', 'week', 'sky'].includes(reply.intent) ? (ctx.profile?.onMind[0] ?? null) : null));
  const layers = oracleLayers(ctx.chart, ctx.place, area, body && body !== 'Moon' ? body : body === 'Moon' ? 'Moon' : null, ctx.now ?? new Date());
  return layers.length ? { ...reply, layers, consulted: consulted(ctx.chart, layers) } : reply;
}

function answerOnly(question: string, ctx: OracleContext): OracleReply {
  const { chart: c, place } = ctx;
  const now = ctx.now ?? new Date();
  const q = question.trim();
  const day = iso(now);
  const base = { question: q, day };
  const limit = limitOf(q);
  if (limit && limit !== 'unclear') return { ...base, intent: 'decision', label: ORACLE_TONE.again.label, orb: 'ASK AGAIN', tone: 'again', points: 'Moon', lines: [{ heading: 'Ask it another way', text: ORACLE_REFRAME[limit] }], deeper: [], limit };
  const intent = intentOf(q);
  if (limit === 'unclear' && (intent === 'open' || intent === 'decision')) return { ...base, intent: 'decision', label: ORACLE_TONE.again.label, orb: 'ASK AGAIN', tone: 'again', points: 'Moon', lines: [{ heading: 'Ask it another way', text: ORACLE_REFRAME.unclear }], deeper: [], limit };
  const cusps = cuspsOf(c, place);
  const area = areaOf(q);

  switch (intent) {
    case 'decision': {
      const a = askOracle(q, c, place, now);
      return { ...base, intent, label: a.label, orb: '', tone: a.tone, points: a.points, lines: [{ heading: '', text: a.line }, ...(a.because ? [{ heading: 'In the sky', text: a.because }] : [])], deeper: a.why.map((w) => ({ heading: '', text: w })), limit: a.limit };
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
      const t = togetherReading(c, place, ctx.other.chart, ctx.other.place, ctx.other.name);
      const items = t.flatMap((s) => s.items.map((i) => ({ heading: i.heading, text: i.text, basis: i.basis })));
      return { ...base, intent, label: `You and ${ctx.other.name}`, orb: 'TWO CHARTS', points: 'Venus', lines: items.slice(0, 2), deeper: items.slice(2, 8) };
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
      const b = bodyIn(q)! as (typeof MOVERS)[number] | 'Moon';
      if (b === 'Moon') {
        const s = todaySky(c, place, now);
        return { ...base, intent, label: s.moon.heading, orb: 'THE MOON', points: 'Moon', lines: [s.moon], deeper: [] };
      }
      const lon = tropicalLongitude(b, now);
      const rx = speed(b, now) < 0;
      const h = cusps ? houseOf(lon, cusps) : null;
      const w = weekAhead(c, place.lat, place.lon, now, 30).movers.find((m) => m.mover === b);
      const contacts: SkyLine[] = (w?.contacts ?? []).slice(0, 4).map((x) => ({ heading: `${fmtDate(x.date)}: ${b} ${x.aspect} your ${x.natal}`, text: `${WEEK_CONTACT[b][x.aspect]} Your ${x.natal} is ${WEEK_TARGET[x.natal] ?? W.PLANET_FUNCTION[x.natal]}.`, basis: `Within ${fmtDeg(x.orb)}` }));
      return {
        ...base,
        intent,
        label: `${b} in ${signOf(lon)}${rx ? ', retrograde' : ''}`,
        orb: `${b} IN ${signOf(lon)}`.toUpperCase(),
        points: b,
        lines: [{ heading: `${b} is at ${fmtDeg(lon % 30)} ${signOf(lon)}${rx ? ', retrograde' : ''}`, text: `${cap(WEEK_MOVER[b])}.${h ? ` For you it is moving through your ${ord(h)} house, ${W.HOUSE[h].area}.` : ''}${rx && D.STATION_TEXT[b] ? ` Retrograde: ${D.STATION_TEXT[b].retrograde}.` : ''}`, basis: 'Tropical, geocentric' }, ...contacts.slice(0, 1)],
        deeper: contacts.slice(1),
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

  // The sky now, and anything the Oracle cannot place.
  const s = todaySky(c, place, now);
  const lines = [s.moon, ...s.now.slice(0, intent === 'sky' ? 3 : 1)];
  const deeper: SkyLine[] = [...s.now.slice(intent === 'sky' ? 3 : 1), ...s.later.slice(0, 5).map((l) => ({ heading: l, text: '' }))];
  if (s.retrograde.length) deeper.push({ heading: 'Retrograde now', text: `${s.retrograde.join(', ')}.` });
  return {
    ...base,
    intent: intent === 'sky' ? 'sky' : 'open',
    label: intent === 'sky' ? 'The sky right now, for you' : 'The Oracle reads the sky for you',
    orb: 'THE SKY NOW',
    points: s.now[0]?.heading.match(BODY_RE)?.[0] ?? 'Moon',
    lines: intent === 'sky' ? lines : [{ heading: '', text: ORACLE_SAYS.open }, ...lines],
    deeper,
    consult: intent === 'open',
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
