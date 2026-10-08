/**
 * "Your question": a fuller, personal answer when someone asks about the sky right now or about a
 * feeling (anxious, low, stressed, unsettled). Built on the device from the person's own chart and
 * today's sky, from approved-library text; no AI. DRAFT text for the approver.
 *
 * It ties together what the rest of the app shows separately: today's Moon in the person's houses,
 * fast contacts this week, retrogrades and stations, the slow seasons (with dates), the progressed
 * Moon, Vedic Saturn from the Moon and the dasha, plus how this Moon tends to carry worry and what helps.
 */
import { lahiriAyanamsa, norm, placidusCusps, houseOf, RASHIS, SIGNS, tropicalLongitude } from '../astro/chart';
import type { NatalChart } from '../astro/natal';
import { allAspects, monthAhead } from '../astro/deep';
import { cycles, type Cycle } from './cycles';
import type { Profile } from './mirror';
import { STATION_TEXT } from './deep';
import { SIGN_ELEMENT, type Element } from './templates';
import * as W from './western';
import * as V from './vedic';
import type { Topic } from './topics';

// ─── Library ──────────────────────────────────────────────────────────────────

/** Today's Moon passing through each natal house: where the day's mood may land for this person. */
export const MOON_TODAY_HOUSE: Record<number, string> = {
  1: 'it is crossing your first house, so moods may sit close to the surface and show on your face before you have named them. You may feel more sensitive to how you are seen.',
  2: 'it is moving through your second house, so feelings may gather around money, comfort, and your sense of worth. Small worries about security can feel bigger than they are.',
  3: 'it is moving through your third house, so your mind may be busy: messages, errands, and conversations replaying in your head.',
  4: 'it is moving through your fourth house, the most private part of the chart, so home, family, and old memories may be closer than usual. You may want to retreat a little.',
  5: 'it is moving through your fifth house, so you may want play, creativity, or affection, and feel flat if there is no room for them.',
  6: 'it is moving through your sixth house, so feelings may show up in your body and your to-do list: tension, restlessness, or an urge to fix and tidy.',
  7: 'it is moving through your seventh house, so feelings may be stirred by one particular person, and you may notice other people’s moods more than your own.',
  8: 'it is moving through your eighth house, so feelings may run deeper and more private than usual, around trust, intimacy, or what feels out of your control.',
  9: 'it is moving through your ninth house, so you may feel restless for perspective, meaning, or a change of scene.',
  10: 'it is moving through your tenth house, the most public part of the chart, so pressure around work, duties, or how you are doing may feel louder today.',
  11: 'it is moving through your eleventh house, so friends, groups, and hopes for the future may be on your mind, along with any sense of not quite belonging.',
  12: 'it is moving through your twelfth house, a quiet, hidden part of the chart. Tradition reads this as a day when you may feel tired or unsettled without a clear reason, and rest helps more than pushing.',
};

/** How today's Moon relates to the natal Moon. */
export const MOON_TO_MOON: Record<'conjunct' | 'sextile' | 'square' | 'trine' | 'opposite', string> = {
  conjunct: 'Today’s Moon is in the same sign as your birth Moon, your monthly lunar return. Feelings may be stronger and more familiar, as if your usual emotional patterns are turned up.',
  sextile: 'Today’s Moon makes an easy angle to your birth Moon, which is often read as a day when feelings are easier to understand and share.',
  square: 'Today’s Moon squares your birth Moon. This short monthly angle is often felt as friction between what you need and what the day asks of you, and it usually passes within two or three days.',
  trine: 'Today’s Moon is in harmony with your birth Moon, which is often read as a day when it is easier to feel at home in yourself.',
  opposite: 'Today’s Moon is opposite your birth Moon, a monthly turning point when feelings can come out through other people, and you may feel pulled between your needs and theirs.',
};

