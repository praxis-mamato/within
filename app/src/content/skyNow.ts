/**
 * The prominent transits right now, the same for everyone: planets retrograde (with their stations), the
 * nearest New or Full Moon, sign changes and stations within a few days, and exact aspects between the
 * planets this week. Given to the Oracle's AI answers and conversations, and to the social manager, so they
 * can name the real sky when it touches someone's question.
 */
import * as Astronomy from 'astronomy-engine';
import { BODIES, lahiriAyanamsa, meanNode, nakshatraOf, SIGNS, tropicalLongitude } from '../astro/chart';
import { westernDignity } from '../astro/progressions';

const DAY = 86400000;
const norm = (x: number) => ((x % 360) + 360) % 360;
const signOf = (lon: number) => SIGNS[Math.floor(norm(lon) / 30)];
const at = (lon: number) => `${Math.floor(norm(lon) % 30)}°${String(Math.floor(((norm(lon) % 30) % 1) * 60)).padStart(2, '0')}′ ${signOf(lon)}`;
const day = (t: number) => new Date(t).toISOString().slice(0, 10);
const speed = (b: (typeof BODIES)[number], t: number) => norm(tropicalLongitude(b, new Date(t + 3 * 3600000)) - tropicalLongitude(b, new Date(t - 3 * 3600000)) + 180) - 180;

