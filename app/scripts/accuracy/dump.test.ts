/**
 * Accuracy audit, step 1: dumps the engine's positions, houses, nakshatras, transit dates, Saturn
 * returns, lunations, and stations for 400 pseudo-random births. Step 2 (compare.py) recomputes
 * everything with Swiss Ephemeris and reports the share that matches. See README.md.
 * Run: AUDIT_OUT=/tmp/engine.json npx vitest run scripts/accuracy/dump.test.ts --dir .
 */
import { writeFileSync } from 'node:fs';
import { ascendantAndMidheaven, lahiriAyanamsa, placidusCusps } from '../../src/astro/chart';
import { computeNatal } from '../../src/astro/natal';
import { monthAhead } from '../../src/astro/deep';
import { weekAhead } from '../../src/astro/week';
import { nextReturn } from '../../src/content/oracleEngine';

let seed = 42;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
it.skipIf(!process.env.AUDIT_OUT)('dumps engine output', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  const charts = [];
  for (let i = 0; i < 400; i++) {
    const t = Date.UTC(1930, 0, 1) + rnd() * (Date.UTC(2024, 11, 31) - Date.UTC(1930, 0, 1));
    const d = new Date(Math.floor(t / 60000) * 60000);
    const lat = Math.round((-55 + rnd() * 115) * 100) / 100;
    const lon = Math.round((-180 + rnd() * 360) * 100) / 100;
    const b = { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16), timePrecision: 'exact' as const, windowMinutes: 60, lat, lon, tz: 'UTC' };
    const c = computeNatal(b, now);
    const am = ascendantAndMidheaven(c.utc, lat, lon);
    charts.push({
      utc: c.utc.toISOString(),
      lat,
      lon,
      planets: Object.fromEntries(c.western.planets.map((p) => [p.body, { lon: p.longitude, rx: p.retrograde, house: p.house ?? null }])),
      asc: am.asc,
      mc: am.mc,
      cusps: placidusCusps(c.utc, lat, lon),
      ayanamsa: lahiriAyanamsa(c.utc),
      nakshatra: c.vedic.nakshatra.name,
      pada: c.vedic.nakshatra.pada,
      saturnReturn: i < 60 ? nextReturn(c, 'Saturn', now).passes : null,
      contacts: i < 40 ? weekAhead(c, lat, lon, now, 30).movers.flatMap((m) => m.contacts.map((x) => ({ mover: m.mover, aspect: x.aspect, natal: x.natal, natalLon: x.natalLon, date: x.date }))) : [],
    });
  }
  const base = computeNatal({ date: '1985-07-14', time: '06:30', timePrecision: 'exact', windowMinutes: 60, lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' });
  const m = monthAhead(base, new Date('2026-01-01T00:00:00Z'), 730);
  writeFileSync(process.env.AUDIT_OUT!, JSON.stringify({ charts, lunar: m.lunar, stations: m.stations }));
}, 120000);
