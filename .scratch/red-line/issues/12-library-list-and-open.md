# 12: Library: list and open past documents

**What to build:** A renter sees their past documents, newest first, each with title, date, state and verdict, and can open one to see the saved report without re-uploading or re-running the model. The report view is a thin wrapper; the designed report screen and Q&A box get a separate third spec. The opened report shows the profile it ran against, so staleness is visible. An empty library tells the renter what to do next. Opening a report re-runs citation verification against the stored text on every risk flag; if one fails, the report is not rendered and the failure is logged as a blocker (CLAUDE.md's invariant), never shown as a partial report.

**Blocked by:** 11

**Status:** ready-for-agent

- [ ] The list shows only the signed-in user's documents, newest first, with title, date, state and verdict.
- [ ] Opening a document shows the saved report with every flag's exact source sentence, the skipped sections, the disclaimer and the profile snapshot, with no model call.
- [ ] A deliberately corrupted stored sentence blocks rendering and is logged.
- [ ] An empty library shows a clear next step.
- [ ] A user cannot open another user's document by id.
- [ ] Any user-facing copy has been through the humanizer skill.

## Comments
