/**
 * The week ahead, planet by planet: words for src/astro/week.ts. Each planet gets a heading, the house
 * it is moving through, and every dated contact it makes to the birth chart; New and Full Moons get
 * their exact degree, house, and the birth points they touch. When the person has told us what is on
 * their mind, the matching houses are tied back to it.
 */
import { SIGNS } from '../astro/chart';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { weekAhead, type MoverWeek, type WeekAspect, type WeekLunation } from '../astro/week';
import type { ReadingItem, ReadingSection } from './fullReading';
import { AREAS, TARGET_AREAS, type Area, type Profile } from './mirror';
import * as D from './deep';
import * as W from './western';

/** What each moving planet is about this week, used in its heading. */
export const WEEK_MOVER: Record<string, string> = {
  Sun: 'attention, and where your energy goes',
  Mercury: 'thinking, talking, and deciding',
  Venus: 'closeness, pleasure, and what you value',
  Mars: 'desire, and the courage to act',
  Jupiter: 'growth, trust, and saying yes',
  Saturn: 'commitment, patience, and building',
  Uranus: 'change, and the wish for room',
  Neptune: 'imagination, longing, and blurred edges',
  Pluto: 'depth, power, and letting something change',
};

/** How each moving planet meets a birth point, by aspect. */
export const WEEK_CONTACT: Record<string, Record<WeekAspect, string>> = {
  Sun: {
    conjunct: 'The Sun shines directly on this part of you, so it is easier to see and harder to ignore.',
    sextile: 'The Sun offers a small, friendly opening here, if you take it.',
    square: 'The Sun puts some pressure here: what you want this week and this part of you may pull in different directions.',
    trine: 'The Sun lends warmth and ease here; things in this area may come more naturally.',
    opposite: 'The Sun lights this up from across the chart, often through other people and what they ask of you.',
  },
  Mercury: {
    conjunct: 'Mercury brings this into words: a good day to name it, write it down, or talk it through.',
    sextile: 'Mercury makes conversations about this a little easier.',
    square: 'Mercury can bring crossed wires here; check what you meant and what was heard.',
    trine: 'Mercury helps thoughts about this flow; a good moment for a clear message.',
    opposite: 'Mercury brings someone else’s view of this to you, sometimes as a disagreement worth listening to.',
  },
  Venus: {
    conjunct: 'Venus softens this part of you and makes it easier to enjoy, share, and receive.',
    sextile: 'Venus opens a door here for warmth, kindness, or a small pleasure.',
    square: 'Venus asks what you value here, and whether wanting and having are the same thing.',
    trine: 'Venus brings ease and goodwill here; let things be pleasant.',
    opposite: 'Venus brings this into your relationships, where it can be mirrored back to you.',
  },
  Mars: {
    conjunct: 'Mars brings heat and urgency here; energy is high, and so is impatience.',
    sextile: 'Mars gives you a push here; a good moment to start, ask, or move.',
    square: 'Mars adds friction here. Use the energy to act on something rather than to argue.',
    trine: 'Mars brings steady, usable energy here; effort may go further than usual.',
    opposite: 'Mars brings this out through other people, sometimes as a clash, sometimes as a spark.',
  },
  Jupiter: {
    conjunct: 'Jupiter widens this part of your life and invites you to trust it more.',
    sextile: 'Jupiter offers an opening here; it tends to reward the person who reaches for it.',
    square: 'Jupiter can overdo things here; growth is possible, with some proportion.',
    trine: 'Jupiter supports this part of you; a generous, encouraging contact.',
    opposite: 'Jupiter brings growth here through other people, offers, and perspectives.',
  },
  Saturn: {
    conjunct: 'Saturn asks you to take this part of you seriously and build something lasting from it.',
    sextile: 'Saturn offers steady support here, if you put in the work.',
    square: 'Saturn presses here; limits show up, and so does what is worth committing to.',
    trine: 'Saturn steadies this part of you; often one of the most grounding contacts of the week.',
    opposite: 'Saturn brings responsibilities here through other people and agreements.',
  },
  Uranus: {
    conjunct: 'Uranus brings the unexpected here, and a strong wish for room to change.',
    sextile: 'Uranus opens a small window here for something new.',
    square: 'Uranus unsettles this part of you, which can loosen what has become too tight.',
    trine: 'Uranus brings fresh ideas here with less disruption than usual.',
    opposite: 'Uranus brings change here through other people or sudden news.',
  },
  Neptune: {
    conjunct: 'Neptune softens the edges here; imagination and compassion rise, and so can confusion.',
    sextile: 'Neptune lends inspiration here; a good time for art, music, or quiet.',
    square: 'Neptune blurs this part of you; check facts before acting on a feeling.',
    trine: 'Neptune brings gentleness and intuition here.',
    opposite: 'Neptune brings this to you through others, where it is easy to idealize or be idealized.',
  },
  Pluto: {
    conjunct: 'Pluto takes this part of you deep; something here may be ready to change at the root.',
    sextile: 'Pluto offers quiet strength here, and a chance to go deeper.',
    square: 'Pluto applies pressure here; what you hold too tightly may ask to be loosened.',
    trine: 'Pluto supports deep, lasting change here without much drama.',
    opposite: 'Pluto brings questions of power here through other people.',
  },
};

