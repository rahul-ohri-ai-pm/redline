# 2. v1 targets renters only; other document types are refused, not degraded

## Decision

Redline v1 is built and tuned for one segment: renters reading a lease.
Freelance agreements and Terms of Service stay in CLAUDE.md's long-run scope
list, but v1 **refuses to process them** — the upload flow detects or asks
the document type and returns a clear "not supported yet, coming soon"
message rather than running lease-tuned severity logic and action buckets
against a document type they weren't calibrated for.

Small businesses and general consumers are not served in v1 at all; no
version of the product currently targets them.

## Alternatives

- Accept all four document types in v1, reusing lease-calibrated logic
  untuned for the others. Ships more surface area sooner, but silently
  produces severity judgments and counter-offers calibrated for the wrong
  power dynamic (see [[0003-action-buckets]]) — a freelancer has different
  leverage than a renter, and a flat reuse would misjudge what's worth
  pushing on.
- Target freelancers first, matching the product's own tagline framing.
  Rejected: research/summary.md flags freelance-specific pain evidence as
  the thinnest link found, while renter pain (junk/hidden fees,
  auto-renewal-style traps) is the best-evidenced and has the cleanest price
  anchor ($200–$2,000+ lawyer review cost).

## Why

Renters have the strongest evidence base in research/summary.md and, unlike
a ToS-signer, actually have a document (a lease) worth pushing back on. A
tool that silently degrades quality on document types it wasn't designed
for would violate the spirit of the one invariant in CLAUDE.md — a citation
can be technically verbatim and still sit inside a severity judgment that's
wrong for the segment reading it.

## Consequences

- The upload flow needs a document-type gate before analysis begins, with a
  clear rejection message for freelance agreements and ToS, not just a
  degraded result.
- Every downstream product decision this round (severity calibration,
  action-bucket thresholds, counter-offer tone) is being made for the
  renter/landlord power dynamic specifically, and will need revisiting
  before freelance agreements or ToS are added.
