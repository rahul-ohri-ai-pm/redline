# 01: Project & model-call scaffold

**What to build:** A Next.js project skeleton with an OpenRouter client wrapper — the single boundary through which both engine seams call the model — plus a test harness that can stub/mock that boundary's responses. This is pure infrastructure: nothing product-visible ships in this ticket, but every later ticket needs this seam to build against.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Next.js project builds and runs locally with no product routes yet.
- [ ] A single OpenRouter client wrapper exists; no code calls a provider SDK directly (per CLAUDE.md's settled stack decision).
- [ ] The wrapper is structured so tests can stub/mock a model call and assert on how the caller handles a given response, without making a real network call.
- [ ] Test runner is configured and a trivial smoke test (stub a model response, assert the wrapper returns it) passes in CI.

## Comments
