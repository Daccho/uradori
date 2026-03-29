# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"ウラドリ" — a dual-platform app (Apple Vision Pro + Cloudflare Workers backend) that enables interactive, AI-driven dialogue between TV viewers and broadcast content. Viewers voice opinions during broadcasts; two AIs (ソラジローAI with full broadcast materials via RAG, and 視聴者代表AI aggregating viewer voices) debate in a spatial VR environment.

## Repository Structure

- `server/` — Hono + Cloudflare Workers API (TypeScript)
- `ios/` — visionOS app (Swift, SwiftUI, RealityKit)
- `docs/spec.md` — Full product specification (Japanese)

## Server Development

### Commands (run from `server/`)

```bash
pnpm install              # Install dependencies
pnpm run dev              # Local dev server (wrangler dev)
pnpm run deploy           # Deploy to Cloudflare Workers
pnpm run cf-typegen       # Generate CloudflareBindings types from wrangler.jsonc
```

### Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (pass `CloudflareBindings` as generics: `new Hono<{ Bindings: CloudflareBindings }>()`)
- **DB**: D1 (SQLite) with Drizzle ORM, UUID v7 for all IDs
- **AI**: Workers AI only (llama-3.1-70b-instruct for LLM, plamo-embedding-1b for embeddings) — no external LLM APIs allowed for data confidentiality
- **Vector search**: Cloudflare Vectorize for RAG
- **Storage**: R2 for media files
- **Package manager**: pnpm
- **Testing**: Vitest with @cloudflare/vitest-pool-workers
- **Linter/Formatter**: Biome

### Key Design Decisions

- All LLM/embedding processing must stay within Cloudflare Workers AI — data must not leave Cloudflare infrastructure
- SSE streaming for AI dialog responses (Workers paid plan, no timeout)
- Admin endpoints authenticated via `X-Admin-Key` header; viewer endpoints are public
- Error responses follow `{ ok: false, error: { code, message } }` format
- CORS: `localhost:*` in dev, `*.uradori.workers.dev` + `https://uradori-web.workers.dev` in prod

### Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 | Database |
| `VECTORIZE` | Vectorize | Vector index for RAG |
| `AI` | Workers AI | LLM + Embedding |

### Secrets (via `wrangler secret put`)

`ADMIN_KEY`, `HACKATHON_API_KEY`, `HACKATHON_API_URL`

## iOS Development

- Xcode 15+ required, targeting visionOS
- Project at `ios/ios.xcodeproj`
- Uses ImmersiveSpace (RealityKit), Speech framework for voice input, AVFoundation for video, URLSession/WebSocket for API communication

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/topics` | Admin | Register topic |
| GET | `/api/topics` | Public | List topics (filter by title_id, onair_date) |
| POST | `/api/voice` | Public | Submit viewer voice (500 char limit) |
| POST | `/api/dialog/start` | Public | Aggregate voices → generate questions → AI dialog → SSE stream |
| POST | `/api/ingest` | Admin | Register materials to Vectorize (auto from external API or manual) |

## Language

The product, spec, and user-facing content are in Japanese. Code and comments may be in either Japanese or English.
