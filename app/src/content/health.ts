/**
 * Health, answered from the chart: vitality (the Sun), what calms the body (the Moon), how energy
 * moves (Mars), the routines that suit you (the 6th house), the parts of the body tradition links to
 * your signs, and the dates in the next month when energy may dip or lift. Body care and timing,
 * never a medical opinion: symptoms go to a doctor.
 */
import { houseOf, placidusCusps, SIGNS } from '../astro/chart';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { weekAhead } from '../astro/week';
import type { SkyLine } from './today';
import { SIGN_ELEMENT } from './templates';
import { dayScores } from './oracleLayers';
import * as W from './western';

/** Traditional body rulership of each sign (medical astrology), framed as where to care, not what is wrong. */
export const SIGN_BODY: Record<string, string> = {
  Aries: 'the head and face; tension can show up as headaches when you push too hard',
  Taurus: 'the throat and neck; holding things in can settle there',
  Gemini: 'the lungs, arms, and nerves; breathing slowly helps a racing mind',
  Cancer: 'the stomach and chest; feelings often land in your digestion',
  Leo: 'the heart and upper back; joy and warmth are real medicine for you',
  Virgo: 'digestion and the gut; routine and simple food steady you',
  Libra: 'the lower back and kidneys; balance, water, and rest matter',
  Scorpio: 'the pelvis and the body’s ways of letting go; release is part of your health',
  Sagittarius: 'the hips, thighs, and liver; movement and moderation suit you',
  Capricorn: 'the bones, knees, skin, and teeth; slow, steady care pays off',
  Aquarius: 'the circulation, shins, and ankles; moving often matters more than moving hard',
  Pisces: 'the feet and the immune system; sleep and boundaries protect you',
};
/** How energy tends to move, by the element of Mars. */
export const MARS_ENERGY: Record<string, string> = {
  fire: 'Your energy comes in bursts. Short, intense movement suits you better than long, dull routines.',
  earth: 'Your energy is steady and builds slowly. Consistency beats intensity for you.',
  air: 'Your energy follows your interest. Variety, company, and play keep you moving.',
  water: 'Your energy rises and falls with your mood. Gentle movement and water help you reset.',
};
/** What calms your body, by the element of the Moon. */
export const MOON_CALM: Record<string, string> = {
  fire: 'Your body calms through doing: a walk, a stretch, anything that burns off the charge.',
  earth: 'Your body calms through the senses: good food, a bath, time outside, sleep on time.',
  air: 'Your body calms when your mind does: talk it out, write it down, then breathe slowly.',
  water: 'Your body calms through feeling safe: rest, warmth, quiet, and people you trust.',
};
/** The routine that suits you, by the sign on the 6th house. */
export const SIXTH_ROUTINE: Record<string, string> = {
  Aries: 'Routines you can start fast and finish quickly; competition with yourself helps.',
  Taurus: 'Unhurried routines at the same time each day, with real comfort built in.',
  Gemini: 'Routines with variety: change the exercise, the route, the playlist.',
  Cancer: 'Routines that feel like care, done at home or with people you love.',
  Leo: 'Routines that feel like play, ideally with a little audience.',
  Virgo: 'Precise routines you can track; small daily improvements motivate you.',
  Libra: 'Routines with a partner, and with beauty: a nice place, a good class.',
  Scorpio: 'Deep routines you commit to fully: one practice, done seriously.',
  Sagittarius: 'Routines outdoors or on the move, with a goal on the horizon.',
  Capricorn: 'Structured routines with clear milestones; you like to see progress.',
  Aquarius: 'Unusual routines that feel like yours, and groups that move together.',
  Pisces: 'Gentle routines: water, dance, yoga, sleep, and quiet.',
};
export const HEALTH_TEXT = {
  boundary: 'The Oracle can’t speak to illness, a diagnosis, or pregnancy; a doctor can. Here is what your chart says about your energy and what supports it.',
  care: 'For any symptom or worry, see a doctor. Astrology is for noticing your patterns, not for medical decisions.',
  noTime: 'Add your birth time to see your 6th house, the traditional house of daily health.',
};

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function healthAnswer(c: NatalChart, place: { lat: number; lon: number }, now = new Date(), boundary = false): { lines: SkyLine[]; deeper: SkyLine[] } {
  const p = (b: string) => c.western.planets.find((x) => x.body === b)!;
  const sun = p('Sun');
  const moon = p('Moon');
  const mars = p('Mars');
  const lines: SkyLine[] = [];
  if (boundary) lines.push({ heading: '', text: HEALTH_TEXT.boundary });
  lines.push({ heading: `Your vitality: Sun in ${sun.sign}${sun.house ? `, ${ord(sun.house)} house` : ''}`, text: `Tradition links ${sun.sign} with ${SIGN_BODY[sun.sign]}.`, basis: `${fmtDeg(sun.degree)} ${sun.sign}` });
  lines.push({ heading: `How your energy moves: Mars in ${mars.sign}`, text: MARS_ENERGY[SIGN_ELEMENT[mars.sign]], basis: `${fmtDeg(mars.degree)} ${mars.sign}` });

  const deeper: SkyLine[] = [];
  if (c.western.moonSign.certain) deeper.push({ heading: `What calms you: Moon in ${moon.sign}`, text: `${MOON_CALM[SIGN_ELEMENT[moon.sign]]} Tradition links ${moon.sign} with ${SIGN_BODY[moon.sign]}.`, basis: `${fmtDeg(moon.degree)} ${moon.sign}` });
  const cusps = c.timePrecision === 'exact' ? placidusCusps(c.utc, place.lat, place.lon) : null;
  if (cusps) {
    const sixth = SIGNS[Math.floor((((cusps[5] % 360) + 360) % 360) / 30)];
    const inSixth = c.western.planets.filter((x) => x.body !== 'Node' && houseOf(x.longitude, cusps) === 6).map((x) => x.body);
    deeper.push({ heading: `Routines that suit you: ${sixth} on your 6th house`, text: `${SIXTH_ROUTINE[sixth]}${inSixth.length ? ` With ${inSixth.join(' and ')} here, ${W.PLANET_FUNCTION[inSixth[0]]} shapes your daily habits.` : ''}` });
    const asc = SIGNS[Math.floor((((cusps[0] % 360) + 360) % 360) / 30)];
    deeper.push({ heading: `Your body’s first signals: ${asc} rising`, text: `Tradition links ${asc} with ${SIGN_BODY[asc]}.` });
  } else deeper.push({ heading: 'Your 6th house', text: HEALTH_TEXT.noTime });

  // The next month: dips and lifts to vitality (Sun), energy (Mars), and comfort (Moon).
  const month = weekAhead(c, place.lat, place.lon, now, 30).movers.flatMap((m) => m.contacts.filter((x) => ['Sun', 'Mars', 'Moon', 'Ascendant'].includes(x.natal)).map((x) => ({ m: m.mover, x })));
  const lift = month.filter(({ m, x }) => ['Jupiter', 'Venus', 'Sun', 'Mars'].includes(m) && ['trine', 'sextile', 'conjunct'].includes(x.aspect)).slice(0, 2);
  const dip = month.filter(({ m, x }) => ['Saturn', 'Neptune', 'Pluto', 'Mars'].includes(m) && ['square', 'opposite'].includes(x.aspect)).slice(0, 2);
  for (const { m, x } of lift) lines.push({ heading: `${fmtDate(x.date)}: energy may lift`, text: `${m} ${x.aspect} your ${x.natal}. A good day to start or step up a habit.` });
  for (const { m, x } of dip) lines.push({ heading: `${fmtDate(x.date)}: go gently`, text: `${m} ${x.aspect} your ${x.natal}. Energy may dip; rest counts as progress.` });
  if (!lift.length && !dip.length) {
    const best = dayScores(c, place, now, 'health', 'routine', 30).filter((d) => d.score > 1).sort((a, b) => b.score - a.score)[0];
    if (best) lines.push({ heading: `${fmtDate(best.date)}: a good day to begin`, text: 'The steadiest day this month to start a new routine.' });
  }
  deeper.push({ heading: '', text: HEALTH_TEXT.care });
  return { lines, deeper };
}
