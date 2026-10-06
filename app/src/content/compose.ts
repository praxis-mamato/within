/**
 * Chooses and fills draft templates from a person's computed chart (build spec §3.3, step 1–2).
 * Rule-based only: no generated prose. Every reading records the template IDs it used.
 */
import type { Pillar } from '../data/fixtures';
import { crossAspects, type NatalChart } from '../astro/natal';
import { currentTransits } from '../astro/facts';
import {
  ASPECT_QUALITY,
  DASHA_THEME,
  DIGNITY,
  ELEMENT_THEME,
  LIBRARY_VERSION,
  NAKSHATRA,
  OTHER_STEPS,
  PLANET_ROLE,
  QUESTIONS,
  SIGN_ELEMENT,
  STEPS,
  TARGET,
  TRANSIT_ASPECT,
  TRANSIT_PLANET,
  VEDIC_RASHI,
  WESTERN_SIGN,
  type Element,
} from './templates';

export interface Composed {
  title: string;
  body: string;
  templateIds: string[];
}

export interface ComposedReflection {
  western: Composed;
  vedic: Composed;
  together: Composed;
  question: string;
  step: string;
  stepInvolvesOther: boolean;
}

const id = (...parts: string[]) => `${parts.join('.').toLowerCase().replace(/\s+/g, '-')}@${LIBRARY_VERSION}`;
const wSign = (c: NatalChart, body: string) => c.western.planets.find((p) => p.body === body)!.sign;
const vSign = (c: NatalChart, body: string) => c.vedic.planets.find((p) => p.body === body)!.sign;
const vRashi = (c: NatalChart, body: string) => c.vedic.planets.find((p) => p.body === body)!.rashi;
const el = (sign: string): Element => SIGN_ELEMENT[sign];

function westernSelf(c: NatalChart): Composed {
  const moon = c.western.moonSign;
  const m = moon.value ?? wSign(c, 'Moon');
  const venus = wSign(c, 'Venus');
  const mars = wSign(c, 'Mars');
  const moonText = moon.certain
    ? `With your Moon in ${m}, one reading is that you need ${WESTERN_SIGN[m].need}.`
    : `Without a birth time, your Moon could be in ${moon.options.join(' or ')}: ${moon.options.map((o) => `${o} suggests a need for ${WESTERN_SIGN[o].need}`).join('; ')}.`;
  return {
    title: moon.certain ? `${m} Moon: a need for ${WESTERN_SIGN[m].short}` : `A Moon between ${moon.options.join(' and ')}`,
    body: `${moonText} Venus in ${venus} may mean you connect ${WESTERN_SIGN[venus].connect}, and Mars in ${mars} that you assert yourself ${WESTERN_SIGN[mars].assert}. If keeping the peace costs you your own view, it may be worth noticing which of these is doing the work.`,
    templateIds: [id('self.western.moon', moon.certain ? m : 'uncertain'), id('self.western.venus', venus), id('self.western.mars', mars)],
  };
}

function vedicSelf(c: NatalChart): Composed {
  const r = c.vedic.moonRashi;
  const moonSign = r.certain ? vSign(c, 'Moon') : null;
  const nak = c.vedic.moonNakshatra;
  const venus = vSign(c, 'Venus');
  const parts: string[] = [];
  const ids: string[] = [];
  if (moonSign) {
    parts.push(`Your Moon in ${vRashi(c, 'Moon')} may describe ${VEDIC_RASHI[moonSign].mind}.`);
    ids.push(id('self.vedic.moon', moonSign));
    if (DIGNITY.Moon[moonSign]) parts.push(DIGNITY.Moon[moonSign]);
  } else {
    parts.push(`Without a birth time, your Moon could be in ${r.options.join(' or ')}, so this reading leans on placements that don’t change during the day.`);
    ids.push(id('self.vedic.moon.uncertain'));
  }
  if (nak.certain) {
    const n = NAKSHATRA[nak.value!];
    parts.push(`Its nakshatra, ${nak.value}, has the symbol of ${n.symbol} and is linked with ${n.deity}; it is associated with ${n.theme}.`);
    ids.push(id('self.vedic.nakshatra', nak.value!));
  }
  parts.push(`Venus in ${vRashi(c, 'Venus')} suggests ${VEDIC_RASHI[venus].love}.`);
  ids.push(id('self.vedic.venus', venus));
  if (DIGNITY.Venus[venus]) parts.push(DIGNITY.Venus[venus]);
  return {
    title: moonSign ? `${vRashi(c, 'Moon')} Moon${nak.certain ? `, ${nak.value}` : ''}` : 'Your Vedic Moon, with an open question',
    body: parts.join(' '),
    templateIds: ids,
  };
}

