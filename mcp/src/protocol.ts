/**
 * A small, stateless MCP server over Streamable HTTP (JSON responses only, no sessions).
 * Handles initialize, ping, tools/list, and tools/call. Access rules: every tool needs a signed-in
 * Within account; the member tools also need an active membership (the same entitlement as the app).
 */
import { askQuestion, chartOverview, findPlace, InputError, natalReading, relationship, skyToday, timing, type BirthArgs } from './engine';

export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
export const SERVER_INFO = { name: 'within', title: 'Within Astrology', version: '0.1.0' };

const birth = (what: string) => ({
  type: 'object',
  description: `${what}. Give place as a town name, or latitude, longitude, and timezone together.`,
  properties: {
    date: { type: 'string', description: 'Birth date, YYYY-MM-DD.' },
    time: { type: 'string', description: 'Local birth time, HH:MM in 24-hour time. Leave out when unknown.' },
    time_accuracy: { type: 'string', enum: ['exact', 'approximate', 'unknown'], description: 'How sure the person is of the time. Approximate means within about an hour.' },
    place: { type: 'string', description: 'Birth town, with region or country when it helps, e.g. "Springfield, Illinois".' },
    latitude: { type: 'number' },
    longitude: { type: 'number', description: 'East positive.' },
    timezone: { type: 'string', description: 'IANA time zone, e.g. America/Denver.' },
  },
  required: ['date'],
});

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { title: string; readOnlyHint: true; openWorldHint: false };
  members: boolean;
  run: (args: Record<string, unknown>, now: Date) => Promise<string>;
}

const tool = (name: string, title: string, description: string, members: boolean, properties: Record<string, object>, required: string[], run: ToolDef['run']): ToolDef => ({
  name,
  title,
  description,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
  annotations: { title, readOnlyHint: true, openWorldHint: false },
  members,
  run,
});

const B = (a: Record<string, unknown>, k = 'birth') => a[k] as BirthArgs;

export const TOOLS: ToolDef[] = [
  tool('find_place', 'Find a birthplace', 'Look up a town to get its latitude, longitude, and time zone. Use when a birthplace is ambiguous (several towns share the name) before calculating a chart.', false, { query: { type: 'string', description: 'Town name, optionally with region or country.' } }, ['query'], (a) => findPlace(a.query as string)),
  tool('chart_overview', 'Chart overview', 'Sun, Moon, and rising sign in Western astrology, Moon sign, nakshatra, and lagna in Vedic astrology, Within’s reading of the core of the chart, and today’s sky for this person. Free with a Within account.', false, { birth: birth('The person’s birth details') }, ['birth'], (a, now) => chartOverview(B(a), now)),
  tool('sky_today', 'Today’s sky', 'Today’s Moon and the planets making exact contacts to this person’s chart in the next two days, with Within’s meanings. Free with a Within account. Use for “what is the sky doing for me today”.', false, { birth: birth('The person’s birth details') }, ['birth'], (a, now) => skyToday(B(a), now)),
  tool('natal_reading', 'Natal reading', 'The full birth chart in one tradition: every placement, house, aspect, pattern, and (Vedic) yogas, navamsa, dashas, with Within’s reviewed interpretations. Within members.', true, { birth: birth('The person’s birth details'), tradition: { type: 'string', enum: ['western', 'vedic'] } }, ['birth', 'tradition'], (a, now) => natalReading(B(a), a.tradition === 'vedic' ? 'vedic' : 'western', now)),
  tool('timing', 'Timing and cycles', 'What is active now and coming up for this chart: the next ten days by date, the month and year ahead, named cycles (such as a Saturn return), progressions, solar arcs, solar return, and the Vedic dasha calendar. Within members.', true, { birth: birth('The person’s birth details') }, ['birth'], (a, now) => timing(B(a), now)),
  tool('relationship_reading', 'Relationship reading', 'Two charts together: synastry aspects, house overlays, composite chart, and the Vedic Moon relationship, without scores. Within members. Only use a second person’s birth details the person chose to share.', true, { birth: birth('The person’s birth details'), other_birth: birth('The other person’s birth details') }, ['birth', 'other_birth'], (a, now) => relationship(B(a), B(a, 'other_birth'), now)),
  tool('ask_question', 'Ask about my chart', 'Within’s answer to the person’s own question (love, work, timing, a feeling, a decision), built from their chart and today’s sky. Questions about danger, coercion, or self-harm return safety resources instead. Within members.', true, { birth: birth('The person’s birth details'), question: { type: 'string', description: 'The person’s question in their own words, up to 500 characters.' } }, ['birth', 'question'], (a, now) => askQuestion(B(a), a.question as string, now)),
];

export interface Caller {
  /** True when the account has an active or trialing membership. */
  member: boolean;
}

export const JOIN_URL = 'https://withinoracle.app/#/account';
export const MEMBERS_ONLY = `This part of Within is for members. Membership opens full natal readings in both traditions, timing, relationship readings, and answers to your own questions, in Claude and in the Within app. Join or sign in at ${JOIN_URL}. Chart overview and today’s sky stay free.`;

type Id = string | number | null;
interface Request {
  jsonrpc: '2.0';
  id?: Id;
  method: string;
  params?: Record<string, unknown>;
}

const ok = (id: Id, result: unknown) => ({ jsonrpc: '2.0', id, result });
const err = (id: Id, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });
const text = (t: string, isError = false) => ({ content: [{ type: 'text', text: t }], isError });

/** Answers one JSON-RPC message. Returns null for notifications, which get no reply. */
export async function handle(msg: unknown, caller: Caller, now = new Date()): Promise<object | null> {
  const m = msg as Request;
  if (!m || typeof m !== 'object' || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return err(null, -32600, 'Invalid request');
  if (m.id === undefined) return null;
  const id = m.id;
  switch (m.method) {
    case 'initialize': {
      const asked = m.params?.protocolVersion as string | undefined;
      return ok(id, {
        protocolVersion: asked && PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'Within calculates Western and Vedic birth charts and returns Within’s reviewed interpretations. Ask for birth date, time (and how sure), and town before calling a chart tool.',
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })) });
    case 'tools/call': {
      const name = m.params?.name;
      const t = TOOLS.find((x) => x.name === name);
      if (!t) return err(id, -32602, `Unknown tool: ${String(name)}`);
      if (t.members && !caller.member) return ok(id, text(MEMBERS_ONLY, true));
      try {
        return ok(id, text(await t.run((m.params?.arguments as Record<string, unknown>) ?? {}, now)));
      } catch (e) {
        if (e instanceof InputError) return ok(id, text(e.message, true));
        console.error('tool failed', t.name, e instanceof Error ? e.message : 'unknown');
        return ok(id, text('Within couldn’t calculate this chart. Check the birth details and try again.', true));
      }
    }
    default:
      return err(id, -32601, `Method not found: ${m.method}`);
  }
}
