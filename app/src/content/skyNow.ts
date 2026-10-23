/**
 * The prominent transits right now, the same for everyone: planets retrograde (with their stations), the
 * nearest New or Full Moon, sign changes and stations within a few days, and exact aspects between the
 * planets this week. Given to the Oracle's AI answers and conversations, and to the social manager, so they
 * can name the real sky when it touches someone's question.
 */
import * as Astronomy from 'astronomy-engine';
import { BODIES, SIGNS, tropicalLongitude } from '../astro/chart';

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

const SLOW = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
const ASPECTS: [number, string][] = [
  [0, 'conjunct'],
  [60, 'sextile'],
  [90, 'square'],
  [120, 'trine'],
  [180, 'opposite'],
];

export function skyNow(now = new Date()): string[] {
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
    for (let j = i + 1; j < P.length; j++) {
      let prev: number | null = null;
      for (let t = t0 - 3 * DAY; t <= t0 + 3 * DAY; t += 3 * 3600000) {
        const d0 = norm(tropicalLongitude(P[i], new Date(t)) - tropicalLongitude(P[j], new Date(t)));
        const d = d0 > 180 ? 360 - d0 : d0;
        if (prev !== null)
          for (const [a, name] of ASPECTS)
            if ((prev - a) * (d - a) <= 0 && Math.abs(prev - d) < 5) out.push(`${P[i]} ${name} ${P[j]} exact ${day(t)} (${at(tropicalLongitude(P[i], new Date(t)))} / ${at(tropicalLongitude(P[j], new Date(t)))}) (sky now)`);
        prev = d;
      }
    }

  out.push(`The Sun is in ${signOf(tropicalLongitude('Sun', now))}; the Moon is in ${signOf(tropicalLongitude('Moon', now))} today (sky now)`);
  return out.slice(0, 20);
}
