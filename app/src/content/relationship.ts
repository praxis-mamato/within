/**
 * The words for two charts together: the relationship's dynamics, synastry contacts, where each person
 * lands in the other's chart, the composite and Davison charts, progressed synastry, the relationship's
 * year, and the Vedic factors one by one. Possible dynamics, never what the other person feels or
 * intends, and never a compatibility score.
 */
import { fmtDeg, type NatalChart } from '../astro/natal';
import { houseOf, norm, placidusCusps } from '../astro/chart';
import { composite, crossAspects, davison, kootas, pointsOf, progressedSynastry, relationshipTimeline, type Aspect, type CrossAspect, type Place, type VedicSide } from '../astro/relationship';
import type { ReadingItem, ReadingSection } from './fullReading';
import * as V from './vedic';
import * as W from './western';

export type Dynamic = 'attraction' | 'emotional' | 'communication' | 'commitment' | 'growth' | 'intensity' | 'freedom' | 'ideals' | 'direction' | 'friction';

/** What each dynamic is, and how it tends to feel when the contacts are easy or tense. */
export const DYNAMIC_TEXT: Record<Dynamic, { name: string; ease: string; tension: string }> = {
  attraction: {
    name: 'Attraction and chemistry',
    ease: 'There is a natural pull between you. Affection and desire tend to meet without much effort.',
    tension: 'The spark is strong, and not easy to sit with. Desire and timing can pull in different directions; that friction is part of the charge.',
  },
  emotional: {
    name: 'Emotional safety',
    ease: 'You may feel at home with each other. Needs are easier to read and to meet.',
    tension: 'Your emotional rhythms differ. Feeling cared for may take asking, not guessing.',
  },
  communication: {
    name: 'Talking and understanding',
    ease: 'Conversation tends to flow. You can think out loud together.',
    tension: 'You process differently. Misreadings are likely; checking what was meant helps.',
  },
  commitment: {
    name: 'Commitment and staying power',
    ease: 'There is a steadying weight here: loyalty, structure, and the sense that this could last.',
    tension: 'Responsibility can feel heavy or uneven. One of you may feel held back, the other held responsible.',
  },
  growth: {
    name: 'Growth and generosity',
    ease: 'You encourage each other. Life may feel bigger and more hopeful together.',
    tension: 'You can egg each other on into too much. Generosity is real; so is overpromising.',
  },
  intensity: {
    name: 'Intensity and transformation',
    ease: 'The bond goes deep and can change you both for the better.',
    tension: 'Power and control can come up. The depth is real; so is the need for equal footing.',
  },
  freedom: {
    name: 'Freedom and surprise',
    ease: 'You keep each other awake. There is room to be different and to change.',
    tension: 'Excitement and instability travel together. Space and reliability both need tending.',
  },
  ideals: {
    name: 'Ideals and imagination',
    ease: 'There is tenderness and a shared imagination: music, spirit, a sense of being understood without words.',
    tension: 'It is easy to see each other as you wish rather than as you are. Clear words protect the magic.',
  },
  direction: {
    name: 'Shared direction',
    ease: 'Contacts to the North Node are read as a meeting that pulls one or both of you toward growth.',
    tension: 'It can be uncomfortable as well as compelling; the growth is the point.',
  },
  friction: {
    name: 'Friction and anger',
    ease: 'Disagreement can turn into momentum: you push each other to act.',
    tension: 'Tempers can flare. Agreeing on how to argue matters more than avoiding it.',
  },
};

/** One line for each kind of cross-chart contact between two personal planets. */
export const SYN_PAIR: Record<string, string> = {
  'Sun-Sun': 'your core selves',
  'Sun-Moon': 'one person’s identity and the other’s emotional needs: a classic bond',
  'Sun-Venus': 'admiration and affection',
  'Sun-Mars': 'energy and drive, encouragement or competition',
  'Sun-Mercury': 'understanding each other’s minds',
  'Moon-Moon': 'your emotional rhythms and what home feels like',
  'Moon-Venus': 'tenderness and comfort',
  'Moon-Mars': 'feelings and reactions; warmth or flashpoints',
  'Moon-Mercury': 'talking about feelings',
  'Venus-Venus': 'what you each find beautiful and how you love',
  'Venus-Mars': 'attraction and desire',
  'Mars-Mars': 'how you each act, push, and fight',
  'Mercury-Mercury': 'how you think and talk',
  'Mercury-Venus': 'kind words and shared tastes',
  'Mercury-Mars': 'debate: lively or sharp',
};

