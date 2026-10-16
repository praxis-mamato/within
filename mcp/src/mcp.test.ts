import { askQuestion, chartOverview, InputError, natalReading, relationship, resolveBirth, timing } from './engine';
import { handle, MEMBERS_ONLY, TOOLS } from './protocol';
import worker, { callerFor, type Env } from './worker';
import { lint } from '../../app/src/content/lint';

const birth = { date: '1990-04-12', time: '08:30', time_accuracy: 'exact' as const, place: 'Denver' };
const now = new Date('2026-10-14T18:00:00Z');
const env: Env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_test' };
const call = (name: string, args: object, member: boolean) => handle({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }, { member }, now) as Promise<{ result: { content: { text: string }[]; isError: boolean } }>;

describe('birth details', () => {
  it('resolves a town and says which one it used', async () => {
    const r = await resolveBirth(birth);
    expect(r.used).toMatch(/^Denver, CO, United States, 1990-04-12 08:30, UTC−06:00$/);
    expect(r.chart.western.ascendant.value).toBe('Gemini');
  });

  it('accepts coordinates and a time zone instead of a town', async () => {
    const r = await resolveBirth({ date: '1990-04-12', time: '08:30', latitude: 39.74, longitude: -104.98, timezone: 'America/Denver' });
    expect(r.chart.western.ascendant.value).toBe('Gemini');
  });

  it('never shows a rising sign without a birth time', async () => {
    const r = await resolveBirth({ date: '1990-04-12', place: 'Denver' });
    expect(r.chart.western.ascendant.certain).toBe(false);
    expect(await chartOverview({ date: '1990-04-12', place: 'Denver' }, now)).toContain('rising sign unknown');
  });

  it.each([
    [{ date: '12/04/1990', place: 'Denver' }, /YYYY-MM-DD/],
    [{ date: '1990-04-12', time: '8.30', time_accuracy: 'exact', place: 'Denver' }, /HH:MM/],
    [{ date: '1990-04-12', place: 'Qwxyzzy' }, /No town matched/],
    [{ date: '1990-04-12' }, /place/],
    [{ date: '1700-01-01', place: 'Denver' }, /1800 to 2100/],
  ])('rejects %j clearly', async (b, msg) => {
    await expect(resolveBirth(b as never)).rejects.toThrow(InputError);
    await expect(resolveBirth(b as never)).rejects.toThrow(msg);
  });
});

describe('readings', () => {
  it('return facts and Within’s interpretations without placeholders', async () => {
    const out = [await natalReading(birth, 'western', now), await natalReading(birth, 'vedic', now), await timing(birth, now), await relationship(birth, { date: '1988-11-02', place: 'London' }, now)];
    for (const t of out) {
      expect(t).toContain('## Calculated facts');
      expect(t).toContain('## Within’s interpretations');
      expect(t).not.toMatch(/undefined|NaN|\$\{|- : /);
    }
  });

  it('pass Within’s content lint in the free tools', async () => {
    const t = await chartOverview(birth, now);
    const body = t.split('## Within’s reading of the core')[1];
    expect(lint(body)).toEqual([]);
  });

  it('answer safety questions with resources, not astrology', async () => {
    const t = await askQuestion(birth, 'I am scared to go home, what does my chart say?', now);
    expect(t).toContain('Safety first');
    expect(t).not.toContain('Chart used');
  });
});

describe('MCP protocol', () => {
  it('negotiates a version and lists every tool as read-only with a title', async () => {
    const init = (await handle({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, { member: false })) as { result: { protocolVersion: string } };
    expect(init.result.protocolVersion).toBe('2025-06-18');
    const list = (await handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { member: false })) as { result: { tools: { title: string; annotations: { readOnlyHint: boolean } }[] } };
    expect(list.result.tools).toHaveLength(TOOLS.length);
    for (const t of list.result.tools) expect(t.title && t.annotations.readOnlyHint).toBeTruthy();
  });

  it('gives no reply to notifications', async () => {
    expect(await handle({ jsonrpc: '2.0', method: 'notifications/initialized' }, { member: false })).toBeNull();
  });

  it('keeps chart overview free and member tools for members', async () => {
    expect((await call('chart_overview', { birth }, false)).result.isError).toBe(false);
    const locked = await call('natal_reading', { birth, tradition: 'western' }, false);
    expect(locked.result).toMatchObject({ isError: true, content: [{ text: MEMBERS_ONLY }] });
    expect((await call('natal_reading', { birth, tradition: 'western' }, true)).result.isError).toBe(false);
  });

  it('returns input problems as tool errors Claude can fix', async () => {
    const r = await call('chart_overview', { birth: { date: 'soon' } }, false);
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toMatch(/YYYY-MM-DD/);
  });
});

describe('worker', () => {
  const req = (path: string, init: RequestInit = {}) => new Request(`https://mcp.example.com${path}`, init);

  it('serves protected resource metadata pointing at Supabase Auth', async () => {
    const res = await worker.fetch(req('/.well-known/oauth-protected-resource/mcp'), env);
    expect(await res.json()).toMatchObject({ resource: 'https://mcp.example.com/mcp', authorization_servers: ['https://example.supabase.co/auth/v1'] });
  });

  it('answers an unsigned call with 401 and where to sign in', async () => {
    const res = await worker.fetch(req('/mcp', { method: 'POST', body: '{}' }), env);
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe('Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp", scope="openid email"');
  });

  it('reads membership from the entitlements row the token can see', async () => {
    const fake = (status: number, rows: unknown[]) => (async (url: string) => (String(url).includes('/auth/v1/user') ? new Response('{}', { status }) : Response.json(rows))) as unknown as typeof fetch;
    expect(await callerFor('t', env, fake(200, [{ status: 'active' }]))).toEqual({ member: true });
    expect(await callerFor('t', env, fake(200, [{ status: 'canceled' }]))).toEqual({ member: false });
    expect(await callerFor('t', env, fake(200, []))).toEqual({ member: false });
    expect(await callerFor('t', env, fake(401, []))).toBeNull();
  });
});
