/**
 * Your chart's energy: where the birth chart holds tension (squares and oppositions), where energy
 * flows without effort (trines and sextiles), and where planets fuse (conjunctions); which planets are
 * the cause, how to release the tension, and what the high road and low road look like for each. Then
 * the retrogrades you were born with and those in the sky now, and which of these patterns your
 * progressions and the year's slow transits are activating.
 */
import { tropicalLongitude } from '../astro/chart';
import { allAspects } from '../astro/deep';
import { fmtDeg, type NatalChart } from '../astro/natal';
import { progressions, yearAhead } from '../astro/progressions';
import type { SkyLine } from './today';
import * as W from './western';

export type EnergyKind = 'tension' | 'flow' | 'fusion';

/** Each planet at its best. */
export const PLANET_HIGH: Record<string, string> = {
  Sun: 'confident, warm, generous with your light',
  Moon: 'emotionally honest, caring, attuned',
  Mercury: 'curious, clear, a good listener',
  Venus: 'loving, fair, able to enjoy',
  Mars: 'brave, direct, willing to act',
  Jupiter: 'hopeful, wise, generous',
  Saturn: 'steady, responsible, patient',
  Uranus: 'original, free, open to change',
  Neptune: 'compassionate, imaginative, spiritual',
  Pluto: 'deep, honest about power, able to transform',
};
/** Each planet when it is under strain. */
export const PLANET_LOW: Record<string, string> = {
  Sun: 'needing to be seen, proud, or drained',
  Moon: 'moody, clingy, or shut down',
  Mercury: 'overthinking, nervous, or sharp-tongued',
  Venus: 'people-pleasing, indulgent, or jealous',
  Mars: 'impatient, angry, or picking fights',
  Jupiter: 'overpromising, excessive, or preachy',
  Saturn: 'rigid, fearful, or hard on yourself',
  Uranus: 'restless, erratic, or detached',
  Neptune: 'escaping, confused, or blurring boundaries',
  Pluto: 'controlling, suspicious, or all-or-nothing',
};
/** A way to move each planet's energy when it is stuck. */
export const PLANET_RELEASE: Record<string, string> = {
  Sun: 'do one thing that is just for you, and let yourself be seen doing it',
  Moon: 'name the feeling out loud, then rest or eat something warm',
  Mercury: 'write it down; a page of words empties a busy mind',
  Venus: 'make something beautiful, or ask plainly for what you want',
  Mars: 'move your body hard, then choose one direct action',
  Jupiter: 'pick the one thing that matters and say no to the rest',
  Saturn: 'make a small plan with a real end date, and keep it',
  Uranus: 'change one routine on purpose, so change does not have to break in',
  Neptune: 'music, water, or prayer, then check the facts',
  Pluto: 'tell the whole truth to someone safe, then let one thing go',
};
/** The retrogrades you were born with: the energy that works inward first. */
export const NATAL_RX: Record<string, string> = {
  Mercury: 'Your mind works inward first: you think things through deeply before you speak, and you may return to ideas others have moved past.',
  Venus: 'Your values and affections are inward and particular: you love on your own terms and take time to trust what you want.',
  Mars: 'Your drive works inward first: you may hold back, then act with great focus once you are sure.',
  Jupiter: 'Your faith and growth are personal: meaning comes from your own experience more than from teachers.',
  Saturn: 'Your sense of duty is self-imposed: you may set the bar higher for yourself than anyone else would.',
  Uranus: 'Your need for freedom works inwardly: change starts in your own mind long before it shows.',
  Neptune: 'Your imagination runs deep and private: your inner world is rich, and boundaries matter.',
  Pluto: 'Your power works inwardly: deep change happens in you quietly, often unseen by others.',
};

export const ENERGY_TEXT = {
  intro: 'Every aspect between your birth planets, read as energy: where it pulls, where it flows, and where it fuses.',
  tension: 'Tension: squares and oppositions. These are where you grow fastest, and where you feel stuck when the energy has nowhere to go.',
  flow: 'Flow: trines and sextiles. These come easily, which is a gift and a risk: easy energy is easy to take for granted.',
  fusion: 'Fusion: conjunctions. Two planets act as one, for better and for worse.',
  flowLow: 'coasting on it, taking it for granted, or using the easy way out',
  flowHigh: 'using it on purpose, as a strength you lend to the harder parts of your life',
  release: 'To release it',
  noRx: 'None of your personal planets was retrograde when you were born.',
  skyRx: 'Retrograde in the sky now',
  noSkyRx: 'No planet is retrograde right now.',
  active: 'Lit up now',
  noActive: 'None of these patterns is being set off by a progression or a slow transit right now.',
};

const KIND: Record<string, EnergyKind> = { square: 'tension', opposition: 'tension', trine: 'flow', sextile: 'flow', conjunction: 'fusion' };
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const PERSONAL = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtDate = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export interface EnergyAspect {
  a: string;
  b: string;
  aspect: string;
  orb: number;
  kind: EnergyKind;
  about: string;
  high: string;
  low: string;
  release: string;
  /** What is setting this off now: progressions and slow transits. */
  active: string[];
}

