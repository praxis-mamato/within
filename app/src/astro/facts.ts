/** Turns computed charts into the short fact lines each reflection's "Show the details" lists. */
import type { Pillar, Tradition } from '../data/fixtures';
import { tropicalLongitude, type DashaPeriod } from './chart';
import { crossAspects, fmtDeg, moonSignDistance, type NatalChart, type Uncertain } from './natal';

export interface Facts {
  facts: string[];
  unavailable: string[];
}

const either = (u: Uncertain<string>) => (u.certain ? u.value! : `${u.options.join(' or ')} (uncertain)`);
const w = (c: NatalChart, body: string) => {
  const p = c.western.planets.find((x) => x.body === body)!;
  return `${body} in ${p.sign} ${fmtDeg(p.degree)}${p.retrograde ? ' (retrograde)' : ''}${p.house ? `, house ${p.house}` : ''}`;
};
const v = (c: NatalChart, body: string) => {
  const p = c.vedic.planets.find((x) => x.body === body)!;
  return `${body} in ${p.rashi} (${p.sign}) ${fmtDeg(p.degree)}${p.house ? `, house ${p.house}` : ''}`;
};
const year = (d: Date) => d.getUTCFullYear();
const period = (p: DashaPeriod) => `${p.lord} (${year(p.start)}–${year(p.end)})`;

/** Slow planets in the sky now, aspecting the person's natal Sun, Moon, and Venus. */
export function currentTransits(c: NatalChart, now = new Date()) {
  const slow = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  const targets = ['Sun', 'Moon', 'Venus'];
  const aspects = [
    { name: 'conjunct', angle: 0 },
    { name: 'square', angle: 90 },
    { name: 'trine', angle: 120 },
    { name: 'opposite', angle: 180 },
  ];
  const out: string[] = [];
  for (const s of slow) {
    const lon = tropicalLongitude(s, now);
    for (const t of targets) {
      const n = c.western.planets.find((p) => p.body === t)!;
      const sep = Math.abs(((lon - n.longitude + 540) % 360) - 180);
      for (const a of aspects) if (Math.abs(sep - a.angle) <= 2) out.push(`${s} now ${a.name} your ${t} (orb ${fmtDeg(Math.abs(sep - a.angle))})`);
    }
  }
  return out;
}

export function factsFor(pillar: Pillar, tradition: Tradition, me: NatalChart, other: NatalChart | null, nickname = 'them', now = new Date()): Facts {
  if (tradition === 'western') {
    const asc = me.western.ascendant;
    const base = [w(me, 'Sun'), w(me, 'Moon'), ...(asc.options.length ? [`Rising sign: ${either(asc)}`] : [])];
    if (pillar === 'self') return { facts: [...base, w(me, 'Venus'), w(me, 'Mars')], unavailable: me.western.unavailable };
    if (pillar === 'purpose') return { facts: [w(me, 'Mercury'), w(me, 'Mars'), w(me, 'Saturn')], unavailable: me.western.unavailable };
    if (pillar === 'relationship') {
      const t = currentTransits(me, now);
      return { facts: [w(me, 'Venus'), ...(t.length ? t : ['No major slow-planet transits to your Sun, Moon, or Venus right now (within 2°).'])], unavailable: me.western.unavailable };
    }
    // other
    if (!other) return { facts: base, unavailable: [`${nickname}’s birth details aren’t added, so no comparison is included.`] };
    const asp = crossAspects(me, other).slice(0, 5);
    return {
      facts: [
        `${nickname}: ${w(other, 'Sun')}; ${w(other, 'Moon')}`,
        ...(asp.length ? asp.map((a) => `Your ${a.a} ${a.aspect} ${nickname}’s ${a.b} (orb ${fmtDeg(a.orb)})`) : ['No close aspects between your personal planets.']),
      ],
      unavailable: other.western.unavailable.map((u) => `${nickname}: ${u}`),
    };
  }

  const nak = me.vedic.moonNakshatra.certain ? `Moon nakshatra: ${me.vedic.nakshatra.name}, pada ${me.vedic.nakshatra.pada} (lord ${me.vedic.nakshatra.lord})` : `Moon nakshatra: ${either(me.vedic.moonNakshatra)}`;
  const lagna = me.vedic.lagna.options.length ? [`Lagna: ${either(me.vedic.lagna)}`] : [];
  const current = me.vedic.current ? [`Current dasha: ${period(me.vedic.current.maha)}, sub-period ${period(me.vedic.current.antar)}`] : [];
  const extra = [`Ayanamsa (Lahiri): ${fmtDeg(me.vedic.ayanamsa)}`];
  if (pillar === 'self') return { facts: [`Moon in ${either(me.vedic.moonRashi)}`, nak, ...lagna, v(me, 'Venus'), ...extra], unavailable: me.vedic.unavailable };
  if (pillar === 'purpose') return { facts: [v(me, 'Mercury'), v(me, 'Jupiter'), ...current], unavailable: me.vedic.unavailable };
  if (pillar === 'relationship') return { facts: [...(current.length ? current : ['Current dasha: not shown (see below)']), v(me, 'Venus'), ...extra], unavailable: me.vedic.unavailable };
  if (!other) return { facts: [`Your Moon in ${either(me.vedic.moonRashi)}`, nak], unavailable: [`${nickname}’s birth details aren’t added, so no comparison is included.`] };
  const dist = moonSignDistance(me, other);
  return {
    facts: [
      `Your Moon in ${either(me.vedic.moonRashi)}; ${nickname}’s Moon in ${either(other.vedic.moonRashi)}`,
      `${nickname}’s Moon nakshatra: ${either(other.vedic.moonNakshatra)}`,
      ...(dist ? [`${nickname}’s Moon is ${dist}${['st', 'nd', 'rd'][dist - 1] ?? 'th'} from yours (no compatibility score is given)`] : []),
    ],
    unavailable: other.vedic.unavailable.map((u) => `${nickname}: ${u}`),
  };
}

