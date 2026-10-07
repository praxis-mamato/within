import { aspectPatterns, allAspects, dashamsaSign, dashaCalendar, dominantPlanet, drishti, houseRulers, lordshipYogas, monthAhead, navamsaSign, synastry, vargas } from './deep';
import { computeNatal } from './natal';
import { placidusCusps } from './chart';

describe('divisional charts', () => {
  // Classical navamsa starts: fire signs from Aries, earth from Capricorn, air from Libra, water from Cancer.
  it.each([
    [0, 0], [3.5, 1], [29.9, 8], // Aries: Aries → Sagittarius
    [30, 9], // Taurus starts at Capricorn
    [60, 6], // Gemini starts at Libra
    [90, 3], // Cancer starts at Cancer
    [120, 0], // Leo starts at Aries
    [359.9, 11], // last pada of Pisces is Pisces (vargottama)
  ])('navamsa of %f° is sign %i', (lon, sign) => expect(navamsaSign(lon)).toBe(sign));
  it.each([
    [0, 0], // Aries (odd) starts from itself
    [30, 9], // Taurus (even) starts from its 9th, Capricorn
    [57.5, 6], // Taurus 27.5° is the 10th part: Capricorn … Libra
    [60, 2], // Gemini (odd) starts from itself
  ])('dashamsa of %f° is sign %i', (lon, sign) => expect(dashamsaSign(lon)).toBe(sign));
});

const now = new Date('2026-10-06T12:00:00Z');
const pune = { date: '1985-11-23', time: '08:35', timePrecision: 'exact' as const, windowMinutes: 60, lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' };
const c = computeNatal(pune, now);

describe('deep chart structure', () => {
  it('computes vargas for all nine grahas and the D9 lagna', () => {
    const v = vargas(c);
    expect(v.grahas).toHaveLength(9);
    expect(v.d9Lagna).not.toBeNull();
    for (const g of v.grahas) expect(g.vargottama).toBe(g.d1 === g.d9);
  });
  it('applies special Vedic aspects only to Mars, Jupiter, and Saturn', () => {
    for (const d of drishti(c)) {
      if (!['Mars', 'Jupiter', 'Saturn'].includes(d.from)) expect(d.nth).toBe(7);
    }
  });
  it('finds lordship yogas only with a known lagna', () => {
    const unknown = computeNatal({ ...pune, timePrecision: 'unknown', time: '' }, now);
    expect(lordshipYogas(unknown)).toEqual([]);
    expect(Array.isArray(lordshipYogas(c))).toBe(true);
  });
  it('lists aspects sorted by orb and finds the Sagittarius stellium', () => {
    const a = allAspects(c);
    expect(a[0].orb).toBeLessThanOrEqual(a[a.length - 1].orb);
    // Sun, Mercury, Saturn, and Uranus are all in Sagittarius for this chart.
    expect(aspectPatterns(c).some((p) => p.name === 'Stellium' && p.where === 'Sagittarius' && p.bodies.length >= 4)).toBe(true);
  });
  it('gives every house a ruler and a house for that ruler', () => {
    const r = houseRulers(c, pune.lat, pune.lon);
    expect(r).toHaveLength(12);
    expect(r[0].ruler).toBe('Jupiter'); // Sagittarius rising
    expect(r.every((x) => x.rulerHouse >= 1 && x.rulerHouse <= 12)).toBe(true);
  });
  it('names a dominant planet with reasons', () => {
    const d = dominantPlanet(c);
    expect(d.reasons.length).toBeGreaterThan(0);
  });
});

describe('timing', () => {
  const m = monthAhead(c, now, 30, pune.lat, pune.lon);
  it('finds the New and Full Moons in the month', () => {
    expect(m.lunar.filter((l) => l.kind === 'New Moon').length).toBeGreaterThanOrEqual(1);
    expect(m.lunar.filter((l) => l.kind === 'Full Moon').length).toBeGreaterThanOrEqual(1);
    expect(m.lunar.every((l) => l.house !== null)).toBe(true);
  });
  it('dates each transit inside the window, within 1°', () => {
    for (const t of m.transits) {
      expect(t.orb).toBeLessThan(1);
      expect(t.date >= '2026-10-05' && t.date <= '2026-11-06').toBe(true);
    }
  });
  it('lists dasha sub-periods for the next two years', () => {
    const cal = dashaCalendar(c, now, 24);
    expect(cal.some((x) => x.level === 'pratyantardasha')).toBe(true);
  });
});

describe('two charts', () => {
  const b = computeNatal({ ...pune, date: '1987-03-02', time: '19:10', lat: 51.5, lon: -0.13, tz: 'Europe/London' }, now);
  it('finds aspects, house overlays, and composite placements', () => {
    const s = synastry(c, b, placidusCusps(b.utc, 51.5, -0.13), placidusCusps(c.utc, pune.lat, pune.lon));
    expect(s.aspects.length).toBeGreaterThan(0);
    expect(s.overlays.theirsInMine).toHaveLength(10);
    expect(s.composite).toHaveLength(10);
  });
});
