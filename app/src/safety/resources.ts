/**
 * Safety resources for every country (docs/next-features.md, "Launching everywhere").
 *
 * Every country gets: its emergency number where listed here, plus Find A Helpline, a global
 * directory of free, confidential crisis lines. Countries with the most sign-ups also get named
 * crisis and domestic-violence lines.
 *
 * NOT YET VERIFIED. The runbook (§8) requires a person to call or check each entry against the
 * operator's own site and set `verified` to that date before G2. Entries with `verified: null`
 * are drafts. Never add a number from memory without checking it.
 */

export interface Line {
  name: string;
  /** What to dial or text, exactly as shown to the person. */
  contact: string;
  kind: 'crisis' | 'domestic_violence';
  url?: string;
}

export interface CountryResources {
  /** Emergency services. Where police and ambulance differ, both are given. */
  emergency: string;
  lines?: Line[];
  /** ISO date a person last checked every entry for this country, or null. */
  verified: string | null;
}

export const GLOBAL_DIRECTORY = {
  name: 'Find A Helpline',
  url: 'https://findahelpline.com',
  description: 'Free, confidential crisis lines in your country, by phone, text, or chat.',
};

const EU112: CountryResources = { emergency: '112', verified: null };

export const RESOURCES: Record<string, CountryResources> = {
  US: {
    emergency: '911',
    lines: [
      { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', kind: 'crisis', url: 'https://988lifeline.org' },
      { name: 'National Domestic Violence Hotline', contact: '1-800-799-7233, or text START to 88788', kind: 'domestic_violence', url: 'https://www.thehotline.org' },
    ],
    verified: null,
  },
  CA: {
    emergency: '911',
    lines: [{ name: '9-8-8 Suicide Crisis Helpline', contact: 'Call or text 988', kind: 'crisis', url: 'https://988.ca' }],
    verified: null,
  },
  GB: {
    emergency: '999 or 112',
    lines: [
      { name: 'Samaritans', contact: '116 123', kind: 'crisis', url: 'https://www.samaritans.org' },
      { name: 'National Domestic Abuse Helpline (England)', contact: '0808 2000 247', kind: 'domestic_violence', url: 'https://www.nationaldahelpline.org.uk' },
    ],
    verified: null,
  },
  IE: {
    emergency: '112 or 999',
    lines: [{ name: 'Samaritans', contact: '116 123', kind: 'crisis', url: 'https://www.samaritans.org' }],
    verified: null,
  },
  AU: {
    emergency: '000',
    lines: [
      { name: 'Lifeline', contact: '13 11 14', kind: 'crisis', url: 'https://www.lifeline.org.au' },
      { name: '1800RESPECT', contact: '1800 737 732', kind: 'domestic_violence', url: 'https://www.1800respect.org.au' },
    ],
    verified: null,
  },
  NZ: {
    emergency: '111',
    lines: [{ name: 'Need to talk?', contact: 'Call or text 1737', kind: 'crisis', url: 'https://1737.org.nz' }],
    verified: null,
  },
  IN: {
    emergency: '112',
    lines: [{ name: 'Tele-MANAS', contact: '14416', kind: 'crisis', url: 'https://telemanas.mohfw.gov.in' }],
    verified: null,
  },
  // European Union, EEA, and nearby: 112 reaches emergency services everywhere.
  AT: EU112, BE: EU112, BG: EU112, HR: EU112, CY: EU112, CZ: EU112, DK: EU112, EE: EU112, FI: EU112, FR: EU112,
  DE: EU112, GR: EU112, HU: EU112, IT: EU112, LV: EU112, LT: EU112, LU: EU112, MT: EU112, NL: EU112, PL: EU112,
  PT: EU112, RO: EU112, SK: EU112, SI: EU112, ES: EU112, SE: EU112, NO: EU112, IS: EU112, CH: EU112, LI: EU112,
  TR: EU112, UA: EU112,
  MX: { emergency: '911', verified: null },
  AR: { emergency: '911', verified: null },
  BR: { emergency: '190 (police), 192 (ambulance)', verified: null },
  CL: { emergency: '133 (police), 131 (ambulance)', verified: null },
  CO: { emergency: '123', verified: null },
  PH: { emergency: '911', verified: null },
  JP: { emergency: '110 (police), 119 (ambulance)', verified: null },
  KR: { emergency: '112 (police), 119 (ambulance)', verified: null },
  SG: { emergency: '999 (police), 995 (ambulance)', verified: null },
  HK: { emergency: '999', verified: null },
  MY: { emergency: '999', verified: null },
  ID: { emergency: '112', verified: null },
  ZA: { emergency: '10111 (police), 10177 (ambulance), 112 from a mobile', verified: null },
  NG: { emergency: '112', verified: null },
  KE: { emergency: '999 or 112', verified: null },
  AE: { emergency: '999 (police), 998 (ambulance)', verified: null },
  SA: { emergency: '911', verified: null },
  IL: { emergency: '100 (police), 101 (ambulance)', verified: null },
};

/** A best guess at the person's country from the device, which they can change. Never from birth place. */
export function guessCountry(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages ?? [], timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone): string | null {
  const fromZone = ZONE_COUNTRY[timeZone];
  if (fromZone) return fromZone;
  for (const l of languages) {
    const region = l.split('-')[1];
    if (region && /^[A-Z]{2}$/.test(region)) return region;
  }
  return null;
}

/** Zones that identify one country well enough for a first guess. */
const ZONE_COUNTRY: Record<string, string> = {
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Pacific/Auckland': 'NZ', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Phoenix': 'US', 'America/Los_Angeles': 'US',
  'America/Anchorage': 'US', 'Pacific/Honolulu': 'US', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG', 'Asia/Manila': 'PH', 'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL', 'Europe/Stockholm': 'SE', 'Asia/Dubai': 'AE', 'Asia/Jerusalem': 'IL',
};

export function resourcesFor(country: string | null): CountryResources | null {
  return country ? (RESOURCES[country] ?? null) : null;
}
