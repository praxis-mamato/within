/**
 * The four elements, the three modes (cardinal, fixed, mutable), and the two polarities: what each is,
 * how it shows up when strong or missing, what helps, and how a chart's balance is weighed.
 * Western temperament, with the Vedic tattvas alongside. For reflection, not prediction.
 */
import type { NatalChart } from '../astro/natal';
import { ascendantAndMidheaven, SIGNS, tropicalLongitude } from '../astro/chart';
import type { SkyLine } from './today';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Mode = 'cardinal' | 'fixed' | 'mutable';

export const ELEMENT_OF: Record<string, Element> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};
export const MODE_OF: Record<string, Mode> = {
  Aries: 'cardinal', Cancer: 'cardinal', Libra: 'cardinal', Capricorn: 'cardinal',
  Taurus: 'fixed', Leo: 'fixed', Scorpio: 'fixed', Aquarius: 'fixed',
  Gemini: 'mutable', Virgo: 'mutable', Sagittarius: 'mutable', Pisces: 'mutable',
};

export interface ElementText {
  name: string;
  signs: string;
  nature: string;
  gifts: string;
  shadow: string;
  strong: string;
  missing: string;
  helps: string;
  inLove: string;
  vedic: string;
}

export const ELEMENTS: Record<Element, ElementText> = {
  fire: {
    name: 'Fire',
    signs: 'Aries, Leo, Sagittarius',
    nature: 'Spirit, drive, and the spark of life. Fire acts first and understands afterwards; it is warm, direct, and moved by inspiration more than by plans.',
    gifts: 'Courage, enthusiasm, leadership, generosity, faith in what is possible, and the ability to start things and warm a room.',
    shadow: 'Impatience, burnout, restlessness, a quick temper, and losing interest once the excitement fades.',
    strong: 'With a lot of fire you may live at full speed: quick to begin, slow to rest. Others feel your warmth and your heat. The practice is pacing yourself so the flame lasts.',
    missing: 'With little fire, motivation may need a reason before it arrives, and you may wait for certainty before acting. Confidence can be built deliberately: small risks, movement, and people who light you up.',
    helps: 'Movement and sport, sunlight, a goal worth chasing, play, and saying yes to something before you have every answer.',
    inLove: 'Wants passion, honesty, and adventure; needs room to be spontaneous and a partner who can match the energy without competing with it.',
    vedic: 'Agni tattva: the fire of transformation, digestion, and insight. In Jyotish, fire signs are Aries, Leo, and Sagittarius, linked with dharma (purpose).',
  },
  earth: {
    name: 'Earth',
    signs: 'Taurus, Virgo, Capricorn',
    nature: 'The body, the senses, and the material world. Earth trusts what it can touch, measure, and build; it is patient, grounded, and practical.',
    gifts: 'Reliability, patience, skill, good sense with money and time, loyalty, and the ability to turn ideas into something real.',
    shadow: 'Stubbornness, over-caution, worry about security, getting stuck in routine, and valuing the useful over the joyful.',
    strong: 'With a lot of earth you may be the steady one others lean on: you finish what you start. The practice is letting yourself change course, and enjoying what you have built.',
    missing: 'With little earth, practical details, routines, and money may take more effort, and ideas may stay ideas. Simple structures help: a calendar, a budget, one small habit at a time.',
    helps: 'Routines, time in nature and gardens, cooking, craft, touch, rest, and finishing one concrete thing.',
    inLove: 'Shows love through loyalty and actions more than words; wants security, physical affection, and a shared life that is built over time.',
    vedic: 'Prithvi tattva: stability, form, and the body. In Jyotish, earth signs are Taurus, Virgo, and Capricorn, linked with artha (resources and livelihood).',
  },
  air: {
    name: 'Air',
    signs: 'Gemini, Libra, Aquarius',
    nature: 'Mind, words, and connection. Air thinks things through, sees from many sides, and lives between people; it is curious, social, and detached enough to be fair.',
    gifts: 'Ideas, communication, perspective, fairness, humour, networking, and the ability to explain and connect.',
    shadow: 'Overthinking, distance from feelings, restlessness, indecision, and living in the head instead of the body.',
    strong: 'With a lot of air you may process life by talking and thinking it through, and need people and ideas the way others need food. The practice is landing in the body and in the feeling under the thought.',
    missing: 'With little air, stepping back to talk things through or see another side may take more effort, and feelings may run without words for a while. Writing, conversation, and learning give them shape.',
    helps: 'Conversation, writing, reading, learning something new, fresh air and breath, and time with friends who think differently.',
    inLove: 'Wants a friend and a conversation partner first; needs mental connection, space, and fairness, and may show love by listening and sharing ideas.',
    vedic: 'Vayu tattva: movement, breath, and the mind. In Jyotish, air signs are Gemini, Libra, and Aquarius, linked with kama (desire and relationship).',
  },
  water: {
    name: 'Water',
    signs: 'Cancer, Scorpio, Pisces',
    nature: 'Feeling, memory, and the unseen. Water senses before it understands; it is empathic, intuitive, protective, and deep.',
    gifts: 'Empathy, intuition, emotional intelligence, care, loyalty, imagination, and the ability to heal and hold others.',
    shadow: 'Moodiness, absorbing other people’s feelings, holding on, self-protection that turns into withdrawal, and escaping when it hurts.',
    strong: 'With a lot of water you may feel the room before anyone speaks and remember how everything felt. The practice is boundaries: telling your feelings from other people’s.',
    missing: 'With little water, naming feelings may take more effort, though they are still there; they may show up in the body or in sudden waves. Quiet, music, and safe people help them surface.',
    helps: 'Water itself (baths, swimming, the sea), music, art, rest, journaling, and time with people who feel safe.',
    inLove: 'Wants emotional depth, trust, and to be truly known; bonds deeply and protects what it loves, and needs reassurance more than grand gestures.',
    vedic: 'Jala tattva: flow, emotion, and nourishment. In Jyotish, water signs are Cancer, Scorpio, and Pisces, linked with moksha (release and inner freedom).',
  },
};

