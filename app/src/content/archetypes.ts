/**
 * Archetypes: the twelve signs and ten planets read as the characters they have carried through centuries of
 * myth and astrology (the Pioneer, the Lover, the Sage…), and a person's own cast: the Sun, Moon, and rising
 * archetypes, the chart ruler as guide, and the planet most woven into the chart. For reflection, not prediction.
 */
import type { NatalChart } from '../astro/natal';
import { allAspects } from '../astro/deep';
import { SIGNS, tropicalLongitude } from '../astro/chart';
import { RULER } from './western';
import type { SkyLine } from './today';

export interface Archetype {
  name: string;
  /** Another name the same figure goes by. */
  also: string;
  essence: string;
  gift: string;
  shadow: string;
  growth: string;
  question: string;
}

export const ARCHETYPE_INTRO =
  'An archetype is a character the whole world recognizes: the Hero, the Lover, the Sage. Astrology has read the signs and planets this way for centuries. Each sign is a way of being, each planet is a part of you with its own voice, and your chart is the cast you were born with. Every archetype has a gift and a shadow: the shadow is the gift overused or underused, and growth is learning to hold both.';

export const SIGN_ARCHETYPE: Record<string, Archetype> = {
  Aries: {
    name: 'The Pioneer',
    also: 'the Warrior',
    essence: 'The first spark: the courage to begin and to go where no one has gone yet.',
    gift: 'Courage, initiative, honesty, and energy that gets things moving.',
    shadow: 'Impatience, a quick temper, and starting fights or projects that don’t get finished.',
    growth: 'Learning that strength includes patience, and that not every battle is yours to fight.',
    question: 'What are you ready to begin?',
  },
  Taurus: {
    name: 'The Gardener',
    also: 'the Keeper of beauty',
    essence: 'The one who tends, savors, and grows things slowly, trusting the seasons.',
    gift: 'Steadiness, loyalty, sensuality, and the patience to let things ripen.',
    shadow: 'Stubbornness, possessiveness, and staying too long in what is comfortable.',
    growth: 'Trusting that change can also be a kind of growth.',
    question: 'What deserves your patient care?',
  },
  Gemini: {
    name: 'The Messenger',
    also: 'the Storyteller',
    essence: 'Curiosity in motion: connecting people, ideas, and words.',
    gift: 'Wit, adaptability, quick learning, and making the complicated simple.',
    shadow: 'Scattered attention, restlessness, half-truths, and staying on the surface.',
    growth: 'Choosing one thread and following it all the way down.',
    question: 'What story are you telling yourself?',
  },
  Cancer: {
    name: 'The Nurturer',
    also: 'the Protector',
    essence: 'The keeper of home, feeling, memory, and belonging.',
    gift: 'Care, intuition, loyalty, and the power to make others feel safe.',
    shadow: 'Moodiness, clinging, retreating into the shell, and caring for everyone but yourself.',
    growth: 'Letting yourself be cared for too.',
    question: 'Where do you feel at home?',
  },
  Leo: {
    name: 'The Sovereign',
    also: 'the Performer',
    essence: 'The heart that shines and warms others, leading by example.',
    gift: 'Generosity, creativity, loyalty, joy, and the courage to be seen.',
    shadow: 'Pride, needing applause, and drama when unseen.',
    growth: 'Shining from within rather than for the audience.',
    question: 'What makes your heart come alive?',
  },
  Virgo: {
    name: 'The Healer',
    also: 'the Craftsperson',
    essence: 'Devoted service and skill: making things work, and work well.',
    gift: 'Care for the details, practical help, discernment, and humility.',
    shadow: 'Perfectionism, worry, and criticism of yourself and others.',
    growth: 'Knowing that good enough is often whole.',
    question: 'What could you do with love instead of worry?',
  },
  Libra: {
    name: 'The Diplomat',
    also: 'the Lover of beauty',
    essence: 'The seeker of harmony, fairness, and true partnership.',
    gift: 'Grace, tact, a sense of beauty, and the ability to see every side.',
    shadow: 'People-pleasing, indecision, and keeping the peace at your own cost.',
    growth: 'Knowing that honest disagreement can make a bond stronger.',
    question: 'Where do you need balance?',
  },
  Scorpio: {
    name: 'The Alchemist',
    also: 'the Detective',
    essence: 'Transformation: going to the depths and coming back changed.',
    gift: 'Depth, loyalty, insight, intensity, and courage with hard truths.',
    shadow: 'Control, secrecy, grudges, and all-or-nothing thinking.',
    growth: 'Letting go so that something new can live.',
    question: 'What are you ready to transform?',
  },
  Sagittarius: {
    name: 'The Seeker',
    also: 'the Explorer',
    essence: 'The quest for meaning, truth, and the wider view.',
    gift: 'Optimism, honesty, humor, faith, and a love of learning and travel.',
    shadow: 'Restlessness, overpromising, preaching, and avoiding commitment.',
    growth: 'Finding the meaning in what is right here.',
    question: 'What truth are you seeking?',
  },
  Capricorn: {
    name: 'The Elder',
    also: 'the Architect',
    essence: 'Mastery, responsibility, and building what lasts.',
    gift: 'Discipline, wisdom, patience, ambition, and quiet strength.',
    shadow: 'Rigidity, coldness, carrying everything alone, and work before joy.',
    growth: 'Letting rest and tenderness be part of success.',
    question: 'What are you building, and for whom?',
  },
  Aquarius: {
    name: 'The Visionary',
    also: 'the Rebel',
    essence: 'The future-thinker who changes the group and the system.',
    gift: 'Originality, independence, friendship, ideals, and seeing what could be.',
    shadow: 'Detachment, contrariness, and loving humanity while keeping people at a distance.',
    growth: 'Bringing the heart along with the vision.',
    question: 'What would you change for everyone?',
  },
  Pisces: {
    name: 'The Mystic',
    also: 'the Dreamer',
    essence: 'Compassion, imagination, and the sense that everything is connected.',
    gift: 'Empathy, creativity, spiritual depth, and forgiveness.',
    shadow: 'Escapism, losing yourself in others, and blurry boundaries.',
    growth: 'Giving your dreams a shape and your kindness a boundary.',
    question: 'What are you dreaming of?',
  },
};

