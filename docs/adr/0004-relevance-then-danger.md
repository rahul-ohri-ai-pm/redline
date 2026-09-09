# 4. Relevance to the renter's own situation is ranked above intrinsic danger

## Decision

Before a flagged clause is bucketed or severity-ranked, it passes through a
relevance filter keyed to the renter's own profile — whether they have a
pet, whether the lease is joint, and other renter-type facts captured via
the existing "user's own red lines" list (CLAUDE.md's scope list). A clause
that doesn't apply to this renter's situation (e.g. a strict pet policy for
a renter with no pet) is shown as lower priority regardless of how
dangerous that clause would be for a different renter.

For clauses that *are* relevant, bucket assignment (clarify / push on /
remove-modify, see [[0003-action-buckets]]) is set by, in order:

1. Whether the clause is realistically negotiable at all — some one-sided
   terms are standard/statutory and pushing on them wastes the renter's
   limited leverage.
2. How one-sided/irreversible the clause is, independent of dollar amount.
3. Dollar amount, as a tiebreaker between clauses of similar one-sidedness.

Within relevant, actionable clauses, danger ranks: hidden/wallet-impacting
fees first, then auto-renewal, security deposit deduction terms,
early-termination penalties, landlord's right of entry (privacy), guest
restrictions, then everything else shown as "unusual" rather than ranked.

## Alternatives

- Rank purely by intrinsic danger, ignoring renter profile. Simpler, but
  buries a $500 pet-damage clause under "irrelevant to this renter" noise
  for someone who does have a pet, and surfaces irrelevant danger (a
  detailed pet policy) for someone who doesn't — wastes the renter's
  limited attention on clauses that don't apply to them.
- Rank purely by dollar amount, ignoring one-sidedness. Rejected: a
  zero-notice entry clause has no dollar figure but is still worth
  flagging above a minor, disclosed fee.

## Why

A renter is assumed (per [[0002-v1-renters-only]]) to miss important points
and not push back unless told to. Attention is the scarce resource — a flag
list that's technically complete but not relevance-sorted asks the renter
to do the triage work Redline exists to do for them. Negotiability gates
danger because pushing on a clause that can't change wastes the renter's
one shot at raising anything with the landlord.

## Consequences

- The relevance filter needs renter-profile input (pets, joint lease,
  renter type) collected before or during analysis — this is what makes
  the "editable red lines list" in CLAUDE.md's scope actually load-bearing,
  not just a nice-to-have list of concerns.
- Clauses that fail the relevance filter still need to be shown somewhere
  (not silently dropped) but ranked below relevant ones — matches CLAUDE.md's
  rule against overclaiming: hiding a clause entirely would be a claim the
  document doesn't support checking it at all.
- "Negotiable at all" requires Redline to have some notion of what's
  statutory/standard for a residential lease vs. landlord-specific
  overreach — this is a modeling/knowledge requirement, not just a UI
  concern, and will need its own answer (what jurisdiction assumptions, if
  any) before the flag can ship.
