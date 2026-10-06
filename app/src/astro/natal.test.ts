import ref from './reference.swisseph.json';
import { RASHIS, SIGNS } from './chart';
import { computeNatal, crossAspects, moonSignDistance } from './natal';

// Mumbai 1985-11-23 08:35 IST = 03:05 UTC (reference case).
const mumbai = { date: '1985-11-23', time: '08:35', windowMinutes: 60, lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' };
const r = ref.find((c) => c.name === 'Mumbai 1985')!;
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('computeNatal with an exact time', () => {
  const c = computeNatal({ ...mumbai, timePrecision: 'exact' }, new Date('2026-10-06T00:00:00Z'));
  it('resolves the birth instant through the time zone', () => {
    expect(c.utc.toISOString()).toBe('1985-11-23T03:05:00.000Z');
    expect(c.offsetLabel).toBe('UTC+05:30');
  });
  it('matches Swiss Ephemeris rising sign and Lahiri placements', () => {
    expect(c.western.ascendant.value).toBe(SIGNS[Math.floor(r.asc / 30)]);
    expect(c.vedic.lagna.value).toBe(RASHIS[Math.floor(r.siderealAsc / 30)]);
    for (const p of c.vedic.planets.filter((x) => x.body in r.sidereal)) {
      expect(diff(p.longitude, (r.sidereal as Record<string, number>)[p.body])).toBeLessThan(0.01);
    }
  });
  it('includes houses, dasha dates, and the current period', () => {
    expect(c.western.houseSystem).toBe('Placidus');
    expect(c.western.planets.every((p) => p.body === 'Node' || p.house)).toBe(true);
    expect(c.vedic.dashas).toHaveLength(9);
    expect(c.vedic.current).not.toBeNull();
    expect(c.western.unavailable).toEqual([]);
  });
});

describe('computeNatal with an unknown time', () => {
  const c = computeNatal({ ...mumbai, time: '', timePrecision: 'unknown' });
  it('never shows a rising sign, houses, or dasha dates', () => {
    expect(c.western.ascendant.value).toBeNull();
    expect(c.vedic.lagna.value).toBeNull();
    expect(c.western.planets.some((p) => p.house)).toBe(false);
    expect(c.vedic.dashas).toBeNull();
    expect(c.western.unavailable[0]).toMatch(/need a birth time/);
  });
  it('flags the Moon when it could change sign or nakshatra that day', () => {
    if (!c.vedic.moonNakshatra.certain) expect(c.vedic.unavailable.join(' ')).toMatch(/nakshatra/);
    expect(c.vedic.moonNakshatra.options.length).toBeGreaterThan(0);
  });
});

describe('computeNatal with an approximate time', () => {
  it('names both possible rising signs when the window crosses a boundary', () => {
    const c = computeNatal({ ...mumbai, timePrecision: 'approximate', windowMinutes: 240 });
    expect(c.western.ascendant.certain).toBe(false);
    expect(c.western.unavailable[0]).toMatch(/could be .* or /);
    expect(c.vedic.dashas).toBeNull();
  });
});

describe('comparison', () => {
  const a = computeNatal({ ...mumbai, timePrecision: 'exact' });
  const b = computeNatal({ date: '1987-03-02', time: '19:10', timePrecision: 'exact', windowMinutes: 60, lat: 51.5074, lon: -0.1278, tz: 'Europe/London' });
  it('lists aspects sorted by orb, without a score', () => {
    const asp = crossAspects(a, b);
    expect(asp.length).toBeGreaterThan(0);
    expect(asp[0].orb).toBeLessThanOrEqual(asp[asp.length - 1].orb);
  });
  it('counts Moon sign distance from 1 to 12', () => {
    const d = moonSignDistance(a, b)!;
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(12);
  });
});
