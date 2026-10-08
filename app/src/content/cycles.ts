/**
 * Cycles: the periods you are in now and coming up, in plain language, built from slow transits,
 * the progressed Moon, and the Vedic dasha. Draft text for the approver.
 */
import { yearAhead, progressions, type AspectName } from '../astro/progressions';
import type { NatalChart } from '../astro/natal';
import { PROGRESSED_MOON_SIGN } from './progressions';
import { AREAS, MOVER_AREA, MOVER_TARGET, SEASONS, TARGET_AREAS, type Area, type Profile } from './mirror';
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

/** One natal point a slow planet is touching, with its own line. */
export interface Contact {
  transiting: string;
  aspect: AspectName;
  natal: string;
  touches: string;
  start: string;
  end: string;
  peaks: string[];
  line: string;
  /** True when it touches an area the person said is on their mind. */
  forYou: boolean;
}

/** A season: everything one slow planet (or the progressed Moon, or the dasha) is doing for you now. */
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
  contacts: Contact[];
  /** Lines written for the areas the person said are on their mind. */
  forYou: string[];
}

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const MOVER_WEIGHT: Record<string, number> = { Pluto: 3, Neptune: 2.8, Uranus: 2.8, Saturn: 2.5, Jupiter: 1.5 };
const weightOf = (mover: string, natal: string, k: Cls) => MOVER_WEIGHT[mover] * (['Sun', 'Moon', 'Ascendant', 'Midheaven'].includes(natal) ? 1.2 : 1) * (k === 'soft' ? 0.75 : 1.15);

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

/**
 * The seasons you are in now (one per slow planet, plus the progressed Moon and the dasha), and the
 * individual contacts starting in the next 12 months. Areas the person named come first.
 */
export function cycles(c: NatalChart, lat: number, lon: number, now = new Date(), profile: Profile | null = null): { now: Cycle[]; next: Contact[] } {
  const today = iso(now);
  const onMind = new Set<Area>(profile?.onMind ?? []);
  // Look back 10 months so a contact already under way shows its real start.
  const windows = yearAhead(c, lat, lon, new Date(now.getTime() - 300 * DAY), 300 + 366).filter((w) => w.end >= today && TOUCHES[w.natal]);
  const contact = (w: (typeof windows)[number]): Contact => ({
    transiting: w.transiting,
    aspect: w.aspect,
    natal: w.natal,
    touches: TOUCHES[w.natal].label,
    start: w.start,
    end: w.end,
    peaks: w.exact,
    line: w.aspect === 'conjunct' && w.transiting === w.natal ? RETURNS[w.transiting]?.feel ?? MOVER_TARGET[w.transiting][w.natal] : MOVER_TARGET[w.transiting][w.natal],
    forYou: (TARGET_AREAS[w.natal] ?? []).some((a) => onMind.has(a)),
  });

  const out: Cycle[] = [];
  const active = windows.filter((w) => w.start <= today);
  for (const mover of ['Pluto', 'Neptune', 'Uranus', 'Saturn', 'Jupiter']) {
    const ws = active.filter((w) => w.transiting === mover);
    if (!ws.length) continue;
    const contacts = ws.map(contact).sort((a, b) => Number(b.forYou) - Number(a.forYou) || a.start.localeCompare(b.start));
    // The strongest contact sets the season's tone.
    const lead = [...ws].sort((a, b) => weightOf(mover, b.natal, cls(b.aspect)) - weightOf(mover, a.natal, cls(a.aspect)))[0];
    const k = cls(lead.aspect);
    const ret = lead.aspect === 'conjunct' && lead.transiting === lead.natal ? RETURNS[mover] : undefined;
    const peaks = [...new Set(ws.flatMap((w) => w.exact))].sort();
    const start = ws.map((w) => w.start).sort()[0];
    const areas = [...new Set(ws.flatMap((w) => TARGET_AREAS[w.natal] ?? []))].filter((a) => onMind.has(a));
    const weight = weightOf(mover, lead.natal, k) * (ret ? 1.3 : 1);
    out.push({
      id: `season-${mover}`,
      kind: 'transit',
      tradition: 'Western',
      title: ret?.title ?? `${mover} · ${CYCLE_TITLE[mover][k]}`,
      touches: contacts.map((x) => x.touches).filter((v, i, a) => a.indexOf(v) === i).join(', '),
      start,
      end: ws.map((w) => w.end).sort().reverse()[0],
      peaks,
      phase: phaseOf(start, peaks, today),
      intensity: weight >= 3.2 ? 3 : weight >= 2 ? 2 : 1,
      feel: ret ? ret.feel : CYCLE_FEEL[mover][k],
      helps: ret ? ret.helps : CYCLE_HELP[mover][k],
      basis: ws.map((w) => `${w.transiting} ${w.aspect} natal ${w.natal}`).join('; '),
      contacts,
      forYou: areas.map((a) => MOVER_AREA[mover][a]).filter((x): x is string => Boolean(x)).slice(0, 2),
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
      helps: profile?.season ? `You described this as a time of ${SEASONS[profile.season] ?? profile.season.toLowerCase()}. Ask what this chapter needs from you within that.` : 'Notice what you need more of in this chapter, and give it to yourself on purpose.',
      basis: `Progressed Moon in ${pr.moon.sign} (secondary progression, about two and a half years per sign)`,
      contacts: [],
      forYou: [],
    });

  // The Vedic dasha sub-period now.
  const cur = c.vedic.current;
  if (cur)
    out.push({
      id: `dasha-${cur.maha.lord}-${cur.antar.lord}`,
      kind: 'dasha',
      tradition: 'Vedic',
      title: `Vedic period · ${cur.antar.lord} within ${cur.maha.lord}`,
      touches: 'the tone of this period',
      start: iso(cur.antar.start),
      end: iso(cur.antar.end),
      peaks: [],
      phase: 'In progress',
      intensity: 2,
      feel: `In Vedic timing you are in a ${cur.maha.lord} mahadasha, now colored by its ${cur.antar.lord} sub-period. ${cap(V.DASHA_DETAIL[cur.antar.lord])}.`,
      helps: `Work with ${cur.antar.lord}’s themes rather than against them.`,
      basis: `Vimshottari dasha: ${cur.maha.lord} mahadasha, ${cur.antar.lord} antardasha`,
      contacts: [],
      forYou: [],
    });

  const ranked = out.sort((a, b) => Number(b.forYou.length > 0) - Number(a.forYou.length > 0) || b.intensity - a.intensity);
  // Coming up: one line per new contact, the same planet and point only once.
  const seen = new Set<string>();
  const next = windows
    .filter((w) => w.start > today)
    .sort((a, b) => a.start.localeCompare(b.start))
    .filter((w) => (seen.has(w.transiting + w.natal) ? false : (seen.add(w.transiting + w.natal), true)))
    .map(contact);
  return { now: ranked, next };
}

export const AREA_LABEL = AREAS;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
