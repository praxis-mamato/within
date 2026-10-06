/**
 * The full Western and Vedic readings: every placement interpreted from the libraries in
 * western.ts and vedic.ts, plus the sky right now. Rule-based; every item names its basis.
 */
import { BODIES, nakshatraOf, norm, RASHIS, SIGNS, tropicalLongitude, lahiriAyanamsa, antardashas } from '../astro/chart';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { currentTransits } from '../astro/facts';
import { NAKSHATRA, SIGN_ELEMENT, LIBRARY_VERSION } from './templates';
import * as W from './western';
import * as V from './vedic';

export interface ReadingItem {
  heading: string;
  text: string;
  /** The placement or rule this item is based on, shown small under the text. */
  basis?: string;
}
export interface ReadingSection {
  id: string;
  title: string;
  intro?: string;
  items: ReadingItem[];
}

const PERSONAL = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

// ─── Western ────────────────────────────────────────────────────────────────

function natalAspects(c: NatalChart) {
  const ps = c.western.planets.filter((p) => PERSONAL.includes(p.body));
  const aspects = [
    { name: 'conjunction', angle: 0, orb: 8 },
    { name: 'sextile', angle: 60, orb: 4 },
    { name: 'square', angle: 90, orb: 7 },
    { name: 'trine', angle: 120, orb: 7 },
    { name: 'opposition', angle: 180, orb: 8 },
  ];
  const out: { a: string; b: string; aspect: string; orb: number }[] = [];
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const sep = Math.abs(((ps[i].longitude - ps[j].longitude + 540) % 360) - 180);
      const lum = ['Sun', 'Moon'].includes(ps[i].body) || ['Sun', 'Moon'].includes(ps[j].body) ? 2 : 0;
      for (const a of aspects) {
        const orb = Math.abs(sep - a.angle);
        if (orb <= a.orb + (a.angle === 60 ? 0 : lum)) out.push({ a: ps[i].body, b: ps[j].body, aspect: a.name, orb });
      }
    }
  return out.sort((x, y) => x.orb - y.orb);
}

