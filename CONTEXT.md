# Redline — Context

## Vocabulary

**Action bucket** — every flagged clause is sorted into exactly one of three
buckets, not given a flat severity score:

- **Clarify** — the user should ask a question before signing. Lowest
  stakes; often the document is ambiguous rather than one-sided.
- **Push on** — the user should attempt to negotiate this point, though
  they may not win. Moderate stakes.
- **Remove/modify** — the user should demand a specific change. Highest
  stakes; this is the bucket that gets a drafted counter-offer.

Chosen over a numeric/label severity score because it tells the renter what
to *do*, not just how bad it is. A renter who will likely sign regardless
(see v1 segment below) needs an action, not a score.

**v1 segment** — Redline v1 is built for **renters reading a lease**, and
only renters. The product assumes the renter has little individual
negotiating leverage with a landlord and will likely sign close to what
they're given — the action buckets exist to arm them for a conversation they
may still lose, not to produce insertable contract language for a
counterparty with real leverage.

Freelance agreements and Terms of Service remain named document types in
CLAUDE.md's scope list but are **not tuned or accepted in v1** — see
[[0002-v1-renters-only]].

**Relevance filter** — before a flag is ranked or bucketed, it's checked
against the renter's own profile (do they have a pet, is it a joint lease,
what type of renter are they). A clause irrelevant to the renter's actual
situation (e.g. a pet policy for a renter with no pet) is deprioritized
regardless of how dangerous it would be for someone else. Relevance to the
reader takes precedence over intrinsic danger — see
[[0004-relevance-then-danger]]. This is the mechanism that makes the
existing "user's own red lines" list (CLAUDE.md) load-bearing: it's the
renter-profile input relevance filtering runs against.

**Lease danger ranking (v1)** — for clauses that pass the relevance filter,
danger is ranked:

1. Hidden/wallet-impacting fees (highest — matches research's strongest
   evidence: junk fees, "small fee" surprises)
2. Auto-renewal of lease term
3. Security deposit deduction terms
4. Early-termination penalties
5. Landlord's right of entry (privacy)
6. Guest restrictions
7. Everything else, flagged as "unusual" rather than ranked by danger

**Bucket assignment axis** — within the relevance-and-danger-ranked list, a
clause's action bucket (clarify / push on / remove-modify) is set by, in
order: (1) whether it's realistically negotiable at all — a standard
statutory term isn't, however one-sided; (2) how one-sided/irreversible it
is; (3) dollar amount, as a tiebreaker. See [[0004-relevance-then-danger]].

**Error bias** — Redline over-flags by default rather than under-flags. A
harmless clause wrongly flagged costs attention and trust, which is
recoverable; a dangerous clause silently missed costs the renter money or
rights, which is not. Renter feedback on over-flagged clauses is the
intended correction mechanism over time (a v2 input, not built in v1). See
[[0005-over-flag-and-calibrate-tone]].

**Confidence-calibrated tone** — a flag's wording tracks the model's actual
certainty about that specific flag: hedged phrasing ("this may allow...")
when uncertain, a flat statement ("this clause allows...") when clear-cut.
Tone is not uniformly confident regardless of certainty — see
[[0005-over-flag-and-calibrate-tone]]. This is Redline's answer to the
DoNotPay regulatory precedent (research/summary.md): the product isn't
overclaiming if its language already reflects its own uncertainty.

**Opportunity flag** — distinct from a risk flag. Where a risk flag warns
about a clause that's already in the document and dangerous, an opportunity
flag suggests something favorable the renter could ask for that isn't
there, or a genuinely fine clause that could still be improved in their
favor. Surfaced when the risk-flag list is empty or thin, so a clean lease
still gives the renter something actionable rather than just "no problems
found." Only when there's truly nothing to flag or suggest does Redline
give a bare "this lease is largely standard, go ahead" verdict. See
[[0006-opportunity-flags-and-disclaimer]].

**Disclaimer** — every report states, once and prominently, that Redline is
not legal advice and not a lawyer. Non-negotiable given how assertive the
other v1 decisions make the product's output (over-flagging by default,
proactive opportunity suggestions) — this is what keeps that assertiveness
from repeating the DoNotPay precedent. See
[[0006-opportunity-flags-and-disclaimer]].

**Renter profile** — the questionnaire (state/jurisdiction, pets, joint
lease, renter type) is captured once and reused: it pre-fills on future
documents, and the renter edits what changed rather than starting blank.
State/jurisdiction is the only required field — it's the first gate in
bucket assignment ([[0004-relevance-then-danger]]) — everything else is
skippable at the cost of relevance-filter precision. See
[[0007-jurisdiction-intake-questionnaire]].

**State-standard data** — a reference source (deposit caps, notice-period
minimums, banned fee types, typical amounts) per state, distinct from the
uploaded document itself. It backs three features: the jurisdiction gate in
bucket assignment, opportunity-flag framing, and — as of
[[0008-qa-box-grounding]] — the Q&A box, which may now answer from this
data in addition to document text. Not yet sourced or built; a real data
dependency the PRD needs to name.

**Q&A grounding** — the Q&A box answers from document text or
state-standard data, and explicitly refuses questions needing anything
else (verbal agreements, hypotheticals, "should I sign this"-style advice).
This amends CLAUDE.md's current "answers only from the document" wording —
update that line when CLAUDE.md is next revised. See
[[0008-qa-box-grounding]].

**Partial extraction** — if part of a document parses cleanly and part
doesn't, Redline analyzes the clean part and explicitly discloses which
pages/sections it couldn't read, rather than refusing the whole document or
guessing at garbled text. Same principle as excluding OCR: an unreadable
section skipped is safe, one guessed at breaks the citation invariant. See
[[0009-partial-extraction-handling]].

**Opportunity flags are exempt from the citation invariant** — unlike risk
flags, they don't cite a source sentence or state-standard data point,
because they're framed as general, low-commitment suggestions rather than
findings. Report UI must keep them visually distinct from risk flags so a
renter never mistakes a suggestion for a documented fact. See
[[0010-opportunity-flags-advisory-only]].
