# 6. Opportunity flags on a clean lease; a legal disclaimer on every report

## Decision

Two additions to what a report contains:

1. When a lease has few or no risk flags, Redline still looks for
   **opportunity flags** — favorable terms the renter could reasonably ask
   for that aren't in the lease, or ways a fine clause could be improved in
   their favor — before falling back to a bare "this lease is largely
   standard, go ahead" verdict. That bare verdict is only used when there is
   genuinely nothing to flag or suggest.
2. Every report carries a prominent, standing disclaimer that Redline is
   not legal advice and not a lawyer. This is not conditional on how
   confident any given report's flags are.

## Alternatives

- Stay silent on overall verdict when nothing is flagged, just show
  whatever (possibly empty) risk list exists. Rejected: gives the renter no
  positive signal that the tool looked and found the lease acceptable, and
  wastes the report on a lease that's actually a good candidate for the
  renter to ask for more.
- Skip or soften the disclaimer to protect the confident, calibrated tone
  chosen in [[0005-over-flag-and-calibrate-tone]]. Rejected explicitly by
  the user: given over-flagging plus proactive opportunity suggestions make
  the product more assertive, not less, the disclaimer is what keeps that
  assertiveness from crossing into the DoNotPay-style overclaiming that
  drew an FTC fine (research/summary.md).

## Why

A tool that only ever reports problems stops being believed on the leases
that are actually fine — the opportunity flag gives a clean lease a
genuinely useful output instead of a shrug. The disclaimer is the
counterweight to every other v1 decision in this round making Redline
sound more confident and more prescriptive (over-flagging, opportunity
suggestions, calibrated-but-still-assertive tone) — it's cheaper to state
once, prominently, than to risk regulatory exposure for the same claim
DoNotPay was fined over.

## Consequences

- Opportunity flags need their own output shape, distinct from risk flags
  and from the three action buckets in [[0003-action-buckets]] — they
  aren't warning about something in the document, they're suggesting
  something that could be added or changed in the renter's favor.
- The "genuinely nothing to flag" bare-verdict path needs its own copy,
  separate from a risk-flag report — it's a first-class output state, not
  an empty list with no framing.
- Disclaimer placement and exact wording aren't decided yet (this ADR
  settles *that* it's mandatory and on every report, not the copy) — the
  PRD should carry the requirement forward for someone to actually word it.
