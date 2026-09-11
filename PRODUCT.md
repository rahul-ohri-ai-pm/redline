# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Settled in CLAUDE.md's "Stack" section — not reconsidered here.

## Users

A renter about to sign a residential lease who has no individual leverage
to negotiate with their landlord — they will most likely sign close to
whatever they're given, whatever Redline tells them. Not a renter with real
bargaining power (competitive market, a landlord open to redlines); the
product is built for the renter who signs anyway and needs to know what
they're accepting and what's worth raising regardless (PRD.md; ADR 0002,
ADR 0003).

Today this renter either signs without catching what matters (reading a
lease closely against no baseline is slow, and the terms that matter are
often undisclosed until after signing), or pays a lawyer $200–$2,000+
(averaging ~$660–$700 flat, or $200–$400/hr) — a cost that puts review out
of reach for this renter.

Freelancers, small businesses, and general ToS-signers are named document
types in the product's long-run scope but get nothing built or tuned for
them in v1 (ADR 0002) — see Capabilities and Constraints.

No first-person renter account surfaced in the research pass; the evidence
for this segment is regulatory and cost-benchmark data (DC AG suit over
undisclosed lease fees), not individual renter quotes.

## Product Purpose

Redline reads a residential lease and returns: a plain-English summary,
risk-ranked clauses each citing the exact source sentence, a drafted
counter-offer per flagged clause, a Q&A box that answers only from the
document (or state-standard reference data), an editable list of the
renter's own red lines that drives the analysis, and a saved library of
past documents.

It exists because renters lose money and rights to lease terms that are
one-sided or never disclosed until it's too late — a real, regulator-
documented failure mode — and because no existing product sits in the gap
between free/shallow consumer tools and $99–$550/user/month enterprise
legal-team software: a cheap, fast, single-document tool for a non-lawyer
that ranks risk, cites exact source text, and drafts a response.

Success (from PRD.md "What good looks like"):
- 100% of risk flags pass automated verbatim-citation verification — a
  flag that fails does not ship; this is a blocker, not a bug to triage
  later.
- Every flag carries exactly one action bucket (clarify / push on /
  remove-modify); no unbucketed flags reach the renter.
- Every report shows the disclaimer, on every code path.
- No report is a dead end — real risk shows bucketed, cited flags; low/no
  risk shows opportunity flags or, only when there's truly nothing to say,
  a bare "largely standard" verdict.
- Skipped/unreadable sections are always disclosed on every affected
  report, not just in edge-case testing.
- Flag wording is checkable against its own stated confidence (hedged when
  uncertain, flat when clear-cut).

