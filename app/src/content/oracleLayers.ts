/**
 * The Oracle's full reading: the layers an astrologer would check for one question, all calculated
 * from the chart. For a life area: the house that rules it, its ruler and natural significator, the
 * slow transits of the year, the next month's contacts, the progressed chart, solar arcs, this year's
 * solar return, the Vedic bhava lord and dasha, and the best dates ahead. For a planet: the same
 * layers centred on that planet.
 */
import { placidusCusps, SIGNS } from '../astro/chart';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { allAspects, houseRulers, TRAD_RULER } from '../astro/deep';
import { progressions, solarArc, solarReturn, yearAhead } from '../astro/progressions';
import { weekAhead } from '../astro/week';
import type { Area } from './mirror';
import type { SkyLine } from './today';
import { WEEK_CONTACT } from './week';
import * as P from './progressions';
import * as V from './vedic';
import * as W from './western';

export interface Layer {
  title: string;
  tradition: 'Western' | 'Vedic' | 'Both';
  lines: SkyLine[];
}

/** The houses that speak to each life area, the first one primary. */
export const AREA_HOUSES: Record<Area, number[]> = { love: [7, 5], work: [10, 6], money: [2, 8], family: [4], health: [6, 1], creativity: [5], friends: [11, 3], purpose: [9, 12] };
/** The planet traditionally read for each area, whatever the chart. */
export const AREA_SIGNIFICATOR: Record<Area, string> = { love: 'Venus', work: 'Saturn', money: 'Jupiter', family: 'Moon', health: 'Mars', creativity: 'Sun', friends: 'Mercury', purpose: 'Jupiter' };
const AREA_NAME: Record<Area, string> = { love: 'love and partnership', work: 'work and career', money: 'money and security', family: 'home and family', health: 'body and energy', creativity: 'creativity and joy', friends: 'friends and community', purpose: 'meaning and direction' };

