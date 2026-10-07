import { computeNatal } from './natal';
import { tropicalLongitude } from './chart';
import { progressedDate, progressions, solarArc, solarReturn, westernDignity, yearAhead } from './progressions';

const now = new Date('2026-10-06T12:00:00Z');
const pune = { date: '1985-11-23', time: '08:35', timePrecision: 'exact' as const, windowMinutes: 60, lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' };
const c = computeNatal(pune, now);
const sep = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('western dignity', () => {
  it.each([
    ['Sun', 'Leo', 'Domicile'], ['Sun', 'Aries', 'Exaltation'], ['Sun', 'Aquarius', 'Detriment'], ['Sun', 'Libra', 'Fall'],
    ['Mars', 'Scorpio', 'Domicile'], ['Venus', 'Virgo', 'Fall'], ['Pluto', 'Taurus', 'Detriment'], ['Jupiter', 'Leo', null],
  ])('%s in %s is %s', (b, s, want) => expect(westernDignity(b, s)).toBe(want));
});

describe('secondary progressions', () => {
  it('uses a day for each year of life', () => {
    const pd = progressedDate(c, now);
    const days = (pd.getTime() - c.utc.getTime()) / 86400000;
    const years = (now.getTime() - c.utc.getTime()) / (365.2422 * 86400000);
    expect(days).toBeCloseTo(years, 6);
  });
  it('moves the progressed Sun about a degree a year', () => {
    const p = progressions(c, pune.lat, pune.lon, now);
    const natalSun = c.western.planets.find((x) => x.body === 'Sun')!.longitude;
    const arc = sep(p.planets[0].lon, natalSun);
    expect(arc).toBeGreaterThan(p.age * 0.95);
    expect(arc).toBeLessThan(p.age * 1.05);
  });
  it('finds the progressed Moon’s next sign change about 2–3 years out at most', () => {
    const p = progressions(c, pune.lat, pune.lon, now);
    expect(p.moon.nextIngress).not.toBeNull();
    expect(new Date(p.moon.nextIngress!).getTime() - now.getTime()).toBeLessThan(3 * 365.25 * 86400000);
    expect(p.phase.angle).toBeGreaterThanOrEqual(0);
    expect(p.phase.angle).toBeLessThan(360);
  });
  it('lists contacts that are close now or exact in the window', () => {
    const p = progressions(c, pune.lat, pune.lon, now);
    for (const x of p.contacts) expect(x.exact !== null || x.orbNow <= 1).toBe(true);
  });
});

describe('solar arc', () => {
  it('equals the progressed Sun’s distance from the natal Sun', () => {
    const s = solarArc(c, pune.lat, pune.lon, now);
    const p = progressions(c, pune.lat, pune.lon, now);
    const natalSun = c.western.planets.find((x) => x.body === 'Sun')!.longitude;
    expect(s.arc).toBeCloseTo(sep(p.planets[0].lon, natalSun), 1);
  });
});

describe('year ahead', () => {
  it('gives windows inside the year with exact dates inside each window', () => {
    const y = yearAhead(c, pune.lat, pune.lon, now);
    expect(y.length).toBeGreaterThan(0);
    for (const w of y) {
      expect(w.start <= w.end).toBe(true);
      expect(w.start >= '2026-10-06' && w.end <= '2027-10-07').toBe(true);
      for (const d of w.exact) expect(d >= w.start && d <= w.end).toBe(true);
    }
  });
});

describe('solar return', () => {
  it('finds the Sun back on its birth degree, most recent birthday', () => {
    const sr = solarReturn(c, pune.lat, pune.lon, now)!;
    const natalSun = c.western.planets.find((x) => x.body === 'Sun')!.longitude;
    expect(sep(tropicalLongitude('Sun', sr.date), natalSun)).toBeLessThan(0.001);
    expect(sr.date.toISOString().slice(0, 7)).toBe('2025-11');
  });
  it('needs an exact birth time', () => {
    expect(solarReturn(computeNatal({ ...pune, time: '', timePrecision: 'unknown' }, now), pune.lat, pune.lon, now)).toBeNull();
  });
});
