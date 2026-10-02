# 10: Questionnaire, saved profile and red lines

**What to build:** A signed-in renter completes one questionnaire screen: state (required), pets, joint lease and renter type (each skippable), plus an editor for their red lines (add, edit, remove, reorder). It pre-fills from the saved profile and the renter edits what changed (ADR 0007). Answers and red lines are saved per user and carry across documents. The state picker offers only states present in the state-standard data (CA, TX, NY today); a renter in any other state is told plainly that their state isn't covered yet and cannot proceed. Skipped optional fields are named on the screen as lowering relevance precision, and recorded as "not provided", distinct from "no".

**Blocked by:** 09

**Status:** done

- [x] `profiles` and `red_lines` tables exist via a migration, each with row-level security limiting a user to their own rows.
- [x] Row-level-security tests against a real Supabase instance show user A cannot read, update or delete user B's profile or red lines, and an unauthenticated request reads nothing.
- [x] State is required; submission is blocked without it and for states with no state-standard data.
- [x] Skipped optional fields round-trip as "not provided", not `false`.
- [x] The questionnaire pre-fills from the saved profile on a second visit.
- [x] Red lines can be added, edited, removed and reordered, and persist across sessions.
- [x] Skipped fields are listed with the precision warning.
- [x] Submitting produces the `RenterProfile` shape the analysis engine takes.
- [x] Any user-facing copy has been through the humanizer skill.

## Comments