export const KOOTA_TEXT: Record<string, { what: string; harmony: string; mixed: string; care: string }> = {
  Varna: { what: 'temperament and outlook', harmony: 'Your outlooks are alike.', mixed: 'Your outlooks differ, which can widen each of you.', care: 'Your outlooks differ.' },
  Tara: { what: 'how each birth star supports the other', harmony: 'Each of your birth stars supports the other.', mixed: 'Support flows more easily one way; notice who carries more.', care: 'Your birth stars sit at a demanding distance; patience helps.' },
  Yoni: { what: 'instinct and intimacy', harmony: 'Your instinctive natures match.', mixed: 'Your instincts differ but can learn each other.', care: 'Tradition reads your instinctive natures as at odds; physical and emotional pacing need care.' },
  'Graha Maitri': { what: 'friendship between your Moon-sign lords', harmony: 'The lords of your Moon signs are friends: a classic sign of mental rapport.', mixed: 'The lords of your Moon signs are neutral: rapport is built rather than given.', care: 'The lords of your Moon signs are at odds; differences of mind may need patience.' },
  Gana: { what: 'basic nature', harmony: 'Your natures are alike.', mixed: 'Your natures differ in a workable way.', care: 'Your natures differ strongly; tradition asks for tolerance of each other’s style.' },
  Bhakoot: { what: 'the distance between your Moon signs', harmony: 'Your Moon signs sit at a supportive distance.', mixed: 'Your Moon signs sit at a neutral distance.', care: 'Tradition reads this Moon-sign distance as asking for care around money, family, or health together.' },
  Nadi: { what: 'constitution', harmony: 'Your constitutions differ, which tradition reads as complementary.', mixed: 'Your constitutions are mixed.', care: 'You share the same nadi; tradition asks for attention to health and to family planning together.' },
};

export const REL_TEXT = {
  noScore: 'Read factor by factor, with no total: a number cannot tell you how a relationship goes.',
  davison: 'The Davison chart is the real sky at the moment halfway between your two births, over the place halfway between them. Like the composite, it is read as the relationship’s own chart.',
  composite: 'The composite chart takes the midpoint of each pair of your planets and is read as a portrait of the relationship itself, apart from either of you.',
  progressed: 'Progressed synastry: how each of you has grown since birth, measured against the other’s birth chart. Contacts here describe what is being activated between you now.',
  noProgressed: 'No progressed planet is touching the other’s chart right now. These contacts come and go over years.',
  timeline: 'Slow planets crossing the relationship’s composite chart in the next year: seasons the relationship moves through together.',
  noTimeline: 'No slow planet makes an exact contact to the composite chart this year. A steadier stretch.',
  noTime: 'Houses and angles need an exact birth time for both of you.',
};

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const fmtDate = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const HARD: Aspect[] = ['square', 'opposite'];
const PERSONAL = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
const ROLE: Record<string, string> = {
  Sun: 'sense of self', Moon: 'emotional needs', Mercury: 'way of talking', Venus: 'way of loving', Mars: 'drive', Jupiter: 'optimism', Saturn: 'sense of responsibility', Uranus: 'need for freedom', Neptune: 'ideals', Pluto: 'intensity', 'North Node': 'direction of growth', Ascendant: 'way of meeting the world', Midheaven: 'public direction',
};

