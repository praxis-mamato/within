/**
 * Subscriber deep sections, assembled from src/astro/deep.ts calculations and the depth library.
 * Added to the full reading for subscribers, plus two new tabs: Timing and Together.
 */
import { placidusCusps, RASHIS, SIGNS } from '../astro/chart';
import { aspectPatterns, allAspects, dashaCalendar, dominantPlanet, drishti, houseRulers, lordshipYogas, monthAhead, synastry, vargas } from '../astro/deep';
import { fmtDeg, type NatalChart } from '../astro/natal';
import type { ReadingItem, ReadingSection } from './fullReading';
import * as D from './deep';
import { progressionSections } from './chartReading';
import * as V from './vedic';
import * as W from './western';

export interface Place {
  lat: number;
  lon: number;
}

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ─── Western depth ──────────────────────────────────────────────────────────

export function westernDeep(c: NatalChart, place: Place): ReadingSection[] {
  const out: ReadingSection[] = [];
  const asp = allAspects(c);

  // Planet profiles: sign, house, and closest aspects read together.
  const profiles: ReadingItem[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].map((b) => {
    const p = c.western.planets.find((x) => x.body === b)!;
    const houseText = p.house ? D.PLANET_IN_HOUSE[b]?.[p.house] ?? `${cap(W.PLANET_FUNCTION[b])} may play out most in ${W.HOUSE[p.house].area}.` : '';
    const mine = asp.filter((a) => (a.a === b || a.b === b) && a.orb < 5).slice(0, 3);
    const aspText = mine
      .map((a) => {
        const other = a.a === b ? a.b : a.a;
        const pair = W.PAIR[`${a.a}-${a.b}`] ?? W.PAIR[`${a.b}-${a.a}`];
        return `${a.aspect} ${other}${pair ? ` (${pair})` : ''}`;
      })
      .join('; ');
    return {
      heading: `${b} in ${p.sign}${p.house ? `, ${ord(p.house)} house` : ''}`,
      text: [W.PLANET_IN_SIGN[b][p.sign], houseText, aspText ? `Its closest contacts: ${aspText}.` : ''].filter(Boolean).join(' '),
      basis: `${fmtDeg(p.degree)} ${p.sign}${p.retrograde ? ' · retrograde' : ''}${mine.length ? ` · ${mine.length} aspects within 5°` : ''}`,
    };
  });
  out.push({ id: 'wd-profiles', title: 'Planet by planet', intro: 'Each planet read through its sign, its house, and its closest aspects together.', items: profiles });

  // Patterns and the dominant planet.
  const patterns = aspectPatterns(c);
  const dom = dominantPlanet(c);
  out.push({
    id: 'wd-patterns',
    title: 'Chart patterns and emphasis',
    items: [
      { heading: `Strongest planet: ${dom.body}`, text: `${dom.body}, which describes ${W.PLANET_FUNCTION[dom.body]}, may be the strongest voice in your chart.`, basis: dom.reasons.join('; ') },
      ...(patterns.length
        ? patterns.map((p) => ({ heading: `${p.name}: ${p.bodies.join(', ')}`, text: D.PATTERN_TEXT[p.name], basis: p.where }))
        : [{ heading: 'No major aspect patterns', text: 'Your chart has no stellium, grand trine, T-square, grand cross, or yod, so its energy may be spread across several separate themes.' }]),
    ],
  });

  // House rulers.
  const rulers = houseRulers(c, place.lat, place.lon);
  out.push({
    id: 'wd-rulers',
    title: 'How your life areas connect',
    intro: 'Each house is ruled by the planet that rules its sign. Where that planet sits links the two areas of life.',
    items: rulers.length
      ? rulers.map((r) => ({
          heading: `${W.HOUSE[r.house].name}: ${r.sign}, ruled by ${r.ruler} in the ${ord(r.rulerHouse)}`,
          text: r.house === r.rulerHouse ? `${cap(W.HOUSE[r.house].area)} may be self-contained and strongly felt.` : `${cap(W.HOUSE[r.house].area)} may be tied to ${W.HOUSE[r.rulerHouse].area}.`,
          basis: `${r.ruler} rules ${r.sign}`,
        }))
      : [{ heading: 'Not included', text: 'House rulers need an exact birth time.' }],
  });
  return out;
}