export const PLANET_ARCHETYPE: Record<string, Archetype> = {
  Sun: {
    name: 'The Hero',
    also: 'the Self',
    essence: 'The self on its journey: purpose, vitality, and who you are becoming.',
    gift: 'Confidence, warmth, purpose, and the drive to grow.',
    shadow: 'Ego, needing to be the center, and burning out to prove yourself.',
    growth: 'Being yourself without needing to be the most.',
    question: 'Who are you becoming?',
  },
  Moon: {
    name: 'The Inner Child',
    also: 'the Mother',
    essence: 'Feelings, needs, memory, and what comforts you.',
    gift: 'Sensitivity, care, instinct, and emotional memory.',
    shadow: 'Old hurts running the show, moods, and needs left unspoken.',
    growth: 'Meeting your own needs with the care you would give a child.',
    question: 'What do you need right now?',
  },
  Mercury: {
    name: 'The Trickster',
    also: 'the Messenger',
    essence: 'The mind, words, and the go-between of gods and people.',
    gift: 'Cleverness, humor, curiosity, and a way with words.',
    shadow: 'Overthinking, nervous chatter, and telling the story you want to hear.',
    growth: 'Speaking truly and listening as well as you talk.',
    question: 'What are you really trying to say?',
  },
  Venus: {
    name: 'The Lover',
    also: 'the Artist',
    essence: 'Love, beauty, pleasure, and what you value.',
    gift: 'Affection, charm, taste, harmony, and the ability to enjoy life.',
    shadow: 'Vanity, indulgence, and trading yourself for being liked.',
    growth: 'Loving yourself enough to choose what is truly good for you.',
    question: 'What do you love, and does it love you back?',
  },
  Mars: {
    name: 'The Warrior',
    also: 'the Champion',
    essence: 'Desire, drive, courage, and the energy to act.',
    gift: 'Courage, passion, decisiveness, and protecting what matters.',
    shadow: 'Anger, recklessness, and fighting the wrong battle.',
    growth: 'Using your fire for something, not against someone.',
    question: 'What are you fighting for?',
  },
  Jupiter: {
    name: 'The Sage',
    also: 'the Benefactor',
    essence: 'Growth, faith, wisdom, and good fortune shared.',
    gift: 'Generosity, optimism, teaching, and a sense of meaning.',
    shadow: 'Excess, overconfidence, and promising more than you can give.',
    growth: 'Growing wise as well as big.',
    question: 'Where are you being asked to grow?',
  },
  Saturn: {
    name: 'The Teacher',
    also: 'the Timekeeper',
    essence: 'Time, limits, responsibility, and mastery earned slowly.',
    gift: 'Discipline, endurance, integrity, and wisdom that lasts.',
    shadow: 'Fear, harsh self-judgment, and walls that keep life out.',
    growth: 'Turning fear into structure, and structure into freedom.',
    question: 'What is this season teaching you?',
  },
  Uranus: {
    name: 'The Awakener',
    also: 'the Rebel',
    essence: 'Sudden insight, freedom, change, and the future breaking in.',
    gift: 'Originality, independence, invention, and courage to be different.',
    shadow: 'Restlessness, breaking things for the sake of it, and coldness.',
    growth: 'Changing what needs to change and keeping what you love.',
    question: 'Where do you need more freedom?',
  },
  Neptune: {
    name: 'The Dreamer',
    also: 'the Mystic',
    essence: 'Imagination, spirit, compassion, and the longing for something greater.',
    gift: 'Inspiration, empathy, art, and faith.',
    shadow: 'Illusion, escape, and seeing what you wish were there.',
    growth: 'Keeping your dreams and your eyes open at the same time.',
    question: 'What are you longing for?',
  },
  Pluto: {
    name: 'The Phoenix',
    also: 'the Transformer',
    essence: 'Death and rebirth: power, depth, and renewal after an ending.',
    gift: 'Resilience, depth, honesty, and the power to begin again.',
    shadow: 'Control, obsession, and holding on to what has ended.',
    growth: 'Letting endings make room for who you are becoming.',
    question: 'What is ready to end so something can be reborn?',
  },
};

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const sign = (c: NatalChart, body: string) => c.western.planets.find((p) => p.body === body);