Explicitly open, not decided: whether the underlying judgment (which
clauses get flagged, how they're bucketed, how danger is ranked) is
actually correct for real leases — no test corpus or accuracy target is
committed in v1.

## Positioning

A cheap, fast, single-document review tool for a non-lawyer that (1) ranks
risk by both relevance to the renter's own situation and objective danger,
(2) cites the exact source sentence for every risk flag — a verifiable,
machine-checked invariant, not a claim — and (3) drafts a counter-offer per
flagged clause, at a price meant to land an order of magnitude below lawyer
review ($200–$2,000+). PRD.md anchors this to a $9–$99 range drawn from
competitor pricing (ContractClarifyAI, QwickContractReview) and Fiverr
gig rates — an unvalidated planning assumption, not a price backed by
renter willingness-to-pay research (see Evidence on Hand).

The niche is not uncontested: ContractClarifyAI and QwickContractReview
already target close to this positioning. Redline's specific bet is that
action-bucketed, relevance-filtered, citation-verified output is a real
differentiator — not yet demonstrated, an assumption the product is built
on.

## Operating Context

- The renter uploads a lease file; it's parsed client-side in the browser,
  and only extracted text ever reaches the server or storage.
- If the document isn't a residential lease, Redline refuses it with a
  clear "not supported yet" message rather than analyzing it untuned.
- Before analysis, the renter completes a structured intake questionnaire:
  state/jurisdiction (required — analysis cannot run without it) plus
  skippable renter-profile fields (pets, joint lease, renter type, other
  red-line inputs). Pre-fills from a saved profile on repeat use.
- Redline analyzes whatever portion of the document parsed cleanly; any
  page/section it couldn't confidently read is skipped and explicitly
  disclosed, never guessed at.
- The renter's own red-line list is editable and feeds the relevance
  filter alongside profile fields.
- Past documents and their reports are saved to a library the renter
  returns to.

## Capabilities and Constraints

**In scope for v1** (see PRD.md, "What the first version does"):
- Per-flag: exact verbatim source sentence, one action bucket (clarify /
  push on / remove-modify), and a drafted counter-offer for remove/modify
  flags.
- Relevance filter first (against renter profile/red lines), then danger
  ranking: hidden/wallet-impacting fees → auto-renewal → security deposit
  deduction terms → early-termination penalties → landlord's right of
  entry → guest restrictions → everything else flagged as "unusual."
- Bucket assignment (which of clarify / push on / remove-modify a flag
  gets) is set, in order, by: (1) whether the clause is realistically
  negotiable at all — a standard statutory term isn't, however one-sided;
  (2) how one-sided/irreversible it is; (3) dollar amount, as a tiebreaker.
- Over-flagging is the accepted default error, not under-flagging.
- Flag wording tracks actual model confidence (hedged vs. flat).
- Opportunity flags (advisory, not citation-bound) surface when risk flags
  are few/none, before falling back to a bare "largely standard" verdict.
- Standing, prominent disclaimer on every report: not legal advice, not a
  lawyer.
- Q&A box grounded only in document text or state-standard reference data
  (deposit caps, notice-period minimums, etc.); refuses questions needing
  anything else (verbal agreements, hypotheticals, "should I sign this").
- Editable red-line list drives the relevance filter.
- Saved library of past documents and reports.

**The one invariant:** every risk flag must cite the exact sentence it
came from, verbatim from the parsed text. A flag that can't show its
source sentence is a bug, not an edge case — a blocker (CLAUDE.md; ADR
0001). Opportunity flags are explicitly exempt from this invariant —
they're framed as suggestions, not findings, and report UI must keep them
visually distinct from risk flags so a renter never mistakes one for the
other (ADR 0010).

**Terminology** (see CONTEXT.md for full definitions): action bucket,
relevance filter, danger ranking, opportunity flag, state-standard data,
partial extraction, confidence-calibrated tone.

**Explicitly out of scope for v1** (not stubbed, not reconsidered here):
payments/billing; OCR for scanned documents (a citation pointing at
misread text is worse than no citation); sharing a document between users;
any tuning (severity calibration, bucket logic, Q&A framing) for freelance
agreements or Terms of Service, despite being named in long-run scope; a
renter-feedback loop to correct over-flagging; jurisdiction-agnostic
operation (state is required, not optional); validation of flag/bucket/
ranking judgment against a real lease corpus.

**Undecided, not invented here:** whether the flag/bucket/danger-ranking
judgment is correct for real leases (no test corpus or accuracy target
exists yet); an accepted noise threshold for over-flagging.

**Data dependency not yet sourced:** state-standard reference data
(deposit caps, notice-period minimums, banned fee types, typical amounts)
per jurisdiction — required for the jurisdiction gate, opportunity-flag
framing, and Q&A grounding, but not yet built (CONTEXT.md).

## Brand Commitments

Product name: Redline. No other name, logo, voice, or personality has been
confirmed as binding.

## Evidence on Hand

No real renter testimonials, case studies, press, or first-person renter
accounts exist. The lease-specific evidence in research/summary.md is a
regulatory finding (DC AG suit re: undisclosed utility fee), not an
individual renter's story — future work must not fabricate renter quotes,
testimonials, or case studies to fill this gap.

Freelance-specific pain evidence is thin (research/summary.md: no sourced
freelance horror stories found despite freelancing being named in original
scope) — not relevant to v1's renters-only build, but future work should
not lean on invented freelancer pain if that segment is ever built.

Willingness-to-pay evidence is indirect (competitor pricing, lawyer-cost
benchmarks), not direct renter statements of what they'd pay — do not
present a specific price as validated by user research.

## Product Principles

1. **Every claim is checkable, not just stated.** The citation invariant
   for risk flags is machine-verifiable, not a promise; anything that
   can't cite its source (or, for opportunity flags, isn't clearly marked
   as a suggestion) doesn't ship as a finding.
2. **Over-flag, don't under-flag — but calibrate tone to actual
   confidence.** A missed risk costs the renter money or rights
   (unrecoverable); a false alarm costs attention (recoverable) — but
   flag wording must reflect real certainty so hedged and flat statements
   stay distinguishable.
3. **Relevance to this renter outranks abstract danger.** A clause that
   doesn't apply to this renter's situation is deprioritized regardless of
   how dangerous it would be for someone else; the profile and red-line
   list are load-bearing inputs, not optional flavor.
4. **State assertiveness only where the product has actually limited
   itself.** The standing not-legal-advice disclaimer, action buckets
   instead of a flat score, and refusing untuned document types are
   deliberate guardrails against the DoNotPay outcome (FTC action over
   unsubstantiated "AI lawyer" claims) — don't erode them for a smoother
   product feel.
5. **Disclose incompleteness instead of guessing.** Unreadable sections
   are skipped and shown, never silently dropped or OCR'd/guessed at —
   this is the same principle that excludes OCR entirely.