function westernPurpose(c: NatalChart): Composed {
  const merc = wSign(c, 'Mercury');
  const mars = wSign(c, 'Mars');
  const sat = wSign(c, 'Saturn');
  return {
    title: `Mercury in ${merc}: how you put needs into words`,
    body: `Mercury in ${merc} may mean you speak ${WESTERN_SIGN[merc].speak}. With Mars in ${mars} you may assert yourself ${WESTERN_SIGN[mars].assert}. Saturn in ${sat} can describe where practice builds confidence slowly. One way to use this: practise saying a need in your own natural style first, then stretch it.`,
    templateIds: [id('purpose.western.mercury', merc), id('purpose.western.mars', mars), id('purpose.western.saturn', sat)],
  };
}

function vedicPurpose(c: NatalChart): Composed {
  const merc = vSign(c, 'Mercury');
  const jup = vSign(c, 'Jupiter');
  const cur = c.vedic.current;
  return {
    title: cur ? `${cur.maha.lord} period: ${DASHA_THEME[cur.maha.lord].split(',')[0]}` : `Mercury in ${vRashi(c, 'Mercury')}`,
    body: `Mercury in ${vRashi(c, 'Mercury')} suggests ${VEDIC_RASHI[merc].approach} when you speak. Jupiter in ${vRashi(c, 'Jupiter')} points to growth through ${VEDIC_RASHI[jup].approach}.${cur ? ` You are in a ${cur.maha.lord} mahadasha, traditionally a time emphasizing ${DASHA_THEME[cur.maha.lord]}, with a ${cur.antar.lord} sub-period adding ${DASHA_THEME[cur.antar.lord].split(',')[0]}.` : ''}`,
    templateIds: [id('purpose.vedic.mercury', merc), id('purpose.vedic.jupiter', jup), ...(cur ? [id('dasha', cur.maha.lord, cur.antar.lord)] : [])],
  };
}

function westernRelationship(c: NatalChart, now: Date): Composed {
  const venus = wSign(c, 'Venus');
  const transits = currentTransits(c, now);
  const first = transits[0]?.match(/^(\w+) now (\w+) your (\w+)/);
  const body = first
    ? `Right now ${first[1]}, a planet of ${TRANSIT_PLANET[first[1]]}, ${TRANSIT_ASPECT[first[2]]} ${TARGET[first[3]]}. This tradition reads that as a theme for this chapter, not an event. With Venus in ${venus}, you may connect ${WESTERN_SIGN[venus].connect}.`
    : `No slow planet is closely touching your Sun, Moon, or Venus right now, which this tradition might read as a quieter chapter. With Venus in ${venus}, you may connect ${WESTERN_SIGN[venus].connect}.`;
  return {
    title: first ? `${first[1]} ${first[2]} your ${first[3]}` : 'A quieter chapter',
    body,
    templateIds: [first ? id('relationship.western.transit', first[1], first[2], first[3]) : id('relationship.western.quiet'), id('relationship.western.venus', venus)],
  };
}

function vedicRelationship(c: NatalChart): Composed {
  const venus = vSign(c, 'Venus');
  const cur = c.vedic.current;
  return {
    title: cur ? `${cur.maha.lord}–${cur.antar.lord} chapter` : `Venus in ${vRashi(c, 'Venus')}`,
    body: cur
      ? `Your current ${cur.maha.lord} mahadasha is traditionally linked with ${DASHA_THEME[cur.maha.lord]}, and the ${cur.antar.lord} sub-period with ${DASHA_THEME[cur.antar.lord]}. In a relationship this might show up as where your attention goes. Venus in ${vRashi(c, 'Venus')} suggests ${VEDIC_RASHI[venus].love}.`
      : `Without an exact birth time the current dasha isn’t certain, so this reading uses Venus: in ${vRashi(c, 'Venus')} it suggests ${VEDIC_RASHI[venus].love}.`,
    templateIds: [cur ? id('dasha', cur.maha.lord, cur.antar.lord) : id('relationship.vedic.nodasha'), id('relationship.vedic.venus', venus)],
  };
}

function westernOther(me: NatalChart, other: NatalChart | null, name: string): Composed {
  if (!other) {
    const venus = wSign(me, 'Venus');
    return {
      title: 'Your side of the picture',
      body: `Without ${name}’s details, this reading only uses your chart. Venus in ${venus} suggests you connect ${WESTERN_SIGN[venus].connect}. ${name} may connect differently, and only ${name} can tell you how.`,
      templateIds: [id('other.western.solo', venus)],
    };
  }
  const a = crossAspects(me, other)[0];
  if (!a) {
    return { title: 'Few close contacts', body: `Your personal planets and ${name}’s form few close aspects, which this tradition might read as two people with separate rhythms. That is a question to explore together, not a conclusion.`, templateIds: [id('other.western.none')] };
  }
  return {
    title: `Your ${a.a} ${a.aspect} ${name}’s ${a.b}`,
    body: `Your ${PLANET_ROLE[a.a]} (${a.a}) and ${name}’s ${PLANET_ROLE[a.b]} (${a.b}) form a ${a.aspect}: ${ASPECT_QUALITY[a.aspect]}. This describes a possible dynamic, not what ${name} thinks or feels.`,
    templateIds: [id('other.western.aspect', a.a, a.aspect, a.b)],
  };
}

