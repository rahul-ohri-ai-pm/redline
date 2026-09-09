# 9. Analyze what parses cleanly; disclose what didn't, never guess

## Decision

When client-side parsing can only confidently extract part of a document
(e.g. pages 1–3 parse cleanly, page 4 comes out garbled), Redline analyzes
the clean portion and explicitly tells the renter which pages or sections
it could not read and skipped. It does not refuse the whole document, and
it does not attempt to analyze or cite text it isn't confident was
extracted correctly.

## Alternatives

- Refuse the whole document if any part fails to parse cleanly. Rejected:
  discards a partial but genuinely useful analysis over one bad page,
  overly conservative given the renter is assumed to have limited
  alternatives (per [[0002-v1-renters-only]], they're unlikely to negotiate
  regardless — but they can still act on what Redline *did* read).
- Attempt to analyze garbled text anyway, flagging it as lower-confidence
  via the tone-calibration mechanism from
  [[0005-over-flag-and-calibrate-tone]]. Rejected: this is exactly the
  failure mode OCR was excluded to prevent (CLAUDE.md: "a citation pointing
  at misread text is worse than no citation") — garbled extraction is the
  same risk as misread scanned text, just from a different cause.

## Why

Consistent with why OCR is excluded from scope at all: an unreadable
section skipped and disclosed protects the citation invariant
([[0001-every-flag-cites-its-source]]); an unreadable section guessed at
breaks it. Partial analysis is still strictly better than an outright
refusal for a renter who has no other cheap option.

## Consequences

- The parser needs a confidence signal per page/section (clean vs.
  garbled/unreadable), not just a single pass/fail for the whole document.
- The report UI needs a visible "couldn't read: page 4" notice, not a
  silent gap — otherwise a renter has no way to know their deposit clause
  on page 4 was never actually checked.