// ─── Vedic depth ────────────────────────────────────────────────────────────

export function vedicDeep(c: NatalChart): ReadingSection[] {
  const out: ReadingSection[] = [];
  const v = vargas(c);
  const venus = v.grahas.find((g) => g.body === 'Venus')!;
  const moon = v.grahas.find((g) => g.body === 'Moon')!;
  const vargottama = v.grahas.filter((g) => g.vargottama && !['Rahu', 'Ketu'].includes(g.body));
  const d9: ReadingItem[] = [];
  if (v.d9Lagna) d9.push({ heading: `Navamsa lagna: ${v.d9Lagna}`, text: `Read as the inner temperament that matures over life. ${V.LAGNA[SIGNS[RASHIS.indexOf(v.d9Lagna)]]}`, basis: 'D9 ascendant' });
  else d9.push({ heading: 'Navamsa lagna not included', text: 'The navamsa lagna changes about every 13 minutes, so it needs an exact birth time.' });
  d9.push({ heading: `Venus in ${venus.d9} navamsa`, text: `Venus, karaka of love and partnership, falls in ${venus.d9} in the D9. Tradition reads its navamsa sign as the deeper style of how you love and what you need from a partner.`, basis: `D1 ${venus.d1} → D9 ${venus.d9}` });
  d9.push({ heading: `Moon in ${moon.d9} navamsa`, text: 'The Moon’s navamsa sign is read as the emotional nature beneath the surface.', basis: `D1 ${moon.d1} → D9 ${moon.d9}` });
  for (const g of vargottama) d9.push({ heading: `${g.body} is vargottama`, text: `${g.body} ${D.VARGOTTAMA_TEXT}`, basis: `${g.d1} in D1 and D9` });
  out.push({ id: 'vd-navamsa', title: 'Navamsa (D9): inner strength and partnership', intro: D.NAVAMSA_INTRO, items: d9 });

  const sun = v.grahas.find((g) => g.body === 'Sun')!;
  const sat = v.grahas.find((g) => g.body === 'Saturn')!;
  out.push({
    id: 'vd-dashamsa',
    title: 'Dashamsa (D10): work and standing',
    intro: D.DASHAMSA_INTRO,
    items: [
      v.d10Lagna ? { heading: `Dashamsa lagna: ${v.d10Lagna}`, text: 'Read as your approach to work and public life.', basis: 'D10 ascendant' } : { heading: 'Dashamsa lagna not included', text: 'It needs an exact birth time.' },
      { heading: `Sun in ${sun.d10} dashamsa`, text: 'The Sun here is read for authority and recognition at work.', basis: `D10 ${sun.d10}` },
      { heading: `Saturn in ${sat.d10} dashamsa`, text: 'Saturn here is read for discipline, service, and long-term effort at work.', basis: `D10 ${sat.d10}` },
    ],
  });

  const dr = drishti(c);
  const onKey = dr.filter((d) => ['Moon', 'Venus', 'Sun'].includes(d.to));
  out.push({
    id: 'vd-drishti',
    title: 'Graha drishti: who looks at whom',
    intro: 'In Jyotish every graha aspects the 7th sign from itself; Mars also the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th. Aspects on the Moon, Sun, and Venus are read most closely.',
    items: onKey.length
      ? onKey.map((d) => ({ heading: `${d.from} aspects ${d.to}`, text: `${d.from}’s aspect on ${d.to} (${V.GRAHA[d.to].karaka}) ${D.DRISHTI_TEXT[d.from] ?? 'adds its own qualities'}.`, basis: `${ord(d.nth)} from ${d.from}` }))
      : [{ heading: 'No aspects on the Sun, Moon, or Venus', text: 'These three grahas work without strong influence from the others.' }],
  });

  const ly = lordshipYogas(c);
  out.push({
    id: 'vd-raja',
    title: 'Raja, Dhana, and related yogas',
    intro: 'Combinations formed by the lords of houses, counted from your lagna.',
    items: !c.vedic.lagna.certain
      ? [{ heading: 'Not included', text: 'These yogas depend on house lordship, which needs a known lagna.' }]
      : ly.length
        ? ly.map((y) => ({ heading: `${y.name} yoga: ${y.grahas.join(' and ')}`, text: D.LORDSHIP_TEXT[y.name], basis: `Lords of houses ${y.houses.join(' and ')}, ${y.how}` }))
        : [{ heading: 'None of these combinations', text: 'No Raja, Dhana, Viparita, or Neecha Bhanga yoga forms by the rules used here. That says nothing about worth or outcome; many charts have none.' }],
  });
  return out;
}

