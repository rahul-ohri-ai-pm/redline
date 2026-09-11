---
version: 1
slug: "app-app"
primary_target: "app/(app)"
related_targets: []
---

## Scope

Visitor mode: Operate. Authenticated app shell — the frame that holds every screen behind sign-in, not any one screen. Audience: same renter, now signed in and working.

Task: hold five things in one navigable frame — paste/upload a document, the resulting report (summary, ranked flags, clean verdict), the question box, the reader's editable red-line list, and the library of past documents.

Frequency/constraints: revisited often, sometimes mid-task (checking a flag while on the phone with a landlord); the frame must stay legible and low-friction on every visit, never re-teach itself. Nothing decided here overrides PRODUCT.md's v1 scope — no screen content is designed in this brief.

**No screen inside this frame is built today.** This is a surface-brief-only round: the direction is recorded so a later session can build inside an already-committed world without re-deciding it.

## Direction contract

THESIS: The shell inherits the Code-Violation-Tag world locked for the landing page, but shifts register from Persuade to Operate — inspection-tag flourish never slows a renter mid-task; density and scanability outrank drama here.

OWN-WORLD: Same tokens as the landing page — violation-red (#C4362A), kraft (#E8DCC0), paper white (#F6F1E4), graphite ink (#2B2B28), amber push-on (#D97F2E); Big Shoulders Stencil, Courier Prime, Public Sans — restrained further for daily use: tags shrink to compact list-row chips, wire/stamp texture reduces to a left-edge color bar and a small stamp glyph rather than a fully illustrated tag, since an Operate surface earns brand in precise details, not spectacle.

STORY: A signed-in renter pastes or uploads a document, watches it become a summary, ranked flags, and a clean verdict; asks the document a question in the Q&A box; edits their own red lines; and returns to a library of past documents — every screen legible at a glance, nothing new to learn per visit.

FIRST VIEWPORT: The shell frame itself, not any one screen — a persistent left rail (document library plus the red-line list) in kraft tone, a central working pane for whatever screen is active, and a slim top strip carrying the active document's own action-bucket counts as three small stamped tallies (clarify / push on / remove-modify) — the frame's only ambient reminder of the world outside the working pane.

FORM: Same locked direction as the landing page — IMPECCABLE'S PICK, "The Code-Violation Tag"; seed key 602b2a5d. No separate roll: an established-world extension per new-work.md step 1, not a new concept tournament.

FINISH: surface brief only; no screen in this frame is built today. A build session against this brief still ends at the finish review, DESIGN.md update, and provenance on every shipping raster — this record exists so that session doesn't re-decide the world first.

## Unresolved decisions

- Exact rail behavior on mobile (drawer vs. bottom nav): not decided; a build session resolves it against real content density.
- Whether the top-strip bucket tallies are per-document or account-wide: not decided; depends on how the library screen groups documents, which this brief does not design.
- Sign-in screen's own treatment: not covered by this brief at all.
