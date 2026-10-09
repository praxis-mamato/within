// Sessions with a human astrologer: the catalog, shared by the app and the booking function so the
// price charged is always the price shown. Amounts are in US cents. No imports, so it runs in both.

export interface AstrologerPackage {
  id: string;
  name: string;
  sessions: number;
  minutes: number;
  /** Price in US cents. */
  amount: number;
  summary: string;
  includes: string[];
}

export const PACKAGES: AstrologerPackage[] = [
  {
    id: 'two-sessions',
    name: 'Two sessions',
    sessions: 2,
    minutes: 45,
    amount: 100000,
    summary: 'A full reading of your birth chart, then a second session on your timing and the question you bring.',
    includes: ['Natal chart reading, Western and Vedic', 'Your next 12 months: transits, progressions, dashas', 'A written summary after each session'],
  },
  {
    id: 'season',
    name: 'A season of guidance',
    sessions: 4,
    minutes: 45,
    amount: 180000,
    summary: 'Four sessions over about three months, to work through a decision, a transition, or a relationship.',
    includes: ['Everything in Two sessions', 'Electional dates chosen for your plans', 'Message support between sessions'],
  },
  {
    id: 'coaching',
    name: 'Astrology-informed coaching',
    sessions: 6,
    minutes: 45,
    amount: 240000,
    summary: 'Six coaching sessions that use your chart and timing as a map for change you choose.',
    includes: ['Goals set from your chart and your life', 'Practices matched to your current cycles', 'A written plan you keep'],
  },
  {
    id: 'year',
    name: 'A year with your astrologer',
    sessions: 12,
    minutes: 45,
    amount: 480000,
    summary: 'A monthly session for a year, starting with your solar return, so each month is read as it arrives.',
    includes: ['Solar return reading for the year', 'Monthly timing session', 'Priority scheduling and message support'],
  },
];

export const packageById = (id: unknown) => PACKAGES.find((p) => p.id === id) ?? null;
export const fmtUsd = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`;
