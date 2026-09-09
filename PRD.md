# Redline — Product Brief (v1)

## Who this is for, specifically, and what they do today instead

A renter, about to sign a residential lease, who has **no individual
leverage to negotiate with their landlord** — they will most likely sign
close to what they're given, whatever Redline tells them. Not a renter with
real bargaining power (a competitive rental market, a landlord open to
redlines); the product is built for the renter who signs anyway and needs
to know what they're accepting and what's worth raising regardless (ADR
0002, ADR 0003).

Today this renter either:

- Signs without catching what matters, because reading a lease closely
  against no baseline is slow and the terms that matter are often the ones
  never disclosed until after signing (see quote below), or
- Pays a lawyer for review — **$200–$2,000+**, averaging **~$660–$700**
  flat or **$200–$400/hr** (research/summary.md, "Who would plausibly
  pay") — a cost that puts review out of reach for the renter this product
  targets.

No first-person renter account surfaced in the research pass (see "What
the research could not tell us" below) — the evidence for this segment is
regulatory and cost-benchmark data, not individual renter quotes.

Freelancers, small businesses, and general ToS-signers are named
document types in the product's long-run scope but get **nothing** built
or tuned for them in v1, despite being part of the original framing
(ADR 0002).

## The problem

Renters lose money and rights to lease terms that are one-sided or simply
never disclosed until it's too late to matter:

> "[A landlord] did not disclose in any way the existence of a monthly
> utility administration fee until a lease had been signed."
> — DC Attorney General, in a suit against a landlord over undisclosed
> junk fees
> (https://oag.dc.gov/release/attorney-general-schwalb-sues-landlord-charging-illegal-junk-fees)

This is a regulatory finding, not an isolated anecdote — it names the exact
failure mode Redline is built to catch: a real cost, buried in language a
renter had no reason to scrutinize before signing.

The market gap is real too: research/summary.md found **no product that
sits in the gap Redline targets** — a cheap, fast, single-document tool for
a non-lawyer that ranks risk, cites exact source text, and drafts a
response — across 8 profiled products from free browser extensions to
$99–$550/user/month enterprise legal-team tools. The closest priced
comparable, ContractClarifyAI, runs $9 one-time to $29/month, well under
lawyer-review cost and consistent with what Fiverr contract-review gigs
already charge ($15–$500) — evidence that people already pay
out-of-pocket in this band. **Caveat:** this niche is not empty —
ContractClarifyAI and QwickContractReview already occupy almost exactly
this positioning; see "What the research could not tell us."

## What the first version does

1. The renter uploads a lease. It is parsed client-side, in the browser;
   only the extracted text is ever sent to the server or stored — never
   the original file.
2. If the uploaded document isn't a residential lease (a freelance
   agreement or Terms of Service), Redline refuses it with a clear message
   that this document type isn't supported yet.
3. Before analysis, the renter completes a structured intake
   questionnaire: state/jurisdiction (**required** — analysis cannot run
   without it) plus renter-profile fields that are skippable (pets, joint
   lease, renter type, and other red-line inputs). The questionnaire
   pre-fills from a saved profile on repeat use; the renter edits whatever
   changed.
4. Redline analyzes whatever portion of the document parsed cleanly. Any
   page or section it couldn't confidently read is skipped and explicitly
   disclosed to the renter — never guessed at.
5. Each risk found is flagged with: the exact source sentence, verbatim
   from the parsed text; an action bucket (see below); and, for
   remove/modify flags, a drafted counter-offer.
6. Flags are filtered for relevance to the renter's own profile first (a
   pet clause doesn't surface for a renter with no pet), then ranked by
   danger: hidden/wallet-impacting fees, then auto-renewal, then security
   deposit deduction terms, then early-termination penalties, then
   landlord's right of entry, then guest restrictions, then everything
   else shown as "unusual" rather than danger-ranked.
7. Every flag is sorted into exactly one action bucket — **clarify**,
   **push on**, or **remove/modify** — decided in order by: whether the
   clause is realistically negotiable at all, how one-sided/irreversible
   it is, and dollar amount as a tiebreaker.
8. On a borderline call, Redline flags rather than stays silent —
   over-flagging is the accepted default error, not under-flagging.
9. Each flag's wording tracks the model's actual certainty about that
   specific flag — hedged when uncertain, stated flatly when clear-cut.
10. When a lease has few or no risk flags, Redline still looks for
    **opportunity flags** — general, advisory suggestions of favorable
    terms the renter could ask for — before falling back to a bare "this
    lease is largely standard" verdict, which is only used when there is
    genuinely nothing to flag or suggest. Opportunity flags are not
    required to cite a source sentence or data point; they're framed as
    suggestions, not findings.
11. Every report carries a standing, prominent disclaimer: Redline is not
    legal advice and not a lawyer.
12. A Q&A box answers renter questions grounded in the document's text or
    in the state-standard reference data Redline already holds (deposit
    caps, notice-period minimums, and similar); it explicitly refuses
    questions requiring anything else (verbal agreements, hypotheticals,
    "should I sign this"-style advice).
13. The renter's own red lines — an editable list — feed the relevance
    filter and drive the analysis, alongside the profile fields from the
    intake questionnaire.
14. Past documents and their reports are saved to a library the renter can
    return to.

Nothing beyond this list is in scope for v1.

## What good looks like

- **100% of risk flags pass automated verbatim-citation verification** —
  every cited sentence is found, unedited, in the parsed text. A flag that
  fails this check does not ship; this is a blocker, not a bug to
  triage later (per the standing invariant).
- **Every flag carries exactly one action bucket** — clarify, push on, or
  remove/modify — with no unbucketed flags reaching the renter.
- **Every report a renter opens shows the disclaimer**, with no code path
  that produces a report without it.
- **No report ends in a dead end.** A lease with real risk shows
  bucketed, cited flags; a lease with little or no risk shows opportunity
  flags or, only when there is truly nothing to say, the bare "largely
  standard" verdict — never a blank or ambiguous result.
- **Skipped, unreadable sections are always visible to the renter** — a
  report that analyzed 3 of 4 pages says so, on every such report, not
  just in edge-case testing.
- **Flag wording is checkable against its own stated confidence** — a
  flag marked as uncertain reads as hedged; one stated flatly should hold
  up. This is a copy/QA check, not yet an automated one.

What's genuinely open, not decided here: whether the *judgment itself* —
which clauses get flagged, how they're bucketed, how danger is ranked — is
actually correct for real leases. Nothing in this brief specifies a test
corpus or an accuracy target for that judgment; that's a gap for whoever
scopes the build, not resolved by this brief (see "What we are not
building").

## My red lines: which clauses, how severely, and why

Ranked by danger, for clauses that pass the relevance filter:

1. **Hidden/wallet-impacting fees.** Highest priority — this is the
   best-evidenced harm in the research (the DC AG quote above; the funeral
   home 18%-of-payout fee pattern) and the most direct, hardest-to-reverse
   cost a renter can be hit with after signing.
2. **Auto-renewal of the lease term.** Locks the renter into another term
   or rate they didn't actively choose; the harm compounds the longer it
   goes unnoticed (mirrors the gym/LA Fitness auto-billing pattern in the
   research, applied to a lease term rather than a subscription).
3. **Security deposit deduction terms.** Usually the single largest sum a
   renter has at stake at move-out, and the terms governing what counts as
   deductible damage are exactly where disputes happen.
4. **Early-termination penalties.** A financial trap specifically for a
   renter who needs to leave before term end — the clause that turns a
   life change (job loss, relocation) into an unexpected bill.
5. **Landlord's right of entry.** Not primarily financial — this is a
   privacy and safety concern, ranked above guest restrictions because the
   stakes (unannounced entry to a home) are higher than a social
   restriction.
6. **Guest restrictions.** Real, but the lowest-stakes category on this
   list — affects the renter's day-to-day life rather than their money or
   physical privacy.
7. **Everything else** that deviates from what's standard for a
   residential lease is still flagged, but shown as "unusual" rather than
   ranked by danger — relevance to this renter's situation takes
   precedence over ranking clauses no one asked about.

## The calls I made, and what I gave up

- **Chose renters over freelancers, small businesses, and ToS-signers.**
  Gave up serving freelancers first, even though the product's own
  original framing led with them. **Worse off:** freelancers and ToS
  signers, who get no version of this product in v1 despite freelance
  pain (indemnity, IP assignment, kill fees) being named in the product's
  scope from day one.
- **Chose "renter will likely sign anyway" over "renter has real
  leverage."** Gave up producing insertable, ready-to-send contract
  language. **Worse off:** any renter who actually is in a position to
  negotiate (tenant-favorable market, a landlord open to changes) — they
  get triage advice, not a redraft they can paste in.
- **Chose action buckets over a flat severity score.** Gave up the
  simplicity (and portability to other document types) of a single
  numeric or label score. **Worse off:** nobody directly — this is a
  build-complexity cost, not a user cost — but it does mean this exact
  logic can't be reused as-is if freelance agreements or ToS get added
  later; it was built for the renter/landlord power dynamic specifically.
- **Chose to refuse non-lease documents outright over accepting them
  untuned.** Gave up broader day-one coverage. **Worse off:** a freelancer
  or ToS-signer who tries Redline today gets a flat refusal, not even a
  rough, clearly-caveated pass.
- **Chose relevance-filter-first over pure danger ranking.** Gave up
  showing every renter the same ranked list regardless of their situation.
  **Worse off:** a renter who skips the optional profile fields gets a
  less precise, less personalized result — the cost of not answering the
  questionnaire falls on the renter who skips it.
- **Chose over-flagging over under-flagging as the default error.** Gave
  up precision — fewer false alarms — in exchange for fewer missed risks.
  **Worse off:** every renter, a little, on trust and attention — some
  flags will be noise, and there's no numeric target yet for how much
  noise is acceptable before the product stops being believed (the
  "smoke detector that beeps at everything" risk, named but not resolved
  here).
- **Chose confidence-calibrated tone over uniformly confident tone.** Gave
  up maximum perceived authority on every flag. **Worse off:** a renter
  reading a hedged-but-correct flag next to a flatly-stated one may
  under-weight the hedged one, even when it's right — calibration protects
  Redline from overclaiming but shifts some interpretive work back onto
  the renter.
- **Chose to require jurisdiction/state at intake.** Gave up a
  jurisdiction-agnostic version that could ship without state-standard
  reference data. **Worse off:** a renter who doesn't know or won't
  disclose their state is blocked from using the product at all — this is
  friction at the front door, not a degraded result.
- **Chose a reusable, pre-filled profile over asking fresh every time.**
  Gave up a guarantee that every analysis runs against current
  information. **Worse off:** a renter who moves states or has their
  situation change and forgets to update the pre-filled profile risks
  analysis running against stale jurisdiction or household data.
- **Chose to exempt opportunity flags from the citation invariant.** Gave
  up holding every claim in the product to the same evidentiary bar.
  **Worse off:** a renter who can't tell an opportunity flag (a
  suggestion) from a risk flag (a documented finding) at a glance is
  trusting a lower-grade claim without realizing it — this puts real
  weight on report UI making the distinction obvious, which isn't
  designed yet.
- **Chose a standing disclaimer on every report over a lighter,
  disclaimer-free tone.** Gave up some of the "just tell me if it's
  fine" simplicity and confidence the rest of this brief chose to build
  toward. **Worse off:** nobody directly — this is a deliberate
  self-limitation, chosen specifically to avoid the DoNotPay outcome
  (an FTC fine over unsubstantiated "AI lawyer" claims).
- **Chose partial-document analysis (skip and disclose) over refusing
  the whole document on any parse failure.** Gave up a guarantee that
  every report covers the entire document. **Worse off:** a renter whose
  dangerous clause happens to sit in an unreadable section gets a report
  that looks complete but isn't — the disclosure protects against silent
  failure, but only if the renter reads and acts on it.

## What we are not building, and why

- **Payments/billing.** Out of scope by original product decision — not
  reconsidered here.
- **OCR for scanned documents.** Deliberately excluded: a citation
  pointing at misread text is worse than no citation at all — it would
  break the one invariant this product is built around, not just narrow
  its input formats.
- **Sharing a document between users.** Out of scope by original product
  decision — not reconsidered here.
- **Any tuning for freelance agreements or Terms of Service.** These
  remain named in the long-run scope but get no severity calibration,
  bucket logic, or Q&A framing this release — see "The calls I made."
- **A renter-feedback loop to correct over-flagging.** The over-flagging
  bias (see above) assumes feedback will eventually tune it, but that
  feedback mechanism itself is not being built in v1 — it's named as a
  known future need, not a v1 deliverable.
- **Jurisdiction-agnostic operation.** Explicitly decided against — state
  is a required field, not an optional enhancement.
- **Validation of flag/bucket/ranking judgment against a real lease
  corpus.** Not committed as part of this brief. The automated checks
  named in "What good looks like" verify citation integrity and structural
  completeness (every flag has a bucket, every report has a disclaimer) —
  none of them verify that the *judgment* is correct. That's a build/QA
  decision for whoever scopes implementation, not settled here.

## What the research could not tell us

- **No first-person renter account was found.** The lease-specific
  evidence this brief leans on (the DC AG quote) is a regulatory finding,
  not an individual renter's story — research/summary.md's caveat that
  most of its human-quoted stories "trace back to one aggregator page
  compiling a single Reddit thread" applies to the freelance/funeral-home
  examples, not to a renter-specific source, because none was found.
- **Freelance-specific pain evidence is thin** — research/summary.md notes
  it "could not find sourced freelance-specific horror stories (indemnity,
  kill fees, scope-of-work)" despite freelancing being named in the
  product's original scope. This was one factor (not the only one) in
  choosing renters over freelancers for v1.
- **Willingness-to-pay evidence is indirect.** The $9–$99 price band this
  brief's cost comparisons lean on comes from competitor pricing and
  lawyer-cost benchmarks, not renters saying what they'd pay — "Agent4
  found no first-person Reddit pricing anecdotes within its budget."
- **This niche is not uncontested.** ContractClarifyAI and
  QwickContractReview already target almost exactly Redline's
  positioning — cheap, fast, non-lawyer-facing, single-document review.
  Nothing in the research demonstrates that Redline's specific
  differentiators (action buckets, relevance filtering, jurisdiction-aware
  ranking) are actually better in practice; that's an assumption this
  brief is built on, not a finding.
- **No jurisdiction-specific data exists yet.** The state-standard
  reference data this brief now depends on for jurisdiction gating,
  opportunity flags, and Q&A (ADR 0007, 0008) has zero backing from the
  research — it's a new build requirement this brief introduces, sourced
  from nowhere the research covered.
