/**
 * The free layer on Today: the sky right now read against the person's own chart, and their chart in
 * brief. Calculated on the device from the same engines as the paid readings, so the free taste is
 * the real thing, just less of it.
 */
import { SIGNS } from '../astro/chart';
import type { NatalChart } from '../astro/natal';
import { fmtDeg } from '../astro/natal';
import { allAspects } from '../astro/deep';
import { weekAhead } from '../astro/week';
import { moonToday, MOON_TO_MOON, MOON_TODAY_HOUSE } from './answer';
import { WEEK_CONTACT, WEEK_TARGET } from './week';
import * as D from './deep';
import * as W from './western';

export interface SkyLine {
  heading: string;
  text: string;
  basis?: string;
}
export interface TodaySky {
  moon: SkyLine;
  /** Contacts exact today or in the next two days, all planets. */
  now: SkyLine[];
  /** The week's other contacts, titles only: what a subscription opens. */
  later: string[];
  retrograde: string[];
}

export const TODAY_TEXT = {
  moonIntro: 'The Moon sets the mood of the day and changes sign every two to three days.',
  quiet: 'No planet is making an exact contact to your chart in the next two days. A good day to work with what is already in motion.',
  retro: 'Retrograde now, so its themes lean toward review rather than fresh starts:',
};

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const time = (d: Date) => d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function todaySky(c: NatalChart, place: { lat: number; lon: number }, now = new Date()): TodaySky {
  const m = moonToday(c, now, place.lat, place.lon);
  const moonText = [TODAY_TEXT.moonIntro];
  if (m.house) moonText.push(`For you, ${MOON_TODAY_HOUSE[m.house]}`);
  if (m.rel) moonText.push(MOON_TO_MOON[m.rel]);
  const moon: SkyLine = {
    heading: `The Moon is in ${m.sign}${m.house ? `, your ${ord(m.house)} house` : ''}`,
    text: moonText.join(' '),
    basis: m.leaves > now ? `Moves on ${time(m.leaves)}` : undefined,
  };

  const w = weekAhead(c, place.lat, place.lon, now, 7);
  const today = now.toISOString().slice(0, 10);
  const soon = new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10);
  const all = w.movers.flatMap((mv) => mv.contacts.map((x) => ({ mv, x })));
  const nowItems = all
    .filter(({ x }) => x.date <= soon)
    .sort((a, b) => a.x.date.localeCompare(b.x.date) || a.x.orb - b.x.orb)
    .slice(0, 4)
    .map(({ mv, x }) => ({
      heading: `${x.date === today ? 'Today' : fmtDate(x.date)}: ${mv.mover} ${x.aspect} your ${x.natal}`,
      text: `${WEEK_CONTACT[mv.mover][x.aspect]} Your ${x.natal} is ${WEEK_TARGET[x.natal] ?? W.PLANET_FUNCTION[x.natal]}.${mv.house ? ` ${mv.mover === 'Sun' ? 'The Sun' : mv.mover} is in your ${ord(mv.house)} house, ${W.HOUSE[mv.house].area}.` : ''}`,
      basis: `${mv.mover} ${fmtDeg(mv.lon % 30)} ${mv.sign} · your ${x.natal} ${fmtDeg(x.natalLon % 30)} ${SIGNS[Math.floor((((x.natalLon % 360) + 360) % 360) / 30)]}`,
    }));
  const shown = new Set(nowItems.map((i) => i.heading));
  const later = [
    ...all.filter(({ x }) => x.date > soon).map(({ mv, x }) => ({ date: x.date, text: `${fmtDate(x.date)}: ${mv.mover} ${x.aspect} your ${x.natal}` })),
    ...w.lunations.map((l) => ({ date: l.date, text: `${fmtDate(l.date)}: ${l.kind} in ${l.sign}${l.house ? `, your ${ord(l.house)} house` : ''}` })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => x.text)
    .filter((h) => !shown.has(h));
  const retrograde = w.movers.filter((mv) => mv.retrograde && ['Mercury', 'Venus', 'Mars'].includes(mv.mover)).map((mv) => mv.mover);
  return { moon, now: nowItems.length ? nowItems : [{ heading: 'Quiet skies for you', text: TODAY_TEXT.quiet }], later, retrograde };
}

/** Sun, Moon, rising sign, and the tightest thread between personal planets, read in full. */
export function chartInBrief(c: NatalChart): SkyLine[] {
  const p = (b: string) => c.western.planets.find((x) => x.body === b)!;
  const out: SkyLine[] = [];
  for (const b of ['Sun', 'Moon'] as const) {
    const x = p(b);
    if (b === 'Moon' && !c.western.moonSign.certain) {
      out.push({ heading: `Moon in ${c.western.moonSign.options.join(' or ')}`, text: 'Your Moon changed sign on the day you were born; a birth time settles which one.' });
      continue;
    }
    out.push({
      heading: `${b} in ${x.sign}${x.house ? `, ${ord(x.house)} house` : ''}`,
      text: `${cap(W.PLANET_FUNCTION[b])}. ${W.PLANET_IN_SIGN[b][x.sign]}${x.house ? ` ${D.PLANET_IN_HOUSE[b][x.house]}` : ''}`,
      basis: `${fmtDeg(x.degree)} ${x.sign}`,
    });
  }
  const asc = c.western.ascendant;
  if (asc.certain && asc.value) out.push({ heading: `${asc.value} rising`, text: W.RISING[asc.value], basis: 'Ascendant' });
  const thread = allAspects(c).find((a) => W.PAIR[`${a.a}-${a.b}`] && a.aspect !== 'quincunx');
  if (thread)
    out.push({
      heading: `${thread.a} ${thread.aspect} ${thread.b}`,
      text: `The tightest thread in your chart links ${W.PAIR[`${thread.a}-${thread.b}`]}. Here they ${W.ASPECT_MEANING[thread.aspect]}.`,
      basis: `Orb ${fmtDeg(thread.orb)}`,
    });
  return out;
}
