# 07: DOCX upload with per-block readability

**What to build:** A renter uploads a Word document and gets per-block readability. Readable blocks come through as sections, unreadable blocks become `UnreadableSection` with `text: null` and a reason, and the renter sees what couldn't be read before they continue (ADR 0009). This is its own parser behind `parseFile`, with its own readability checks, fixtures and tests; it shares no heuristic with the plain-text or PDF parsers.

**Blocked by:** 05

**Status:** ready-for-agent

Dependency: needs `mammoth`, approved by the owner. Add it in this ticket, not earlier.

- [ ] A clean DOCX returns readable sections with text unaltered by anything beyond the single normalization pass.
- [ ] A DOCX with an unreadable block returns that block as an `UnreadableSection` (`text: null`, reason) and the rest as readable; the renter is told what was skipped.
- [ ] The readability heuristic errs toward marking a block unreadable.
- [ ] Parsing happens in the browser; the DOCX is never sent to the server.
- [ ] Tests use DOCX-specific fixtures (clean, one unreadable block) and assert on the returned `text` and `Section[]`.
- [ ] Any user-facing copy has been through the humanizer skill.

## Comments
