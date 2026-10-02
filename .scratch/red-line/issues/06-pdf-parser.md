# 06: PDF upload with per-page readability

**What to build:** A renter uploads a text-layer PDF and gets per-page readability. Clean pages come through as readable sections (ids like "page-4"), garbled pages become `UnreadableSection` with `text: null` and a reason, and the renter sees which pages couldn't be read before they continue (ADR 0009). A PDF with no text layer is refused with an explicit message and never partially recovered or OCR'd (CLAUDE.md). This is its own parser behind `parseFile`, with its own readability checks, fixtures and tests; it shares no heuristic with the plain-text or DOCX parsers.

**Blocked by:** 05

**Status:** ready-for-agent

Dependency: needs `pdfjs-dist`, approved by the owner. Add it in this ticket, not earlier.

- [ ] A clean text PDF returns readable sections per page, with text unaltered by anything beyond the single normalization pass.
- [ ] A PDF with one garbled page returns that page as an `UnreadableSection` (`text: null`, reason) and the other pages as readable; the renter is told which page was skipped.
- [ ] A PDF with no text layer is refused with a clear message that scans aren't supported, and no guessed text is produced.
- [ ] The readability heuristic errs toward marking a page unreadable.
- [ ] Parsing happens in the browser; the PDF is never sent to the server.
- [ ] Tests use PDF-specific fixtures (clean, one garbled page, no text layer) and assert on the returned `text` and `Section[]`.
- [ ] Any user-facing copy has been through the humanizer skill.

## Comments