/** How each natal Moon sign may carry worry, and what tends to settle it. */
export const MOON_SIGN_WORRY: Record<string, string> = {
  Aries: 'With your Moon in Aries, worry may come out as impatience or an urge to act right now. Movement and one clear action can settle you faster than talking it through.',
  Taurus: 'With your Moon in Taurus, worry may show up when your routines or sense of security are shaken. Comfort, good food, sleep, and time outdoors can bring you back to steady ground.',
  Gemini: 'With your Moon in Gemini, worry may live in your head as racing thoughts and too many tabs open. Writing it down or saying it out loud can turn noise into something you can work with.',
  Cancer: 'With your Moon in Cancer, you may feel other people’s moods as your own and worry most about the people you love. Home, familiar faces, and being looked after can help.',
  Leo: 'With your Moon in Leo, worry may show up as feeling unseen or unappreciated. Warmth, play, and someone who notices you can help more than you might admit.',
  Virgo: 'With your Moon in Virgo, worry may come out as overthinking, checking, and trying to get everything right. Small useful tasks can calm you, as long as you also give yourself permission to stop.',
  Libra: 'With your Moon in Libra, worry may rise when things feel unbalanced, unfair, or unresolved with someone. Beauty, calm surroundings, and an honest conversation can help.',
  Scorpio: 'With your Moon in Scorpio, worry may go deep and stay private, often around trust or losing control. Naming what you fear, even just to yourself, can loosen its grip.',
  Sagittarius: 'With your Moon in Sagittarius, worry may show up as feeling hemmed in or without direction. Space, movement, and a bigger perspective can help.',
  Capricorn: 'With your Moon in Capricorn, you may handle worry by tightening control and carrying it alone. Rest, and letting one person in on what you are carrying, can help more than working harder.',
  Aquarius: 'With your Moon in Aquarius, worry may make you step back and analyze your feelings from a distance. Time with friends who get you, and some room to breathe, can help.',
  Pisces: 'With your Moon in Pisces, you may absorb the mood around you without realizing it, and feel anxious without knowing why. Quiet, water, music, and asking “is this mine?” can help.',
};

/** Natal Moon contacts that can make feelings more intense; read as sensitivity, not a flaw. */
export const NATAL_MOON_ASPECT: Record<string, string> = {
  Saturn: 'Your birth Moon is in a close aspect with Saturn, which is often read as a habit of being hard on yourself when you feel things, and of carrying worry quietly. Gentleness with yourself is part of the work here.',
  Uranus: 'Your birth Moon is in a close aspect with Uranus, which is often read as a nervous system that reacts fast to change and needs more space and freedom than most.',
  Neptune: 'Your birth Moon is in a close aspect with Neptune, which is often read as deep sensitivity: you may pick up on moods in a room and need more rest and quiet to clear them.',
  Pluto: 'Your birth Moon is in a close aspect with Pluto, which is often read as feeling things intensely and all at once, especially around trust and control.',
  Mars: 'Your birth Moon is in a close aspect with Mars, which is often read as feelings that turn quickly into energy, so worry may come out as restlessness or a short fuse.',
};

/** Fast planets touching a natal point this week: short contacts of a few days. */
export const FAST_CONTACT: Record<string, Record<'conj' | 'hard' | 'soft', string>> = {
  Sun: {
    conj: 'puts a spotlight on {target} for a few days',
    hard: 'adds a few days of pressure around {target}',
    soft: 'brings a few days of support for {target}',
  },
  Mercury: {
    conj: 'can make your mind busier around {target}, with more thinking and talking',
    hard: 'can bring a few days of overthinking or crossed wires around {target}',
    soft: 'makes it easier to put {target} into words',
  },
  Venus: {
    conj: 'brings a little warmth and ease to {target}',
    hard: 'can stir a few days of wanting more from {target}',
    soft: 'softens {target} for a few days',
  },
  Mars: {
    conj: 'adds heat and urgency to {target} for a few days',
    hard: 'can bring a few days of tension, impatience, or a shorter fuse around {target}',
    soft: 'gives {target} a few days of extra energy and courage',
  },
};
const FAST_TARGET: Record<string, string> = {
  Sun: 'your sense of self',
  Moon: 'your emotional life',
  Mercury: 'your thinking',
  Venus: 'your relationships',
  Mars: 'your energy',
  Ascendant: 'how you show up',
};

/** Vedic Saturn counted from the natal Moon: the gochara positions most often asked about. */
export const SATURN_FROM_MOON: Record<string, string> = {
  12: 'Saturn is in the 12th from your Moon: the first phase of Sade Sati, the roughly seven-and-a-half years Saturn spends around your Moon. Tradition links this phase with restless sleep, worry about the future, and letting go of what no longer fits.',
  1: 'Saturn is passing over your Moon sign itself: the middle and most felt phase of Sade Sati. Tradition reads it as a time when feelings can be heavy and responsibilities many, and also as a time of real emotional maturing.',
  2: 'Saturn is in the 2nd from your Moon: the last phase of Sade Sati. Tradition links it with attention to family, money, and speech, and with the pressure gradually easing.',
  4: 'Saturn is in the 4th from your Moon (kantaka Shani), which tradition links with a less settled feeling at home or inside yourself. Small comforts and routines can help.',
  8: 'Saturn is in the 8th from your Moon (ashtama Shani), which tradition reads as a time for patience, rest, and care with big commitments; worry can feel louder than the facts.',
  other: 'Saturn is not in one of the traditionally heavy positions from your Moon right now, so Vedic timing does not point to Saturn as the source of pressure.',
};