/** The birth points a contact can reach that are not planets. */
export const WEEK_TARGET: Record<string, string> = {
  'North Node': 'your direction of growth, the less familiar path that pulls you forward',
  Ascendant: 'how you meet the world, your body, and first impressions',
  Midheaven: 'your direction, career, and public life',
};

/** Short names for houses and birth points, used to name what a lunation brings together. */
export const WEEK_HOUSE_SHORT: Record<number, string> = {
  1: 'self and body',
  2: 'money and worth',
  3: 'everyday talk',
  4: 'home and family',
  5: 'play and romance',
  6: 'work and health',
  7: 'partnership',
  8: 'intimacy and shared resources',
  9: 'beliefs and the bigger picture',
  10: 'career and public life',
  11: 'friends and the future',
  12: 'rest and the inner life',
};
export const WEEK_POINT_SHORT: Record<string, string> = {
  Sun: 'identity and vitality',
  Moon: 'emotional needs',
  Mercury: 'thinking and talking',
  Venus: 'love and values',
  Mars: 'drive and desire',
  Jupiter: 'growth and trust',
  Saturn: 'duty and structure',
  Uranus: 'freedom',
  Neptune: 'ideals and imagination',
  Pluto: 'power and change',
  'North Node': 'your direction of growth',
  Ascendant: 'how you show up',
  Midheaven: 'your public direction',
};

/** What a New or Full Moon does to a birth point, by kind of aspect. */
export const WEEK_LUNATION_ASPECT: Record<'New Moon' | 'Full Moon', Record<'meet' | 'ease' | 'tension', string>> = {
  'New Moon': {
    meet: 'A New Moon on a birth point is a fresh start for what that point stands for.',
    ease: 'This New Moon supports a beginning that both sides of you can agree on.',
    tension: 'This New Moon starts something that pulls against an older need; the two may want to be balanced rather than chosen between.',
  },
  'Full Moon': {
    meet: 'A Full Moon on a birth point brings it into full view; feelings about it may be strong.',
    ease: 'This Full Moon brings things to light gently; a good time to see how far you have come.',
    tension: 'This Full Moon highlights a tension that has been building; seeing it clearly is the first step.',
  },
};

/** Lines that tie a planet's house this week back to what the person said is on their mind. */
export const WEEK_FOCUS: Record<Area, string> = {
  love: 'You said love and relationships are on your mind, and this week’s sky lands right there.',
  work: 'You said work is on your mind, and this week’s sky lands right there.',
  family: 'You said family and home are on your mind, and this week’s sky lands right there.',
  health: 'You said your body and energy are on your mind, and this week’s sky lands right there.',
  money: 'You said money and security are on your mind, and this week’s sky lands right there.',
  creativity: 'You said creativity is on your mind, and this week’s sky lands right there.',
  friends: 'You said friends and community are on your mind, and this week’s sky lands right there.',
  purpose: 'You said meaning and direction are on your mind, and this week’s sky lands right there.',
};

