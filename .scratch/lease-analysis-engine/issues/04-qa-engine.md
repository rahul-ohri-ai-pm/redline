# 04: Q&A engine — grounded answers and explicit refusal

**What to build:** The `answerQuestion(text, stateStandardData, renterProfile, question) → Answer | Refusal` seam described in `spec.md`. Answers a renter's question when it's supported by the document's own text or the state-standard reference data; returns an explicit refusal — not silence, not a guess — when the question needs facts or reasoning outside both sources (verbal agreements, hypotheticals, "should I sign this"-style advice).

**Blocked by:** 01, 02

**Status:** done

- [x] Questions answerable from document text return an `Answer` grounded in that text.
- [x] Questions answerable from state-standard data (e.g. "is a $50 late fee normal for my state") return an `Answer` grounded in that data (ADR 0008).
- [x] Questions requiring facts or reasoning outside both sources return an explicit `Refusal` with wording that reads as a boundary, not a broken feature — never silence, never a guess.
- [x] "Should I sign this"-style advice questions are refused, not answered (ADR 0008's explicit rejection of general-advice answers).
- [x] Test fixture set is independent from the analysis engine's fixtures, so Q&A grounding changes can't silently break analysis-engine tests or vice versa.
- [x] The OpenRouter model call is stubbed/mocked in tests; tests assert on the engine's handling of a model response (source classification, refusal-boundary logic), not on live model output.

Implemented: `lib/qa-engine.ts` (`answerQuestion`), discriminated `Answer | Refusal` union, own fixture `tests/fixtures/qa-lease-excerpt.txt`, 8 tests including a fabricated-citation rejection test and a general-advice refusal test. Note: defines its own minimal `RenterProfile` since ticket 03 hadn't landed one yet — flagged in BUILD-REPORT.md for reconciliation.

## Comments