function vedicOther(me: NatalChart, other: NatalChart | null, name: string): Composed {
  const mine = me.vedic.moonRashi.certain ? vSign(me, 'Moon') : null;
  if (!other || !other.vedic.moonRashi.certain || !mine) {
    return {
      title: 'Different minds, not a verdict',
      body: mine
        ? `Your Moon in ${vRashi(me, 'Moon')} suggests ${VEDIC_RASHI[mine].mind}. ${other ? `${name}’s Moon sign isn’t certain from the details given,` : `Without ${name}’s details,`} so no comparison is made.`
        : `Your Moon sign isn’t certain without a birth time, so no Moon comparison is made.`,
      templateIds: [id('other.vedic.solo')],
    };
  }
  const theirs = vSign(other, 'Moon');
  const same = el(mine) === el(theirs);
  return {
    title: `${vRashi(me, 'Moon')} Moon and ${vRashi(other, 'Moon')} Moon`,
    body: `Your Moon in ${vRashi(me, 'Moon')} suggests ${VEDIC_RASHI[mine].mind}; ${name}’s in ${vRashi(other, 'Moon')} suggests ${VEDIC_RASHI[theirs].mind}. ${same ? 'These share an element, which this lens might read as a similar emotional rhythm.' : 'These differ in element, which this lens might read as different emotional rhythms worth asking about.'}`,
    templateIds: [id('other.vedic.moons', mine, theirs)],
  };
}

function together(pillar: Pillar, me: NatalChart, other: NatalChart | null, name: string): Composed {
  const wm = me.western.moonSign;
  const vm = me.vedic.moonRashi;
  if (pillar === 'other') {
    return {
      title: 'Together',
      body: other
        ? `Both lenses describe a possible dynamic between you and ${name}. Neither can tell you what ${name} thinks or intends; only ${name} can.`
        : `Both lenses here describe only you. ${name}’s view is the missing half, and it can only come from ${name}.`,
      templateIds: [id('together.other', other ? 'pair' : 'solo')],
    };
  }
  if (!wm.certain || !vm.certain) {
    return {
      title: 'Together',
      body: 'Without a birth time, both traditions leave your Moon open, and they agree on that. Notice which description fits your experience.',
      templateIds: [id('together.uncertain')],
    };
  }
  const a = el(wm.value!);
  const b = el(vSign(me, 'Moon'));
  return {
    title: 'Together',
    body:
      a === b
        ? `Western puts your Moon in ${wm.value}, Vedic in ${vRashi(me, 'Moon')}, and both are ${a} signs: both point to ${ELEMENT_THEME[a]}.`
        : `Western puts your Moon in ${wm.value} (${a}: ${ELEMENT_THEME[a]}); Vedic puts it in ${vRashi(me, 'Moon')} (${b}: ${ELEMENT_THEME[b]}). The zodiacs differ by about 24°, so this happens often. Neither is the right one; notice which fits.`,
    templateIds: [id('together', a === b ? 'same' : 'different', a, b)],
  };
}

export function composeReflection(pillar: Pillar, me: NatalChart, other: NatalChart | null, nickname = 'them', now = new Date()): ComposedReflection {
  const fill = (s: string) => s.replaceAll('{name}', nickname);
  const western =
    pillar === 'self' ? westernSelf(me) : pillar === 'purpose' ? westernPurpose(me) : pillar === 'relationship' ? westernRelationship(me, now) : westernOther(me, other, nickname);
  const vedic = pillar === 'self' ? vedicSelf(me) : pillar === 'purpose' ? vedicPurpose(me) : pillar === 'relationship' ? vedicRelationship(me) : vedicOther(me, other, nickname);

  let step: string;
  let question: string;
  if (pillar === 'other') {
    const a = other ? crossAspects(me, other)[0] : undefined;
    step = fill(OTHER_STEPS[a?.aspect ?? 'none']);
    question = fill('What could you ask {name} instead of assuming?');
  } else {
    const keyPlanet = pillar === 'self' ? 'Moon' : pillar === 'purpose' ? 'Mercury' : 'Venus';
    const e = el(wSign(me, keyPlanet));
    step = STEPS[pillar][e];
    question = QUESTIONS[pillar][e];
  }
  return { western, vedic, together: together(pillar, me, other, nickname), question, step, stepInvolvesOther: pillar === 'other' };
}
