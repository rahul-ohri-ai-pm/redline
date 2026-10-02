# 16: Report screen supporting sections

**What to build:** The rest of the report a renter needs to trust it. The disclaimer is in the first screenful, not a footer. Skipped sections are listed near the top, with skipped optional profile answers named as lowering precision (ADR 0007). The profile the report ran against is shown so staleness is visible. Opportunity suggestions get their own labeled section, styled and worded differently from risk flags and never showing a source sentence they do not have (ADR 0010). The "largely standard" verdict appears only when there are no risk flags and no suggestions.

**Blocked by:** 15

**Status:** done

- [x] The disclaimer is visible without scrolling on a typical desktop viewport and is present on every report.
- [x] Skipped sections and skipped profile answers are listed near the top and match what the engine returned.
- [x] The profile snapshot is shown on the report.
- [x] Opportunity suggestions are in their own section, labeled as suggestions, with no citation shown.
- [x] The "largely standard" verdict shows only with zero risk flags and zero suggestions; tested on the clean-lease fixture report and on a report with only suggestions.
- [x] Any user-facing copy has been through the humanizer skill.

## Comments
