import { formatOffset, loadPlaces, localToUtc, searchPlaces } from './places';

describe('places', () => {
  it('finds cities by prefix, biggest first, and narrows by region', async () => {
    const places = await loadPlaces();
    expect(searchPlaces(places, 'Mumbai')[0]).toMatchObject({ countryCode: 'IN', tz: 'Asia/Kolkata' });
    expect(searchPlaces(places, 'springfield il')[0]).toMatchObject({ region: 'IL', tz: 'America/Chicago' });
    expect(searchPlaces(places, 'sao paulo')[0]).toMatchObject({ countryCode: 'BR', tz: 'America/Sao_Paulo' });
    expect(searchPlaces(places, 'portland or')[0].tz).toBe('America/Los_Angeles');
  });
});

describe('localToUtc', () => {
  it('applies daylight saving time for the birth date', () => {
    expect(localToUtc('1994-05-09', '08:30', 'America/Los_Angeles').utc.toISOString()).toBe('1994-05-09T15:30:00.000Z');
    expect(localToUtc('1994-01-09', '08:30', 'America/Los_Angeles').utc.toISOString()).toBe('1994-01-09T16:30:00.000Z');
  });
  it('handles half-hour zones', () => {
    const r = localToUtc('1985-11-23', '08:35', 'Asia/Kolkata');
    expect(r.utc.toISOString()).toBe('1985-11-23T03:05:00.000Z');
    expect(formatOffset(r.offset)).toBe('UTC+05:30');
  });
  it('handles the southern hemisphere', () => {
    expect(localToUtc('1972-02-15', '09:45', 'Australia/Sydney').utc.toISOString()).toBe('1972-02-14T22:45:00.000Z');
  });
});
