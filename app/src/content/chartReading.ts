/**
 * Chart placement tables (free, both traditions) and the predictive sections of the
 * subscriber Timing tab: secondary progressions, solar arcs, the year ahead, and the solar return.
 */
import { nakshatraOf, placidusCusps, SIGNS } from '../astro/chart';
import { allAspects, houseRulers, vargas } from '../astro/deep';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { progressions, solarArc, solarReturn, westernDignity, yearAhead } from '../astro/progressions';
import { dignityOf, type ReadingItem, type ReadingSection } from './fullReading';
import * as P from './progressions';
import * as W from './western';

interface Place {
  lat: number;
  lon: number;
}

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const fmtMonth = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const signOf = (lon: number) => SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
const at = (lon: number) => `${fmtDeg(lon % 30)} ${signOf(lon)}`;
const GLYPH: Record<string, string> = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Node: '☊', Rahu: '☊', Ketu: '☋' };
const THEME: Record<string, string> = { ...W.PLANET_FUNCTION, Ascendant: 'how you meet the world', Midheaven: 'your direction and public life' };

// ─── Placement tables ─────────────────────────────────────────────────────────

export function westernPlacements(c: NatalChart, place: Place): ReadingSection {
  const exact = c.timePrecision === 'exact';
  const cusps = exact ? placidusCusps(c.utc, place.lat, place.lon) : null;
  const rows = c.western.planets.map((p) => [
    `${GLYPH[p.body] ?? ''} ${p.body === 'Node' ? 'North Node' : p.body}`,
    p.sign,
    fmtDeg(p.degree),
    p.house ? ord(p.house) : '—',
    p.retrograde ? 'Retrograde ℞' : 'Direct',
    (p.body !== 'Node' && westernDignity(p.body, p.sign)) || '—',
  ]);
  const tables: NonNullable<ReadingSection['tables']> = [{ caption: 'Planets', columns: ['Planet', 'Sign', 'Degree', 'House', 'Motion', 'Dignity'], rows }];
  if (cusps && c.western.ascendantDegree !== null) {
    const asc = cusps[0];
    const mc = cusps[9];
    tables.push({
      caption: 'Angles',
      columns: ['Angle', 'Position', 'Read as'],
      rows: [
        ['Ascendant (AC)', at(asc), 'how you meet the world'],
        ['Descendant (DC)', at(asc + 180), 'what you seek in partners'],
        ['Midheaven (MC)', at(mc), 'direction and public life'],
        ['Imum Coeli (IC)', at(mc + 180), 'roots and private life'],
      ],
    });
    const rulers = houseRulers(c, place.lat, place.lon);
    tables.push({
      caption: 'House cusps (Placidus) and their rulers',
      columns: ['House', 'Cusp', 'Ruler', 'Ruler sits in'],
      rows: cusps.map((cusp, i) => [ord(i + 1), at(cusp), rulers[i]?.ruler ?? '—', rulers[i] ? `${ord(rulers[i].rulerHouse)} house` : '—']),
    });
  }
  const asp = allAspects(c);
  tables.push({
    caption: 'Aspects between planets',
    columns: ['Planet', 'Aspect', 'Planet', 'Orb'],
    rows: asp.map((a) => [a.a, a.aspect, a.b, fmtDeg(a.orb)]),
  });
  const notes: ReadingItem[] = c.western.unavailable.map((u) => ({ heading: 'Not included', text: u }));
  return {
    id: 'w-table',
    title: 'Your chart, placement by placement',
    intro: `Tropical zodiac${cusps ? ', Placidus houses' : ''}, true positions calculated on this device. Dignity is the traditional strength of a planet in its sign: domicile (its own sign), exaltation, detriment, or fall.`,
    items: notes,
    tables,
  };
}

export function vedicPlacements(c: NatalChart): ReadingSection {
  const v = vargas(c);
  const rows = c.vedic.planets.map((p) => {
    const n = nakshatraOf(p.longitude);
    const d = dignityOf(p.body, p.sign, p.degree);
    return [
      `${GLYPH[p.body] ?? ''} ${p.body}`,
      `${p.rashi} (${p.sign})`,
      fmtDeg(p.degree),
      `${n.name} ${n.pada}`,
      n.lord,
      p.house ? ord(p.house) : '—',
      v.grahas.find((g) => g.body === p.body)?.d9 ?? '—',
      d ? d.charAt(0).toUpperCase() + d.slice(1) : '—',
    ];
  });
  if (c.vedic.lagna.certain && c.vedic.lagnaLongitude !== null) {
    const n = nakshatraOf(c.vedic.lagnaLongitude);
    rows.unshift(['Lagna', `${c.vedic.lagna.value} (${signOf(c.vedic.lagnaLongitude)})`, fmtDeg(c.vedic.lagnaLongitude % 30), `${n.name} ${n.pada}`, n.lord, '1st', v.d9Lagna ?? '—', '—']);
  }
  const notes: ReadingItem[] = c.vedic.unavailable.map((u) => ({ heading: 'Not included', text: u }));
  return {
    id: 'v-table',
    title: 'Your chart, graha by graha',
    intro: `Sidereal zodiac, Lahiri ayanamsa ${fmtDeg(c.vedic.ayanamsa)}, whole-sign bhavas counted from the lagna. Nakshatra shows the lunar mansion and its pada (quarter); the navamsa (D9) column shows each graha’s sign in the ninth-harmonic chart.`,
    items: notes,
    tables: [{ caption: 'Grahas', columns: ['Graha', 'Rashi', 'Degree', 'Nakshatra', 'Nakshatra lord', 'Bhava', 'Navamsa', 'Dignity'], rows }],
  };
}

