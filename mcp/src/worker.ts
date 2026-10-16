/**
 * Within's remote MCP server (Cloudflare Worker). Claude connects to /mcp; people sign in with their
 * Within account through Supabase Auth's OAuth 2.1 server, and the access token decides what they get.
 * Birth details pass through to calculate a chart and are never stored or logged.
 */
import { handle } from './protocol';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const MCP_PATH = '/mcp';
const MEMBER = ['active', 'trialing'];

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

/** RFC 9728 protected resource metadata: tells Claude where Within's authorization server is. */
export function resourceMetadata(origin: string, env: Env) {
  return {
    resource: `${origin}${MCP_PATH}`,
    authorization_servers: [`${env.SUPABASE_URL}/auth/v1`],
    scopes_supported: ['openid', 'email'],
    bearer_methods_supported: ['header'],
    resource_name: 'Within Astrology',
  };
}

export function unauthorized(origin: string, why = 'Sign in to Within') {
  return json({ error: 'unauthorized', error_description: why }, 401, {
    'www-authenticate': `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource${MCP_PATH}", scope="openid email"`,
  });
}

/** Checks the token with Supabase and reads the caller's membership through row-level security. */
export async function callerFor(token: string, env: Env, f: typeof fetch = fetch): Promise<{ member: boolean } | null> {
  const headers = { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` };
  const user = await f(`${env.SUPABASE_URL}/auth/v1/user`, { headers });
  if (!user.ok) return null;
  const rows = await f(`${env.SUPABASE_URL}/rest/v1/entitlements?select=status`, { headers });
  const ent = rows.ok ? ((await rows.json()) as { status: string }[]) : [];
  return { member: ent.some((e) => MEMBER.includes(e.status)) };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = url.origin;

    if (url.pathname === '/.well-known/oauth-protected-resource' || url.pathname === `/.well-known/oauth-protected-resource${MCP_PATH}`)
      return json(resourceMetadata(origin, env), 200, { 'cache-control': 'public, max-age=3600' });

    if (url.pathname !== MCP_PATH) return json({ error: 'not_found' }, 404);
    // Stateless server: no server-to-client stream and no sessions to end.
    if (req.method === 'GET' || req.method === 'DELETE') return new Response(null, { status: 405, headers: { allow: 'POST' } });
    if (req.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });

    const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return unauthorized(origin);
    const caller = await callerFor(token, env);
    if (!caller) return unauthorized(origin, 'The Within sign-in has expired');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
    }
    if (Array.isArray(body)) {
      const out = (await Promise.all(body.map((m) => handle(m, caller)))).filter(Boolean);
      return out.length ? json(out) : new Response(null, { status: 202 });
    }
    const out = await handle(body, caller);
    return out ? json(out) : new Response(null, { status: 202 });
  },
};