/** The planet with the most close aspects: the archetype most woven through the rest of the chart. */
export function strongestPlanet(c: NatalChart): { body: string; links: number } | null {
  const count: Record<string, { n: number; orb: number }> = {};
  for (const a of allAspects(c)) {
    for (const b of [a.a, a.b]) {
      count[b] ??= { n: 0, orb: 0 };
      count[b].n++;
      count[b].orb += a.orb;
    }
  }
  const best = Object.entries(count)
    .filter(([b]) => PLANET_ARCHETYPE[b])
    .sort((x, y) => y[1].n - x[1].n || x[1].orb - y[1].orb)[0];
  return best ? { body: best[0], links: best[1].n } : null;
}

export interface CastMember {
  role: string;
  heading: string;
  archetype: Archetype;
  basis: string;
  /** Said instead of the essence when the same archetype appears twice (Sun and Moon in one sign). */
  note?: string;
}

/** A chart's archetypes: Sun, Moon, rising, the chart ruler as guide, and the most connected planet. */
export function chartArchetypes(c: NatalChart): CastMember[] {
  const out: CastMember[] = [];
  const sun = sign(c, 'Sun')!;
  out.push({ role: 'core', heading: `Your core archetype: ${SIGN_ARCHETYPE[sun.sign].name}`, archetype: SIGN_ARCHETYPE[sun.sign], basis: `Sun in ${sun.sign}: who you are becoming` });
  const moon = sign(c, 'Moon')!;
  if (c.western.moonSign.certain)
    out.push({
      role: 'inner',
      heading: `Your inner archetype: ${SIGN_ARCHETYPE[moon.sign].name}${moon.sign === sun.sign ? ', twice over' : ''}`,
      archetype: SIGN_ARCHETYPE[moon.sign],
      basis: `Moon in ${moon.sign}: what you need and how you feel`,
      ...(moon.sign === sun.sign ? { note: `Your Moon is in ${moon.sign} too, so ${SIGN_ARCHETYPE[moon.sign].name.replace('The ', 'the ')} shapes what you need as well as who you are becoming. Its gifts come easily to you, and so does its shadow; the other archetypes in your chart are how you balance it.` } : {}),
    });
  const asc = c.western.ascendant.certain ? c.western.ascendant.value : null;
  if (asc) {
    out.push({ role: 'mask', heading: `How you meet the world: ${SIGN_ARCHETYPE[asc].name}`, archetype: SIGN_ARCHETYPE[asc], basis: `${asc} rising: first impressions and your way in` });
    const ruler = RULER[asc];
    const at = sign(c, ruler);
    if (at)
      out.push({ role: 'guide', heading: `Your guide: ${PLANET_ARCHETYPE[ruler].name}`, archetype: PLANET_ARCHETYPE[ruler], basis: `${ruler} rules your ${asc} rising, and sits in ${at.sign}${at.house ? `, house ${at.house}` : ''}` });
  }
  const top = strongestPlanet(c);
  if (top && !out.some((m) => m.archetype === PLANET_ARCHETYPE[top.body]))
    out.push({ role: 'loudest', heading: `The voice woven through everything: ${PLANET_ARCHETYPE[top.body].name}`, archetype: PLANET_ARCHETYPE[top.body], basis: `${top.body} makes ${top.links} close aspects, the most in your chart` });
  return out;
}