/** Stations for the outer planets, which the monthly station library does not cover. */
export const WEEK_STATION: Record<string, Record<'retrograde' | 'direct', string>> = {
  Uranus: {
    retrograde: 'The urge for change turns inward; a time to notice where you want more room before making a move.',
    direct: 'Change that has been brewing inside may start to show on the outside.',
  },
  Neptune: {
    retrograde: 'Illusions may thin; a time to see a situation or a person more clearly.',
    direct: 'Imagination and longing flow outward again; a good time to put a dream into some form.',
  },
  Pluto: {
    retrograde: 'Deep change goes underground for a while; a time to look honestly at what you hold onto.',
    direct: 'Something that has been changing under the surface may start to move in the open.',
  },
};

export const WEEK_TEXT = {
  intro:
    'Every contact the planets make to your birth chart in the next ten days, planet by planet, on the day each is closest. Fast planets (Sun, Mercury, Venus, Mars) pass in a day or two; slow planets work on the same point for weeks, and the date is the closest pass.',
  quiet: 'A quieter week: no planet reaches an exact contact with your birth chart in the next ten days.',
  slow: 'This is one pass of a contact that lasts weeks, so its themes may already be familiar.',
  today: 'This is exact today.',
  noHouse: 'Houses need an exact birth time, so this week’s reading leaves them out.',
};

// Houses that speak to each life area, for the tie-back to what the person said.
const HOUSE_AREA: Record<number, Area> = { 1: 'health', 2: 'money', 3: 'friends', 4: 'family', 5: 'creativity', 6: 'health', 7: 'love', 8: 'money', 9: 'purpose', 10: 'work', 11: 'friends', 12: 'purpose' };

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const at = (lon: number) => `${fmtDeg(((lon % 30) + 30) % 30)} ${SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)]}`;
const SLOW = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const pointMeaning = (name: string) => WEEK_TARGET[name] ?? W.PLANET_FUNCTION[name];
const named = (m: string) => (m === 'Sun' ? 'The Sun' : m);
const orbText = (orb: number) => (orb < 1 / 60 ? 'Exact' : `Within ${fmtDeg(orb)}`);
const stationText = (m: string, turns: 'retrograde' | 'direct') => {
  const d = D.STATION_TEXT[m]?.[turns];
  return d ? `${d.charAt(0).toUpperCase()}${d.slice(1)}.` : WEEK_STATION[m]?.[turns];
};
const aspectClass = (a: WeekAspect) => (a === 'conjunct' ? 'meet' : a === 'sextile' || a === 'trine' ? 'ease' : 'tension');

function moverSection(m: MoverWeek, today: string): ReadingSection {
  const intro: string[] = [];
  if (m.house) intro.push(`${named(m.mover)} is moving through your ${ord(m.house)} house, ${W.HOUSE[m.house].area}.`);
  if (m.retrograde && !m.station) intro.push(`${m.mover} is retrograde, so its themes turn inward and toward review.`);
  const items: ReadingItem[] = m.contacts.map((x) => ({
    heading: `${x.date === today ? 'Today' : fmtDate(x.date)}: ${m.mover} ${x.aspect} your ${x.natal}`,
    text: `${WEEK_CONTACT[m.mover][x.aspect]} Your ${x.natal} stands for ${pointMeaning(x.natal)}.${SLOW.includes(m.mover) ? ` ${WEEK_TEXT.slow}` : ''}${x.date === today ? ` ${WEEK_TEXT.today}` : ''}`,
    basis: `${orbText(x.orb)} · your ${x.natal} at ${at(x.natalLon)}`,
  }));
  const st = m.station && stationText(m.mover, m.station.turns);
  if (m.station && st) items.push({ heading: `${fmtDate(m.station.date)}: ${m.mover} turns ${m.station.turns}`, text: st, basis: 'Station (apparent change of direction)' });
  if (m.ingress) items.push({ heading: `${fmtDate(m.ingress.date)}: ${m.mover} enters ${m.ingress.sign}`, text: `The tone shifts toward ${W.SIGN_KEYWORD[m.ingress.sign] ?? m.ingress.sign}.`, basis: 'Sign change' });
  return {
    id: `w-${m.mover.toLowerCase()}`,
    title: `${m.mover} in ${m.sign}${m.retrograde ? ' (retrograde)' : ''}: ${WEEK_MOVER[m.mover]}`,
    intro: intro.join(' ') || undefined,
    items,
  };
}

