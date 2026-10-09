/**
 * The Oracle: ask one question, get one answer from the sky at that moment, read against your chart.
 * It follows horary astrology, the centuries-old tradition of reading a single question from the
 * chart of the moment it is asked: the Moon's next contact, whether the Moon is "void of course",
 * and the transits touching the part of your chart the question is about.
 *
 * Answers are tones, not verdicts: go gently, wait, look closer, or ask another way. Questions about
 * health, pregnancy, another person's heart, the law, or gambling are never given a tone.
 */
import { SIGNS, tropicalLongitude } from '../astro/chart';
import type { NatalChart } from '../astro/natal';
import { fmtDeg } from '../astro/natal';
import { weekAhead, type WeekAspect } from '../astro/week';
import { TARGET_AREAS, type Area } from './mirror';
import { HOUSE_AREA, WEEK_CONTACT } from './week';
import * as W from './western';

export type Tone = 'go' | 'wait' | 'closer' | 'again';
export type Limit = 'health' | 'others' | 'legal' | 'gamble' | 'unclear';

export const ORACLE_TONE: Record<Tone, { label: string; lines: string[] }> = {
  go: {
    label: 'Go gently ahead',
    lines: ['The sky leans your way here. Take the next small step, and keep it kind.', 'Open the door a little and see what comes through.', 'There is support around this. Move at a pace that feels like yours.'],
  },
  wait: {
    label: 'Wait a little',
    lines: ['Not yet. Give it a few days, then ask again.', 'Hold steady; the timing looks better soon.', 'Let this rest for now. A clearer moment is close.'],
  },
  closer: {
    label: 'Look closer',
    lines: ['Look again before you leap. Something here is not yet clear.', 'There is more to see. Check the details, and your own motives.', 'Slow down. The answer may be in what you have not asked yet.'],
  },
  again: {
    label: 'Ask it another way',
    lines: ['The Oracle cannot read this one as it stands. Ask it another way.', 'The question is a little cloudy. Try asking about what you can choose.'],
  },
};

/** Questions the Oracle does not give a tone to, and the question it offers instead. */
export const ORACLE_REFRAME: Record<Limit, string> = {
  health: 'The Oracle does not answer questions about health, illness, or pregnancy; a doctor or midwife is the right voice there. Try asking: what helps me feel steady while I wait to know more?',
  others: 'The Oracle does not speak for another person’s heart or choices. Try asking about your side: what do I need from this connection, and how could I ask for it?',
  legal: 'The Oracle does not answer legal questions; a lawyer is the right voice there. Try asking: how can I take care of myself through this process?',
  gamble: 'The Oracle does not pick bets, stocks, or numbers. Try asking: what is my relationship with risk teaching me right now?',
  unclear: 'Ask one clear question about something you can act on, for example: should I reach out to her this week?',
};

export const ORACLE_TEXT = {
  voidOfCourse:
    'The Moon is “void of course”: it makes no more contacts before it changes sign. Horary tradition reads this as a moment when a matter tends to stay as it is, so it is better to wait and ask again once the Moon moves on.',
  moonNext: 'In horary tradition, the Moon’s next contact shows how a question tends to unfold.',
  sameDay: 'The sky gives one answer to a question each day. Ask again tomorrow, or ask something new.',
  limit: 'You have asked the Oracle three questions today. The sky resets at midnight, or subscribe for unlimited questions and the full reading behind each answer.',
  intro: 'Ask one question. The Oracle reads the sky at this moment against your chart, the way horary astrologers have for centuries, and answers in one of four ways.',
};

const AREA_WORDS: [Area, RegExp][] = [
  ['love', /\b(love|date|dating|partner|boyfriend|girlfriend|husband|wife|crush|relationship|marry|marriage|text (him|her|them)|reach out|ex)\b/i],
  ['work', /\b(job|work|career|boss|promotion|interview|apply|application|business|client|project|quit|raise|hire|hired)\b/i],
  ['money', /\b(money|buy|sell|spend|save|loan|rent|salary|price|invest|afford|purchase)\b/i],
  ['family', /\b(mom|mum|dad|mother|father|family|sister|brother|home|house|move|moving|kids?|child|children|parents?)\b/i],
  ['friends', /\b(friends?|group|party|community|team|neighbou?r)\b/i],
  ['creativity', /\b(create|creative|write|writing|art|music|paint|design|book|launch|post|perform)\b/i],
  ['purpose', /\b(purpose|meaning|path|direction|study|school|travel|trip|course|degree|spiritual)\b/i],
  ['health', /\b(exercise|gym|run|sleep|routine|diet|rest|energy|habit)\b/i],
];
const LIMIT_WORDS: [Limit, RegExp][] = [
  ['health', /\b(sick|illness|ill|cancer|disease|diagnos\w*|surgery|pregnan\w*|baby|miscarr\w*|die|dying|death|dead|tumou?r|test results?|doctor|medication)\b/i],
  ['others', /\b(does|do|is|will|would|did)\s+(he|she|they|my (?:partner|husband|wife|boyfriend|girlfriend|ex|crush|boss|friend|mother|father|mom|mum|dad|sister|brother|son|daughter))\s+(?:still\s+|really\s+|even\s+|ever\s+)?(love|like|miss|want|think|care|cheat|cheating|lying|lie|come back|regret|feel)\b|\b(cheating|cheat on me|faithful|seeing someone else|thinking (about|of) me)\b/i],
  ['legal', /\b(court|lawsuit|sue|custody|divorce settlement|lawyer|trial|verdict|visa|immigration)\b/i],
  ['gamble', /\b(lottery|lotto|bet|betting|casino|stocks?|crypto|bitcoin|gamble|gambling|numbers? to play)\b/i],
];

