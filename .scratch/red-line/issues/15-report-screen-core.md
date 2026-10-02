# 15: Report screen core: bucketed flags with their evidence

**What to build:** A renter opens a saved document and sees a designed report in place of the thin wrapper. The verdict and plain-English summary come first, then flags grouped by action bucket (remove/modify, push on, clarify) in danger order within each bucket, with three small stamped bucket tallies at the top of the working pane. Each flag shows its bucket chip, summary, the verbatim source sentence and the engine's wording as returned. Remove/modify flags carry a counter-offer the renter can copy; push-on and clarify flags show the engine's ask or question. Flags the relevance filter deprioritized stay visible but quieter. The screen is only reached through the load step that re-verifies every risk flag against the stored text; a failure shows the plain failure state and logs a blocker, never a partial report. Nothing on the screen is recomputed by a model.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Grouping, ordering and bucket counts are derived from the saved report by pure functions, tested on fixture reports (adhesion lease with flags, a report with deprioritized flags) by asserting on the derived output.
- [ ] Every flag on screen shows its exact source sentence; a deliberately corrupted stored sentence still blocks rendering and is logged.
- [ ] A remove/modify flag's counter-offer can be copied; push-on and clarify flags show their ask instead of replacement text.
- [ ] Deprioritized flags are visible and visually quieter.
- [ ] Bucket tallies for the open document appear at the top of the working pane.
- [ ] No model call happens on open.
- [ ] Any user-facing copy has been through the humanizer skill.

## Comments