/** Grounding ideas by the element of the natal Moon. */
export const ELEMENT_CALM: Record<Element, string> = {
  fire: 'Your Moon is in a fire sign, so moving helps: a brisk walk, a workout, or doing one brave thing you have been putting off can burn off anxious energy.',
  earth: 'Your Moon is in an earth sign, so your body and your routines help: regular meals, sleep, time outdoors, and one small task finished properly.',
  air: 'Your Moon is in an air sign, so words help: write the worry down, then write what you actually know, and talk it through with someone who listens.',
  water: 'Your Moon is in a water sign, so feeling it helps: name the feeling, give it somewhere to go (a bath, music, tears, a friend), and protect your quiet time.',
};

export const ANSWER_TEXT = {
  skyIntro: 'Here is what the sky is doing now, and where it meets your own birth chart. These are themes to notice, not events to expect.',
  feelingIntro: 'Astrology can’t explain a feeling for you, but it can offer a map of the weather you are in. Here is what is active in your chart right now, and what may help.',
  quiet: 'No slow planet is pressing hard on your Sun, Moon, Mercury, or rising sign right now. That can mean this feeling has more to do with what is happening in your life than with a big astrological season, which is useful to know too.',
  longer: 'These longer seasons last months, so they describe the backdrop rather than a single day.',
  care: 'Astrology can describe a season; it can’t measure how heavy it feels for you. If this feeling stays for weeks, or gets in the way of sleep, work, or the people you love, talking with a doctor or counselor can help, alongside anything here.',
  meaning: 'Put together, the strongest theme for you right now is',
};

// ─── Building the answer ──────────────────────────────────────────────────────

export interface AnswerSection {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
  basis?: string;
}
export interface Answer {
  title: string;
  intro: string;
  sections: AnswerSection[];
  care?: string;
}

const FEELINGS: [RegExp, string][] = [
  [/\banxi|\bnervous|\bon edge\b|\bpanic|\bworr(y|ied|ying)\b|\buneasy\b|\bscared\b|\bafraid\b/i, 'anxious'],
  [/\bstress|\boverwhelm|\bunder pressure\b|\bburn(ed|t)? out\b/i, 'stressed'],
  [/\bsad\b|\blow\b|\bdown\b|\bdepress|\bheavy\b|\bblue\b|\bhopeless/i, 'low'],
  [/\bangry|\birritab|\bfrustrat|\bshort.?fuse/i, 'irritable'],
  [/\btired\b|\bexhausted\b|\bdrained\b|\bno energy\b/i, 'drained'],
  [/\bunsettled|\brestless|\boff lately|\bnot myself|\bemotional\b|\bmoody\b/i, 'unsettled'],
];

/** The feeling the person named, in their own terms, or null. */
export function feelingIn(text: string): string | null {
  for (const [re, word] of FEELINGS) if (re.test(text)) return word;
  return null;
}

/** Whether this situation gets the fuller answer: a question about the sky, or about a feeling. */
export function wantsAnswer(topic: Topic, text: string): boolean {
  return topic === 'sky' || topic === 'feelings' || topic === 'restless' || feelingIn(text) !== null;
}

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const range = (x: { start: string; end: string; peaks: string[] }) =>
  `${fmt(x.start)} to ${fmt(x.end)}${x.peaks.length ? `, closest ${x.peaks.map(fmt).join(' and ')}` : ''}`;
const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const VERB: Record<string, string> = { conjunct: 'meets', square: 'squares', trine: 'trines', opposite: 'opposes', sextile: 'sextiles' };
const cls = (a: string): 'conj' | 'hard' | 'soft' => (a === 'conjunct' ? 'conj' : a === 'square' || a === 'opposite' ? 'hard' : 'soft');
const HEAVY = ['Saturn', 'Uranus', 'Neptune', 'Pluto'];
const FEELING_POINTS = ['Moon', 'Sun', 'Mercury', 'Ascendant'];

