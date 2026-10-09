/**
 * The Moon mapped to a person's calendar: phases, the Moon's sign changes with the house each one
 * lands in for them, void-of-course windows, eclipses, and retrogrades. Calculated on the device.
 */
import * as Astronomy from 'astronomy-engine';
import { houseOf, meanNode, norm, placidusCusps, SIGNS, tropicalLongitude } from '../astro/chart';
import { fmtDeg, type NatalChart } from '../astro/natal';
import type { CalEvent } from '../lib/ics';
import { MOON_TODAY_HOUSE } from './answer';
import * as D from './deep';
import * as W from './western';

export interface MoonCalendarOptions {
  phases: boolean;
  signs: boolean;
  voidOfCourse: boolean;
  retrogrades: boolean;
}

export const MOON_CAL_TEXT = {
  name: 'Within · Your Moon',
  firstQuarter: 'First Quarter Moon: a point of action, when what you started at the New Moon meets its first test.',
  lastQuarter: 'Last Quarter Moon: a point of release, a good time to finish, clear, and simplify before the next New Moon.',
  void: 'The Moon is void of course: it makes no more contacts before it changes sign. Tradition reads this as a time when new starts tend to stay as they are; good for rest, routine, and finishing.',
  eclipse: 'An eclipse: traditionally an amplified New or Full Moon that can mark a turning point over the next six months. A theme to notice, not an event to expect.',
  footer: 'From Within. Astrology for reflection, not prediction.',
};

const HOUR = 3600000;
const DAY = 24 * HOUR;
const signIdx = (lon: number) => Math.floor(norm(lon) / 30);
const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const SKY = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;
const ANGLES = [0, 60, 90, 120, 180];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The moment f's sign index changes between a and b, to the minute. */
function refine(a: number, b: number, f: (t: number) => number) {
  const s0 = signIdx(f(a));
  while (b - a > 60000) {
    const m = (a + b) / 2;
    if (signIdx(f(m)) === s0) a = m;
    else b = m;
  }
  return b;
}

/** The last exact Moon aspect to Sun–Saturn in the hours before t, or null if none in 60 hours. */
function lastAspectBefore(t: number) {
  const orb = (x: number) => SKY.map((p) => ANGLES.map((a) => sep(tropicalLongitude('Moon', new Date(x)), tropicalLongitude(p, new Date(x))) - a));
  let next = orb(t);
  for (let x = t - HOUR; x > t - 60 * HOUR; x -= HOUR) {
    const cur = orb(x);
    for (let i = 0; i < SKY.length; i++) for (let j = 0; j < ANGLES.length; j++) if (cur[i][j] < 0 !== next[i][j] < 0 && Math.abs(cur[i][j]) < 3) return x + HOUR / 2;
    next = cur;
  }
  return null;
}