export const LAYER_TEXT = {
  noTime: 'House rulers and the Vedic bhavas need an exact birth time; this reading uses the planet traditionally linked with this area instead.',
  quietYear: 'No slow planet makes an exact contact here in the next twelve months. A steadier stretch, where your own choices set the pace.',
  quietMonth: 'No exact contacts here in the next thirty days.',
  quietProg: 'No progressed or directed planet is touching this part of your chart now; these slow techniques move a degree a year.',
};

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const fmtMonth = (s: string) => new Date(`${s.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nameOf = (b: string) => (b === 'Node' ? 'North Node' : b);

/** The points a question is about: the area's house ruler, its significator, and planets in its houses. */
function focusPoints(c: NatalChart, place: { lat: number; lon: number }, area: Area | null, body: string | null) {
  if (body) return { points: [body], house: null as number | null, ruler: null as string | null };
  if (!area) return { points: ['Sun', 'Moon'], house: null, ruler: null };
  const rulers = houseRulers(c, place.lat, place.lon);
  const house = AREA_HOUSES[area][0];
  const ruler = rulers.find((r) => r.house === house)?.ruler ?? null;
  const inHouse = c.western.planets.filter((p) => p.house && AREA_HOUSES[area].includes(p.house)).map((p) => p.body);
  const points = [...new Set([...(ruler ? [ruler] : []), AREA_SIGNIFICATOR[area], ...inHouse])].filter((b) => b !== 'Node');
  return { points, house: rulers.length ? house : null, ruler };
}

export function oracleLayers(c: NatalChart, place: { lat: number; lon: number }, area: Area | null, body: string | null, now = new Date()): Layer[] {
  if (!area && !body) return [];
  const out: Layer[] = [];
  const { points, house, ruler } = focusPoints(c, place, area, body);
  const pl = (b: string) => c.western.planets.find((p) => p.body === b);
  const label = body ? `your ${nameOf(body)}` : AREA_NAME[area!];

  // 1. The birth chart.
  const natal: SkyLine[] = [];
  if (house && area) {
    const cusps = placidusCusps(c.utc, place.lat, place.lon)!;
    const sign = SIGNS[Math.floor((((cusps[house - 1] % 360) + 360) % 360) / 30)];
    const r = pl(ruler!);
    natal.push({
      heading: `Your ${ord(house)} house begins in ${sign}`,
      text: `The ${ord(house)} house is ${W.HOUSE[house].area}. With ${sign} on its cusp, it takes on ${W.SIGN_KEYWORD[sign]}, and its ruler is ${ruler}.${r ? ` Your ${ruler} sits in ${r.sign}${r.house ? `, your ${ord(r.house)} house (${W.HOUSE[r.house].area})` : ''}, so this part of life tends to work through there.` : ''}`,
      basis: `Placidus cusp ${fmtDeg(cusps[house - 1] % 30)} ${sign}`,
    });
    const inH = c.western.planets.filter((p) => p.house && AREA_HOUSES[area].includes(p.house) && p.body !== 'Node');
    for (const p of inH.slice(0, 3)) natal.push({ heading: `${p.body} in your ${ord(p.house!)} house`, text: `${cap(W.PLANET_FUNCTION[p.body])}, placed in ${W.HOUSE[p.house!].area}.`, basis: `${fmtDeg(p.degree)} ${p.sign}` });
  } else if (area && !house) natal.push({ heading: 'Houses', text: LAYER_TEXT.noTime });
  for (const b of body ? [body] : [AREA_SIGNIFICATOR[area!]]) {
    const p = pl(b);
    if (!p) continue;
    natal.push({
      heading: `${body ? 'Your' : 'The significator:'} ${nameOf(b)} in ${p.sign}${p.house ? `, ${ord(p.house)} house` : ''}`,
      text: `${W.PLANET_IN_SIGN[b]?.[p.sign] ?? `In ${p.sign}, it takes on ${W.SIGN_KEYWORD[p.sign]}.`}`,
      basis: `${fmtDeg(p.degree)} ${p.sign}${p.retrograde ? ', retrograde' : ''}`,
    });
    for (const a of allAspects(c).filter((x) => (x.a === b || x.b === b) && x.aspect !== 'quincunx').slice(0, 2))
      natal.push({ heading: `${a.a} ${a.aspect} ${a.b}`, text: `${W.PAIR[`${a.a}-${a.b}`] ? `This links ${W.PAIR[`${a.a}-${a.b}`]}; the` : 'The'} two ${W.ASPECT_MEANING[a.aspect]}.`, basis: `Orb ${fmtDeg(a.orb)}` });
  }
  out.push({ title: `Your birth chart: ${label}`, tradition: 'Western', lines: natal });

  // 2. The year's slow transits to these points.
  const yr = yearAhead(c, place.lat, place.lon, now).filter((w) => points.includes(w.natal));
  out.push({
    title: 'The year ahead: slow planets',
    tradition: 'Western',
    lines: yr.length
      ? yr.slice(0, 5).map((w) => ({ heading: `${w.transiting} ${w.aspect} your ${w.natal}`, text: (P.SLOW_TRANSIT[w.transiting]?.[w.aspect] ?? `${w.transiting} ${w.aspect} your ${w.natal}.`).replace('{target}', `your ${w.natal}`), basis: `${fmtDate(w.start)} to ${fmtDate(w.end)}; closest ${w.exact.map(fmtDate).join(', ')}` }))
      : [{ heading: 'A steadier year here', text: LAYER_TEXT.quietYear }],
  });

  // 3. The next thirty days.
  const month = weekAhead(c, place.lat, place.lon, now, 30).movers.flatMap((m) => m.contacts.filter((x) => points.includes(x.natal) && !['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(m.mover)).map((x) => ({ m, x })));
  out.push({
    title: 'The next 30 days',
    tradition: 'Western',
    lines: month.length
      ? month.sort((a, b) => a.x.date.localeCompare(b.x.date)).slice(0, 5).map(({ m, x }) => ({ heading: `${fmtDate(x.date)}: ${m.mover} ${x.aspect} your ${x.natal}`, text: WEEK_CONTACT[m.mover][x.aspect], basis: `Within ${fmtDeg(x.orb)}` }))
      : [{ heading: 'Quiet', text: LAYER_TEXT.quietMonth }],
  });

  // 4. Progressions and solar arcs.
  const pr = progressions(c, place.lat, place.lon, now);
  const sa = solarArc(c, place.lat, place.lon, now);
  const prog: SkyLine[] = [];
  const pm = pr.planets.find((p) => p.body === 'Moon')!;
  prog.push({ heading: `Progressed Moon in ${pm.sign}${pm.house ? `, your ${ord(pm.house)} house` : ''}`, text: `${P.PROGRESSED_MOON_SIGN[pm.sign]}${pm.house ? ` ${P.PROGRESSED_MOON_HOUSE[pm.house]}` : ''}`, basis: `${fmtDeg(pm.degree)} ${pm.sign}; the emotional chapter of the last two to three years` });
  for (const x of pr.contacts.filter((k) => points.includes(k.natal) || points.includes(k.progressed)).slice(0, 3))
    prog.push({ heading: `Progressed ${x.progressed} ${x.aspect} natal ${x.natal}`, text: `Your progressed ${x.progressed} ${P.CONTACT_HOW[x.aspect]} your ${x.natal}.`, basis: x.exact ? `Exact around ${fmtMonth(x.exact)}` : `Within ${fmtDeg(x.orbNow)}` });
  for (const x of sa.contacts.filter((k) => points.includes(k.natal) || points.includes(k.directed)).slice(0, 3))
    prog.push({ heading: `Solar arc ${x.directed} ${x.aspect} natal ${x.natal}`, text: `Directed ${x.directed} ${P.CONTACT_HOW[x.aspect]} your ${x.natal}.`, basis: x.exact ? `Exact around ${fmtMonth(x.exact)}` : `Within ${fmtDeg(x.orbNow)}` });
  if (prog.length === 1) prog.push({ heading: 'No progressed contacts here', text: LAYER_TEXT.quietProg });
  out.push({ title: 'Your progressed chart and solar arcs', tradition: 'Western', lines: prog });

  // 5. This year's solar return.
  const sr = solarReturn(c, place.lat, place.lon, now);
  if (sr)
    out.push({
      title: `Your solar return (birthday ${sr.date.getFullYear()})`,
      tradition: 'Western',
      lines: [
        { heading: `${sr.ascendant} rising this year`, text: P.SR_ASCENDANT[sr.ascendant] ?? '', basis: `Return chart for ${sr.date.toISOString().slice(0, 10)}` },
        ...(sr.sunHouse ? [{ heading: `The year’s Sun in the ${ord(sr.sunHouse)} house`, text: `${P.SR_SUN_HOUSE[sr.sunHouse]}${area && AREA_HOUSES[area].includes(sr.sunHouse) ? ` This year’s focus falls right on ${AREA_NAME[area]}.` : ''}` }] : []),
      ],
    });

  // 6. Vedic: the bhava lord and the dasha.
  const ved: SkyLine[] = [];
  const cur = c.vedic.current;
  const lagnaIdx = c.vedic.lagnaLongitude !== null ? Math.floor(((c.vedic.lagnaLongitude % 360) + 360) % 360 / 30) : null;
  const lords = new Set<string>();
  if (area && lagnaIdx !== null) {
    for (const h of AREA_HOUSES[area]) {
      const sign = SIGNS[(lagnaIdx + h - 1) % 12];
      const lord = TRAD_RULER[sign];
      lords.add(lord);
      const g = c.vedic.planets.find((p) => p.body === lord);
      ved.push({ heading: `${ord(h)} bhava: ${sign}, ruled by ${lord}`, text: `${V.BHAVA[h] ? `${V.BHAVA[h].name}: ${V.BHAVA[h].area}. ` : ''}Its lord ${lord} sits in ${g?.rashi ?? '—'}${g?.house ? `, the ${ord(g.house)} bhava` : ''}.`, basis: 'Whole-sign bhavas from the lagna (Lahiri)' });
    }
  }
  if (body) {
    lords.add(body);
    const g = c.vedic.planets.find((p) => p.body === (body === 'Node' ? 'Rahu' : body));
    if (g) ved.push({ heading: `${g.body} in ${g.rashi}${g.house ? `, the ${ord(g.house)} bhava` : ''}`, text: `${V.GRAHA[g.body] ? `In Jyotish, ${g.body} signifies ${V.GRAHA[g.body].karaka}.` : ''}`, basis: `Sidereal ${fmtDeg(g.degree)} ${g.sign} (Lahiri)` });
  }
  if (cur) {
    const ties = [cur.maha.lord, cur.antar.lord].filter((l) => lords.has(l));
    ved.push({
      heading: `Dasha: ${cur.maha.lord} with ${cur.antar.lord}`,
      text: `${cap(V.DASHA_DETAIL[cur.maha.lord])}.${ties.length ? ` ${ties.join(' and ')} ${ties.length > 1 ? 'are' : 'is'} directly tied to ${label} in your chart, so this period speaks to it strongly.` : ''}`,
      basis: `${cur.antar.lord} antardasha until ${cur.antar.end.toISOString().slice(0, 10)}`,
    });
  }
  if (ved.length) out.push({ title: 'The Vedic view', tradition: 'Vedic', lines: ved });
  return out.filter((l) => l.lines.length);
}

/** What the Oracle read to answer, in numbers: the visible measure of its work. */
export function consulted(c: NatalChart, layers: Layer[]): string[] {
  const exact = c.timePrecision === 'exact';
  return [
    `${c.western.planets.length} planets and points`,
    exact ? '12 houses and 4 angles' : 'whole-sign view (no birth time)',
    `${allAspects(c).length} natal aspects`,
    'a year of transits, day by day',
    'progressions and solar arcs',
    'your solar return',
    'Vimshottari dashas and 27 nakshatras',
    `${layers.reduce((n, l) => n + l.lines.length, 0)} findings`,
  ];
}