/** Which dynamic a cross-chart contact feeds. */
function dynamicOf(x: CrossAspect): Dynamic | null {
  const pair = new Set([x.a, x.b]);
  const has = (p: string) => pair.has(p);
  const other = (p: string) => (x.a === p ? x.b : x.a);
  if (has('Venus') && has('Mars')) return 'attraction';
  if ((has('Sun') && has('Venus')) || (has('Venus') && has('Ascendant')) || (has('Mars') && has('Ascendant'))) return 'attraction';
  if (has('Mars') && (has('Sun') || has('Moon') || x.a === x.b) && HARD.includes(x.aspect)) return 'friction';
  if (has('Moon') && (has('Sun') || has('Venus') || x.a === x.b)) return 'emotional';
  if (has('Mercury')) return PERSONAL.includes(other('Mercury')) || other('Mercury') === 'Mercury' ? 'communication' : null;
  if (has('Saturn') && PERSONAL.some((p) => has(p))) return 'commitment';
  if (has('Jupiter') && PERSONAL.some((p) => has(p))) return 'growth';
  if (has('Pluto') && PERSONAL.some((p) => has(p))) return 'intensity';
  if (has('Uranus') && PERSONAL.some((p) => has(p))) return 'freedom';
  if (has('Neptune') && PERSONAL.some((p) => has(p))) return 'ideals';
  if (has('North Node') && PERSONAL.some((p) => has(p))) return 'direction';
  if (has('Moon')) return 'emotional';
  if (has('Mars')) return 'friction';
  return null;
}

export interface DynamicRead {
  dynamic: Dynamic;
  strength: number;
  tone: 'ease' | 'tension' | 'both';
  evidence: CrossAspect[];
}

/** The relationship's strongest dynamics, from every contact between the two charts. */
export function dynamics(aspects: CrossAspect[]): DynamicRead[] {
  const by = new Map<Dynamic, CrossAspect[]>();
  for (const x of aspects) {
    const d = dynamicOf(x);
    if (d) by.set(d, [...(by.get(d) ?? []), x]);
  }
  return [...by]
    .map(([dynamic, ev]) => {
      const w = (x: CrossAspect) => (x.aspect === 'conjunct' ? 1.2 : 1) * Math.max(0.2, 1 - x.orb / 8);
      const hard = ev.filter((x) => HARD.includes(x.aspect)).reduce((n, x) => n + w(x), 0);
      const soft = ev.filter((x) => !HARD.includes(x.aspect)).reduce((n, x) => n + w(x), 0);
      return { dynamic, strength: hard + soft, tone: (hard > soft * 1.5 ? 'tension' : soft > hard * 1.5 ? 'ease' : 'both') as DynamicRead['tone'], evidence: ev.sort((p, q) => p.orb - q.orb) };
    })
    .sort((p, q) => q.strength - p.strength);
}

const vedicSide = (c: NatalChart): VedicSide | null => {
  if (!c.vedic.moonNakshatra.certain) return null;
  const moon = c.vedic.planets.find((p) => p.body === 'Moon')!;
  const n = c.vedic.nakshatra;
  const d = V.NAKSHATRA_DETAIL[n.name];
  return { rashi: moon.rashi, sign: moon.sign, nakshatra: n.name, index: n.index, gana: d.gana, yoni: d.yoni };
};

