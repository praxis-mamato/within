/**
 * Cycles: the periods you are in now and coming up, in plain language, built from slow transits,
 * the progressed Moon, and the Vedic dasha. Draft text for the approver.
 */
import { yearAhead, progressions, type AspectName } from '../astro/progressions';
import type { NatalChart } from '../astro/natal';
import { PROGRESSED_MOON_SIGN } from './progressions';
import * as V from './vedic';

type Cls = 'conj' | 'hard' | 'soft';
const cls = (a: AspectName): Cls => (a === 'conjunct' ? 'conj' : a === 'square' || a === 'opposite' ? 'hard' : 'soft');

export const CYCLE_TITLE: Record<string, Record<Cls, string>> = {
  Jupiter: { conj: 'A season of growth', hard: 'A stretch toward more', soft: 'Open doors' },
  Saturn: { conj: 'A time of commitment', hard: 'A season of rebuilding', soft: 'Steady ground' },
  Uranus: { conj: 'Breaking free', hard: 'A shake-up', soft: 'Fresh air' },
  Neptune: { conj: 'Dissolving old shapes', hard: 'Fog and longing', soft: 'Quiet inspiration' },
  Pluto: { conj: 'Deep change', hard: 'Pressure to transform', soft: 'Steady empowerment' },
};

export const CYCLE_FEEL: Record<string, Record<Cls, string>> = {
  Jupiter: {
    conj: 'This can feel like a widening: more possibility, more confidence, more people and ideas arriving. The risk is saying yes to everything.',
    hard: 'This can feel like wanting more than your current life holds. Hope runs high, and so can the urge to overdo it.',
    soft: 'This can feel lighter and luckier than usual. Help may come from unexpected places, and small efforts can go further.',
  },
  Saturn: {
    conj: 'This can feel serious and weighty, like being asked to grow up a little more. What is solid gets stronger; what is not may need repair.',
    hard: 'This can feel like friction, delay, or tiredness, as if life is asking you to slow down and check your foundations.',
    soft: 'This can feel steady and productive. Patient effort is rewarded, and structure feels supportive rather than limiting.',
  },
  Uranus: {
    conj: 'This can feel electric and unsettled, with a strong wish to change something, sometimes suddenly. Old routines may stop fitting.',
    hard: 'This can feel restless or disruptive: surprises, impatience, a need for space. Underneath is usually a real need for more freedom.',
    soft: 'This can feel refreshing. New ideas, people, or experiments may arrive and fit easily into your life.',
  },
  Neptune: {
    conj: 'This can feel dreamy, tender, or unclear, as if the edges of things are softening. Imagination and compassion grow; so can confusion.',
    hard: 'This can feel foggy: uncertainty about what you want, idealizing people or plans, or feeling tired without a clear reason.',
    soft: 'This can feel gentle and inspired. Creativity, intuition, and spiritual interest may come more easily.',
  },
  Pluto: {
    conj: 'This can feel intense and slow-moving, like something old is ending at a deep level so something truer can take its place.',
    hard: 'This can feel like pressure, power struggles, or being pushed to face what you have outgrown.',
    soft: 'This can feel like a quiet strengthening: more focus, more resolve, and change that comes from within.',
  },
};

export const CYCLE_HELP: Record<string, Record<Cls, string>> = {
  Jupiter: { conj: 'Choose one or two things to grow, rather than everything.', hard: 'Keep an eye on proportion: time, money, promises.', soft: 'Act on the openings; they are easy to let pass.' },
  Saturn: { conj: 'Commit to what matters and let go of what you are only doing out of habit.', hard: 'Repair rather than push. Rest is part of the work.', soft: 'Put structure under a goal you care about.' },
  Uranus: { conj: 'Make room for change on purpose so it does not have to break in.', hard: 'Notice what you need freedom from, and change one thing deliberately.', soft: 'Try the experiment.' },
  Neptune: { conj: 'Check facts, sleep well, and give your imagination a creative outlet.', hard: 'Slow down big decisions and ask a grounded friend for perspective.', soft: 'Make time for art, music, nature, or practice.' },
  Pluto: { conj: 'Let what is ending end; you do not have to rush what comes next.', hard: 'Notice where you are holding on too tightly, and what you fear losing.', soft: 'Use the extra resolve on a change you have been putting off.' },
};

export const TOUCHES: Record<string, { label: string; area: string }> = {
  Sun: { label: 'your sense of self', area: 'It touches your identity and direction: who you are and where you are going.' },
  Moon: { label: 'your emotional life', area: 'It touches your feelings, home, and what makes you feel safe.' },
  Mercury: { label: 'your mind and voice', area: 'It touches how you think, talk, learn, and decide.' },
  Venus: { label: 'love and what you value', area: 'It touches relationships, pleasure, money, and what you find beautiful.' },
  Mars: { label: 'your drive', area: 'It touches your energy, ambition, and how you handle conflict.' },
  Jupiter: { label: 'your beliefs and growth', area: 'It touches your sense of meaning, opportunity, and optimism.' },
  Saturn: { label: 'your structures and responsibilities', area: 'It touches commitments, work, and the long-term shape of your life.' },
  Ascendant: { label: 'how you show up', area: 'It touches your body, your presence, and how you meet the world.' },
  Midheaven: { label: 'your path and public life', area: 'It touches career, reputation, and your direction in the world.' },
};

