import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** Server-side client with full access. Never sent to the browser. */
export const admin: SupabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

/** The signed-in user calling this function, from their Authorization header. */
export async function callingUser(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}

export const SITE_URLS = (Deno.env.get('SITE_URLS') ?? 'https://praxis-mamato.github.io/within/').split(',').map((s) => s.trim());

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