/** The full reading for two charts, in sections, strongest dynamics first. */
export function relationshipReading(me: NatalChart, mePlace: Place, them: NatalChart, themPlace: Place, name: string, now = new Date()): ReadingSection[] {
  const out: ReadingSection[] = [];
  const mine = pointsOf(me, mePlace);
  const theirs = pointsOf(them, themPlace);
  const asp = crossAspects(mine, theirs);
  const dyn = dynamics(asp);

  // 1. The dynamics.
  out.push({
    id: 'r-dynamics',
    title: `You and ${name}: the dynamics`,
    intro: 'What the contacts between your charts add up to, strongest first. Possible dynamics, not a verdict.',
    items: dyn.slice(0, 6).map((d) => ({
      heading: DYNAMIC_TEXT[d.dynamic].name,
      text: d.tone === 'both' ? `${DYNAMIC_TEXT[d.dynamic].ease} ${DYNAMIC_TEXT[d.dynamic].tension}` : DYNAMIC_TEXT[d.dynamic][d.tone],
      basis: d.evidence.slice(0, 3).map((x) => `your ${x.a} ${x.aspect} their ${x.b} (${fmtDeg(x.orb)})`).join(' · '),
    })),
  });

  // 2. Synastry contacts, personal planets first.
  const weight = (x: CrossAspect) => Number(PERSONAL.includes(x.a)) + Number(PERSONAL.includes(x.b));
  out.push({
    id: 'r-aspects',
    title: 'Synastry: your planets and theirs',
    intro: 'Every major contact between your charts, including the North Node and, with exact birth times, the angles.',
    tables: [{ caption: 'Contacts between your charts', columns: ['Yours', 'Aspect', 'Theirs', 'Orb'], rows: asp.slice(0, 24).map((x) => [x.a, x.aspect, x.b, fmtDeg(x.orb)]) }],
    items: [...asp]
      .sort((x, y) => weight(y) - weight(x) || x.orb - y.orb)
      .slice(0, 14)
      .map((x) => {
        const key = [x.a, x.b].sort((p, q) => PERSONAL.indexOf(p) - PERSONAL.indexOf(q)).join('-');
        return {
          heading: `Your ${x.a} ${x.aspect} ${name}’s ${x.b}`,
          text: `${SYN_PAIR[key] ? `This links ${SYN_PAIR[key]}. ` : ''}Your ${ROLE[x.a] ?? x.a} and their ${ROLE[x.b] ?? x.b} ${W.ASPECT_MEANING[x.aspect === 'conjunct' ? 'conjunction' : x.aspect === 'opposite' ? 'opposition' : x.aspect]}.`,
          basis: `Orb ${fmtDeg(x.orb)}`,
        };
      }),
  });

  // 3. House overlays.
  const meCusps = me.timePrecision === 'exact' ? placidusCusps(me.utc, mePlace.lat, mePlace.lon) : null;
  const themCusps = them.timePrecision === 'exact' ? placidusCusps(them.utc, themPlace.lat, themPlace.lon) : null;
  const key = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const overlays: ReadingItem[] = [
    ...(meCusps ? theirs.filter((p) => key.includes(p.name)).map((p) => ({ heading: `${name}’s ${p.name} in your ${ord(houseOf(p.lon, meCusps))} house`, text: `This touches your ${W.HOUSE[houseOf(p.lon, meCusps)].area}, through their ${ROLE[p.name]}.`, basis: 'Their planet in your houses' })) : []),
    ...(themCusps ? mine.filter((p) => key.includes(p.name)).map((p) => ({ heading: `Your ${p.name} in ${name}’s ${ord(houseOf(p.lon, themCusps))} house`, text: `This touches their ${W.HOUSE[houseOf(p.lon, themCusps)].area}, through your ${ROLE[p.name]}.`, basis: 'Your planet in their houses' })) : []),
  ];
  out.push({ id: 'r-overlays', title: 'Where you land in each other’s lives', items: overlays.length ? overlays : [{ heading: 'Not included', text: REL_TEXT.noTime }] });

  // 4. The composite chart.
  const comp = composite(me, mePlace, them, themPlace);
  const cp = (n: string) => comp.points.find((p) => p.name === n);
  const compItems: ReadingItem[] = ['Sun', 'Moon', 'Venus', 'Mars', 'Mercury', 'Saturn', 'Ascendant']
    .map((n) => cp(n))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      heading: `Composite ${p.name} in ${p.sign}${p.house ? `, ${ord(p.house)} house` : ''}`,
      text:
        p.name === 'Sun'
          ? `The relationship’s purpose may be colored by ${W.SIGN_KEYWORD[p.sign]}${p.house ? `, lived out through ${W.HOUSE[p.house].area}` : ''}.`
          : p.name === 'Moon'
            ? `Its emotional climate may lean toward ${W.SIGN_KEYWORD[p.sign]}${p.house ? `, felt most in ${W.HOUSE[p.house].area}` : ''}.`
            : p.name === 'Ascendant'
              ? `Together you may come across with a ${p.sign} tone: ${W.SIGN_KEYWORD[p.sign]}.`
              : `${p.sign} colors your shared ${ROLE[p.name]}: ${W.SIGN_KEYWORD[p.sign]}${p.house ? `, in ${W.HOUSE[p.house].area}` : ''}.`,
      basis: `Midpoint ${fmtDeg(norm(p.lon) % 30)} ${p.sign}`,
    }));
  out.push({ id: 'r-composite', title: 'The composite chart: the relationship itself', intro: REL_TEXT.composite, items: compItems, tables: [{ caption: 'Composite positions', columns: ['Point', 'Sign', 'Degree', 'House'], rows: comp.points.map((p) => [p.name, p.sign, fmtDeg(norm(p.lon) % 30), p.house ? ord(p.house) : '—']) }] });

  // 5. The Davison chart.
  const dv = davison(me, mePlace, them, themPlace);
  const dp = (n: string) => dv.points.find((p) => p.name === n)!;
  out.push({
    id: 'r-davison',
    title: 'The Davison chart',
    intro: REL_TEXT.davison,
    items: ['Sun', 'Moon', 'Venus'].map((n) => ({
      heading: `Davison ${n} in ${dp(n).sign}${dp(n).house ? `, ${ord(dp(n).house!)} house` : ''}`,
      text: `${dp(n).sign} colors the relationship’s ${ROLE[n]}: ${W.SIGN_KEYWORD[dp(n).sign]}${dp(n).house ? `, in ${W.HOUSE[dp(n).house!].area}` : ''}.`,
      basis: `${fmtDeg(norm(dp(n).lon) % 30)} ${dp(n).sign}; midpoint ${dv.when.toISOString().slice(0, 10)}`,
    })),
  });

  // 6. Progressed synastry.
  const ps = progressedSynastry(me, mePlace, them, themPlace, now);
  out.push({
    id: 'r-progressed',
    title: 'How you are growing into each other',
    intro: REL_TEXT.progressed,
    items: ps.length
      ? ps.slice(0, 8).map((x) => ({
          heading: x.who === 'a' ? `Your progressed ${x.progressed} ${x.aspect} ${name}’s ${x.natal}` : `${name}’s progressed ${x.progressed} ${x.aspect} your ${x.natal}`,
          text: `It ${x.applying ? 'is building toward exact, and activates' : 'has just peaked, and still colors'} ${x.who === 'a' ? 'their' : 'your'} ${ROLE[x.natal] ?? x.natal} through ${x.who === 'a' ? 'your' : 'their'} growing ${ROLE[x.progressed]}.`,
          basis: `Within ${fmtDeg(x.orb)}, ${x.applying ? 'applying' : 'separating'}`,
        }))
      : [{ heading: 'Quiet for now', text: REL_TEXT.noProgressed }],
  });

  // 7. The relationship's year.
  const tl = relationshipTimeline(comp.points, now);
  out.push({
    id: 'r-timeline',
    title: 'The relationship’s year',
    intro: REL_TEXT.timeline,
    items: tl.length
      ? tl.slice(0, 10).map((t) => ({
          heading: `${fmtDate(t.date)}: ${t.mover} ${t.aspect} the composite ${t.point}`,
          text: `${t.mover} brings ${t.mover === 'Jupiter' ? 'growth and openings' : t.mover === 'Saturn' ? 'tests of commitment and structure' : t.mover === 'Uranus' ? 'change and a wish for room' : t.mover === 'Neptune' ? 'softening, ideals, and some fog' : 'depth and transformation'} to the relationship’s ${ROLE[t.point] ?? t.point}.`,
          basis: t.passes.length > 1 ? `Exact ${t.passes.map(fmtDate).join(', ')}` : 'Exact on this date',
        }))
      : [{ heading: 'A steadier year', text: REL_TEXT.noTimeline }],
  });

  // 8. Vedic factors, one by one.
  const va = vedicSide(me);
  const vb = vedicSide(them);
  if (va && vb)
    out.push({
      id: 'r-vedic',
      title: 'The Vedic view: ashtakoota, factor by factor',
      intro: `${REL_TEXT.noScore} Your Moon: ${va.nakshatra} in ${va.rashi}. ${name}’s: ${vb.nakshatra} in ${vb.rashi}.`,
      items: kootas(va, vb).map((k) => ({ heading: `${k.koota}: ${KOOTA_TEXT[k.koota].what}`, text: KOOTA_TEXT[k.koota][k.tone], basis: k.detail })),
    });
  return out;
}

/** Positions for the bi-wheel: both charts' points, and the strongest contacts between them. */
export function biWheel(me: NatalChart, mePlace: Place, them: NatalChart, themPlace: Place) {
  const mine = pointsOf(me, mePlace);
  const theirs = pointsOf(them, themPlace);
  const asc = mine.find((p) => p.name === 'Ascendant')?.lon ?? null;
  return { mine, theirs, asc, aspects: crossAspects(mine, theirs).filter((x) => PERSONAL.includes(x.a) || PERSONAL.includes(x.b)).slice(0, 14) };
}