export interface ModeText {
  name: string;
  signs: string;
  season: string;
  nature: string;
  gifts: string;
  shadow: string;
  strong: string;
  missing: string;
  helps: string;
}

export const MODES: Record<Mode, ModeText> = {
  cardinal: {
    name: 'Cardinal',
    signs: 'Aries, Cancer, Libra, Capricorn',
    season: 'These signs open each season: spring, summer, autumn, and winter begin as the Sun enters them.',
    nature: 'The energy of beginnings. Cardinal energy initiates: it sees what is needed and moves first.',
    gifts: 'Initiative, leadership, ambition, decisiveness, and the courage to start.',
    shadow: 'Starting more than it finishes, impatience, and pushing ahead before others are ready.',
    strong: 'With a lot of cardinal energy you may be the one who gets things going. The practice is handing things over, or staying long enough to finish.',
    missing: 'With little cardinal energy, beginnings may take more effort: you may wait to be asked. A clear first step, a deadline, or a partner who starts things helps.',
    helps: 'Clear goals, fresh starts, and permission to lead.',
  },
  fixed: {
    name: 'Fixed',
    signs: 'Taurus, Leo, Scorpio, Aquarius',
    season: 'These signs hold the middle of each season, when it is at its strongest.',
    nature: 'The energy of holding. Fixed energy sustains: it commits, concentrates, and stays.',
    gifts: 'Loyalty, determination, focus, endurance, and the power to see things through.',
    shadow: 'Stubbornness, resistance to change, holding on too long, and digging in when challenged.',
    strong: 'With a lot of fixed energy you may be immovable once decided, and deeply loyal. The practice is noticing when holding on has stopped serving you.',
    missing: 'With little fixed energy, sticking with one thing may take more effort, and projects may scatter. Routines, accountability, and smaller commitments help.',
    helps: 'Long projects, deep commitments, and steady routines.',
  },
  mutable: {
    name: 'Mutable',
    signs: 'Gemini, Virgo, Sagittarius, Pisces',
    season: 'These signs close each season and prepare the next: the turn from one season into another.',
    nature: 'The energy of change. Mutable energy adapts: it learns, adjusts, connects, and lets go.',
    gifts: 'Flexibility, versatility, curiosity, service, and the ability to bridge people and ideas.',
    shadow: 'Scattered attention, indecision, restlessness, and bending so much that you lose your own shape.',
    strong: 'With a lot of mutable energy you may adapt to anyone and anything, and be good in a crisis. The practice is knowing what you want while you flex.',
    missing: 'With little mutable energy, change may feel harder and plans may be held tightly. Small experiments and trying a second way help.',
    helps: 'Variety, learning, travel, and room to change your mind.',
  },
};

/** The twelve signs as element and mode together: each sign is one of each. */
export const SIGN_ENERGY: Record<string, string> = {
  Aries: 'Cardinal fire: the spark that starts. Pure initiative and courage.',
  Taurus: 'Fixed earth: the ground that holds. Steadiness, the senses, and building to last.',
  Gemini: 'Mutable air: the mind that moves. Curiosity, words, and connection.',
  Cancer: 'Cardinal water: the feeling that protects. Starting families, homes, and bonds.',
  Leo: 'Fixed fire: the steady flame. Heart, loyalty, and creative self-expression.',
  Virgo: 'Mutable earth: the hands that refine. Skill, service, and making things work.',
  Libra: 'Cardinal air: the mind that relates. Starting partnerships and seeking balance.',
  Scorpio: 'Fixed water: the deep well. Intensity, loyalty, and transformation.',
  Sagittarius: 'Mutable fire: the flame that travels. Meaning, adventure, and faith.',
  Capricorn: 'Cardinal earth: the climber who builds. Ambition, structure, and responsibility.',
  Aquarius: 'Fixed air: the steady idea. Principles, community, and the future.',
  Pisces: 'Mutable water: the ocean that dissolves. Compassion, imagination, and spirit.',
};