export function westernReading(c: NatalChart, now = new Date()): ReadingSection[] {
  const p = (body: string) => c.western.planets.find((x) => x.body === body)!;
  const sun = p('Sun');
  const moon = p('Moon');
  const asc = c.western.ascendant;
  const sections: ReadingSection[] = [];

  // 1. The big three
  const big: ReadingItem[] = [
    { heading: `Sun in ${sun.sign}`, text: W.PLANET_IN_SIGN.Sun[sun.sign], basis: `Sun ${fmtDeg(sun.degree)} ${sun.sign}` },
    c.western.moonSign.certain
      ? { heading: `Moon in ${moon.sign}`, text: W.PLANET_IN_SIGN.Moon[moon.sign], basis: `Moon ${fmtDeg(moon.degree)} ${moon.sign}` }
      : {
          heading: `Moon in ${c.western.moonSign.options.join(' or ')}`,
          text: `Without a birth time the Moon could be in either sign. ${c.western.moonSign.options.map((s) => `In ${s}: ${W.PLANET_IN_SIGN.Moon[s]}`).join(' ')}`,
          basis: 'Moon changes sign during the birth day',
        },
  ];
  if (asc.certain) big.push({ heading: `${asc.value} rising`, text: W.RISING[asc.value!], basis: c.western.ascendantDegree !== null ? `Ascendant ${fmtDeg(c.western.ascendantDegree)} ${asc.value}` : 'Ascendant' });
  else if (asc.options.length) big.push({ heading: `Rising sign: ${asc.options.join(' or ')}`, text: asc.options.map((s) => `If ${s}: ${W.RISING[s]}`).join(' '), basis: 'Birth time window crosses a sign boundary' });
  else big.push({ heading: 'Rising sign not included', text: 'The rising sign changes about every two hours, so it needs a birth time. Add one in Settings if you can find it.' });
  sections.push({ id: 'w-big3', title: 'Your Sun, Moon, and rising sign', intro: 'The three most-read placements in Western astrology: who you are becoming (Sun), what you need (Moon), and how you meet the world (rising).', items: big });

  // 2. Planets in signs
  const inSigns: ReadingItem[] = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].map((b) => ({
    heading: `${b} in ${p(b).sign}${p(b).retrograde ? ' (retrograde)' : ''}`,
    text: `${b} describes ${W.PLANET_FUNCTION[b]}. ${W.PLANET_IN_SIGN[b][p(b).sign]}${p(b).retrograde ? ` Born with ${b} retrograde, these themes may turn inward first and be reworked over time.` : ''}`,
    basis: `${b} ${fmtDeg(p(b).degree)} ${p(b).sign}`,
  }));
  for (const b of ['Uranus', 'Neptune', 'Pluto']) {
    inSigns.push({ heading: `${b} in ${p(b).sign}`, text: `A generational placement shared with people born within a few years of you: ${W.PLANET_FUNCTION[b]}, colored by ${W.SIGN_KEYWORD[p(b).sign]}. It matters most personally through its house and aspects.`, basis: `${b} ${fmtDeg(p(b).degree)} ${p(b).sign}` });
  }
  const node = p('Node');
  inSigns.push({ heading: `North Node in ${node.sign}`, text: `The lunar nodes point to ${W.PLANET_FUNCTION.Node}: here, toward ${W.SIGN_KEYWORD[node.sign]}, away from the comfort of ${W.SIGN_KEYWORD[SIGNS[(SIGNS.indexOf(node.sign) + 6) % 12]]}.`, basis: `Mean node ${fmtDeg(node.degree)} ${node.sign}` });
  sections.push({ id: 'w-signs', title: 'Planets in signs', intro: 'Each planet is a part of you; its sign describes the style it works in.', items: inSigns });

  // 3. Houses and chart ruler
  if (c.western.houseSystem) {
    const items: ReadingItem[] = c.western.planets
      .filter((x) => x.house && x.body !== 'Node')
      .map((x) => ({ heading: `${x.body} in the ${W.HOUSE[x.house!].name.toLowerCase()}`, text: `${W.PLANET_FUNCTION[x.body].charAt(0).toUpperCase() + W.PLANET_FUNCTION[x.body].slice(1)} may play out most in ${W.HOUSE[x.house!].area}.`, basis: `Placidus house ${x.house}` }));
    const ruler = W.RULER[asc.value!];
    const r = p(ruler);
    items.unshift({
      heading: `Chart ruler: ${ruler}`,
      text: `With ${asc.value} rising, ${ruler} rules your chart${W.MODERN_RULER[asc.value!] ? ` (modern astrologers also look to ${W.MODERN_RULER[asc.value!]})` : ''}. It sits in ${r.sign}${r.house ? ` in the ${W.HOUSE[r.house].name.toLowerCase()}, so your life’s direction may gather around ${W.HOUSE[r.house].area}` : ''}.`,
      basis: `${ruler} rules ${asc.value}`,
    });
    sections.push({ id: 'w-houses', title: 'Houses: where it plays out', intro: 'Houses divide the sky at your birth moment into twelve life areas.', items });
  } else {
    sections.push({ id: 'w-houses', title: 'Houses: where it plays out', items: [{ heading: 'Not included', text: c.western.unavailable[0] ?? 'Houses need an exact birth time.' }] });
  }

  // 4. Aspects
  const asp = natalAspects(c).slice(0, 10);
  sections.push({
    id: 'w-aspects',
    title: 'Aspects: how the parts of you interact',
    intro: 'Aspects are angles between planets. Close ones (small orb) are felt most strongly.',
    items: asp.length
      ? asp.map((a) => ({
          heading: `${a.a} ${a.aspect} ${a.b}`,
          text: `${W.PAIR[`${a.a}-${a.b}`] ? `Connects ${W.PAIR[`${a.a}-${a.b}`]}` : `Connects ${W.PLANET_FUNCTION[a.a]} with ${W.PLANET_FUNCTION[a.b]}`}; these may ${W.ASPECT_MEANING[a.aspect]}.`,
          basis: `Orb ${fmtDeg(a.orb)}`,
        }))
      : [{ heading: 'Few close aspects', text: 'Your personal planets form few tight angles, which may let each part of you work fairly independently.' }],
  });

  // 5. Balance and lunar phase
  const counted = c.western.planets.filter((x) => PERSONAL.includes(x.body));
  const elements: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modes: Record<string, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const x of counted) {
    const w = x.body === 'Sun' || x.body === 'Moon' ? 2 : 1;
    elements[SIGN_ELEMENT[x.sign]] += w;
    modes[W.SIGN_MODALITY[x.sign]] += w;
  }
  const byCount = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const topMode = Object.entries(modes).sort((a, b) => b[1] - a[1])[0];
  const phaseAngle = norm(moon.longitude - sun.longitude);
  const phase = [...W.LUNAR_PHASE].reverse().find((x) => phaseAngle >= x.from)!;
  sections.push({
    id: 'w-balance',
    title: 'Temperament and lunar phase',
    items: [
      { heading: `Most emphasized element: ${byCount[0][0]}`, text: `Your chart leans toward ${W.ELEMENT_BALANCE[byCount[0][0]].strong}.`, basis: `Weighted count (Sun and Moon count double): ${byCount.map(([k, v]) => `${k} ${v}`).join(', ')}` },
      ...(byCount[3][1] === 0 ? [{ heading: `Little ${byCount[3][0]}`, text: `With no personal planets in ${byCount[3][0]} signs, ${W.ELEMENT_BALANCE[byCount[3][0]].weak}.` }] : []),
      { heading: `Most emphasized mode: ${topMode[0]}`, text: `You may be strongest at ${W.MODALITY_BALANCE[topMode[0]]}.`, basis: Object.entries(modes).map(([k, v]) => `${k} ${v}`).join(', ') },
      { heading: `Born at the ${phase.name}`, text: `The Moon was ${Math.round(phaseAngle)}° ahead of the Sun. This phase is often read as ${phase.meaning}.`, basis: 'Lunar phase (Rudhyar’s eight phases)' },
    ],
  });

  // 6. The sky now
  const nowItems: ReadingItem[] = currentTransits(c, now).map((t) => ({ heading: t, text: transitText(t), basis: 'Transit within 2°' }));
  const moonNow = SIGNS[Math.floor(tropicalLongitude('Moon', now) / 30)];
  nowItems.unshift({ heading: `The Moon today is in ${moonNow}`, text: `A two-to-three-day mood that touches everyone: a collective tone of ${W.SIGN_KEYWORD[moonNow]}. You and the people around you may feel it differently, depending on your own charts.`, basis: 'Transiting Moon' });
  const retro = BODIES.filter((b) => b !== 'Sun' && b !== 'Moon' && norm(tropicalLongitude(b, new Date(now.getTime() + 43200000)) - tropicalLongitude(b, new Date(now.getTime() - 43200000)) + 180) - 180 < 0);
  if (retro.length) nowItems.push({ heading: `Retrograde now: ${retro.join(', ')}`, text: `${retro.map((b) => `${b} (${W.PLANET_FUNCTION[b]})`).join('; ')}. Retrograde periods are traditionally read as times to review and revisit rather than launch.`, basis: 'Planets appearing to move backward from Earth' });
  sections.push({ id: 'w-now', title: 'The sky now, for you', intro: 'Where the planets are today, and which of them touch your birth chart.', items: nowItems });

  return sections;
}

