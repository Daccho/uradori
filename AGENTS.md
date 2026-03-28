# AGENTS.md

This file provides guidance for AI coding agents working in this repository.

## Project Overview

"ウラドリ" — A dual-platform app (Apple Vision Pro + Cloudflare Workers backend) for AI-driven dialogue between TV viewers and broadcast content.

- `server/` — Hono + Cloudflare Workers API (TypeScript)
- `ios/` — visionOS app (Swift, SwiftUI, RealityKit)
- `docs/spec.md` — Full product specification (Japanese)

---

## Build Commands

### Server (run from `server/`)

```bash
pnpm install              # Install dependencies
pnpm run dev              # Local dev server (wrangler dev)
pnpm run deploy           # Deploy to Cloudflare Workers
pnpm run cf-typegen       # Generate CloudflareBindings types from wrangler.jsonc
```

### Running a Single Test

When tests are added, run a single test file with:

```bash
# Vitest (server tests)
pnpm vitest run src/tests/example.test.ts
pnpm vitest run --testNamePattern "test description"
```

### Linting/Formatting

```bash
# Biome (when configured)
pnpm biome check .
pnpm biome check --write .
pnpm biome ci .
```

### iOS

```bash
cd ios
xcodebuild -project ios.xcodeproj -scheme ios -destination 'platform=visionOS Simulator,name=Apple Vision Pro' build
```

---

## Code Style Guidelines

### TypeScript (Server)

- **Strict mode enabled** — All `tsconfig.json` strict checks must pass
- **Use `CloudflareBindings` generics** — `new Hono<{ Bindings: CloudflareBindings }>()`
- **ES modules** — Use `import/export`, no CommonJS require
- **No type assertions** (`as`/`!<`) unless absolutely necessary
- **Explicit return types** on exported functions

### Imports

```typescript
// TypeScript
import { Hono } from 'hono'
import type { CloudflareBindings } from './bindings'

// Order: external → internal → relative
// Group by: types/interfaces, functions, constants
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `voice-service.ts` |
| Types/Interfaces | PascalCase | `VoiceRequest` |
| Functions | camelCase | `fetchAudienceAI` |
| Constants | SCREAMING_SNAKE | `MAX_VOICE_LENGTH` |
| Variables | camelCase | `topicId`, `isLoading` |
| Enums | PascalCase | `APIError` |

### Error Handling

Error responses **must** follow this format:

```typescript
// Success
{ ok: true, data: { ... } }

// Error
{ ok: false, error: { code: "VOICE_TOO_LONG", message: "声は500文字以内で入力してください" } }
```

```typescript
// Throwing errors in routes
return c.json({ ok: false, error: { code: "INVALID_TOPIC", message: "トピックが見つかりません" } }, 400)
```

### Cloudflare Workers Specific

- **Bindings access**: `c.env.DB`, `c.env.AI`, `c.env.VECTORIZE`
- **Secrets**: Set via `wrangler secret put <name>`, never hardcode
- **SSE streaming**: Use `c.stream()` for AI dialog responses
- **UUID v7**: Use for all entity IDs (see `crypto.randomUUID()`)

### Swift (iOS)

- **Swift 5.9+**, targeting visionOS
- **SwiftUI** for UI, **RealityKit** for 3D/VR
- **async/await** — No completion handlers, use structured concurrency
- **@Observable** macro or ObservableObject for state management

### Swift Imports

```swift
import SwiftUI
import RealityKit
import RealityKitContent
```

### Swift Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files | PascalCase | `ContentView.swift` |
| Structs/Classes | PascalCase | `SorajiroAI` |
| Functions/Methods | camelCase | `postVoice(topicId:text:)` |
| Constants | PascalCase | `maxVoiceLength` |
| Enums | PascalCase | `APIError` |

### Swift Error Handling

```swift
enum APIError: Error {
    case requestFailed
    case invalidResponse
}

// Use throws in async functions
func postVoice(topicId: String, text: String) async throws {
    // ...
    throw APIError.requestFailed
}
```

### iOS Architecture

```
ios/
├── ios/
│   ├── ContentView.swift      # Main entry point
│   ├── Views/                  # SwiftUI views
│   ├── Models/                 # Data models, AI state
│   └── Services/               # API, Speech services
└── Packages/
    └── RealityKitContent/      # RealityKit assets
```

### General Guidelines

1. **No magic numbers** — Use named constants
2. **Early returns** — Prefer guard/early returns over deep nesting
3. **No TODO comments** — Either fix now or create an issue
4. **Comments** — Japanese for user-facing content, English for technical
5. **Tests first** — When fixing bugs, write a failing test first

---

## Testing Guidelines

- Use **Vitest** with `@cloudflare/vitest-pool-workers` for server tests
- Test files: `src/**/*.test.ts`
- Mock Cloudflare bindings using environment variables

```typescript
// Example test structure
import { describe, it, expect } from 'vitest'

describe('Voice API', () => {
  it('should reject voices over 500 characters', async () => {
    // test implementation
  })
})
```

---

## Security

- Never commit secrets, API keys, or credentials
- Admin endpoints authenticated via `X-Admin-Key` header
- Viewer endpoints are public but rate-limited
- All LLM processing stays within Cloudflare Workers AI

---

## Documentation

- User-facing content in **Japanese**
- Code comments may be Japanese or English
- Update `docs/spec.md` when API contracts change
