# Within for Claude: plugin, connector, and how it earns
Draft 0.1 · October 14, 2026

## How selling a Claude plugin works today

- **Anthropic's directory has no payments.** Anyone on a paid Claude plan submits a plugin or connector at claude.ai/directory/manage; listing is free, and there is no price field, purchase flow, or revenue share. ([Publish to the directory](https://claude.com/docs/directory/publish))
- **A listed connector may require a paid account with the service.** The submission form asks "what users need before they can connect, such as accounts, plans, or other setup". So the way to charge is: the plugin is free to add, and Within's own sign-in decides what each person gets. ([Submit a connector](https://claude.com/docs/connectors/building/submission))
- **No buying inside Claude.** The directory policy forbids software that "executes financial transactions on behalf of users" or "transfers money". Membership is bought on Within's website; the connector only reads it. ([Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy))
- **Also forbidden:** advertising or sponsored content, collecting conversation data beyond what a tool needs, reading Claude's memory or history, and instructions pulled dynamically from a server. Within's rules therefore live in the plugin's skill, and tool results contain chart facts and approved text only.
- **The plugin folder must be in a public GitHub repository** before the listing goes live (it can be private while it is reviewed). Only `plugin/` needs to be public; the engine and connector stay in this private repository.

## What we built

| Piece | Where | What it does |
|---|---|---|
| Plugin `within-astrology` | `plugin/` | A skill (`within-reading`) with the workflow and Within's writing rules, two commands, and a pointer to the connector. Passes `claude plugin validate`. |
| Connector (remote MCP server) | `mcp/` | Cloudflare Worker running the app's own chart engine. 7 read-only tools: `find_place`, `chart_overview`, `sky_today` (free), `natal_reading`, `timing`, `relationship_reading`, `ask_question` (members). |
| Sign-in | `supabase/config.toml`, `app/src/screens/ConnectClaude.tsx` | Supabase Auth as the OAuth 2.1 server; people approve Claude on a Within consent page. Membership is the same `entitlements` row the app uses, so access codes work too. |

**Why this shape.** Claude writes the reading on the person's own Claude plan, from Within's calculated facts and reviewed interpretations. Within pays no AI cost per reading (the in-app connected readings cost about $0.06 each); the connector's only cost is Cloudflare Workers Paid ($5 a month plus usage). Every reading keeps Within's accuracy and safety rules: the safety screener runs on every question before any chart is read.

## Pricing

Recommended: **the plugin is free to add; members get everything.**

| | Price | In Claude |
|---|---|---|
| Within account (free) | $0 | Chart overview (Sun, Moon, rising, Vedic Moon and nakshatra) and today's sky |
| Within membership | $9.99/month or $100/year (current plans) | Full natal readings in both traditions, timing, relationships, answers to your own questions, in Claude and the app |

The free tools are the funnel: someone finds Within in the directory, connects, gets a real reading of their core chart, and is asked once to join for depth. Because readings cost Within almost nothing in Claude, membership revenue from Claude is close to pure margin. A separate, higher-priced "Within in Claude" tier is possible later (the gate is one check in `mcp/src/protocol.ts`), but one membership is easier to explain and sell.

## Before it can be listed

1. **Readings approval.** Member tools serve the same library as the app; it should be approved first.
2. **Deploy the connector** (Cloudflare Workers Paid, `mcp/README.md`) and merge the Supabase OAuth setting.
3. **Test in Claude** as a custom connector, then with the plugin uploaded to your own account.
4. **Publish the plugin folder** in a public repository (for example `praxis-mamato/within-claude-plugin`).
5. **Submit twice** at claude.ai/directory/manage: the connector (URL, privacy policy, support email, icon, a reviewer test account with membership via an access code) and the plugin bundle.
6. **Trademark check** on "Within" (Meta's Within) before the listing goes public, since the plugin name and author are reviewed for brand confusion.