function transitText(t: string): string {
  const m = t.match(/^(\w+) now (\w+) your (\w+)/);
  if (!m) return '';
  const theme: Record<string, string> = { Jupiter: 'growth and opportunity', Saturn: 'responsibility, limits, and maturing', Uranus: 'change and a wish for freedom', Neptune: 'sensitivity, ideals, and blurred lines', Pluto: 'deep change and questions of power' };
  const how: Record<string, string> = { conjunct: 'focuses directly on', square: 'presses on, asking for adjustment in', trine: 'supports', opposite: 'brings, often through other people, a need for balance in' };
  return `${m[1]}, associated with ${theme[m[1]]}, ${how[m[2]]} ${W.PLANET_FUNCTION[m[3]]}. Slow transits like this can last months; this is a theme, not an event.`;
}

// ─── Vedic ──────────────────────────────────────────────────────────────────

export function dignityOf(graha: string, sign: string, degree: number): V.Dignity | null {
  if (!V.FRIENDS[graha]) return null;
  if (V.EXALTATION[graha] === sign) return 'exalted';
  if (V.DEBILITATION[graha] === sign) return 'debilitated';
  const mt = V.MOOLATRIKONA[graha];
  if (mt && mt[0] === sign && degree >= mt[1] && degree < mt[2]) return 'moolatrikona';
  if (V.OWN[graha].includes(sign)) return 'own';
  const lord = V.RASHI_LORD[sign];
  if (V.FRIENDS[graha].friends.includes(lord)) return 'friend';
  if (V.FRIENDS[graha].enemies.includes(lord)) return 'enemy';
  return 'neutral';
}

