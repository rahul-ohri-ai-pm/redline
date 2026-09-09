# 3. Flags are sorted into action buckets, not scored by severity alone

## Decision

Every flagged clause is assigned to exactly one of three action buckets —
**clarify**, **push on**, or **remove/modify** — instead of, or in addition
to, a severity score. Only the remove/modify bucket receives a drafted
counter-offer.

## Alternatives

- A flat severity score (e.g. low/medium/high or 1–10). Simpler to compute
  and sort by, but tells a renter how worried to be without telling them
  what to do about it — and the renter persona (see
  [[0002-v1-renters-only]]) is assumed not to push on anything themselves
  unless told to.

## Why

The renter this product is built for will, per user decision, miss the
important points and not push on anything unless explicitly told. A score
alone requires the reader to translate "this is a 7/10" into an action
themselves. A bucket does that translation for them.

## Consequences

- The counter-offer feature only applies to remove/modify — clarify and
  push-on flags need their own output shape (a question to ask, a specific
  ask to raise) rather than drafted replacement text.
- Bucket assignment becomes part of what the model must justify per flag,
  alongside the source-sentence citation required by
  [[0001-every-flag-cites-its-source]] — the citation grounds *that* it's a
  risk, the bucket grounds *what tier of action* it warrants.
- Severity ranking (if kept at all) becomes a secondary sort within a
  bucket, not the primary structure of the output.
