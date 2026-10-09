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
  const { data } = await sb.from('astrologer_bookings').select('id, package_id, amount, status, created_at').neq('status', 'pending').order('created_at', { ascending: false });
  return (data as Booking[]) ?? [];
}