export const POLARITY = {
  yang: { name: 'Active (yang)', text: 'Fire and air: outward, expressive, initiating. Energy that moves toward the world.' },
  yin: { name: 'Receptive (yin)', text: 'Earth and water: inward, receptive, sustaining. Energy that draws in and holds.' },
};

export const ELEMENT_INTRO =
  'Every sign belongs to one of four elements (how you experience life: through action, the senses, the mind, or feeling) and one of three modes (how you move: starting, holding, or adapting). The balance across your planets shows your natural temperament: what comes easily, and what you may need to build.';

/** How much each point counts: the lights and rising most, personal planets next, the slow outer planets not at all (they are the same for everyone born that year). */
const WEIGHT: Record<string, number> = { Sun: 3, Moon: 3, Ascendant: 3, Mercury: 2, Venus: 2, Mars: 2, Jupiter: 1, Saturn: 1, Midheaven: 1 };

export interface Balance {
  elements: Record<Element, number>;
  modes: Record<Mode, number>;
  /** Percentages, rounded, that add up to about 100. */
  elementPct: Record<Element, number>;
  modePct: Record<Mode, number>;
  yang: number;
  topElement: Element;
  lowElement: Element;
  topMode: Mode;
  lowMode: Mode;
  /** Which points sit in each element and mode. */
  who: Record<Element | Mode, string[]>;
}

function weigh(points: { name: string; sign: string }[]): Balance {
  const elements: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modes: Record<Mode, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  const who = { fire: [], earth: [], air: [], water: [], cardinal: [], fixed: [], mutable: [] } as Record<Element | Mode, string[]>;
  for (const p of points) {
    const w = WEIGHT[p.name] ?? 0;
    if (!w) continue;
    elements[ELEMENT_OF[p.sign]] += w;
    modes[MODE_OF[p.sign]] += w;
    who[ELEMENT_OF[p.sign]].push(p.name);
    who[MODE_OF[p.sign]].push(p.name);
  }
  const total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  const pct = <K extends string>(r: Record<K, number>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(((v as number) / total) * 100)])) as Record<K, number>;
  const top = <K extends string>(r: Record<K, number>, dir: 1 | -1) => (Object.entries(r) as [K, number][]).sort((a, b) => dir * (b[1] - a[1]))[0][0];
  return {
    elements,
    modes,
    elementPct: pct(elements),
    modePct: pct(modes),
    yang: Math.round(((elements.fire + elements.air) / total) * 100),
    topElement: top(elements, 1),
    lowElement: top(elements, -1),
    topMode: top(modes, 1),
    lowMode: top(modes, -1),
    who,
  };
}

/** A birth chart's balance, weighted: Sun, Moon, and rising count most. */
export function chartBalance(c: NatalChart, place?: { lat: number; lon: number }): Balance {
  const pts: { name: string; sign: string }[] = c.western.planets.filter((p) => p.body !== 'Node').map((p) => ({ name: p.body, sign: p.sign }));
  if (c.western.ascendant.certain && c.western.ascendant.value) pts.push({ name: 'Ascendant', sign: c.western.ascendant.value });
  if (place && c.timePrecision === 'exact') pts.push({ name: 'Midheaven', sign: SIGNS[Math.floor(ascendantAndMidheaven(c.utc, place.lat, place.lon).mc / 30)] });
  return weigh(pts);
}