export interface VedicExtras {
  yogas: string[];
  houseBasis: 'lagna' | 'moon';
}

export function vedicYogas(c: NatalChart): string[] {
  const g = (b: string) => c.vedic.planets.find((x) => x.body === b)!;
  const idx = (b: string) => SIGNS.indexOf(g(b).sign);
  const from = (a: number, b: number) => ((b - a + 12) % 12) + 1;
  const moon = idx('Moon');
  const yogas: string[] = [];
  if ([1, 4, 7, 10].includes(from(moon, idx('Jupiter')))) yogas.push('Gaja Kesari');
  if (idx('Sun') === idx('Mercury')) yogas.push('Budha-Aditya');
  if (idx('Moon') === idx('Mars')) yogas.push('Chandra-Mangala');
  if (c.vedic.lagna.certain) {
    const lagna = RASHIS.indexOf(c.vedic.lagna.value!);
    const pm: Record<string, string> = { Mars: 'Ruchaka', Mercury: 'Bhadra', Jupiter: 'Hamsa', Venus: 'Malavya', Saturn: 'Sasa' };
    for (const [b, name] of Object.entries(pm)) {
      const d = dignityOf(b, g(b).sign, g(b).degree);
      if ((d === 'exalted' || d === 'own' || d === 'moolatrikona') && [1, 4, 7, 10].includes(from(lagna, idx(b)))) yogas.push(name);
    }
  }
  const others = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const second = others.some((b) => from(moon, idx(b)) === 2);
  const twelfth = others.some((b) => from(moon, idx(b)) === 12);
  if (second && twelfth) yogas.push('Durudhara');
  else if (second) yogas.push('Sunapha');
  else if (twelfth) yogas.push('Anapha');
  // Kemadruma counts only the five tara grahas; the Sun and nodes don't cancel it here.
  else yogas.push('Kemadruma');
  return yogas;
}