function moonToday(c: NatalChart, now: Date, lat: number, lon: number) {
  const lonNow = tropicalLongitude('Moon', now);
  const sign = SIGNS[Math.floor(lonNow / 30)];
  // When the Moon changes sign: step forward an hour at a time (it spends about 2.5 days in a sign).
  let leaves = now;
  for (let h = 1; h <= 72; h++) {
    const t = new Date(now.getTime() + h * 3600000);
    if (SIGNS[Math.floor(tropicalLongitude('Moon', t) / 30)] !== sign) {
      leaves = t;
      break;
    }
  }
  const cusps = c.western.houseSystem ? placidusCusps(c.utc, lat, lon) : null;
  const house = cusps ? houseOf(lonNow, cusps) : null;
  const natal = c.western.moonSign.certain ? c.western.planets.find((p) => p.body === 'Moon')! : null;
  let rel: keyof typeof MOON_TO_MOON | null = null;
  if (natal) {
    const d = sep(lonNow, natal.longitude);
    rel = d <= 10 ? 'conjunct' : Math.abs(d - 60) <= 6 ? 'sextile' : Math.abs(d - 90) <= 8 ? 'square' : Math.abs(d - 120) <= 8 ? 'trine' : d >= 170 ? 'opposite' : null;
  }
  return { sign, leaves, house, rel };
}

function retrogradeNow(now: Date) {
  return (['Mercury', 'Venus', 'Mars'] as const).filter(
    (b) => norm(tropicalLongitude(b, new Date(now.getTime() + 43200000)) - tropicalLongitude(b, new Date(now.getTime() - 43200000)) + 180) - 180 < 0,
  );
}

function saturnFromMoon(c: NatalChart, now: Date): { n: number; text: string } | null {
  if (!c.vedic.moonRashi.certain) return null;
  const sat = Math.floor(norm(tropicalLongitude('Saturn', now) - lahiriAyanamsa(now)) / 30);
  const moon = SIGNS.indexOf(c.vedic.planets.find((p) => p.body === 'Moon')!.sign);
  const n = ((sat - moon + 12) % 12) + 1;
  return { n, text: SATURN_FROM_MOON[String(n)] ?? SATURN_FROM_MOON.other };
}

/**
 * The fuller answer for a sky or feeling question. `text` is the person's own words; `topic` is
 * what topicFor() chose for them.
 */