// ─── Timing ─────────────────────────────────────────────────────────────────

const TRANSIT_PLANET_THEME: Record<string, string> = {
  Sun: 'attention and vitality',
  Mercury: 'conversations and decisions',
  Venus: 'affection, pleasure, and values',
  Mars: 'energy, drive, and friction',
  Jupiter: 'growth and opportunity',
  Saturn: 'responsibility and commitment',
  Uranus: 'change and a wish for freedom',
  Neptune: 'sensitivity, ideals, and blurred lines',
  Pluto: 'deep change and questions of power',
};
const TRANSIT_HOW: Record<string, string> = {
  conjunct: 'focuses on',
  sextile: 'offers an opening for',
  square: 'presses on, asking for adjustment in',
  trine: 'supports',
  opposite: 'brings, often through other people, a need for balance in',
};
const NATAL_THEME: Record<string, string> = { ...Object.fromEntries(Object.entries(W.PLANET_FUNCTION)), Ascendant: 'how you meet the world', Midheaven: 'your direction and public life' };

export function timingReading(c: NatalChart, place: Place, now = new Date()): ReadingSection[] {
  const m = monthAhead(c, now, 30, place.lat, place.lon);
  const out: ReadingSection[] = [];
  out.push({
    id: 't-transits',
    title: 'The month ahead, date by date',
    intro: 'Planets moving over your birth chart in the next 30 days, on the day each contact is closest. These are themes to notice, not events to expect.',
    items: m.transits.length
      ? m.transits.slice(0, 18).map((t) => ({
          heading: `${fmtDate(t.date)}: ${t.transiting} ${t.aspect} your ${t.natal}`,
          text: `${t.transiting}, associated with ${TRANSIT_PLANET_THEME[t.transiting]}, ${TRANSIT_HOW[t.aspect]} ${NATAL_THEME[t.natal]}.`,
          basis: `Exact within ${fmtDeg(t.orb)}`,
        }))
      : [{ heading: 'A quiet month', text: 'No close contacts to your personal planets in the next 30 days.' }],
  });
  out.push({
    id: 't-lunations',
    title: 'New and Full Moons for you',
    items: m.lunar.map((l) => ({
      heading: `${fmtDate(l.date)}: ${l.kind}${l.eclipse ? ' (eclipse season)' : ''} in ${l.sign}${l.house ? `, your ${ord(l.house)} house` : ''}`,
      text: `${cap(D.LUNATION_TEXT[l.kind])}${l.house ? `, around ${W.HOUSE[l.house].area}` : ''}.${l.eclipse ? ` ${D.LUNATION_TEXT.eclipse}` : ''}`,
      basis: l.house ? 'Placidus house of the lunation' : 'House needs an exact birth time',
    })),
  });
  if (m.stations.length)
    out.push({
      id: 't-stations',
      title: 'Planets changing direction',
      items: m.stations.map((s) => ({ heading: `${fmtDate(s.date)}: ${s.body} turns ${s.turns} in ${s.sign}`, text: `${cap(D.STATION_TEXT[s.body][s.turns])}.`, basis: 'Station (apparent change of direction)' })),
    });
  out.push(...progressionSections(c, place, now));
  const cal = dashaCalendar(c, now, 24);
  out.push({
    id: 't-dasha',
    title: 'Your dasha calendar',
    intro: 'Vimshottari sub-periods in the next two years. Each colors the time with its graha’s themes.',
    items: cal.length
      ? cal
          .filter((x) => x.level === 'antardasha' || x.start >= now.toISOString().slice(0, 10))
          .slice(0, 14)
          .map((x) => ({ heading: `${fmtDate(x.start)} – ${fmtDate(x.end)}: ${x.lord} ${x.level}`, text: `Within ${x.within}: ${V.DASHA_DETAIL[x.lord]}.`, basis: x.level }))
      : [{ heading: 'Not included', text: 'Dasha dates need an exact birth time.' }],
  });
  return out;
}

