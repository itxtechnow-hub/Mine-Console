# MineBot Gateway (OmniRoute → Vercel)

A single-tenant conversion of [OmniRoute](https://github.com/cheaper-inference/OmniRoute) (by Cheaper Inference, MIT) rebuilt as one deployable Next.js app for Vercel. One unified API over **321 providers**, with a dashboard, auth, fallback combos, tool calls, and CLI support.

## What this is

- **Unified gateway** — `POST /v1/chat/completions` (OpenAI protocol in/out) and `POST /v1/messages` (Anthropic protocol in/out, for Claude Code). Full bidirectional translation between the two, including **tool calls** and **SSE streaming** in both directions.
- **321-provider catalogue** extracted from OmniRoute's real source (`src/shared/constants/providers/`), with curated base URLs for 47 providers.
- **Dashboard** with the OmniRoute tree: Overview, Providers (one branch per connection you add), Models, Combos, Logs, CLI setup, Settings.
- **Model transparency** — `GET /v1/models` exposes each model's `source` (discovered / manual / combo) and its provider `base_url`.
- **Single-admin auth** — password login, HMAC-signed session cookie, middleware-gated dashboard.
- **Encrypted credentials** — provider API keys are AES-256-GCM encrypted at rest and never returned to the browser.
- **Fallback combos** — map one public model name to an ordered chain of connections; on rate limit, outage, timeout or error, the gateway falls through to the next.

## What was dropped (deliberately)

Everything that has no meaning on Vercel: local server hosting, ngrok/tunnels, local model runtimes (Ollama/LM Studio endpoints still work as *connections* — they just must be publicly reachable), WebSocket servers, and the persistent worker/queue layer. Vercel Functions are request-scoped: the gateway does everything within a single request (max 60s).

## Deploy

1. Push this folder to a Git repo.
2. In Vercel: **New Project → Import**. Framework preset: Next.js. No build config needed.
3. **Storage → Create Blob store** (attaches `BLOB_READ_WRITE_TOKEN` automatically — this is your persistence; config + logs live in Blob).
4. Set environment variables:

   | Variable | Value |
   |---|---|
   | `ADMIN_PASSWORD` | your dashboard login password |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `GATEWAY_KEY` | the Bearer token your CLI clients will send |
   | `CREDENTIAL_ENCRYPTION_KEY` | `openssl rand -hex 32` (64 hex chars) |

5. Deploy a Preview first, test, then promote to Production.

## Using the gateway

```bash
# OpenAI protocol
curl https://YOUR_APP.vercel.app/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GATEWAY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "any-model-name", "messages": [{"role": "user", "content": "ping"}]}'

# Anthropic protocol (Claude Code)
export ANTHROPIC_BASE_URL=https://YOUR_APP.vercel.app/v1
export ANTHROPIC_AUTH_TOKEN=YOUR_GATEWAY_KEY
claude --model any-model-name
```

Model resolution: if a **combo** exists for the requested model name, its target chain is used in order. Otherwise the request is tried against every active connection with the model id as-is. The dashboard's **CLI setup** page has copy-paste configs for Claude Code, OpenCode, Antigravity, Codex CLI, Cursor, and Cline.

## Architecture

```
app/
  login/                     password login
  app/                       dashboard (Overview, Providers, Models, Combos, Logs, CLI, Settings)
  api/auth/                  login/logout
  api/v1/chat/completions/   OpenAI-protocol surface
  api/v1/messages/           Anthropic-protocol surface
  api/v1/models/             model list with source + base_url
  api/admin/                 provider CRUD, test, discover, combos, logs
lib/
  gateway.js                 routing, protocol translation, SSE transforms, dispatch
  store.js                   Vercel Blob persistence + AES-256-GCM credential encryption
  auth.js                    session signing/verification
middleware.ts                session gate for /app/* and /api/admin/*
data/provider-catalog.json   321 providers extracted from OmniRoute source
```

## Notes & limits

- **Persistence** is Vercel Blob (`omniroute/config.json`, `omniroute/logs.json`). Without a Blob store the app runs on in-memory fallback and config resets on cold start — the dashboard warns you.
- **Logs** are metadata only (model, provider, status, latency, tokens). Prompts and keys are never logged; capped at 400 entries.
- **Streaming** works for both protocols, including cross-protocol SSE translation.
- **Timeouts**: outbound provider calls default to 60s (`GATEWAY_TIMEOUT_MS` to change). Keep function `maxDuration` within your Vercel plan's limits.
- Blob objects are written with public access (a Vercel Blob requirement for simple key reads); the config contains only encrypted keys, and the blob URL is not discoverable — but treat the storage as non-secret and keep `CREDENTIAL_ENCRYPTION_KEY` safe. Losing it makes stored credentials unrecoverable.
- Provider base URLs: 47 catalogue entries carry curated base URLs (10 verified high-confidence). Always confirm against the provider's official docs before adding a key.

## Credits

Derived from [OmniRoute](https://github.com/cheaper-inference/OmniRoute) by Cheaper Inference (MIT). This conversion keeps the gateway/routing/combos concepts and the provider catalogue; the implementation is a fresh Next.js/Vercel build.
