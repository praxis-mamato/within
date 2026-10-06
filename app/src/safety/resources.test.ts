import { GLOBAL_DIRECTORY, RESOURCES, guessCountry, resourcesFor } from './resources';

describe('safety resources', () => {
  it('give every listed country an emergency number and only https links', () => {
    for (const [code, r] of Object.entries(RESOURCES)) {
      expect(code).toMatch(/^[A-Z]{2}$/);
      expect(r.emergency).toMatch(/\d/);
      for (const l of r.lines ?? []) {
        expect(l.contact).toMatch(/\d/);
        if (l.url) expect(l.url).toMatch(/^https:\/\//);
      }
    }
    expect(GLOBAL_DIRECTORY.url).toMatch(/^https:\/\//);
  });

  it('excludes mainland China, which is not a launch country', () => {
    expect(RESOURCES.CN).toBeUndefined();
  });

  it('guesses the country from the device time zone, then the language region', () => {
    expect(guessCountry([], 'Europe/London')).toBe('GB');
    expect(guessCountry(['en-AU'], 'UTC')).toBe('AU');
    expect(guessCountry(['en'], 'UTC')).toBeNull();
  });

  it('falls back to the global directory when a country is unlisted or not chosen', () => {
    expect(resourcesFor('other')).toBeNull();
    expect(resourcesFor(null)).toBeNull();
  });
});
