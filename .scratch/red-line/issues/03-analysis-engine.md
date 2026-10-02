# 03: Analysis engine — risk flags, opportunity flags, and partial extraction

**What to build:** The full `analyzeDocument(text, sections, renterProfile) → Report` seam described in `spec.md`. Given a renter's lease text with per-section confidence data and their profile, produce a structured report covering:

- Risk flags: verbatim source-sentence citation, action bucket (clarify / push on / remove-modify) assigned in order by negotiability, one-sidedness, then dollar amount; confidence-calibrated wording (hedged vs. flat); a drafted counter-offer for remove/modify flags only; relevance-filtered-then-danger-ranked ordering; over-flag-on-borderline bias.
- Opportunity flags: advisory suggestions (no citation required) surfaced when risk flags are few or absent, visually/structurally distinct from risk flags.
- Skipped-sections list: any page/section the parser couldn't confidently read, always surfaced, never silently dropped — unreadable sections are excluded from analysis inputs entirely, never guessed at.
- Bare "largely standard" verdict: used only when both risk and opportunity checks come up genuinely empty.
- Standing disclaimer: present on every report, unconditionally.

**Blocked by:** 01, 02

**Status:** done

- [x] Every risk flag's cited sentence is found, verbatim, in the source-text fixture — this is a blocking automated check, not a soft assertion, per ADR 0001.
- [x] Every risk flag carries exactly one action bucket; bucket assignment follows the negotiability -> one-sidedness -> dollar-amount order (ADR 0003, ADR 0004).
- [x] Remove/modify flags include a drafted counter-offer; clarify and push-on flags do not.
- [x] Flags are ordered by the relevance filter (renter profile: pets, joint lease, renter type, red lines) before the danger ranking (fees, auto-renewal, deposit deduction, early-termination, right of entry, guest restrictions, then unranked "unusual") — ADR 0004.
- [x] Borderline clauses are flagged, not silently dropped (over-flag bias, ADR 0005); flag wording is hedged or flat depending on a per-flag certainty signal.
- [x] When risk flags are few/absent, opportunity flags are returned instead of an empty result; opportunity flags carry no citation and are structurally distinct from risk flags (ADR 0006, ADR 0010).
- [x] The bare "largely standard" verdict is returned only when both risk and opportunity checks are genuinely empty.
- [x] Every returned report includes the disclaimer field, with no code path that omits it (ADR 0006).
- [x] Sections marked unreadable in the input are excluded from analysis and citation, and always appear in a skipped-sections list on the report (ADR 0009).
- [x] Test fixture set covers each ranked clause type (hidden fee, auto-renewal, deposit deduction, early-termination penalty, right of entry, guest restriction), at least one "genuinely fine" lease excerpt, and at least one excerpt with a deliberately garbled/unreadable section.
- [x] The OpenRouter model call is stubbed/mocked in tests; tests assert on the engine's handling of a model response (citation verification, bucket/relevance/ranking assignment), not on live model output.

Implemented: `lib/analysis-engine.ts` (entry point) plus `lib/analysis/{types,citation,wording,buckets,ranking,counter-offer,opportunities,model,copy}.ts`. 42 new tests across `analysis-engine.test.ts`, `citation.test.ts`, `wording.test.ts`, `buckets.test.ts`. Fabricated-citation-drop and skipped-sections tests independently spot-checked as real (not decorative). `RenterProfile` type here is authoritative; `lib/qa-engine.ts`'s duplicate needs reconciling (tracked in BUILD-REPORT.md).

## Comments
