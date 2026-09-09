# 7. A structured, jurisdiction-aware questionnaire gates analysis, and persists as a reusable profile

## Decision

Before analysis runs, the renter completes one structured questionnaire
that captures: state/jurisdiction (required — analysis cannot run without
it), plus renter-profile facts that drive the relevance filter (pets, joint
lease, renter type, and other red-line inputs from CLAUDE.md's scope) which
are skippable, at the cost of the relevance filter running with less
precision.

This questionnaire is saved as a reusable renter profile. When the renter
analyzes a new document (a different lease, a new address), the
questionnaire is pre-filled from the saved profile, and the renter edits
whatever changed (new state, new roommates, etc.) rather than starting from
blank fields.

## Alternatives

- Ask for state/jurisdiction only if a clause's legality is ambiguous,
  rather than upfront. Rejected: jurisdiction was made the *first* gate in
  bucket assignment ([[0004-relevance-then-danger]]) — deferring it means
  re-running judgment logic mid-analysis instead of once at intake.
- Treat every questionnaire field as required. Rejected: forcing renter
  type / pet / joint-lease answers before any analysis can run adds friction
  for a renter who just wants a fast read; only jurisdiction is load-bearing
  enough to block analysis outright.
- Ask the full questionnaire fresh every time, no saved profile. Rejected:
  most of a renter's profile (state, renter type) doesn't change between
  documents, and re-asking the same questions on every upload contradicts
  the "quick" framing the user asked for.

## Why

Jurisdiction now determines what counts as standard/statutory vs. landlord
overreach for the *first* bucket-assignment gate
([[0004-relevance-then-danger]]) — without it, "is this even negotiable"
can't be judged at all, so it can't be optional. Everything else in the
questionnaire only sharpens relevance, so it can degrade gracefully instead
of blocking.

## Consequences

- Redline needs a reference source for what's standard per state (deposit
  caps, notice-period minimums, banned fees) to make jurisdiction data
  useful, not just collected — a real data dependency for the PRD to name,
  not just a form field.
- The renter profile becomes persistent user data (state, pet status, etc.)
  distinct from any single document's extracted text — needs its own
  storage consideration alongside the "only extracted text is stored"
  constraint in CLAUDE.md, which was written about the *document*, not
  about profile/questionnaire data.
- A skipped optional field needs to visibly degrade the relevance filter's
  output (e.g. show "some flags may be less precise — pet status not
  provided") rather than silently produce a worse-but-unlabeled result.
