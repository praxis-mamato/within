/** Place search and historical time-zone conversion, all in the browser. */
export interface Place {
  name: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  tz: string;
  population: number;
}

let cache: Place[] | null = null;
const countryNames = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();
export const countryName = (code: string) => countryNames?.of(code) ?? code;

/** Loads the place list on first use so it doesn't slow the first screen. */
export async function loadPlaces(): Promise<Place[]> {
  if (cache) return cache;
  const { PLACES, ZONES } = await import('./places.data');
  cache = PLACES.split('\n').map((row) => {
    const [name, region, cc, lat, lon, z, pop] = row.split('|');
    return { name, region, country: countryName(cc), countryCode: cc, lat: Number(lat), lon: Number(lon), tz: ZONES[Number(z)], population: Number(pop) * 1000 };
  });
  return cache;
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Prefix search on the place name; extra words narrow by region or country. Larger places first. */
export function searchPlaces(places: Place[], query: string, limit = 8): Place[] {
  const words = fold(query).split(/[\s,]+/).filter(Boolean);
  if (!words.length) return [];
  const [first, ...rest] = words;
  const out: Place[] = [];
  for (const p of places) {
    const name = fold(p.name);
    if (!name.startsWith(first) && !name.includes(` ${first}`)) continue;
    const where = fold(`${p.name} ${p.region} ${p.country} ${p.countryCode}`);
    if (rest.every((w) => where.includes(w))) out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

export const placeLabel = (p: Pick<Place, 'name' | 'region' | 'country'>) => [p.name, p.region, p.country].filter(Boolean).join(', ');

/** Offset of `tz` from UTC at the given instant, in minutes (east positive). */
export function offsetMinutes(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Converts a local wall-clock time in `tz` to a UTC instant, using the zone's rules for that date. */
export function localToUtc(date: string, time: string, tz: string): { utc: Date; offset: number } {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '12:00').split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let offset = offsetMinutes(tz, new Date(wall));
  // Re-check at the corrected instant; this settles times near a daylight-saving change.
  offset = offsetMinutes(tz, new Date(wall - offset * 60000));
  return { utc: new Date(wall - offset * 60000), offset };
}

export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const a = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