export const RETURNS: Record<string, { title: string; feel: string; helps: string }> = {
  Saturn: {
    title: 'Your Saturn return',
    feel: 'Saturn comes back to where it was when you were born about every 29 years. It is one of astrology’s best-known turning points: a time when the structures of your life are tested and you may decide, more consciously, what kind of adult life you want.',
    helps: 'Take stock honestly. Keep what is truly yours, and let go of what you took on to please others.',
  },
  Jupiter: {
    title: 'Your Jupiter return',
    feel: 'Jupiter comes back to its birth position about every 12 years, opening a new cycle of growth. It is often read as a time to set a new direction and widen your world.',
    helps: 'Name what you want to grow in the next twelve years, and take a first step.',
  },
};

export interface Cycle {
  id: string;
  kind: 'transit' | 'progressed' | 'dasha';
  tradition: 'Western' | 'Vedic';
  title: string;
  touches: string;
  start: string;
  end: string;
  peaks: string[];
  phase: 'Coming up' | 'Beginning' | 'Building' | 'At its peak' | 'In progress' | 'Integrating';
  /** 1 to 3. */
  intensity: number;
  feel: string;
  helps: string;
  basis: string;
}

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const MOVER_WEIGHT: Record<string, number> = { Pluto: 3, Neptune: 2.8, Uranus: 2.8, Saturn: 2.5, Jupiter: 1.5 };

function phaseOf(start: string, peaks: string[], today: string): Cycle['phase'] {
  if (today < start) return 'Coming up';
  const t = new Date(today).getTime();
  if (peaks.some((p) => Math.abs(new Date(p).getTime() - t) <= 10 * DAY)) return 'At its peak';
  if (peaks.length && today < peaks[0]) {
    const span = new Date(peaks[0]).getTime() - new Date(start).getTime();
    return t - new Date(start).getTime() < span / 3 ? 'Beginning' : 'Building';
  }
  if (peaks.length && today > peaks[peaks.length - 1]) return 'Integrating';
  return 'In progress';
}

/** The cycles active now, then those starting in the next 12 months, strongest first within each group. */
export function cycles(c: NatalChart, lat: number, lon: number, now = new Date()): { now: Cycle[]; next: Cycle[] } {
  const today = iso(now);
  const out: Cycle[] = [];
  // Look back 10 months so a cycle already under way shows its real start.
  const windows = yearAhead(c, lat, lon, new Date(now.getTime() - 300 * DAY), 300 + 366).filter((w) => w.end >= today);
  for (const w of windows) {
    const k = cls(w.aspect);
    const t = TOUCHES[w.natal];
    if (!t) continue;
    const ret = w.aspect === 'conjunct' && w.transiting === w.natal ? RETURNS[w.transiting] : undefined;
    const weight = MOVER_WEIGHT[w.transiting] * (['Sun', 'Moon', 'Ascendant', 'Midheaven'].includes(w.natal) ? 1.2 : 1) * (k === 'soft' ? 0.75 : 1.15) * (ret ? 1.3 : 1);
    out.push({
      id: `${w.transiting}-${w.aspect}-${w.natal}-${w.start}`,
      kind: 'transit',
      tradition: 'Western',
      title: ret?.title ?? CYCLE_TITLE[w.transiting][k],
      touches: ret ? 'a life-stage turning point' : t.label,
      start: w.start,
      end: w.end,
      peaks: w.exact,
      phase: phaseOf(w.start, w.exact, today),
      intensity: weight >= 3.2 ? 3 : weight >= 2 ? 2 : 1,
      feel: ret?.feel ?? `${CYCLE_FEEL[w.transiting][k]} ${t.area}`,
      helps: ret?.helps ?? CYCLE_HELP[w.transiting][k],
      basis: `Transiting ${w.transiting} ${w.aspect} your natal ${w.natal}`,
    });
  }

  // The progressed Moon's current chapter.
  const pr = progressions(c, lat, lon, now);
  if (pr.moon.enteredOn || pr.moon.nextIngress)
    out.push({
      id: `pmoon-${pr.moon.sign}`,
      kind: 'progressed',
      tradition: 'Western',
      title: `An emotional chapter in ${pr.moon.sign}`,
      touches: 'your inner life',
      start: pr.moon.enteredOn ?? iso(new Date(now.getTime() - 400 * DAY)),
      end: pr.moon.nextIngress ?? iso(new Date(now.getTime() + 400 * DAY)),
      peaks: [],
      phase: 'In progress',
      intensity: 2,
      feel: PROGRESSED_MOON_SIGN[pr.moon.sign],
      helps: 'Notice what you need more of in this chapter, and give it to yourself on purpose.',
      basis: `Progressed Moon in ${pr.moon.sign} (secondary progression, about two and a half years per sign)`,
    });

  // The Vedic dasha sub-period now.
  const cur = c.vedic.current;
  if (cur)
    out.push({
      id: `dasha-${cur.maha.lord}-${cur.antar.lord}`,
      kind: 'dasha',
      tradition: 'Vedic',
      title: `${cur.antar.lord} within ${cur.maha.lord}`,
      touches: 'the tone of this period',
      start: iso(cur.antar.start),
      end: iso(cur.antar.end),
      peaks: [],
      phase: 'In progress',
      intensity: 2,
      feel: `In Vedic timing you are in a ${cur.maha.lord} mahadasha, now colored by its ${cur.antar.lord} sub-period. ${cap(V.DASHA_DETAIL[cur.antar.lord])}.`,
      helps: `Work with ${cur.antar.lord}’s themes rather than against them.`,
      basis: `Vimshottari dasha: ${cur.maha.lord} mahadasha, ${cur.antar.lord} antardasha`,
    });

  const active = out.filter((x) => x.start <= today).sort((a, b) => b.intensity - a.intensity || a.end.localeCompare(b.end));
  const next = out.filter((x) => x.start > today).sort((a, b) => a.start.localeCompare(b.start));
  return { now: active, next };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
