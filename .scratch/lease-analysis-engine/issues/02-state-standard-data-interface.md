# 02: State-standard data interface

**What to build:** The typed contract for state-standard reference data (deposit caps, notice-period minimums, banned fee types, typical amounts, per state) that both engine seams will consume, plus fixture data for 2-3 states so downstream tickets aren't blocked on sourcing the real dataset. Sourcing/building the actual production dataset is explicitly out of scope for this spec (see `spec.md`'s Out of Scope and Further Notes) — this ticket only defines the shape and provides enough fixture data to test against.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A typed shape for state-standard data is defined (deposit caps, notice-period minimums, banned fee types, typical amounts, keyed by state).
- [ ] Fixture data exists for at least 2-3 states, covering enough fields to exercise the negotiability gate, opportunity-flag framing, and Q&A grounding in later tickets.
- [ ] The interface is documented as a stand-in for a real dataset, not the real dataset — a follow-up ticket will be needed to source/build production data.

## Comments