export function areaOf(q: string): Area | null {
  return AREA_WORDS.find(([, re]) => re.test(q))?.[0] ?? null;
}
export function limitOf(q: string): Limit | null {
  if (q.replace(/[^a-z]/gi, '').length < 6) return 'unclear';
  return LIMIT_WORDS.find(([, re]) => re.test(q))?.[0] ?? null;
}

// ─── The chart of the moment ──────────────────────────────────────────────────

const SKY = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;
const ANGLES: [WeekAspect, number][] = [['conjunct', 0], ['sextile', 60], ['square', 90], ['trine', 120], ['opposite', 180]];
const signed = (a: number, b: number) => ((a - b + 540) % 360) - 180;
const signOf = (lon: number) => SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];

export interface MoonOfMoment {
  lon: number;
  sign: string;
  /** When the Moon leaves its sign. */
  leaves: Date;
  /** The Moon's next exact contact with a planet before it leaves the sign; null when void of course. */
  next: { planet: string; aspect: WeekAspect; at: Date } | null;
}

/** The Moon now, its next contact with Sun to Saturn before it changes sign, or void of course. */
export function moonOfMoment(now: Date): MoonOfMoment {
  const lon = tropicalLongitude('Moon', now);
  const sign = signOf(lon);
  const STEP = 30 * 60000;
  let leaves = new Date(now.getTime() + 60 * 3600000);
  let next: MoonOfMoment['next'] = null;
  let prev = SKY.map(() => ANGLES.map(() => 0));
  for (let t = now.getTime(); t <= now.getTime() + 60 * 3600000; t += STEP) {
    const d = new Date(t);
    const m = tropicalLongitude('Moon', d);
    if (signOf(m) !== sign) {
      leaves = d;
      break;
    }
    const cur = SKY.map((p) => {
      const pl = tropicalLongitude(p, d);
      return ANGLES.map(([, a]) => Math.abs(signed(m, pl)) - a);
    });
    if (t > now.getTime() && !next)
      SKY.forEach((p, i) =>
        ANGLES.forEach(([name], j) => {
          // A sign change in (separation − angle) between steps is an exact contact.
          if (!next && prev[i][j] < 0 !== cur[i][j] < 0 && Math.abs(cur[i][j]) < 5) next = { planet: p, aspect: name, at: d };
        }),
      );
    prev = cur;
  }
  return { lon, sign, leaves, next };
}

// ─── The answer ─────────────────────────────────────────────────────────────

export interface OracleAnswer {
  question: string;
  day: string;
  tone: Tone;
  label: string;
  line: string;
  /** The sky behind the answer, in one sentence. */
  because: string;
  /** The planet the planchette comes to rest on. */
  points: string;
  /** For subscribers: the reading behind the answer, line by line. */
  why: string[];
  limit?: Limit;
}

const HARD = ['square', 'opposite'];
const SOFT = ['sextile', 'trine'];
const HEAVY = ['Saturn', 'Mars', 'Pluto', 'Uranus'];
const KIND = ['Venus', 'Jupiter', 'Sun'];
const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const when = (d: Date) => d.toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
const hash = (s: string) => [...s].reduce((h, ch) => (Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0), 2166136261);
const firstSentence = (s: string) => s.split(/(?<=\.)\s/)[0];

