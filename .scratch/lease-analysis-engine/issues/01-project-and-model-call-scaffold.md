# 01: Project & model-call scaffold

**What to build:** A Next.js project skeleton with an OpenRouter client wrapper — the single boundary through which both engine seams call the model — plus a test harness that can stub/mock that boundary's responses. This is pure infrastructure: nothing product-visible ships in this ticket, but every later ticket needs this seam to build against.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Next.js project builds and runs locally with no product routes yet.
- [x] A single OpenRouter client wrapper exists; no code calls a provider SDK directly (per CLAUDE.md's settled stack decision).
- [x] The wrapper is structured so tests can stub/mock a model call and assert on how the caller handles a given response, without making a real network call.
- [x] Test runner is configured and a trivial smoke test (stub a model response, assert the wrapper returns it) passes in CI.

Implemented: `lib/openrouter.ts` (`callModel({messages, jsonSchema?}, deps?)`), `lib/__tests__/openrouter.test.ts` (6 tests), `vitest.config.ts`, `npm test`/`npm run typecheck` scripts. Reads env only at call time so build/dev never requires the key. Injectable `deps.fetchFn`/`apiKey`/`model` is the test seam later tickets use.

## Comments
