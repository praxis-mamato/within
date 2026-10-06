/**
 * Live chart calculation for the prototype.
 *
 * Planetary positions come from Astronomy Engine (MIT, https://github.com/cosinekitty/astronomy),
 * which runs entirely in the browser. The astrology layer (houses, ayanamsa, nakshatras, dashas)
 * is implemented here and tested against Swiss Ephemeris reference values in
 * reference.swisseph.json (generated offline; Swiss Ephemeris is not shipped).
 *
 * Conventions are placeholders until the approver signs them off (build spec §3.5):
 * Western: tropical zodiac, Placidus houses. Vedic: sidereal zodiac, Lahiri ayanamsa,
 * whole-sign houses from the lagna, Vimshottari dashas with 365.25-day years.
 */
import * as Astronomy from 'astronomy-engine';

export const ENGINE = {
  name: 'Astronomy Engine',
  version: '2.1',
  license: 'MIT',
  url: 'https://github.com/cosinekitty/astronomy',
};

export const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
export type BodyName = (typeof BODIES)[number] | 'Node';

export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
/** Sanskrit rashi names, same order as SIGNS. */
export const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];
/** Vimshottari order and period lengths in years. */
export const DASHA_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;
const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
const DASHA_YEAR_DAYS = 365.25;

const DEG = Math.PI / 180;
export const norm = (x: number) => ((x % 360) + 360) % 360;
const sin = (d: number) => Math.sin(d * DEG);
const cos = (d: number) => Math.cos(d * DEG);
const tan = (d: number) => Math.tan(d * DEG);
const atan2 = (y: number, x: number) => Math.atan2(y, x) / DEG;

export interface Placement {
  body: BodyName;
  longitude: number;
  sign: string;
  degree: number;
  retrograde: boolean;
}

export function placement(body: BodyName, longitude: number, speed = 1): Placement {
  const lon = norm(longitude);
  return { body, longitude: lon, sign: SIGNS[Math.floor(lon / 30)], degree: lon % 30, retrograde: speed < 0 };
}

/** Apparent geocentric longitude on the true ecliptic of date, in degrees. */
export function tropicalLongitude(body: (typeof BODIES)[number], date: Date): number {
  const t = Astronomy.MakeTime(date);
  if (body === 'Sun') return Astronomy.SunPosition(t).elon;
  if (body === 'Moon') return Astronomy.EclipticGeoMoon(t).lon;
  return Astronomy.Ecliptic(Astronomy.GeoVector(body as Astronomy.Body, t, true)).elon;
}

function julianCenturies(date: Date) {
  return Astronomy.MakeTime(date).tt / 36525;
}

/** Mean lunar node (Meeus 47.7). Rahu; Ketu is opposite. */
export function meanNode(date: Date): number {
  const T = julianCenturies(date);
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000);
}

/** Lahiri ayanamsa (mean, without nutation), anchored at J2000 and advanced by IAU 2006 general precession. */
export function lahiriAyanamsa(date: Date): number {
  const T = julianCenturies(date);
  const precessionArcsec = 5028.796195 * T + 1.1054348 * T * T + 0.00007964 * T * T * T;
  return 23.853222 + precessionArcsec / 3600;
}

function obliquity(date: Date) {
  return Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl;
}

/** Right ascension of the meridian (local apparent sidereal time) in degrees. */
function ramc(date: Date, lonEast: number) {
  return norm(Astronomy.SiderealTime(Astronomy.MakeTime(date)) * 15 + lonEast);
}

export function ascendantAndMidheaven(date: Date, lat: number, lonEast: number) {
  const r = ramc(date, lonEast);
  const e = obliquity(date);
  const mc = norm(atan2(sin(r), cos(r) * cos(e)));
  const asc = norm(atan2(cos(r), -(sin(r) * cos(e) + tan(lat) * sin(e))));
  return { asc, mc, ramc: r, obliquity: e };
}

