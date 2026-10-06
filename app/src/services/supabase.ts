import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CONFIG, LIVE } from './config';

let client: SupabaseClient | null = null;
/** The Supabase client in live mode; null in demo mode. PKCE keeps OAuth codes out of the URL hash, which the router uses. */
export function supabase(): SupabaseClient | null {
  if (!LIVE) return null;
  client ??= createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
  });
  return client;
}
