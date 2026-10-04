---
version: 1
slug: "app-app"
primary_target: "app/(app)"
related_targets: []
---

## Scope

Visitor mode: Operate. The authenticated app shell and every screen inside it:
sign-in, add-a-document (upload, preview, type gate, analyze), the saved
report, the Q&A box, the questionnaire and red-line editor, and the library.
Audience: the renter from PRODUCT.md, now signed in and working.

Task: hold the frame and six screens in one vocabulary — get a document in and
parsed, read a report of ranked flags that each quote their own source
sentence, ask the document a question, keep a profile and red-line list
current, and come back to past documents.

Frequency/constraints: revisited often, sometimes mid-task (checking a flag
while on the phone with a landlord); the frame must stay legible and
low-friction on every visit, never re-teach itself. Nothing designed here
overrides PRODUCT.md's v1 scope or the citation invariant: a report that
cannot re-verify a quote shows its failure state and no flags.

The screens were shipped by an engineering run with no design pass. This round
designs into that working code — behavior, routes, server/client boundaries,
copy meaning and tests are preserved; the visual system is the change.

## Direction contract

THESIS: The shell inherits the Code-Violation-Tag world locked for the landing
page, but shifts register from Persuade to Operate — inspection-tag flourish
never slows a renter mid-task; density and scanability outrank drama here. The
frame refuses the uniform-bordered-card stack the engineering build left: one
paper ground, and a mark only where something was actually found.

OWN-WORLD: Same tokens as the landing page — violation-red (#C4362A), kraft
(#E8DCC0), paper white (#F6F1E4), paper-flat (#EFE7D4), graphite ink
(#2B2B28), amber push-on (#D97F2E), clarify graphite (#8C8577); Big Shoulders
Stencil for the wordmark and screen titles only, Courier Prime for every
numeral, stamp and field label, Public Sans for everything a renter reads —
restrained further for daily use: a fixed rem type scale instead of the
landing page's clamps, and the illustrated tag compressed to a notch-cut row
(20px die-cut top-left corner, kraft head rule, mono ticket number, rotated
bucket stamp) with no wire, grommet or dollar roundel. The brief's earlier
left-edge color bar is dropped: the notch is this world's silhouette and a
colored left border is the generic alert pattern the design hook already
rejected once. Dashed strokes stay exclusive to the clarify bucket — the
deprioritized, refusal, suggestion and empty states each get their own
non-dashed device.

STORY: A signed-in renter pastes or uploads a document and sees exactly what
text will leave the browser; watches it become a verdict, a plain-English
summary and flags grouped by what to do about them; asks the document a
question and gets an answer that shows its grounding or a refusal that shows
its boundary; edits the red lines that drive the next analysis; and returns to
a library of past documents — every screen legible at a glance, nothing new to
learn per visit.

FIRST VIEWPORT: The frame — a persistent 15rem left rail in kraft holding the
wordmark and three links, a slim paper-flat top strip spanning the working
pane with the active screen's name at left and, on an open report, that
document's three stamped bucket tallies in mono at right, and the working pane
below it. On the report the pane opens on the verdict and summary with the
not-legal-advice disclaimer beside them, then what wasn't read, then the
flags. On the phone the rail collapses to that same strip with a Menu button
and the tallies wrap under the document name, so the verdict still leads.

FORM: Same locked direction as the landing page — IMPECCABLE'S PICK, "The
Code-Violation Tag"; seed key 602b2a5d. No separate roll and no comp round:
an established-world extension built code-led per new-work.md step 1, not a
new concept tournament.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance

## Resolved in this build

- Rail on phones: a drawer, not a bottom nav. The rail holds five things; a
  bottom bar fits three at 360px with no room for the signed-in email and
  Sign out, and it would sit on top of the Q&A box and the keyboard — the
  screen a renter has open mid-call. Recorded with its reasoning in ticket
  18's comments; inherited here, not re-decided.
- Top-strip tallies: per open document, not account-wide, per ticket 15. The
  library row carries its own per-document chips instead, so no screen shows
  an account-wide count.
- Sign-in treatment: the inspector's clipboard before anything is on it — the
  paper lease sheet centered on kraft, wordmark stamped at its head, one email
  field and one button, no tag wired on and no example lease text. The 8px
  violation-red top border is removed: it was the one place red ran as a field
  rather than a mark.
- The bucket mark on a compact row: the notch-cut silhouette plus the mono
  stamp, not a left-edge color bar.

## Unresolved decisions

- The top strip is styled by the shell but filled per screen, because the
  tallies belong to a document the layout does not load. If a screen is ever
  added that needs the frame to know the open document, that becomes a layout
  data concern this round did not build.