export function moonCalendar(c: NatalChart, place: { lat: number; lon: number }, from: Date, months: number, opt: MoonCalendarOptions): CalEvent[] {
  const until = new Date(from.getTime() + months * 30.44 * DAY);
  const cusps = c.timePrecision === 'exact' ? placidusCusps(c.utc, place.lat, place.lon) : null;
  const house = (lon: number) => (cusps ? houseOf(lon, cusps) : null);
  const natal = c.western.planets.map((p) => ({ name: p.body === 'Node' ? 'North Node' : p.body, lon: p.longitude }));
  const events: CalEvent[] = [];

  // Phases, with eclipses flagged and the birth points each New and Full Moon touches.
  if (opt.phases)
    for (const [phase, kind, icon] of [[0, 'New Moon', '🌑'], [90, 'First Quarter', '🌓'], [180, 'Full Moon', '🌕'], [270, 'Last Quarter', '🌗']] as const) {
      let t = Astronomy.SearchMoonPhase(phase, Astronomy.MakeTime(from), 40);
      while (t && t.date < until) {
        const lon = tropicalLongitude('Moon', t.date);
        const h = house(lon);
        const nodeDist = Math.min(sep(lon, meanNode(t.date)), sep(lon, meanNode(t.date) + 180));
        const eclipse = (phase === 0 && nodeDist < 17) || (phase === 180 && nodeDist < 11);
        const hits = natal
          .flatMap((p) => ANGLES.map((a) => ({ p, a, orb: Math.abs(sep(lon, p.lon) - a) })))
          .filter((x) => x.orb < 3)
          .sort((x, y) => x.orb - y.orb)
          .slice(0, 3);
        const ASP: Record<number, string> = { 0: 'conjunct', 60: 'sextile', 90: 'square', 120: 'trine', 180: 'opposite' };
        const body =
          phase === 0 || phase === 180
            ? `${cap(D.LUNATION_TEXT[kind as 'New Moon' | 'Full Moon'])}${h ? `, around ${W.HOUSE[h].area}` : ''}.`
            : phase === 90
              ? MOON_CAL_TEXT.firstQuarter
              : MOON_CAL_TEXT.lastQuarter;
        events.push({
          uid: `within-${kind.replace(' ', '')}-${t.date.toISOString()}@within`,
          start: t.date,
          end: new Date(t.date.getTime() + HOUR),
          title: `${icon} ${eclipse ? `${kind} eclipse` : kind} in ${SIGNS[signIdx(lon)]}${h ? ` · your ${ord(h)} house` : ''}`,
          description: [
            `${kind} at ${fmtDeg(norm(lon) % 30)} ${SIGNS[signIdx(lon)]}.`,
            body,
            ...(eclipse ? [MOON_CAL_TEXT.eclipse] : []),
            ...hits.map((x) => `${ASP[x.a]} your ${x.p.name} (within ${fmtDeg(x.orb)}).`),
            MOON_CAL_TEXT.footer,
          ].join('\n'),
        });
        t = Astronomy.SearchMoonPhase(phase, t.AddDays(20), 20);
      }
    }

  // The Moon's sign changes, with the house it enters for this person, and the void before each.
  if (opt.signs || opt.voidOfCourse) {
    const moon = (x: number) => tropicalLongitude('Moon', new Date(x));
    let prev = from.getTime();
    for (let x = prev + 2 * HOUR; x <= until.getTime(); x += 2 * HOUR) {
      if (signIdx(moon(x)) !== signIdx(moon(prev))) {
        const at = refine(prev, x, moon);
        const lon = moon(at + 60000);
        const sign = SIGNS[signIdx(lon)];
        const h = house(lon);
        if (opt.signs)
          events.push({
            uid: `within-moon-${sign}-${new Date(at).toISOString()}@within`,
            start: new Date(at),
            end: new Date(at + 30 * 60000),
            title: `☽ Moon enters ${sign}${h ? ` · your ${ord(h)} house` : ''}`,
            description: [`The Moon moves into ${sign}, bringing a mood of ${W.SIGN_KEYWORD[sign]}.`, ...(h ? [`For you, ${MOON_TODAY_HOUSE[h]}`] : []), MOON_CAL_TEXT.footer].join('\n'),
          });
        if (opt.voidOfCourse) {
          const last = lastAspectBefore(at);
          if (last && at - last >= HOUR)
            events.push({ uid: `within-voc-${new Date(at).toISOString()}@within`, start: new Date(last), end: new Date(at), title: '☽ Moon void of course', description: `${MOON_CAL_TEXT.void}\nUntil the Moon enters ${sign}.\n${MOON_CAL_TEXT.footer}` });
        }
      }
      prev = x;
    }
  }

  // Retrograde periods for Mercury, Venus, and Mars.
  if (opt.retrogrades)
    for (const b of ['Mercury', 'Venus', 'Mars'] as const) {
      const speed = (x: number) => ((tropicalLongitude(b, new Date(x + DAY / 2)) - tropicalLongitude(b, new Date(x - DAY / 2)) + 540) % 360) - 180;
      let start: number | null = speed(from.getTime()) < 0 ? from.getTime() : null;
      for (let x = from.getTime() + DAY; x <= until.getTime() + 120 * DAY; x += DAY) {
        const rx = speed(x) < 0;
        if (rx && start === null) {
          if (x > until.getTime()) break;
          start = x;
        }
        if (!rx && start !== null) {
          const lon = tropicalLongitude(b, new Date(start));
          const h = house(lon);
          events.push({
            uid: `within-${b}-rx-${new Date(start).toISOString().slice(0, 10)}@within`,
            start: new Date(start),
            end: new Date(x),
            allDay: true,
            title: `℞ ${b} retrograde in ${SIGNS[signIdx(lon)]}${h ? ` · your ${ord(h)} house` : ''}`,
            description: [`${cap(D.STATION_TEXT[b].retrograde)}.`, ...(h ? [`In your chart this falls in ${W.HOUSE[h].area}.`] : []), `${b} turns direct: ${cap(D.STATION_TEXT[b].direct)}.`, MOON_CAL_TEXT.footer].join('\n'),
          });
          start = null;
        }
      }
    }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}