/** The sky's balance at a moment: the same weighting, for everyone. */
export function skyBalance(now: Date): Balance {
  const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;
  return weigh(bodies.map((b) => ({ name: b, sign: SIGNS[Math.floor(tropicalLongitude(b, now) / 30)] })));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (xs: string[]) => (xs.length ? xs.join(', ') : 'none');

/** A full reading of a chart's elements, modes, and polarity, with today's sky alongside. */
export function elementReading(c: NatalChart, place: { lat: number; lon: number }, now = new Date()): { label: string; orb: string; lines: SkyLine[]; deeper: SkyLine[] } {
  const b = chartBalance(c, place);
  const e = ELEMENTS[b.topElement];
  const m = MODES[b.topMode];
  const sky = skyBalance(now);
  const signature = `${MODES[b.topMode].name} ${ELEMENTS[b.topElement].name.toLowerCase()}`;
  const bars = (r: Record<string, number>) => Object.entries(r).sort((a, z) => z[1] - a[1]).map(([k, v]) => `${cap(k)} ${v}%`).join(' · ');
  // Light elements: anything at 15% or less; the lightest first.
  const light = (Object.keys(ELEMENTS) as Element[]).filter((k) => b.elementPct[k] <= 15).sort((x, y) => b.elementPct[x] - b.elementPct[y]);
  const lowM = b.modePct[b.lowMode] <= 15;
  const lines: SkyLine[] = [
    { heading: `Your signature: ${signature}`, text: `Your chart leans most toward ${e.name.toLowerCase()} and the ${m.name.toLowerCase()} mode. ${e.nature} ${m.nature}`, basis: `Elements: ${bars(b.elementPct)}. Modes: ${bars(b.modePct)}. Sun, Moon, and rising count triple; Mercury, Venus, and Mars double; the outer planets are left out.` },
    { heading: `Strong in ${e.name.toLowerCase()} (${b.elementPct[b.topElement]}%)`, text: `${e.strong} Gifts: ${e.gifts.charAt(0).toLowerCase()}${e.gifts.slice(1)}`, basis: `In ${e.name.toLowerCase()}: ${list(b.who[b.topElement])}` },
    ...(light.length
      ? light.map((k) => ({ heading: `${b.elementPct[k] === 0 ? 'No' : 'Little'} ${k} (${b.elementPct[k]}%)`, text: `${ELEMENTS[k].missing} What helps: ${ELEMENTS[k].helps.charAt(0).toLowerCase()}${ELEMENTS[k].helps.slice(1)}`, basis: `In ${k}: ${list(b.who[k])}` }))
      : [{ heading: 'A fairly even balance of elements', text: `No element is missing, so you can draw on all four. Your least emphasized is ${b.lowElement} (${b.elementPct[b.lowElement]}%): ${ELEMENTS[b.lowElement].missing.split('.')[0].toLowerCase().replace(/^with little \w+, /, '')}.` }]),
  ];
  const deeper: SkyLine[] = [
    { heading: `Mostly ${m.name.toLowerCase()} (${b.modePct[b.topMode]}%)`, text: `${m.strong} Gifts: ${m.gifts.charAt(0).toLowerCase()}${m.gifts.slice(1)} Watch for: ${m.shadow.charAt(0).toLowerCase()}${m.shadow.slice(1)}`, basis: `${m.name}: ${list(b.who[b.topMode])}` },
    ...(lowM ? [{ heading: `Little ${b.lowMode} (${b.modePct[b.lowMode]}%)`, text: `${MODES[b.lowMode].missing} What helps: ${MODES[b.lowMode].helps.charAt(0).toLowerCase()}${MODES[b.lowMode].helps.slice(1)}`, basis: `${MODES[b.lowMode].name}: ${list(b.who[b.lowMode])}` }] : []),
    { heading: `The shadow of ${e.name.toLowerCase()}`, text: `${e.shadow} ${e.name} at its best is balanced by its opposite qualities: ${b.topElement === 'fire' ? 'patience and rest' : b.topElement === 'earth' ? 'play and change' : b.topElement === 'air' ? 'feeling and the body' : 'perspective and boundaries'}.` },
    { heading: `In love: ${e.name.toLowerCase()}`, text: e.inLove },
    { heading: b.yang >= 55 ? 'More active than receptive' : b.yang <= 45 ? 'More receptive than active' : 'Active and receptive in balance', text: `${b.yang}% of your chart is in fire and air, ${100 - b.yang}% in earth and water. ${b.yang >= 55 ? POLARITY.yang.text : b.yang <= 45 ? POLARITY.yin.text : 'You can move outward and draw inward with equal ease.'}`, basis: 'Polarity' },
    { heading: `The Vedic view: ${e.name.toLowerCase()}`, text: e.vedic },
    { heading: `The sky now: ${sky.topElement} and ${sky.topMode}`, text: `Today’s sky leans ${sky.topElement} and ${sky.topMode}. ${sky.topElement === b.topElement ? `That matches your own leaning, so today may feel natural to you, and turned up.` : sky.topElement === b.lowElement ? `That is the element you have least of, so today may ask you to stretch, and it is a good day to practise it.` : `It is a different tone from your own, which can be a useful balance.`}`, basis: `Sun to Saturn today. Elements: ${bars(sky.elementPct)}. Modes: ${bars(sky.modePct)}` },
  ];
  return { label: `Your elements: ${signature}`, orb: signature.toUpperCase(), lines, deeper };
}

/** Questions about elements, modes, or polarity. */
export const ELEMENT_Q = /\b(elements?|elemental|modalit(y|ies)|triplicit(y|ies)|quadruplicit(y|ies)|cardinal|mutable|fixed (signs?|mode|energy|sign)|am i fixed|polarit(y|ies)|yin and yang|temperament|energy types?|(fire|earth|air|water) (signs?|energy|element)|am i (fire|earth|air|water))\b/i;