export function vedicReading(c: NatalChart, birthDate: string, now = new Date()): ReadingSection[] {
  const g = (b: string) => c.vedic.planets.find((x) => x.body === b)!;
  const sections: ReadingSection[] = [];
  const lagnaKnown = c.vedic.lagna.certain;
  const baseIdx = lagnaKnown ? RASHIS.indexOf(c.vedic.lagna.value!) : c.vedic.moonRashi.certain ? SIGNS.indexOf(g('Moon').sign) : null;
  const houseFrom = (sign: string) => (baseIdx === null ? null : ((SIGNS.indexOf(sign) - baseIdx + 12) % 12) + 1);

  // 1. Lagna
  const lagnaItems: ReadingItem[] = [];
  if (lagnaKnown) {
    const sign = SIGNS[RASHIS.indexOf(c.vedic.lagna.value!)];
    const lord = V.RASHI_LORD[sign];
    const lordHouse = houseFrom(g(lord).sign)!;
    lagnaItems.push({ heading: `${c.vedic.lagna.value} lagna`, text: V.LAGNA[sign], basis: `Sidereal ascendant in ${c.vedic.lagna.value}` });
    lagnaItems.push({ heading: `Lagna lord ${lord} in the ${ord(lordHouse)} house`, text: `${V.LAGNA_LORD_IN[lordHouse]} ${lord} sits in ${g(lord).rashi}, ${V.DIGNITY_TEXT[dignityOf(lord, g(lord).sign, g(lord).degree) ?? 'neutral']}.`, basis: `${lord} rules ${c.vedic.lagna.value}` });
  } else {
    lagnaItems.push({
      heading: 'Lagna not included',
      text: c.vedic.lagna.options.length ? `Your lagna could be ${c.vedic.lagna.options.join(' or ')}. ${c.vedic.lagna.options.map((r) => V.LAGNA[SIGNS[RASHIS.indexOf(r)]]).join(' ')}` : 'The lagna needs a birth time. Following classical practice, the houses below are counted from your Moon (Chandra lagna) instead.',
    });
  }
  sections.push({ id: 'v-lagna', title: 'Lagna: your starting point', intro: 'In Jyotish the lagna is the root of the chart: houses are counted from it.', items: lagnaItems });

  // 2. Moon and nakshatra
  const moonItems: ReadingItem[] = [];
  const m = g('Moon');
  if (c.vedic.moonRashi.certain) {
    const d = dignityOf('Moon', m.sign, m.degree)!;
    moonItems.push({ heading: `Chandra in ${m.rashi}`, text: `The Moon is ${V.GRAHA.Moon.karaka}. Here it is ${V.DIGNITY_TEXT[d]}.`, basis: `Moon ${fmtDeg(m.degree)} ${m.rashi}` });
  } else {
    moonItems.push({ heading: `Chandra in ${c.vedic.moonRashi.options.join(' or ')}`, text: 'The Moon changes rashi during your birth day, so both are possible.' });
  }
  if (c.vedic.moonNakshatra.certain) {
    const n = c.vedic.nakshatra;
    const base = NAKSHATRA[n.name];
    const det = V.NAKSHATRA_DETAIL[n.name];
    moonItems.push({
      heading: `Janma nakshatra: ${n.name}, pada ${n.pada}`,
      text: `Your birth star. Its symbol is ${base.symbol} and its deity ${base.deity}; it is associated with ${base.theme}. Its nature is ${det.quality}. Ruled by ${n.lord}, with a ${V.GANA_TEXT[det.gana]} and the ${det.yoni} as its animal symbol (yoni).`,
      basis: `Moon ${fmtDeg(norm(m.longitude) % (360 / 27))} into ${n.name}`,
    });
  } else {
    moonItems.push({ heading: `Janma nakshatra: ${c.vedic.moonNakshatra.options.join(' or ')}`, text: c.vedic.moonNakshatra.options.map((x) => `${x}: ${NAKSHATRA[x].theme}`).join('; ') + '. A birth time would settle it.' });
  }
  const sunN = nakshatraOf(g('Sun').longitude);
  moonItems.push({ heading: `Sun’s nakshatra: ${sunN.name}`, text: `The Sun’s star colors your sense of purpose with ${NAKSHATRA[sunN.name].theme}.`, basis: `Sun in ${sunN.name} pada ${sunN.pada}` });
  sections.push({ id: 'v-moon', title: 'Chandra and the nakshatras', intro: 'Jyotish gives the Moon special weight: its rashi and nakshatra describe the mind and set the dashas.', items: moonItems });

  // 3. Grahas
  const grahaItems: ReadingItem[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].map((b) => {
    const x = g(b);
    const d = dignityOf(b, x.sign, x.degree);
    const h = houseFrom(x.sign);
    return {
      heading: `${b} in ${x.rashi}${h ? `, ${ord(h)} house` : ''}`,
      text: `${b} is ${V.GRAHA[b].nature}, signifying ${V.GRAHA[b].karaka}.${d ? ` Here it is ${V.DIGNITY_TEXT[d]}.` : ''}${h ? ` In the ${V.BHAVA[h].name} it may act on ${V.BHAVA[h].area}.` : ''}${x.retrograde && !['Rahu', 'Ketu'].includes(b) ? ' Retrograde (vakri), classically read as strong but unconventional in expression.' : ''}`,
      basis: `${fmtDeg(x.degree)} ${x.rashi}${d ? ` · ${d}` : ''}${h ? ` · house from ${lagnaKnown ? 'lagna' : 'Moon'}` : ''}`,
    };
  });
  sections.push({ id: 'v-grahas', title: 'The nine grahas', intro: lagnaKnown ? 'Houses are whole-sign houses counted from your lagna.' : 'Without a lagna, houses are counted from your Moon (Chandra lagna).', items: grahaItems });

  // 4. Yogas
  const yogas = vedicYogas(c);
  sections.push({ id: 'v-yogas', title: 'Yogas', intro: 'Yogas are classical combinations. Texts list hundreds; these are some of the most widely cited.', items: yogas.map((y) => ({ heading: `${y} yoga`, text: V.YOGA_TEXT[y], basis: 'Classical rule, checked against your placements' })) });

  // 5. Dashas
  const cur = c.vedic.current;
  const dashaItems: ReadingItem[] = [];
  if (cur) {
    const maha = g(cur.maha.lord);
    const mh = houseFrom(maha.sign);
    dashaItems.push({ heading: `${cur.maha.lord} mahadasha`, text: `Traditionally ${V.DASHA_DETAIL[cur.maha.lord]}. In your chart ${cur.maha.lord} sits in ${maha.rashi}${mh ? ` in the ${ord(mh)} house, so these themes may show up through ${V.BHAVA[mh].area}` : ''}.`, basis: `${cur.maha.start.getUTCFullYear()}–${cur.maha.end.getUTCFullYear()}` });
    const antar = g(cur.antar.lord);
    const ah = houseFrom(antar.sign);
    dashaItems.push({ heading: `${cur.antar.lord} antardasha`, text: `Within it, a sub-period that may add ${V.DASHA_DETAIL[cur.antar.lord].replace(/^a period that may (bring |emphasize |support |ask for )?/, '')}${ah ? `, through ${V.BHAVA[ah].area}` : ''}.`, basis: `Until ${cur.antar.end.toISOString().slice(0, 10)}` });
    const next = antardashas(cur.maha).find((x) => x.start >= cur.antar.end);
    if (next) dashaItems.push({ heading: `Next: ${next.lord} antardasha`, text: `From ${next.start.toISOString().slice(0, 7)}: ${V.DASHA_DETAIL[next.lord]}.` });
  } else {
    dashaItems.push({ heading: 'Current dasha not included', text: c.vedic.unavailable.find((u) => /dasha/i.test(u)) ?? 'The dasha depends on the Moon’s exact position, which needs a birth time.' });
  }
  sections.push({ id: 'v-dasha', title: 'Vimshottari dasha: your timing', intro: 'The 120-year dasha cycle, set by your Moon’s nakshatra, divides life into chapters ruled by each graha.', items: dashaItems });

  // 6. Birth panchang
  const tithiAngle = norm(g('Moon').longitude - g('Sun').longitude);
  const t = Math.floor(tithiAngle / 12);
  const paksha = t < 15 ? 'Shukla paksha (waxing)' : 'Krishna paksha (waning)';
  const tithiName = t === 14 ? 'Purnima (full Moon)' : t === 29 ? 'Amavasya (new Moon)' : V.TITHI_NAMES[t % 15];
  const [y, mo, d] = birthDate.split('-').map(Number);
  const vara = V.VARA[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  sections.push({
    id: 'v-panchang',
    title: 'Panchang at birth',
    intro: 'The traditional Hindu calendar elements of your birth day.',
    items: [
      { heading: `Tithi: ${tithiName}`, text: `Born in ${paksha}, on the ${ord((t % 15) + 1)} lunar day. Tithis are counted by every 12° the Moon moves ahead of the Sun.`, basis: `Moon ${Math.round(tithiAngle)}° from the Sun` },
      { heading: `Vara: ${vara.name}`, text: `The weekday ruled by ${vara.lord}, ${V.GRAHA[vara.lord].nature}. (The Vedic day begins at sunrise, so a birth before dawn belongs to the previous vara.)`, basis: 'Local birth date' },
    ],
  });

  // 7. Sky now
  const ay = lahiriAyanamsa(now);
  const sid = (b: (typeof BODIES)[number]) => norm(tropicalLongitude(b, now) - ay);
  const satSign = SIGNS[Math.floor(sid('Saturn') / 30)];
  const jupSign = SIGNS[Math.floor(sid('Jupiter') / 30)];
  const moonNow = Math.floor(sid('Moon') / 30);
  const nowItems: ReadingItem[] = [{ heading: `Chandra today in ${RASHIS[moonNow]}`, text: `The Moon’s rashi colors the day for everyone; today’s nakshatra is ${nakshatraOf(sid('Moon')).name}, associated with ${NAKSHATRA[nakshatraOf(sid('Moon')).name].theme}.`, basis: 'Transiting Moon (gochara)' }];
  if (c.vedic.moonRashi.certain) {
    const natalMoon = SIGNS.indexOf(g('Moon').sign);
    const satFromMoon = ((SIGNS.indexOf(satSign) - natalMoon + 12) % 12) + 1;
    const jupFromMoon = ((SIGNS.indexOf(jupSign) - natalMoon + 12) % 12) + 1;
    nowItems.push({ heading: `Saturn transiting your ${ord(satFromMoon)} from the Moon`, text: [12, 1, 2].includes(satFromMoon) ? `This is Sade Sati, the roughly seven-and-a-half years when Saturn passes the 12th, 1st, and 2nd from your Moon. Tradition reads it as a time of responsibility, pressure, and maturing; many people also describe it as a time of building something lasting.` : satFromMoon === 8 ? 'Saturn in the 8th from the Moon (ashtama Shani) is traditionally a time to be patient and careful with commitments.' : `Saturn is in ${RASHIS[SIGNS.indexOf(satSign)]}, the ${ord(satFromMoon)} from your Moon, a slow influence on ${V.BHAVA[satFromMoon].area}.`, basis: `Gochara Saturn in ${RASHIS[SIGNS.indexOf(satSign)]}` });
    nowItems.push({ heading: `Jupiter transiting your ${ord(jupFromMoon)} from the Moon`, text: `Jupiter in the ${ord(jupFromMoon)} from your Moon may bring growth and support around ${V.BHAVA[jupFromMoon].area}${[2, 5, 7, 9, 11].includes(jupFromMoon) ? '; classically this is considered a favorable transit' : ''}.`, basis: `Gochara Jupiter in ${RASHIS[SIGNS.indexOf(jupSign)]}` });
  }
  sections.push({ id: 'v-now', title: 'Gochara: the sky now, for you', intro: 'Transits in Jyotish are read from your Moon sign.', items: nowItems });

  return sections;
}

export const READING_VERSION = `full-reading.${LIBRARY_VERSION}`;

/** Short notes about the current sky for this person, used as answer ideas when they ask about the sky. */
export function skyNotes(c: NatalChart, now = new Date()): string[] {
  const notes = currentTransits(c, now)
    .slice(0, 3)
    .map((t) => `${t.replace(/ \(orb.*\)$/, '').replace(' now ', ' is ')}.`);
  if (c.vedic.current) notes.push(`My ${c.vedic.current.maha.lord}–${c.vedic.current.antar.lord} dasha period.`);
  notes.push(`The Moon in ${SIGNS[Math.floor(tropicalLongitude('Moon', now) / 30)]} today.`);
  return notes;
}
