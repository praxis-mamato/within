# Within connector for Claude (remote MCP server)

A Cloudflare Worker that Claude connects to at `/mcp`. It runs the app's chart engine
(`app/src/astro`, `app/src/content`) and returns the calculated facts plus Within's reviewed
interpretations; Claude writes the reading using the plugin's skill (`plugin/`). Nothing is
stored, and no Anthropic API key is needed: the writing happens on the person's own Claude plan.

| Tool | Access |
|---|---|
| `find_place`, `chart_overview`, `sky_today` | Any signed-in Within account |
| `natal_reading`, `timing`, `relationship_reading`, `ask_question` | Members (`entitlements.status` active or trialing, the same row the app uses) |

**Sign-in.** Supabase Auth is the OAuth 2.1 server (`[auth.oauth_server]` in `supabase/config.toml`).
An unsigned call gets `401` with `WWW-Authenticate: Bearer resource_metadata=…`; the worker serves
`/.well-known/oauth-protected-resource/mcp`, which names `<SUPABASE_URL>/auth/v1` as the authorization
server. Claude registers itself (dynamic client registration), the person approves on the app's
consent page (`#/oauth/consent`, reached through `app/public/oauth/consent/`), and each call's token
is checked against Supabase; the membership is read through row-level security with that token.

## Develop

```bash
cd app && npm ci && cd ../mcp && npm ci
npm test            # tools, protocol, sign-in responses
npm run typecheck
npx wrangler dev    # http://localhost:8787/mcp
```

## Deploy (one time)

1. Cloudflare: upgrade to Workers Paid (charts take more CPU than the free plan's 10 ms), create an API token from the **Edit Cloudflare Workers** template, and add it to this repository as the `CLOUDFLARE_API_TOKEN` Actions secret. `.github/workflows/mcp-deploy.yml` then deploys `within-mcp` to `https://within-mcp.withinoracle.workers.dev/mcp` on every change to the live branch (run it by hand from the Actions tab the first time).
2. Supabase: merging `supabase/config.toml` turns on the OAuth 2.1 server with dynamic registration. Check **Authentication → OAuth Server** shows it on with authorization path `/oauth/consent`.
3. Test in Claude: **Customize → Connectors → Add custom connector** with the `/mcp` URL, sign in, and call each tool.