export function answerFor(text: string, topic: Topic, c: NatalChart, place: { lat: number; lon: number }, now = new Date(), profile: Profile | null = null): Answer | null {
  if (!wantsAnswer(topic, text)) return null;
  const feeling = feelingIn(text) ?? (topic === 'restless' ? 'unsettled' : topic === 'feelings' ? 'anxious' : null);
  const today = now.toISOString().slice(0, 10);
  const moonSign = c.western.moonSign.value;
  const moonEl = moonSign ? SIGN_ELEMENT[moonSign] : null;

  // What's active: slow seasons, the progressed Moon, the dasha.
  const cy = cycles(c, place.lat, place.lon, now, profile).now;
  const seasons = cy.filter((x) => x.kind === 'transit');
  const contacts = seasons.flatMap((s) => s.contacts.filter((ct) => ct.start <= today));
  // Slow, hard contacts; those on the Moon, Sun, Mercury, and rising sign come first.
  const heavy = contacts
    .filter((ct) => HEAVY.includes(ct.transiting) && cls(ct.aspect) !== 'soft')
    .sort((a, b) => Number(FEELING_POINTS.includes(b.natal)) - Number(FEELING_POINTS.includes(a.natal)));
  const pmoon = cy.find((x) => x.kind === 'progressed');
  const dasha = cy.find((x) => x.kind === 'dasha');

  // This week: fast planets touching personal points, and stations.
  const week = monthAhead(c, new Date(now.getTime() - 3 * 86400000), 10, place.lat, place.lon);
  const fast = week.transits
    .filter((t) => FAST_CONTACT[t.transiting] && FAST_TARGET[t.natal] && t.aspect !== 'sextile')
    .filter((t, i, a) => a.findIndex((u) => u.transiting === t.transiting && u.natal === t.natal) === i)
    .slice(0, 4);
  const stations = week.stations.filter((s) => STATION_TEXT[s.body]);
  const retro = retrogradeNow(now);
  const moon = moonToday(c, now, place.lat, place.lon);
  const sat = saturnFromMoon(c, now);

  const sections: AnswerSection[] = [];

  // 1. For a feeling: why it might be here.
  const used = new Set<(typeof fast)[number]>();
  if (feeling) {
    const points: string[] = [];
    for (const ct of heavy.slice(0, 3)) points.push(`${ct.transiting} ${VERB[ct.aspect]} your ${ct.natal === 'Ascendant' ? 'rising sign' : ct.natal} (${range(ct)}). ${ct.line}`);
    if (c.western.moonSign.certain && (moon.rel === 'square' || moon.rel === 'opposite' || moon.rel === 'conjunct')) points.push(MOON_TO_MOON[moon.rel]);
    if (moon.house === 12 || moon.house === 8 || moon.house === 4) points.push(`Today’s Moon ${MOON_TODAY_HOUSE[moon.house]}`);
    for (const t of fast.filter((f) => cls(f.aspect) !== 'soft' && ['Moon', 'Mercury', 'Sun'].includes(f.natal)).slice(0, 2)) {
      points.push(`Around ${fmt(t.date)}, ${t.transiting} ${VERB[t.aspect]} your ${t.natal}: it ${FAST_CONTACT[t.transiting][cls(t.aspect)].replace('{target}', FAST_TARGET[t.natal])}.`);
      used.add(t);
    }
    if (retro.includes('Mercury')) points.push(`Mercury is retrograde: ${STATION_TEXT.Mercury.retrograde}. Many people notice more second-guessing and replayed conversations in these weeks.`);
    if (sat && [12, 1, 2, 8].includes(sat.n)) points.push(`Vedic: ${sat.text}`);
    const paragraphs: string[] = [];
    if (points.length) paragraphs.push(`A few things in your chart may be adding to this right now:`);
    else paragraphs.push(ANSWER_TEXT.quiet);
    const natal: string[] = [];
    if (moonSign) natal.push(MOON_SIGN_WORRY[moonSign]);
    else if (c.western.moonSign.options.length) natal.push(`Without an exact birth time your Moon could be in ${c.western.moonSign.options.join(' or ')}. ${MOON_SIGN_WORRY[c.western.moonSign.options[0]]}`);
    const moonAsp = allAspects(c).find((a) => (a.a === 'Moon' || a.b === 'Moon') && NATAL_MOON_ASPECT[a.a === 'Moon' ? a.b : a.a] && a.aspect !== 'sextile' && a.aspect !== 'trine' && a.orb <= 6);
    if (moonAsp && c.western.moonSign.certain) natal.push(NATAL_MOON_ASPECT[moonAsp.a === 'Moon' ? moonAsp.b : moonAsp.a]);
    sections.push({
      id: 'why',
      title: `Why you may be feeling ${feeling}`,
      paragraphs,
      points,
      basis: 'Slow transits within 1° (with their full windows), today’s Moon, fast contacts this week, retrogrades, and Vedic Saturn from the Moon',
    });
    if (natal.length) sections.push({ id: 'natal', title: 'How your chart tends to carry this', paragraphs: natal, basis: moonSign ? `Natal Moon in ${moonSign}${moonAsp ? `, ${moonAsp.a} ${moonAsp.aspect} ${moonAsp.b}` : ''}` : 'Natal Moon' });
  }

  // 2. The sky right now: the Moon today, this week, retrogrades and stations.
  const leaves = moon.leaves.getTime() > now.getTime() ? ` until about ${moon.leaves.toLocaleDateString('en-US', { weekday: 'long' })}` : '';
  const skyParas = [
    `The Moon is in ${moon.sign}${leaves}, setting a collective tone of ${W.SIGN_KEYWORD[moon.sign]}. ${moon.house ? `In your chart ${MOON_TODAY_HOUSE[moon.house]}` : 'Without an exact birth time, houses are not included, so this reading stays with the signs.'}`,
    ...(moon.rel && c.western.moonSign.certain ? [MOON_TO_MOON[moon.rel]] : []),
  ];
  const skyPoints: string[] = [];
  for (const t of fast.filter((f) => !used.has(f))) skyPoints.push(`${fmt(t.date)}: ${t.transiting} ${VERB[t.aspect]} your ${t.natal === 'Ascendant' ? 'rising sign' : t.natal}. It ${FAST_CONTACT[t.transiting][cls(t.aspect)].replace('{target}', FAST_TARGET[t.natal])}.`);
  for (const s of stations) skyPoints.push(`${fmt(s.date)}: ${s.body} turns ${s.turns} in ${s.sign}, ${STATION_TEXT[s.body][s.turns]}.`);
  for (const r of retro) if (!stations.some((s) => s.body === r) && !(feeling && r === 'Mercury')) skyPoints.push(`${r} is retrograde: ${STATION_TEXT[r].retrograde}.`);
  sections.push({ id: 'sky', title: 'The sky right now, for you', paragraphs: skyParas, points: skyPoints, basis: 'Transiting Moon, fast-planet contacts within 1° this week, stations' });

  // 3. The longer seasons, with dates.
  const longer: string[] = [];
  for (const s of seasons.slice(0, 3)) {
    const lines = s.contacts.filter((ct) => ct.start <= today).slice(0, 2).map((ct) => `${ct.transiting} ${ct.aspect} your ${ct.natal === 'Ascendant' ? 'rising sign' : ct.natal} (${range(ct)}): ${ct.line}`);
    longer.push(`${s.title} (${s.phase.toLowerCase()}). ${s.feel} ${lines.join(' ')}`);
  }
  if (pmoon) longer.push(`${pmoon.title}, ${fmt(pmoon.start)} to ${fmt(pmoon.end)}. ${pmoon.feel}`);
  if (longer.length) sections.push({ id: 'seasons', title: 'The longer seasons you are in', paragraphs: [ANSWER_TEXT.longer], points: longer, basis: 'Jupiter to Pluto transits, the progressed Moon' });

  // 4. Vedic: dasha and Saturn from the Moon.
  const vedic: string[] = [];
  const cur = c.vedic.current;
  if (cur && dasha) vedic.push(`You are in a ${cur.maha.lord} mahadasha (until ${fmt(cur.maha.end.toISOString().slice(0, 10))}), ${V.DASHA_DETAIL[cur.maha.lord]}. Its ${cur.antar.lord} sub-period runs ${fmt(dasha.start)} to ${fmt(dasha.end)}: ${V.DASHA_DETAIL[cur.antar.lord]}.`);
  if (sat && !(feeling && [12, 1, 2, 8].includes(sat.n))) vedic.push(sat.text);
  if (vedic.length) sections.push({ id: 'vedic', title: 'The Vedic view', paragraphs: vedic, basis: `Vimshottari dasha; gochara Saturn${sat ? ` in the ${ord(sat.n)} from your Moon (${RASHIS[SIGNS.indexOf(c.vedic.planets.find((p) => p.body === 'Moon')!.sign)]})` : ''}` });

  // 5. For the sky question: what it may mean, in one line.
  const lead: Cycle | undefined = seasons[0] ?? pmoon;
  const leadName = lead ? lead.title.replace(/^\w+ · /, '').replace(/^Your /, 'your ').replace(/^An? /, (m) => m.toLowerCase()) : '';
  if (!feeling && lead)
    sections.push({ id: 'meaning', title: 'What it may mean for you', paragraphs: [`${ANSWER_TEXT.meaning} ${leadName.charAt(0).toLowerCase()}${leadName.slice(1)}, touching ${lead.touches}. ${lead.contacts[0]?.line ?? lead.feel}`] });

  // 6. What may help.
  const help: string[] = [];
  if (moonEl) help.push(ELEMENT_CALM[moonEl]);
  if (lead) help.push(`For ${leadName.charAt(0).toLowerCase()}${leadName.slice(1)}: ${lead.helps.charAt(0).toLowerCase()}${lead.helps.slice(1)}`);
  if (dasha && !feeling) help.push(`For the Vedic period: ${dasha.helps.charAt(0).toLowerCase()}${dasha.helps.slice(1)}`);
  if (moon.house === 12 || moon.rel === 'square') help.push('For the next couple of days: lower the bar, sleep early, and hold off on big decisions until the Moon moves on.');
  if (retro.includes('Mercury')) help.push('While Mercury is retrograde: re-read before you send, and give a worrying thought a second look before you believe it.');
  if (help.length) sections.push({ id: 'help', title: 'What may help', paragraphs: [], points: help });

  return {
    title: feeling ? `About feeling ${feeling}` : 'The sky right now, for you',
    intro: feeling ? ANSWER_TEXT.feelingIntro : ANSWER_TEXT.skyIntro,
    sections,
    care: feeling ? ANSWER_TEXT.care : undefined,
  };
}

/** Plain text of an answer, for tests and the review console's samples. */
export function answerText(a: Answer): string {
  return [a.title, a.intro, ...a.sections.flatMap((s) => [s.title, ...s.paragraphs, ...(s.points ?? [])]), a.care ?? ''].join(' ');
}