/** The moment a planet's motion turns, searched in 6-hour steps, then narrowed to the hour. */
function station(b: (typeof BODIES)[number], from: number, to: number, dir: 1 | -1): number | null {
  const step = 6 * 3600000 * dir;
  let prev = speed(b, from);
  for (let t = from + step; dir > 0 ? t <= to : t >= to; t += step) {
    const s = speed(b, t);
    if (Math.sign(s) !== Math.sign(prev)) {
      let lo = t - step;
      let hi = t;
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        if (Math.sign(speed(b, mid)) === Math.sign(speed(b, lo))) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    prev = s;
  }
  return null;
}


/** When the angle between two bodies passes exactly through an aspect (either side, so conjunctions count). */
function exactTimes(a: (typeof BODIES)[number], b: (typeof BODIES)[number], angle: number, from: number, to: number, step: number): number[] {
  const f = (t: number, sideSign: number) => norm(tropicalLongitude(a, new Date(t)) - tropicalLongitude(b, new Date(t)) - sideSign * angle + 180) - 180;
  const out: number[] = [];
  for (const side of angle === 0 || angle === 180 ? [1] : [1, -1]) {
    let prev = f(from, side);
    for (let t = from + step; t <= to; t += step) {
      const c = f(t, side);
      if (Math.sign(c) !== Math.sign(prev) && Math.abs(c - prev) < 90) {
        let lo = t - step;
        let hi = t;
        for (let i = 0; i < 10; i++) {
          const mid = (lo + hi) / 2;
          if (Math.sign(f(mid, side)) === Math.sign(prev)) lo = mid;
          else hi = mid;
        }
        out.push((lo + hi) / 2);
      }
      prev = c;
    }
  }
  return out.sort((x, y) => x - y);
}

const SLOW = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
const ASPECTS: [number, string][] = [
  [0, 'conjunct'],
  [60, 'sextile'],
  [90, 'square'],
  [120, 'trine'],
  [180, 'opposite'],
];

let cache: { hour: number; lines: string[] } | null = null;

export function skyNow(now = new Date()): string[] {
  const hour = Math.floor(now.getTime() / 3600000);
  if (cache?.hour !== hour) cache = { hour, lines: compute(now) };
  return cache.lines;
}

function compute(now: Date): string[] {
  const t0 = now.getTime();
  const out: string[] = [];

  // Retrogrades, with the station that began them and the one that ends them.
  for (const b of SLOW) {
    if (speed(b, t0) >= 0) continue;
    const began = station(b, t0, t0 - (['Mercury', 'Venus', 'Mars'].includes(b) ? 90 : 200) * DAY, -1);
    const ends = station(b, t0, t0 + (['Mercury', 'Venus', 'Mars'].includes(b) ? 90 : 200) * DAY, 1);
    out.push(
      `${b} retrograde now, at ${at(tropicalLongitude(b, now))}${began ? `; stationed retrograde ${day(began)} at ${at(tropicalLongitude(b, new Date(began)))}` : ''}${ends ? `; stations direct ${day(ends)} at ${at(tropicalLongitude(b, new Date(ends)))}` : ''} (sky now)`,
    );
  }

  // Stations and sign changes within three days either side.
  for (const b of ['Sun', ...SLOW] as const) {
    if (b !== 'Sun') {
      const st = station(b, t0 - 3 * DAY, t0 + 3 * DAY, 1);
      if (st && !out.some((x) => x.startsWith(`${b} retrograde`) && x.includes(day(st)))) out.push(`${b} stations ${speed(b, st + DAY) < 0 ? 'retrograde' : 'direct'} ${day(st)} at ${at(tropicalLongitude(b, new Date(st)))} (sky now)`);
    }
    let prevSign = signOf(tropicalLongitude(b, new Date(t0 - 3 * DAY)));
    for (let t = t0 - 3 * DAY + 6 * 3600000; t <= t0 + 3 * DAY; t += 6 * 3600000) {
      const s = signOf(tropicalLongitude(b, new Date(t)));
      if (s !== prevSign) out.push(`${b} enters ${s} ${day(t)} (sky now)`);
      prevSign = s;
    }
  }

  // The nearest New and Full Moon (within a week either side).
  for (const [angle, kind] of [
    [0, 'New Moon'],
    [180, 'Full Moon'],
  ] as const) {
    const t = Astronomy.SearchMoonPhase(angle, new Date(t0 - 7 * DAY), 14);
    if (t && Math.abs(t.date.getTime() - t0) <= 7 * DAY) out.push(`${kind} ${t.date.toISOString().slice(0, 16).replace('T', ' ')} UTC at ${at(tropicalLongitude('Moon', t.date))} (sky now)`);
  }

  // Exact aspects between planets (Sun to Pluto) within three days either side.
  const P = ['Sun', ...SLOW] as const;
  for (let i = 0; i < P.length; i++)
    for (let j = i + 1; j < P.length; j++)
      for (const [a, name] of ASPECTS)
        for (const t of exactTimes(P[i], P[j], a, t0 - 3 * DAY, t0 + 3 * DAY, 3 * 3600000))
          out.push(`${P[i]} ${name} ${P[j]} exact ${day(t)}${i === 0 && a === 0 && (P[j] === 'Mercury' || P[j] === 'Venus') ? ` (cazimi, ${speed(P[j], t) < 0 ? 'the inferior conjunction at the heart of the retrograde' : 'the superior conjunction'})` : ''} (${at(tropicalLongitude(P[i], new Date(t)))} / ${at(tropicalLongitude(P[j], new Date(t)))}) (sky now)`);

  // Eclipses: the last one if within six weeks, and the next one of each kind.
  const eclipse = (kind: string, t: number) => `${kind} ${day(t)} at ${at(tropicalLongitude(kind.includes('solar') ? 'Sun' : 'Moon', new Date(t)))} (sky now)`;
  for (const [kind, find] of [
    ['solar eclipse', (d: Date) => Astronomy.SearchGlobalSolarEclipse(d).peak.date.getTime()],
    ['lunar eclipse', (d: Date) => Astronomy.SearchLunarEclipse(d).peak.date.getTime()],
  ] as const) {
    let t = find(new Date(t0 - 42 * DAY));
    if (t < t0) {
      out.push(eclipse(`Last ${kind}`, t));
      t = find(new Date(t + DAY));
    }
    out.push(eclipse(`Next ${kind}`, t));
  }

  // The long cycles: slow planets (Jupiter to Pluto) within orb of each other, with when it was or is exact.
  const OUTER = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  for (let i = 0; i < OUTER.length; i++)
    for (let j = i + 1; j < OUTER.length; j++) {
      const sep = (t: number) => {
        const d0 = norm(tropicalLongitude(OUTER[i], new Date(t)) - tropicalLongitude(OUTER[j], new Date(t)));
        return d0 > 180 ? 360 - d0 : d0;
      };
      const d = sep(t0);
      const hit = ASPECTS.find(([a]) => Math.abs(d - a) <= (a === 0 || a === 180 ? 8 : 4));
      if (!hit) continue;
      const exact = exactTimes(OUTER[i], OUTER[j], hit[0], t0 - 730 * DAY, t0 + 730 * DAY, 2 * DAY).map(day);
      out.push(`${OUTER[i]} ${hit[1]} ${OUTER[j]}, ${Math.abs(d - hit[0]).toFixed(1)}° from exact${exact.length ? `; exact ${exact.join(', ')}` : ''}; a long cycle (sky now)`);
    }

  // Where every planet stands now, in both zodiacs.
  const ayan = lahiriAyanamsa(now);
  for (const b of ['Sun', 'Moon', ...SLOW] as const) {
    const lon = tropicalLongitude(b, now);
    const dig = westernDignity(b, signOf(lon));
    const nak = nakshatraOf(lon - ayan);
    out.push(`${b} now at ${at(lon)}${dig ? ` (${dig.toLowerCase()})` : ''}${b !== 'Sun' && b !== 'Moon' && speed(b, t0) < 0 ? ', retrograde' : ''}; Vedic ${signOf(lon - ayan)}, ${nak.name} nakshatra pada ${nak.pada} (sky now)`);
  }
  const node = meanNode(now);
  out.push(`North Node at ${at(node)}, South Node at ${at(node + 180)}; Vedic Rahu in ${signOf(node - ayan)}, Ketu in ${signOf(node + 180 - ayan)} (sky now)`);
  const phase = Astronomy.MoonPhase(now);
  const PHASES = ['New', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  out.push(`The Moon is ${PHASES[Math.floor(((phase + 22.5) % 360) / 45)].toLowerCase()} (${Math.round(Astronomy.Illumination(Astronomy.Body.Moon, now).phase_fraction * 100)}% lit), tithi ${Math.floor(phase / 12) + 1} of 30 (sky now)`);
  return out.slice(0, 48);
}
