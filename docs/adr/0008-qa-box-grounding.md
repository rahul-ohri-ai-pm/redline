# 8. The Q&A box answers from the document and from state-standard data, and refuses everything else

## Decision

The Q&A box answers a renter's question when the answer is supported by
either (a) the document's own text, or (b) the state-standard reference
data that already backs the jurisdiction gate in
[[0007-jurisdiction-intake-questionnaire]] (e.g. "is a $50 late fee normal
for my state" is answerable because Redline already holds that data).
Questions requiring facts or reasoning outside both sources — verbal
agreements, hypotheticals, general advice ("what should I do," "should I
sign this") — are refused, not guessed at.

This amends CLAUDE.md's current wording, "a Q&A box that answers only from
the document" — the source of truth is now the document *plus* the
state-standard data Redline already collects, not the document alone. The
PRD/CLAUDE.md should be updated to reflect this when next revised.

## Alternatives

- Answer only from document text, refuse anything else, including
  state-standard comparisons. Rejected: Redline already collects and uses
  this data for the relevance filter and bucket assignment
  ([[0004-relevance-then-danger]]); refusing to answer a question the
  product already has the data for would be an inconsistent, arbitrarily
  narrower boundary than the analysis itself uses.
- Answer general advice questions too, since the product already makes
  bucket-assignment judgment calls. Rejected: this is exactly the DoNotPay
  overclaiming failure mode ([[0006-opportunity-flags-and-disclaimer]]) —
  "should I sign this" is a legal-advice question with no falsifiable
  source behind it, document or state data.

## Why

The Q&A box's credibility depends on the same falsifiability principle as
risk flags ([[0001-every-flag-cites-its-source]]): an answer should be
traceable to a source the renter (or a lawyer) could check, whether that
source is the lease text or the same state-standard data already exposed
elsewhere in the report. Anything else is Redline asserting judgment it
can't ground, which is the line the disclaimer
([[0006-opportunity-flags-and-disclaimer]]) exists to keep the product on
the right side of.

## Consequences

- The Q&A box needs to classify incoming questions against two source
  types (document text, state-standard data) and refuse cleanly when a
  question fits neither — the refusal itself needs wording so it doesn't
  read as a broken feature.
- The state-standard data source becomes shared infrastructure across three
  features: bucket assignment ([[0004-relevance-then-danger]]), the
  jurisdiction gate ([[0007-jurisdiction-intake-questionnaire]]), and now
  Q&A — a change to that data's coverage or accuracy affects all three, not
  just one.