export function chartEnergy(c: NatalChart, place: { lat: number; lon: number }, now = new Date()) {
  const pr = progressions(c, place.lat, place.lon, now);
  const yr = yearAhead(c, place.lat, place.lon, now);
  const today = now.toISOString().slice(0, 10);
  const aspects: EnergyAspect[] = allAspects(c)
    .filter((x) => KIND[x.aspect] && PLANETS.includes(x.a) && PLANETS.includes(x.b))
    // Outer-planet pairs are generational; keep the ones that touch a personal planet.
    .filter((x) => PERSONAL.includes(x.a) || PERSONAL.includes(x.b) || ['Jupiter', 'Saturn'].includes(x.a))
    .map((x) => {
      const kind = KIND[x.aspect];
      const pair = W.PAIR[`${x.a}-${x.b}`];
      const active = [
        ...pr.contacts.filter((p) => p.natal === x.a || p.natal === x.b).slice(0, 2).map((p) => `progressed ${p.progressed} ${p.aspect} your ${p.natal}${p.exact ? `, exact around ${fmtDate(p.exact)}` : ''}`),
        ...yr.filter((w) => (w.natal === x.a || w.natal === x.b) && w.end >= today).slice(0, 2).map((w) => `${w.transiting} ${w.aspect} your ${w.natal}, ${fmtDate(w.start)} to ${fmtDate(w.end)}`),
      ];
      return {
        a: x.a,
        b: x.b,
        aspect: x.aspect,
        orb: x.orb,
        kind,
        about: `${pair ? `This links ${pair}. ` : ''}${cap(W.PLANET_FUNCTION[x.a])} and ${W.PLANET_FUNCTION[x.b]} ${W.ASPECT_MEANING[x.aspect]}.`,
        high: kind === 'flow' ? `${cap(ENERGY_TEXT.flowHigh)}: ${PLANET_HIGH[x.a]}, and ${PLANET_HIGH[x.b]}.` : `${cap(PLANET_HIGH[x.a])}, and ${PLANET_HIGH[x.b]}: the two working together.`,
        low: kind === 'flow' ? `${cap(ENERGY_TEXT.flowLow)}.` : `${cap(PLANET_LOW[x.a])}, set against ${PLANET_LOW[x.b]}.`,
        release: `${cap(PLANET_RELEASE[x.a])}; or ${PLANET_RELEASE[x.b]}.`,
        active,
      };
    })
    .sort((p, q) => p.orb - q.orb);
  const natalRx = c.western.planets.filter((p) => p.retrograde && NATAL_RX[p.body]).map((p) => ({ heading: `${p.body} retrograde in ${p.sign}`, text: NATAL_RX[p.body], basis: `${fmtDeg(p.degree)} ${p.sign} at birth` }));
  const skyRx = (['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const).filter((b) => {
    const d = ((tropicalLongitude(b, new Date(now.getTime() + 43200000)) - tropicalLongitude(b, new Date(now.getTime() - 43200000)) + 540) % 360) - 180;
    return d < 0;
  });
  return { aspects, natalRx, skyRx };
}

/** The energy map as layers for the Oracle. */
export function energyLayers(e: ReturnType<typeof chartEnergy>) {
  const line = (x: EnergyAspect): SkyLine => ({
    heading: `${x.a} ${x.aspect} ${x.b}`,
    text: `${x.about} ${ENERGY_TEXT.release}: ${x.release.charAt(0).toLowerCase()}${x.release.slice(1)}`,
    basis: `Orb ${fmtDeg(x.orb)}${x.active.length ? ` · ${ENERGY_TEXT.active}: ${x.active[0]}` : ''}`,
  });
  const roads = (x: EnergyAspect): SkyLine[] => [
    { heading: `${x.a} ${x.aspect} ${x.b}: the high road`, text: x.high },
    { heading: `${x.a} ${x.aspect} ${x.b}: the low road`, text: x.low },
  ];
  const tension = e.aspects.filter((x) => x.kind === 'tension');
  const flow = e.aspects.filter((x) => x.kind === 'flow');
  const fusion = e.aspects.filter((x) => x.kind === 'fusion');
  const active = e.aspects.filter((x) => x.active.length);
  return [
    { title: 'Where you hold tension', tradition: 'Western' as const, lines: [{ heading: '', text: `${ENERGY_TEXT.intro} ${ENERGY_TEXT.tension}` }, ...tension.slice(0, 6).map(line)] },
    { title: 'Where energy flows', tradition: 'Western' as const, lines: [{ heading: '', text: ENERGY_TEXT.flow }, ...flow.slice(0, 6).map(line)] },
    ...(fusion.length ? [{ title: 'Where planets fuse', tradition: 'Western' as const, lines: [{ heading: '', text: ENERGY_TEXT.fusion }, ...fusion.slice(0, 4).map(line)] }] : []),
    { title: 'High road and low road', tradition: 'Western' as const, lines: [...tension.slice(0, 3), ...flow.slice(0, 2)].flatMap(roads) },
    {
      title: 'Lit up now: progressions and transits',
      tradition: 'Western' as const,
      lines: active.length ? active.slice(0, 6).map((x) => ({ heading: `${x.a} ${x.aspect} ${x.b}`, text: `${cap(x.active.join('; '))}.`, basis: x.kind === 'tension' ? 'A tension being set off' : x.kind === 'flow' ? 'A flow being opened' : 'A fusion being stirred' })) : [{ heading: '', text: ENERGY_TEXT.noActive }],
    },
    {
      title: 'Retrogrades: at birth and now',
      tradition: 'Western' as const,
      lines: [...(e.natalRx.length ? e.natalRx : [{ heading: '', text: ENERGY_TEXT.noRx }]), { heading: ENERGY_TEXT.skyRx, text: e.skyRx.length ? `${e.skyRx.join(', ')}.` : ENERGY_TEXT.noSkyRx }],
    },
  ];
}