// ─── Together ───────────────────────────────────────────────────────────────

const ROLE: Record<string, string> = {
  Sun: 'sense of self',
  Moon: 'emotional needs',
  Mercury: 'way of talking',
  Venus: 'way of showing affection',
  Mars: 'drive',
  Jupiter: 'optimism',
  Saturn: 'sense of responsibility',
  Uranus: 'need for freedom',
  Neptune: 'ideals',
  Pluto: 'intensity',
};

export function togetherReading(me: NatalChart, mePlace: Place, them: NatalChart, themPlace: Place, name: string): ReadingSection[] {
  const meCusps = me.timePrecision === 'exact' ? placidusCusps(me.utc, mePlace.lat, mePlace.lon) : null;
  const themCusps = them.timePrecision === 'exact' ? placidusCusps(them.utc, themPlace.lat, themPlace.lon) : null;
  const s = synastry(me, them, themCusps, meCusps);
  const role = (b: string) => ROLE[b];
  const PERSONAL = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
  const weight = (a: { a: string; b: string }) => Number(PERSONAL.includes(a.a)) + Number(PERSONAL.includes(a.b));
  const fill = (t: string, planet: string, house: number) => t.replace('{planet}', planet).replace('{house}', `${ord(house)} house`).replace('{role}', role(planet)).replace('{area}', W.HOUSE[house].area);
  const out: ReadingSection[] = [];
  out.push({
    id: 'r-aspects',
    title: `Your chart and ${name}’s`,
    intro: 'Aspects between your planets and theirs. They describe possible dynamics, not what either of you thinks or intends. No compatibility score is given.',
    // Contacts between personal planets (Sun to Mars) matter most between two people; outer planets come after.
    items: [...s.aspects]
      .sort((x, y) => weight(y) - weight(x) || x.orb - y.orb)
      .slice(0, 14)
      .map((a) => ({
      heading: `Your ${a.a} ${a.aspect} ${name}’s ${a.b}`,
      text: `Your ${role(a.a)} and their ${role(a.b)} ${a.aspect === 'quincunx' ? 'sit at an awkward angle that asks for ongoing adjustment' : `may ${W.ASPECT_MEANING[a.aspect]}`}.`,
      basis: `Orb ${fmtDeg(a.orb)}`,
    })),
  });
  const overlays: ReadingItem[] = [
    ...s.overlays.theirsInMine.filter((o) => ['Sun', 'Moon', 'Venus', 'Mars', 'Saturn'].includes(o.body)).map((o) => ({ heading: `${name}’s ${o.body} in your ${ord(o.house)}`, text: fill(D.OVERLAY_TEXT.theirsInMine, o.body, o.house), basis: 'Their planet in your houses' })),
    ...s.overlays.mineInTheirs.filter((o) => ['Sun', 'Moon', 'Venus', 'Mars', 'Saturn'].includes(o.body)).map((o) => ({ heading: `Your ${o.body} in ${name}’s ${ord(o.house)}`, text: fill(D.OVERLAY_TEXT.mineInTheirs, o.body, o.house), basis: 'Your planet in their houses' })),
  ];
  out.push({
    id: 'r-overlays',
    title: 'Where you land in each other’s charts',
    items: overlays.length ? overlays : [{ heading: 'Not included', text: 'House overlays need an exact birth time for at least one of you.' }],
  });
  const comp = (b: string) => s.composite.find((x) => x.body === b)!;
  out.push({
    id: 'r-composite',
    title: 'The relationship itself',
    intro: D.COMPOSITE_INTRO,
    items: ['Sun', 'Moon', 'Venus'].map((b) => ({
      heading: `Composite ${b} in ${comp(b).sign}`,
      text: b === 'Sun' ? `The relationship’s core may be colored by ${W.SIGN_KEYWORD[comp(b).sign]}.` : b === 'Moon' ? `Its emotional climate may lean toward ${W.SIGN_KEYWORD[comp(b).sign]}.` : `Affection between you may be expressed through ${W.SIGN_KEYWORD[comp(b).sign]}.`,
      basis: `Midpoint ${fmtDeg(comp(b).longitude % 30)} ${comp(b).sign}`,
    })),
  });
  return out;
}