function lunationItem(l: WeekLunation): ReadingItem {
  const parts = [`${D.LUNATION_TEXT[l.kind].charAt(0).toUpperCase()}${D.LUNATION_TEXT[l.kind].slice(1)}${l.house ? `, around ${W.HOUSE[l.house].area}` : ''}.`];
  // The closest few contacts, each with its theme, then one line per kind of contact.
  const here = l.house ? WEEK_HOUSE_SHORT[l.house] : `${l.sign} themes`;
  const close = l.aspects.filter((a, i) => i === 0 || a.orb < 2).slice(0, 3);
  for (const a of close) {
    const cls = aspectClass(a.aspect);
    const theme = cls === 'tension' ? `${here} versus ${WEEK_POINT_SHORT[a.natal]}` : cls === 'ease' ? `${here} working with ${WEEK_POINT_SHORT[a.natal]}` : `a fresh start for ${WEEK_POINT_SHORT[a.natal]}`;
    parts.push(`It is ${a.aspect} your ${a.natal} (${at(a.natalLon)}), ${a.orb < 1 / 60 ? 'exactly' : `within ${fmtDeg(a.orb)}`}: ${theme}.`);
  }
  for (const cls of new Set(close.map((a) => aspectClass(a.aspect)))) parts.push(WEEK_LUNATION_ASPECT[l.kind][cls]);
  return { heading: `${fmtDate(l.date)}: ${l.kind} at ${at(l.lon)}${l.house ? `, your ${ord(l.house)} house` : ''}`, text: parts.join(' '), basis: l.house ? 'Placidus house of the lunation' : 'House needs an exact birth time' };
}

/** The week ahead as reading sections: one per active planet, then the New and Full Moons, then a tie-back. */
export function weekReading(c: NatalChart, place: { lat: number; lon: number }, now = new Date(), profile: Profile | null = null): ReadingSection[] {
  const w = weekAhead(c, place.lat, place.lon, now);
  const today = now.toISOString().slice(0, 10);
  const out: ReadingSection[] = [];
  out.push({
    id: 'w-intro',
    title: `Your week, planet by planet (${fmtDate(w.start)} – ${fmtDate(w.end)})`,
    intro: `${WEEK_TEXT.intro}${c.timePrecision === 'exact' ? '' : ` ${WEEK_TEXT.noHouse}`}`,
    items: w.movers.length ? [] : [{ heading: 'A quieter week', text: WEEK_TEXT.quiet }],
  });
  out.push(...w.movers.map((m) => moverSection(m, today)));
  if (w.lunations.length) out.push({ id: 'w-lunations', title: 'This week’s Moon', items: w.lunations.map(lunationItem) });

  // Tie the houses this week touches back to what the person said is on their mind.
  if (profile?.onMind.length) {
    const touched = new Map<Area, string[]>();
    const note = (areas: Area[], what: string) => {
      for (const area of areas) if (profile.onMind.includes(area)) touched.set(area, [...new Set([...(touched.get(area) ?? []), what])]);
    };
    for (const m of w.movers) {
      if (m.house && (m.contacts.length || m.station)) note([HOUSE_AREA[m.house]], `${named(m.mover).replace('The', 'the')} in your ${ord(m.house)} house`);
      for (const x of m.contacts) note(TARGET_AREAS[x.natal] ?? [], `${m.mover} ${x.aspect} your ${x.natal} (${fmtDate(x.date)})`);
    }
    for (const l of w.lunations) if (l.house) note([HOUSE_AREA[l.house]], `the ${l.kind} in your ${ord(l.house)} house`);
    if (touched.size)
      out.push({
        id: 'w-for-you',
        title: 'What you told us',
        items: [...touched].map(([area, what]) => ({ heading: AREAS[area], text: `${WEEK_FOCUS[area]} Look at ${what.slice(0, 4).join('; ')}.`, basis: 'From your answers in Patterns' })),
      });
  }
  return out;
}