/** The Oracle's answer to "What's my archetype?". */
export function archetypeReading(c: NatalChart, now = new Date()): { label: string; orb: string; lines: SkyLine[]; deeper: SkyLine[] } {
  const cast = chartArchetypes(c);
  const core = cast[0];
  const say = (m: CastMember) => m.note ?? `${m.archetype.essence} Gift: ${lower(m.archetype.gift)}`;
  const lines: SkyLine[] = cast.slice(0, 3).map((m) => ({ heading: m.heading, text: say(m), basis: m.basis }));
  if (!c.western.ascendant.certain) lines.push({ heading: 'Your rising archetype needs a birth time', text: 'Your rising sign changes about every two hours, so it needs an exact birth time. Add yours in Settings to meet your rising archetype and your guide.' });
  const moonNow = SIGNS[Math.floor(tropicalLongitude('Moon', now) / 30)];
  const deeper: SkyLine[] = [
    ...cast.slice(3).map((m) => ({ heading: m.heading, text: say(m), basis: m.basis })),
    ...cast.filter((m, i) => cast.findIndex((x) => x.archetype === m.archetype) === i).map((m) => ({ heading: `${m.archetype.name}: the shadow and the growth`, text: `In its shadow: ${lower(m.archetype.shadow)} Growth: ${lower(m.archetype.growth)}`, basis: m.basis.split(':')[0] })),
    { heading: `Today’s archetype in the sky: ${SIGN_ARCHETYPE[moonNow].name}`, text: `The Moon is in ${moonNow} today, so the mood around everyone carries ${SIGN_ARCHETYPE[moonNow].name.replace('The ', 'the ')}: ${lower(SIGN_ARCHETYPE[moonNow].essence)}`, basis: 'Transiting Moon, a two-to-three-day tone' },
    { heading: 'To reflect on', text: core.archetype.question },
  ];
  return { label: `Your archetype: ${core.archetype.name}`, orb: core.archetype.name.replace('The ', '').toUpperCase(), lines, deeper };
}

/** Questions about archetypes. */
export const ARCHETYPE_Q = /\barchetyp(e|es|al)\b/i;
