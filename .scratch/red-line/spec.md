Status: ready-for-agent

# Lease Analysis Engine — Spec

Scope note: this spec covers the two engine seams that implement the
judgment logic behind Redline v1 (see `PRD.md`) — document analysis and
document Q&A. It does not cover the surrounding upload flow, Supabase
schema, auth, or library storage; those are covered by
`.scratch/upload-auth-library/spec.md`. Revision 2 of this spec adds the
designed report screen and the Q&A box UI, which the upload/auth/library
spec deferred (its decision 8) and which have no other spec.

## Problem Statement

A renter who is about to sign a lease has no cheap, fast way to find out
what's actually risky in it. They either sign without catching what
matters, or pay $200–$2,000+ for a lawyer review. What exists for free is
shallow (grades or summarizes, doesn't rank risk or draft a response), and
even the closest-priced competitors don't ground every claim in the
renter's own document or filter results to the renter's actual situation.

## Solution

Given a renter's lease text (parsed client-side, with per-section
confidence data) and their profile (state/jurisdiction, and optionally
pets, joint-lease status, renter type, and red lines), produce a
structured report: every risk flagged with its exact source sentence, an
action bucket telling the renter what to do about it, a drafted
counter-offer where relevant, opportunity suggestions when the lease is
otherwise clean, and a standing disclaimer. Separately, answer the
renter's own questions about the document, grounded only in the document
text or known state-standard data, refusing explicitly when a question
needs neither.

## User Stories

1. As a renter, I want to upload my lease document, so that I can get an
   analysis without sending the original file anywhere.
2. As a renter, I want my upload rejected with a clear message if it's a
   freelance agreement or Terms of Service, so that I don't get an
   analysis calibrated for the wrong document type.
3. As a renter, I want to be asked for my state/jurisdiction before
   analysis runs, so that flags reflect what's actually standard where I
   live.
4. As a renter, I want to optionally tell Redline about my pets, whether
   it's a joint lease, and my renter type, so that flags are filtered to
   what's actually relevant to my situation.
5. As a renter, I want my profile (state, pets, joint lease, renter type)
   saved and pre-filled next time I analyze a document, so that I don't
   re-enter it every time.
6. As a renter, I want to edit my pre-filled profile before each analysis,
   so that I can update it if my situation changed.
7. As a renter, I want my red lines list to keep driving the analysis
   across documents, editable at any time, so that it doesn't need
   re-creating from scratch each time.
8. As a renter, I want to know exactly which pages or sections of my
   document Redline couldn't read, so that I know what wasn't checked.
9. As a renter, I want Redline to analyze the parts of my document that
   parsed cleanly even when other parts didn't, so that one bad page
   doesn't block the whole analysis.
10. As a renter, I want every risk flag to show me the exact sentence from
    my lease it's based on, so that I can verify the claim myself without
    trusting the tool blindly.
11. As a renter, I want each flag to tell me what to do about it —
    clarify, push on, or ask to remove/change it — so that I know how to
    act, not just how worried to be.
12. As a renter, I want a drafted counter-offer for any clause flagged as
    remove/modify, so that I have concrete language to raise with my
    landlord.
13. As a renter, I want flags ranked by how much they could hurt me — fees
    first, then auto-renewal, deposit terms, early-termination penalties,
    right of entry, then guests — so that I see what matters most first.
14. As a renter, I want clauses irrelevant to my situation (e.g. a pet
    policy when I have no pet) deprioritized, so that I'm not distracted
    by things that don't apply to me.
15. As a renter, I want Redline to flag borderline clauses rather than
    stay silent, so that I don't miss something that actually hurts me.
16. As a renter, I want a flag's wording to reflect how confident Redline
    actually is, so that I can tell a near-certain risk from a best-guess
    one.
17. As a renter with a clean lease, I want Redline to suggest favorable
    terms I could still ask for, so that I get something useful even when
    nothing is wrong.
18. As a renter with a genuinely fine lease, I want to be told plainly
    that it's largely standard, so that I'm not left wondering if the tool
    just found nothing.