// ─── Predictive sections for the Timing tab ───────────────────────────────────

const phaseName = (angle: number) => [...W.LUNAR_PHASE].reverse().find((p) => angle >= p.from)!.name;

export function progressionSections(c: NatalChart, place: Place, now = new Date()): ReadingSection[] {
  const out: ReadingSection[] = [];
  const pr = progressions(c, place.lat, place.lon, now);
  const by = (b: string) => pr.planets.find((p) => p.body === b)!;

  // Secondary progressions.
  const items: ReadingItem[] = [];
  const moon = by('Moon');
  items.push({
    heading: `Progressed Moon in ${moon.sign}${moon.house ? `, your ${ord(moon.house)} house` : ''}`,
    text: `${P.PROGRESSED_MOON_SIGN[moon.sign]}${moon.house ? ` ${P.PROGRESSED_MOON_HOUSE[moon.house]}` : ''}${pr.moon.nextIngress ? ` The progressed Moon moves into ${pr.moon.nextSign} around ${fmtMonth(pr.moon.nextIngress)}.` : ''}`,
    basis: `Progressed Moon ${fmtDeg(moon.degree)} ${moon.sign}${pr.moon.enteredOn ? `, in this sign since ${fmtMonth(pr.moon.enteredOn)}` : ''}`,
  });
  const phase = phaseName(pr.phase.angle);
  items.push({
    heading: `Progressed lunar phase: ${phase}`,
    text: `${P.PROGRESSED_PHASE[phase]}${pr.phase.lastNewMoon ? ` Your last progressed New Moon was around ${fmtMonth(pr.phase.lastNewMoon)}.` : ''}`,
    basis: `Progressed Moon ${Math.round(pr.phase.angle)}° ahead of the progressed Sun`,
  });
  const sun = by('Sun');
  items.push({
    heading: `Progressed Sun in ${sun.sign}${sun.house ? `, your ${ord(sun.house)} house` : ''}`,
    text: sun.sign === sun.natalSign ? `Your progressed Sun is still in your birth sign, ${sun.sign}. ${P.PROGRESSED_SUN_SIGN[sun.sign]}` : `Your progressed Sun has moved from ${sun.natalSign} into ${sun.sign}. ${P.PROGRESSED_SUN_SIGN[sun.sign]}`,
    basis: `Progressed Sun ${fmtDeg(sun.degree)} ${sun.sign}`,
  });
  for (const b of ['Mercury', 'Venus', 'Mars'] as const) {
    const p = by(b);
    items.push({
      heading: `Progressed ${b} in ${p.sign}${p.retrograde ? ' (retrograde)' : ''}${p.house ? `, your ${ord(p.house)} house` : ''}`,
      text: `${b} describes ${W.PLANET_FUNCTION[b]}. ${p.sign === p.natalSign ? `It is still in its birth sign, ${p.sign}: ${W.PLANET_IN_SIGN[b][p.sign]}` : `It has moved from ${p.natalSign} into ${p.sign}, which may add this: ${W.PLANET_IN_SIGN[b][p.sign]}`}${p.retrograde ? ' Progressed retrograde motion is read as a long inward review of these themes.' : ''}`,
      basis: `Progressed ${b} ${fmtDeg(p.degree)} ${p.sign}`,
    });
  }
  for (const ing of pr.ingresses.filter((x) => x.date >= now.toISOString().slice(0, 10)).slice(0, 3))
    items.push({ heading: `${fmtMonth(ing.date)}: progressed ${ing.body} enters ${ing.sign}`, text: P.PROGRESSED_PLANET_INGRESS[ing.body], basis: 'Progressed ingress' });
  out.push({ id: 't-progressed', title: 'Your progressed chart', intro: `${P.PROGRESSION_INTRO} You are ${Math.floor(pr.age)}, so your progressed chart is the sky ${Math.floor(pr.age)} days after you were born.`, items, tables: [{ caption: 'Progressed positions now', columns: ['Planet', 'Natal', 'Progressed', 'House'], rows: pr.planets.map((p) => [p.body, `${fmtDeg(c.western.planets.find((n) => n.body === p.body)!.degree)} ${p.natalSign}`, `${fmtDeg(p.degree)} ${p.sign}${p.retrograde ? ' ℞' : ''}`, p.house ? ord(p.house) : '—']) }] });

  out.push({
    id: 't-prog-contacts',
    title: 'Progressed contacts to your birth chart',
    intro: 'When a progressed planet reaches an exact aspect to a birth planet, astrologers read a period of a year or so when the two themes meet. The progressed Moon’s contacts last about a month each.',
    items: pr.contacts.length
      ? pr.contacts.slice(0, 12).map((x) => ({
          heading: `${x.exact ? `${fmtMonth(x.exact)}: ` : ''}progressed ${x.progressed} ${x.aspect} natal ${x.natal}`,
          text: `Your progressed ${x.progressed}, ${THEME[x.progressed]}, ${P.CONTACT_HOW[x.aspect]} ${THEME[x.natal]}.`,
          basis: x.exact ? `Exact around ${fmtMonth(x.exact)}` : `Within ${fmtDeg(x.orbNow)} now, ${x.applying ? 'applying' : 'separating'}`,
        }))
      : [{ heading: 'No close contacts', text: 'No progressed planet is within a degree of a birth planet in this window. Progressions often go quiet for a year or two between contacts.' }],
  });

  // Solar arc directions.
  const sa = solarArc(c, place.lat, place.lon, now);
  out.push({
    id: 't-solar-arc',
    title: 'Solar arc directions',
    intro: `${P.SOLAR_ARC_INTRO} Your current arc is ${fmtDeg(sa.arc)}.`,
    items: sa.contacts.length
      ? sa.contacts.slice(0, 10).map((x) => ({
          heading: `${x.exact ? `${fmtMonth(x.exact)}: ` : ''}directed ${x.directed} ${x.aspect} natal ${x.natal}`,
          text: `Directed ${x.directed}, ${THEME[x.directed]}, ${P.CONTACT_HOW[x.aspect]} ${THEME[x.natal]}.`,
          basis: x.exact ? `Exact around ${fmtMonth(x.exact)}` : `Within ${fmtDeg(x.orbNow)} now`,
        }))
      : [{ heading: 'No exact arcs in the next two years', text: 'None of your directed points reaches a hard aspect to a birth point in this window.' }],
  });

  // The year ahead.
  const ya = yearAhead(c, place.lat, place.lon, now);
  out.push({
    id: 't-year',
    title: 'The year ahead: Jupiter to Pluto',
    intro: P.YEAR_AHEAD_INTRO,
    items: ya.length
      ? ya.slice(0, 20).map((w) => ({
          heading: `${fmtDate(w.start)} – ${fmtDate(w.end)}: ${w.transiting} ${w.aspect} your ${w.natal}`,
          text: P.SLOW_TRANSIT[w.transiting][w.aspect].replace('{target}', `your ${w.natal} (${THEME[w.natal]})`),
          basis: `Closest ${w.exact.map((d) => fmtDate(d)).join(', ')}${w.exact.length > 1 ? ' (retrograde passes)' : ''}`,
        }))
      : [{ heading: 'A quieter year', text: 'The slow planets make no close contacts to your birth chart in the next twelve months.' }],
  });

  // Solar return.
  const sr = solarReturn(c, place.lat, place.lon, now);
  out.push({
    id: 't-solar-return',
    title: 'Your solar return',
    intro: P.SOLAR_RETURN_INTRO,
    items: sr
      ? [
          { heading: `${sr.ascendant} rising for this birthday year`, text: P.SR_ASCENDANT[sr.ascendant], basis: `Solar return ${new Date(sr.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC, Ascendant ${fmtDeg(sr.ascDegree)} ${sr.ascendant}` },
          ...(sr.sunHouse ? [{ heading: `Return Sun in the ${ord(sr.sunHouse)} house`, text: P.SR_SUN_HOUSE[sr.sunHouse], basis: 'Solar return house of the Sun' }] : []),
          { heading: `Return Moon in ${sr.moonSign}${sr.moonHouse ? `, ${ord(sr.moonHouse)} house` : ''}`, text: `The Moon describes the year’s emotional weather. In ${sr.moonSign}: ${W.PLANET_IN_SIGN.Moon[sr.moonSign]}`, basis: 'Solar return Moon' },
          ...(sr.ascInNatalHouse ? [{ heading: `Return Ascendant in your natal ${ord(sr.ascInNatalHouse)} house`, text: `Tradition reads this as the year’s starting point falling in the area of ${W.HOUSE[sr.ascInNatalHouse].area}.`, basis: 'Solar return Ascendant in the birth chart' }] : []),
        ]
      : [{ heading: 'Not included', text: 'A solar return needs an exact birth time, because the return moment shifts with the Sun’s exact birth degree.' }],
  });
  return out;
}