/** Ecliptic longitude of the point with right ascension `ra`. */
const lonFromRa = (ra: number, e: number) => norm(atan2(sin(ra), cos(ra) * cos(e)));

/**
 * Placidus cusps (1–12), or null where Placidus is undefined (polar latitudes).
 * Each intermediate cusp divides the semi-arc of its own declination, solved by iteration.
 */
export function placidusCusps(date: Date, lat: number, lonEast: number): number[] | null {
  const { asc, mc, ramc: r, obliquity: e } = ascendantAndMidheaven(date, lat, lonEast);
  if (Math.abs(lat) >= 90 - e) return null;
  const cusp = (fraction: number, above: boolean) => {
    let lon = lonFromRa(r + (above ? 90 : 270) * fraction, e);
    for (let i = 0; i < 50; i++) {
      const decl = Math.asin(sin(e) * sin(lon)) / DEG;
      const x = tan(lat) * tan(decl);
      if (Math.abs(x) > 1) return NaN;
      const ad = Math.asin(x) / DEG; // ascensional difference
      const ra = above ? r + fraction * (90 + ad) : r + 180 - fraction * (90 - ad);
      const next = lonFromRa(ra, e);
      if (Math.abs(next - lon) < 1e-9) break;
      lon = next;
    }
    return lon;
  };
  const c11 = cusp(1 / 3, true);
  const c12 = cusp(2 / 3, true);
  const c2 = cusp(2 / 3, false);
  const c3 = cusp(1 / 3, false);
  if ([c11, c12, c2, c3].some(Number.isNaN)) return null;
  const cusps = [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180), norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
  return cusps;
}

export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const span = norm(cusps[(i + 1) % 12] - start);
    if (norm(lon - start) < span) return i + 1;
  }
  return 12;
}

export interface Nakshatra {
  name: string;
  index: number;
  pada: number;
  lord: (typeof DASHA_LORDS)[number];
  /** Fraction of the nakshatra already traversed (0–1). */
  traversed: number;
}

export function nakshatraOf(siderealLon: number): Nakshatra {
  const span = 360 / 27;
  const lon = norm(siderealLon);
  const index = Math.floor(lon / span);
  const within = lon - index * span;
  return { name: NAKSHATRAS[index], index, pada: Math.floor(within / (span / 4)) + 1, lord: DASHA_LORDS[index % 9], traversed: within / span };
}

export interface DashaPeriod {
  lord: (typeof DASHA_LORDS)[number];
  start: Date;
  end: Date;
}

/** Vimshottari mahadashas from birth, starting with the balance of the Moon's nakshatra lord. */
export function vimshottari(birth: Date, moonSidereal: number, count = 9): DashaPeriod[] {
  const n = nakshatraOf(moonSidereal);
  const first = n.index % 9;
  const day = 86400000;
  const periods: DashaPeriod[] = [];
  // The first period started before birth, by the traversed share of its length.
  let start = new Date(birth.getTime() - n.traversed * DASHA_YEARS[first] * DASHA_YEAR_DAYS * day);
  for (let i = 0; i < count; i++) {
    const idx = (first + i) % 9;
    const end = new Date(start.getTime() + DASHA_YEARS[idx] * DASHA_YEAR_DAYS * day);
    periods.push({ lord: DASHA_LORDS[idx], start, end });
    start = end;
  }
  return periods;
}

/** Antardashas (sub-periods) inside one mahadasha, in Vimshottari proportion. */
export function antardashas(maha: DashaPeriod): DashaPeriod[] {
  const first = DASHA_LORDS.indexOf(maha.lord);
  const total = maha.end.getTime() - maha.start.getTime();
  const out: DashaPeriod[] = [];
  let start = maha.start;
  for (let i = 0; i < 9; i++) {
    const idx = (first + i) % 9;
    const end = new Date(start.getTime() + (total * DASHA_YEARS[idx]) / 120);
    out.push({ lord: DASHA_LORDS[idx], start, end });
    start = end;
  }
  return out;
}
