import ref from './reference.swisseph.json';
import { ascendantAndMidheaven, BODIES, lahiriAyanamsa, meanNode, nakshatraOf, norm, placidusCusps, tropicalLongitude, vimshottari } from './chart';

/** Smallest angular distance in degrees. */
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe.each(ref)('$name matches Swiss Ephemeris', (c) => {
  const date = new Date(c.utc);
  it.each(BODIES)('%s within 0.01°', (body) => {
    expect(diff(tropicalLongitude(body, date), c.tropical[body])).toBeLessThan(0.01);
  });
  it('mean node within 0.01°', () => expect(diff(meanNode(date), c.tropical.MeanNode)).toBeLessThan(0.01));
  it('Lahiri sidereal Moon within 0.01°', () => {
    expect(diff(tropicalLongitude('Moon', date) - lahiriAyanamsa(date), c.sidereal.Moon)).toBeLessThan(0.01);
  });
  it('ascendant and MC within 0.01°', () => {
    const { asc, mc } = ascendantAndMidheaven(date, c.lat, c.lon);
    expect(diff(asc, c.asc)).toBeLessThan(0.01);
    expect(diff(mc, c.mc)).toBeLessThan(0.01);
  });
  it('Placidus cusps within 0.02°', () => {
    const cusps = placidusCusps(date, c.lat, c.lon);
    expect(cusps).not.toBeNull();
    cusps!.forEach((x, i) => expect(diff(x, c.placidus[i])).toBeLessThan(0.02));
  });
});

describe('Vedic helpers', () => {
  it('maps 0° sidereal to Ashwini pada 1, ruled by Ketu', () => {
    expect(nakshatraOf(0)).toMatchObject({ name: 'Ashwini', pada: 1, lord: 'Ketu' });
  });
  it('maps the last degree to Revati pada 4', () => {
    expect(nakshatraOf(359.9)).toMatchObject({ name: 'Revati', pada: 4, lord: 'Mercury' });
  });
  it('makes Vimshottari periods that start before birth and run 120 years in total', () => {
    const birth = new Date('2000-01-01T12:00:00Z');
    const periods = vimshottari(birth, 100);
    expect(periods[0].start.getTime()).toBeLessThanOrEqual(birth.getTime());
    const years = (periods[8].end.getTime() - periods[0].start.getTime()) / (365.25 * 86400000);
    expect(years).toBeCloseTo(120, 5);
  });
  it('returns no Placidus cusps inside the polar circle', () => {
    expect(placidusCusps(new Date('2000-06-21T12:00:00Z'), 70, 20)).toBeNull();
  });
  it('normalizes angles', () => expect(norm(-30)).toBe(330));
});