19. As a renter, I want opportunity suggestions visually distinct from
    risk flags, so that I never mistake a suggestion for a documented
    finding.
20. As a renter, I want a clear disclaimer on every report that this isn't
    legal advice, so that I understand the limits of what Redline is
    telling me.
21. As a renter, I want to ask questions about my lease in a Q&A box, so
    that I can get quick answers without re-reading the whole document.
22. As a renter, I want Q&A answers grounded in either my lease text or
    known state-standard data, so that I can trust the answer is based on
    something real.
23. As a renter, I want the Q&A box to tell me plainly when it can't
    answer a question (because it needs facts outside my document or
    state data), so that I don't mistake silence or a guess for a real
    answer.
24. As a renter, I want my past documents and their reports saved to a
    library, so that I can return to them later without re-uploading and
    re-analyzing.
25. As a renter, I want my uploaded file itself never stored or sent
    anywhere — only the extracted text — so that my original document
    stays private.
26. As a developer validating Redline's output, I want every risk flag's
    citation automatically checked against the source text, so that a
    broken citation is caught before it ships, not after.
27. As a developer, I want every flag to require exactly one action
    bucket, so that no flag reaches the renter without one.
28. As a developer, I want every generated report to include the
    disclaimer, so that there's no code path that produces a
    disclaimer-free report.

### Report screen and Q&A box (revision 2)

29. As a renter, I want to see the verdict and a plain-English summary at
    the top of my report, so that I know in a few seconds whether the lease
    needs attention.
30. As a renter, I want flags grouped by action bucket (remove/modify,
    push on, clarify) with a count for each, so that I can see how much
    work the lease needs before reading any single flag.
31. As a renter, I want each flag to show its exact source sentence next to
    its summary, bucket and wording, so that the evidence is never a click
    away.
32. As a renter, I want a remove/modify flag's counter-offer shown with the
    flag and easy to copy, so that I can paste it into a message to my
    landlord.
33. As a renter, I want push-on and clarify flags to show the question or
    ask to raise instead of replacement text, so that every bucket tells me
    what to do.
34. As a renter, I want flags that don't apply to my profile kept visible
    but visually quieter, so that I can see what was deprioritized and why.
35. As a renter, I want skipped sections listed at the top of the report,
    not buried, so that I know what wasn't checked before I rely on it.
36. As a renter, I want skipped optional profile answers named in the
    report as lowering precision, so that I know what I gave up (ADR 0007).
37. As a renter, I want the profile the report ran against shown on the
    report, so that I can tell when it's stale.
38. As a renter, I want opportunity suggestions in their own labeled
    section, styled differently from risk flags and never showing a source
    sentence they don't have, so that I can't mistake a suggestion for a
    finding.
39. As a renter, I want the disclaimer visible on the report without
    scrolling to find it, so that I read it as part of the result.
40. As a renter with a clean lease, I want the "largely standard" verdict
    shown only when there are no risk flags and no suggestions, so that it
    means what it says.
41. As a renter, I want the report to refuse to render, with a plain
    explanation, if any flag's citation fails to verify against my stored
    text, so that I never see an unverified flag.
42. As a renter, I want a Q&A box on the same screen as my report, so that
    I can check a flag against the document without leaving the page.
43. As a renter, I want an answer to show which source it came from
    (document, state data, or both) and the exact lease sentence(s) it
    quotes, so that I can check it.
44. As a renter, I want a refusal to read as a clear boundary with a
    reason, not as a broken feature, so that I know the question was
    outside what Redline can answer.
45. As a renter, I want a general-advice question ("should I sign this")
    refused differently from an unanswerable factual one, so that I
    understand why.
46. As a renter, I want to see my question and its answer or refusal
    together while I'm on the page, so that I can compare several questions.
47. As a renter, I want a clear wait state and a retry on failure when I
    ask a question, so that a failed call is never mistaken for a refusal.
48. As a renter, I want to be unable to ask about another renter's
    document, so that my lease stays private.
49. As a renter, I want the report and Q&A box to work at phone width, so
    that I can check a flag while on a call with my landlord.
