/** Booking sessions with a human astrologer: starts Stripe Checkout and lists the person's bookings. */
import { LIVE, siteUrl } from './config';
import { supabase } from './supabase';
export { PACKAGES, fmtUsd, packageById, type AstrologerPackage } from '../../../supabase/functions/_shared/packages';

export interface BookingRequest {
  packageId: string;
  questions: string;
  availability: string;
  timezone: string;
  shareBirth: boolean;
  birth: string;
}
export interface Booking {
  id: string;
  package_id: string;
  amount: number;
  status: string;
  created_at: string;
  /** The first reading's start time (ISO), once the client has chosen it. */
  first_slot: string | null;
}

async function serverMessage(error: unknown, fallback: string): Promise<string> {
  const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
  return typeof body?.error === 'string' ? body.error : fallback;
}

export async function bookAstrologer(req: BookingRequest): Promise<void> {
  const sb = supabase();
  if (!LIVE || !sb) throw new Error('Booking opens in the live app. In this preview, nothing is charged.');
  const { data, error } = await sb.functions.invoke('book-astrologer', { body: { ...req, returnUrl: siteUrl() } });
  if (error) throw new Error(await serverMessage(error, 'Checkout couldn’t start. Try again.'));
  if (!data?.url) throw new Error('Checkout couldn’t start. Try again.');
  location.assign(data.url);
}

export async function myBookings(): Promise<Booking[]> {
  const sb = supabase();
  if (!LIVE || !sb) return [];
  const { data } = await sb.from('astrologer_bookings').select('id, package_id, amount, status, created_at, first_slot').neq('status', 'pending').order('created_at', { ascending: false });
  return (data as Booking[]) ?? [];
}

// ─── Choosing a reading time ──────────────────────────────────────────────────
// Live readings are Mon, Wed and Fri at 12:00, 1:00 and 2:00pm Mountain time (45 minutes each).
// The database checks the same rules (pick_reading_slot), so a slot can't be taken twice.
export const READING_TZ = 'America/Denver';
const READING_DAYS = [1, 3, 5];
const READING_HOURS = [12, 13, 14];

/** The UTC instant of a wall-clock time in a time zone (handles daylight saving). */
export function zonedTime(y: number, m: number, d: number, h: number, tz = READING_TZ): Date {
  let t = Date.UTC(y, m - 1, d, h);
  for (let i = 0; i < 2; i++) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric' }).formatToParts(new Date(t)).map((p) => [p.type, p.value]));
    const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour);
    t += Date.UTC(y, m - 1, d, h) - shown;
  }
  return new Date(t);
}

/** Open reading times from 20 hours to 28 days ahead, minus the taken ones. */
export function readingSlots(now: Date, taken: Set<number>): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < 30; i++) {
    const day = new Date(now.getTime() + i * 86400000);
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: READING_TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' }).formatToParts(day).map((x) => [x.type, x.value]));
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    if (!READING_DAYS.includes(dow)) continue;
    for (const h of READING_HOURS) {
      const t = zonedTime(+p.year, +p.month, +p.day, h);
      const ahead = t.getTime() - now.getTime();
      if (ahead >= 20 * 3600000 && ahead <= 28 * 86400000 && !taken.has(t.getTime()) && !out.some((x) => x.getTime() === t.getTime())) out.push(t);
    }
  }
  return out;
}

export async function takenSlots(): Promise<Set<number>> {
  const sb = supabase();
  if (!LIVE || !sb) return new Set();
  const { data } = await sb.rpc('taken_reading_slots');
  return new Set(((data as string[] | null) ?? []).map((x) => new Date(x).getTime()));
}

const PICK_ERRORS: Record<string, string> = {
  taken: 'Someone just took that time. Please choose another.',
  invalid: 'That time isn’t available any more. Please choose another.',
  not_allowed: 'This reading already has a time, or isn’t paid yet.',
};
export async function pickSlot(bookingId: string, slot: Date): Promise<void> {
  const sb = supabase();
  if (!LIVE || !sb) throw new Error('Choosing a time opens in the live app.');
  const { data, error } = await sb.rpc('pick_reading_slot', { p_booking: bookingId, p_slot: slot.toISOString() });
  if (error) throw new Error('That time couldn’t be saved. Try again.');
  if (data !== 'ok') throw new Error(PICK_ERRORS[data as string] ?? 'That time couldn’t be saved. Try again.');
}