export function askOracle(question: string, c: NatalChart, place: { lat: number; lon: number }, now = new Date()): OracleAnswer {
  const q = question.trim();
  const day = now.toISOString().slice(0, 10);
  const pick = (tone: Tone) => ORACLE_TONE[tone].lines[hash(`${q.toLowerCase()}|${day}`) % ORACLE_TONE[tone].lines.length];
  const moon = moonOfMoment(now);
  const moonLine = `The Moon is at ${fmtDeg(moon.lon % 30)} ${moon.sign} as you ask, and moves into the next sign ${when(moon.leaves)}.`;

  const limit = limitOf(q);
  if (limit)
    return { question: q, day, tone: 'again', label: ORACLE_TONE.again.label, line: ORACLE_REFRAME[limit], because: '', points: 'Moon', why: [moonLine], limit };

  const area = areaOf(q);
  const why: string[] = [moonLine];
  why.push(area ? `Your question is about ${area === 'health' ? 'body and energy' : W.HOUSE[Number(Object.keys(HOUSE_AREA).find((h) => HOUSE_AREA[Number(h)] === area))].area}, so the Oracle looks at the planets touching that part of your chart.` : 'Your question touches no single area, so the Oracle reads the strongest contact to your chart right now.');


  // Transits to the person's chart in the next three days, the ones about the question first.
  const w = weekAhead(c, place.lat, place.lon, now, 4);
  const contacts = w.movers
    .flatMap((m) => m.contacts.map((x) => ({ m, x })))
    .map((k) => ({ ...k, score: (area && (TARGET_AREAS[k.x.natal] ?? []).includes(area) ? 2 : 0) + (area && k.m.house && HOUSE_AREA[k.m.house] === area ? 2 : 0) + (k.x.date === day ? 1 : 0) - k.x.orb }))
    .sort((a, b) => b.score - a.score);
  const top = contacts[0] && (!area || contacts[0].score >= 1) ? contacts[0] : null;

  // Void of course: the matter tends to stay as it is, unless a strong transit speaks to the question.
  if (!moon.next) {
    why.push(ORACLE_TEXT.voidOfCourse);
    if (!(top && top.score >= 2))
      return { question: q, day, tone: 'wait', label: ORACLE_TONE.wait.label, line: `${pick('wait')} Ask again after ${when(moon.leaves)}.`, because: `The Moon is void of course in ${moon.sign} until ${when(moon.leaves)}.`, points: 'Moon', why };
  }
  const mn = moon.next;
  if (mn) why.push(`${ORACLE_TEXT.moonNext} Here, the Moon’s next contact is a ${mn.aspect === 'opposite' ? 'opposition' : mn.aspect === 'conjunct' ? 'conjunction' : mn.aspect} with ${mn.planet}, ${when(mn.at)}.`);

  let tone: Tone;
  let because: string;
  let points: string;
  if (top) {
    const { m, x } = top;
    points = m.mover;
    const dateWord = x.date === day ? 'today' : `on ${fmtDate(x.date)}`;
    because = `${m.mover === 'Sun' ? 'The Sun' : m.mover} ${x.aspect === 'opposite' ? 'opposes' : x.aspect === 'conjunct' ? 'meets' : `${x.aspect}s`} your ${x.natal} ${dateWord}. ${firstSentence(WEEK_CONTACT[m.mover][x.aspect])}`;
    why.push(`${m.mover} ${x.aspect} your ${x.natal} (${fmtDeg(x.natalLon % 30)} ${signOf(x.natalLon)}), exact ${dateWord}${m.house ? `, moving through your ${ord(m.house)} house` : ''}.`);
    if (m.mover === 'Neptune') tone = 'closer';
    else if (HARD.includes(x.aspect) && HEAVY.includes(m.mover)) tone = x.date > day ? 'wait' : 'closer';
    else if (HARD.includes(x.aspect)) tone = 'closer';
    else if (SOFT.includes(x.aspect) || KIND.includes(m.mover)) tone = 'go';
    else tone = HEAVY.includes(m.mover) ? 'closer' : 'go';
    if (m.mover === 'Mercury' && m.retrograde && (area === 'work' || area === 'money')) tone = 'closer';
  } else if (mn) {
    // No transit to the chart: the Moon's next contact decides, as in classic horary.
    points = mn.planet;
    because = `The Moon’s next contact is ${mn.aspect === 'opposite' ? 'an opposition' : `a ${mn.aspect === 'conjunct' ? 'conjunction' : mn.aspect}`} with ${mn.planet}, ${when(mn.at)}.`;
    if (SOFT.includes(mn.aspect)) tone = ['Saturn', 'Mars'].includes(mn.planet) ? 'closer' : 'go';
    else if (HARD.includes(mn.aspect)) tone = ['Venus', 'Jupiter'].includes(mn.planet) ? 'closer' : 'wait';
    else tone = ['Saturn', 'Mars'].includes(mn.planet) ? 'closer' : 'go';
  } else {
    // Unreachable: a void Moon without a strong transit returned above.
    tone = 'wait';
    because = '';
    points = 'Moon';
  }
  return { question: q, day, tone, label: ORACLE_TONE[tone].label, line: pick(tone), because, points, why };
}