50. As a developer, I want the Q&A box to send only a document id and a
    question, so that lease text is not re-uploaded on every question.
51. As a developer, I want the Q&A handler to read the stored text and
    profile snapshot, so that an answer is always checked against the same
    text the report was.
52. As a developer, I want a source sentence in an answer verified against
    the stored text before it is shown, so that the invariant holds for
    Q&A as it does for flags.

## Implementation Decisions

**Two separately-testable seams**, kept apart rather than merged into one
module, so a change to one can't silently affect the other's tests:

- **Analysis engine seam** — `analyzeDocument(text, sections, renterProfile) → Report`.
  Takes parsed lease text with per-section confidence/skip data (from
  client-side parsing) and the renter profile, returns the structured
  report described below.
- **Q&A engine seam** — `answerQuestion(text, stateStandardData, renterProfile, question) → Answer | Refusal`.
  Answers grounded in document text or state-standard data; returns an
  explicit refusal (not silence, not a guess) when the question needs
  neither.

Both seams sit above the document-type gate (freelance agreements and ToS
never reach either seam — refused earlier, with a "coming soon" message)
and above the underlying model call, which goes through OpenRouter and
never a provider SDK directly (settled stack decision).

**Report shape** (conceptual):

- Risk flags: source-sentence citation (verbatim), action bucket
  (clarify / push on / remove-modify), confidence-tracked wording (hedged
  vs. flat, per the model's actual certainty about that flag), and — for
  remove/modify only — a drafted counter-offer.
- Opportunity flags: advisory suggestions, not tied to a citation, shown
  when risk flags are few or absent. Must read as distinct from risk
  flags.
- Skipped-sections list: any page/section the parser couldn't confidently
  read, always surfaced, never silently dropped.
- Disclaimer: standing, present on every report unconditionally.
- Bare "largely standard" verdict: used only when there is genuinely
  nothing to flag or suggest, after both risk and opportunity checks come
  up empty.

**Bucket assignment order** (within the analysis engine): (1) whether the
clause is realistically negotiable at all — a standard/statutory term
isn't, however one-sided; (2) how one-sided/irreversible it is; (3) dollar
amount as a tiebreaker.

**Relevance-then-danger ordering**: the relevance filter (keyed to
renter-profile facts — pets, joint lease, renter type, red lines, plus
jurisdiction) runs before danger ranking. Danger order for clauses that
pass relevance: hidden/wallet-impacting fees, auto-renewal, security
deposit deduction terms, early-termination penalties, landlord's right of
entry, guest restrictions, then everything else shown as "unusual" rather
than ranked.

**Error bias**: over-flag on borderline calls, never under-flag.

**Renter profile persistence**: state/jurisdiction is the only required
field (the analysis engine cannot run without it — it's the first
bucket-assignment gate); pet/joint-lease/renter-type/red-lines are
optional and degrade relevance-filter precision, not availability, when
omitted. Profile is persisted and pre-filled on repeat use, editable per
document.

**State-standard reference data**: a new data dependency (deposit caps,
notice-period minimums, banned fee types, typical amounts, per state) that
both seams depend on — analysis engine for the negotiability gate and
opportunity-flag framing, Q&A engine as its second grounding source
alongside document text. **Sourcing/building this dataset is not decided
by this spec** — see Out of Scope.

**Extraction boundary**: client-side, text-only parsing produces the
`text` and `sections` (with confidence/skip data) inputs to
`analyzeDocument`. Unreadable sections are excluded from analysis inputs
entirely, not passed through and guessed at.

**Storage**: only extracted text is ever persisted server-side; the
original uploaded file is never sent to the server or stored — this
applies regardless of which seam is used.

**Revision 2: report screen and Q&A box.**

- **The report screen replaces the thin report wrapper** the library
  currently uses. Both a freshly analyzed document and a reopened one render
  through it, from the saved `Report` exactly as stored. Nothing on it is
  recomputed by a model.
- **Order on the screen**: verdict and summary, disclaimer, skipped
  sections and skipped-profile-answer notice, flags grouped by bucket
  (remove/modify, push on, clarify) in danger order within each bucket
  (ADR 0003, 0004), opportunity suggestions in their own section, the
  profile snapshot, then the Q&A box. The disclaimer is on the first
  screenful, not in a footer.
- **Bucket tallies** from the app-shell brief render as three small
  stamped counts at the top of the working pane for the open document.
  They stay per-document here, since the library does not group documents;
  revisit if it does.
- **Flag presentation**: bucket chip, summary, the verbatim source
  sentence, and the wording the engine produced (hedged or flat), never
  rewritten by the UI. Remove/modify flags carry a copy-to-clipboard
  counter-offer. Push-on and clarify flags show the engine's ask or
  question. Flags the relevance filter deprioritized stay visible but
  quieter.
- **Opportunity flags** are visually and verbally distinct from risk
  flags, carry no citation, and are labeled as suggestions (ADR 0010).
- **Load-time re-check stays the gate**: the report screen is only reached
  through the load step that re-verifies every risk flag against the stored
  text. A failure renders the plain failure state and logs a blocker; it
  never renders a partial report.
- **Q&A box is a new seam, the ask handler**: given a session, a document
  id and a question, it loads that user's stored document, calls
  `answerQuestion` with the stored text, the state-standard data and the
  profile snapshot, and returns an `Answer` or `Refusal`. The request
  carries a document id and a question only, never text. Another user's
  document id returns not-found. A signed-out request is refused. A model
  or network failure returns an error distinct from a refusal, so the UI
  can offer a retry.
- **Q&A grounding and display** follow ADR 0008. An answer shows its
  grounding (document, state-standard data, both) and any quoted sentences;
  document-grounded answers must quote at least one sentence. Before an
  answer is returned, every quoted sentence is re-verified against the
  stored text. A failed check turns the response into an error, not a
  shown answer. Refusals show the engine's text; general-advice refusals
  and unanswerable-factual refusals are styled the same way but keep their
  distinct wording.
- **Q&A history is not stored.** Nothing in the v1 list says questions or
  answers are saved. The box keeps the session's questions and answers on
  the page only; reloading clears them. The upload-auth-library spec made
  the same call.
- **Q&A requires an account**, as analysis does, because it reads a stored
  document.
- **Mobile**: report and Q&A work at phone width. The rail's mobile
  behavior (drawer or bottom nav) was left to a build session by the shell
  brief and is resolved there, against the real report content.
- **Copy** for every label, refusal frame, empty state and error goes
  through the humanizer skill before it is committed, per CLAUDE.md. Engine
  output (summaries, counter-offers, answers, refusal text) is displayed
  as returned.
- **Styling** follows DESIGN.md, PRODUCT.md and the app-shell brief:
  compact list-row chips and a restrained register. No thick one-sided
  accent borders.

## Testing Decisions

- A good test here exercises the seam's external behavior — given input
  text/profile/question, assert on the returned `Report` or
  `Answer`/`Refusal` shape — not internal prompt construction or
  intermediate model-call plumbing.
- **Citation verification is a blocking automated check**, not a soft
  assertion: every risk flag's cited sentence must be found verbatim in
  the source-text fixture, or the test fails. This is the single
  highest-priority test in the suite, mirroring the standing invariant.
- The two seams are tested independently with their own fixture sets, so
  Q&A grounding logic changes can't silently break analysis-engine tests
  or vice versa.
- Fixture set (shared conceptually, used by both seams' suites): realistic
  lease excerpts covering each ranked clause type — hidden fee, auto-
  renewal, deposit deduction, early-termination penalty, right of entry,
  guest restriction — plus at least one "genuinely fine" lease excerpt to
  exercise the opportunity-flag and bare-verdict paths, and at least one
  excerpt with a deliberately garbled/unreadable section to exercise
  partial-extraction handling.
- The model call (via OpenRouter) is the boundary that's mocked/stubbed in
  tests for both seams — tests verify the engine's handling of a model
  response (citation verification, bucket/relevance/ranking assignment,
  refusal-boundary logic), not a live model's actual output.
- No existing test prior art in this repo — this is a greenfield codebase;
  these will be the first tests written.
- Judgment-quality validation (is a given clause's bucket/ranking
  assignment actually correct for a real lease) is out of scope for this
  spec's test suite — it covers structural correctness (citation verified,
  bucket present, disclaimer present, refusal returned correctly), not
  whether the underlying judgment is right.

**Revision 2 testing.**

- **One new seam, the ask handler.** Test it through its external
  behavior with an injected session, document store and model stub:
  - An answerable question returns an `Answer` with its grounding, and a
    document-grounded answer's quoted sentences are found verbatim in the
    stored text.
  - An unanswerable factual question and a general-advice question each
    return a `Refusal`.
  - A fabricated quoted sentence turns the response into an error, never a
    shown answer. This is blocking, like the flag citation check.
  - Another user's document id returns not-found; signed-out is refused.
  - A model failure returns an error distinct from a refusal.
  - The request body is a document id and a question only.
- **The report screen is not a seam.** Test the saved `Report` through the
  existing load step: a corrupted stored sentence still blocks rendering.
  The ordering, grouping and counts the screen shows are derived from the
  saved report by pure functions, tested on fixture reports (adhesion lease
  with flags, clean lease with opportunity flags only, a report with
  skipped sections). Assert on the derived output, not on component
  internals.
- The model call stays the mocked boundary, built from the sidecar
  fixtures so the suite runs without a key. The existing smoke script can
  gain one real ask-a-question path when a key is present.
- Prior art: the library, analyze-handler and delete tests, which inject
  a session, a store and a model stub.

## Out of Scope

- Anything not on the "what the first version does" list in `PRD.md`.
- Payments/billing, OCR, document sharing between users.
- Tuning either seam for freelance agreements or Terms of Service — those
  document types are refused before reaching either seam, not processed
  by them at reduced quality.
- A renter-feedback loop to correct over-flagging — named as a future
  need, not built here.
- Jurisdiction-agnostic operation — state is a required input, not
  optional.
- Validation of flag/bucket/ranking judgment against a real lease corpus,
  or any accuracy target for that judgment.
- **Sourcing or building the state-standard reference dataset itself.**
  This spec assumes it exists as an input to both seams; acquiring it is
  a prerequisite this spec surfaces but does not resolve.
- The upload flow, questionnaire UI, Supabase schema, auth, and library
  storage — covered by `.scratch/upload-auth-library/spec.md`, not here.
- Saving Q&A history, exporting or printing a report, sharing a report,
  and editing a flag or counter-offer. None are on the PRD v1 list.
- Changing what either engine returns. The screens display engine output
  as returned; judgment changes are separate work.
- The run-to-run variance in how many flags the analysis returns on the
  same document (one smoke run returned 16 flags, a later one 1). It is a
  judgment-quality concern, not a screen concern, but this screen will make
  it visible and it should be looked at first.

## Further Notes

- The state-standard reference data dependency is the single biggest
  unresolved prerequisite for both seams — worth a research or prototype
  pass before implementation starts in earnest, since neither seam's
  negotiability gate, opportunity framing, or Q&A grounding can be built
  against real data without it.
- Relevant ADRs: `docs/adr/0001` (citation invariant) through `0010`
  (opportunity flags exempt from citation). `CONTEXT.md` holds the
  vocabulary used throughout this spec (action bucket, relevance filter,
  opportunity flag, state-standard data, renter profile, partial
  extraction) — read both before implementing.
- Revision 1 covered the full judgment layer of `PRD.md`'s v1 list at the
  engine level. The upload, auth and library surface is in
  `.scratch/upload-auth-library/spec.md` and is built. Revision 2 specs the
  last unbuilt v1 surface, the report screen and the Q&A box. After it,
  every item on the PRD v1 list has a spec.
- The thin report view built for the library is the starting point. The
  `/api/gate` route has no session check today, and the Q&A route must not
  copy that.
- Open: whether the top-strip tallies become account-wide once the library
  groups documents; whether the mobile rail is a drawer or bottom nav.
