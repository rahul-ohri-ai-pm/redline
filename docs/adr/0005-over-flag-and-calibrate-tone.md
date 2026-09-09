# 5. Over-flag by default; calibrate tone to per-flag certainty

## Decision

When a clause is borderline, Redline flags it rather than staying silent —
over-flagging is the accepted default error, not under-flagging. Separately,
the wording of each flag tracks the model's actual certainty about that
specific flag: hedged when uncertain, stated flatly when clear-cut. These
are two independent dials — how *often* Redline flags, and how *confidently
worded* each individual flag is — not one setting.

## Alternatives

- Under-flag by default (only surface high-confidence risks). Rejected:
  the cost of a missed dangerous clause (money or rights lost, silently) is
  categorically worse than the cost of an unnecessary flag (attention
  spent, trust dinged) — and the latter is recoverable via renter feedback,
  the former isn't recoverable after signing.
- Uniformly confident tone regardless of certainty, relying on citation
  ([[0001-every-flag-cites-its-source]]) and human judgment to catch
  errors. Rejected: stacked with an over-flagging default, this reproduces
  exactly the DoNotPay FTC problem (research/summary.md) — a product
  asserting certainty it doesn't have.

## Why

Over-flagging protects the renter (the harm of a miss is asymmetric with
the harm of a false alarm). Calibrated tone protects Redline and keeps
over-flagging honest — the renter can tell, from the wording itself, which
flags are near-certain and which are Redline's best guess, rather than
every flag reading with the same borrowed authority.

## Consequences

- The model needs to output a per-flag certainty signal, not just the flag
  itself, and that signal has to drive wording choice deterministically
  enough to be checkable (similar in spirit to the verbatim-citation check
  in [[0001-every-flag-cites-its-source]]).
- Over-flagging without a feedback mechanism risks eroding trust anyway
  (the "smoke detector that beeps at everything" failure). Renter feedback
  on individual flags is the intended long-run correction but is out of
  v1's build scope — noted here so it isn't lost before a later brief
  revisits it.
