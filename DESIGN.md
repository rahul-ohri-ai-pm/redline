---
name: Redline
description: A building-inspector's clipboard world where lease sentences become numbered, wired violation tags.
colors:
  violation: "#c4362a"
  violation-dark: "#8f2820"
  kraft: "#e8dcc0"
  kraft-dark: "#cdbd97"
  paper: "#f6f1e4"
  paper-flat: "#efe7d4"
  ink: "#2b2b28"
  ink-soft: "#55534a"
  steel: "#6b6b63"
  amber: "#d97f2e"
  amber-dark: "#a85f1f"
  clarify: "#8c8577"
typography:
  display:
    fontFamily: "Big Shoulders Stencil, Arial Narrow, sans-serif"
    fontSize: "clamp(2.3rem, 4.6vw, 3.6rem)"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Big Shoulders Stencil, Arial Narrow, sans-serif"
    fontSize: "clamp(1.7rem, 3.2vw, 2.4rem)"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "0.015em"
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.85rem"
    fontWeight: 700
    letterSpacing: "0.03em"
rounded:
  flat: "0px"
  sharp: "2px"
  circle: "50%"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.75rem"
  lg: "2.4rem"
  section: "clamp(3rem, 6vw, 5rem)"
components:
  button-primary:
    backgroundColor: "{colors.violation}"
    textColor: "{colors.paper}"
    typography: "{typography.display}"
    rounded: "{rounded.sharp}"
    padding: "0.95rem 1.9rem"
  button-primary-hover:
    backgroundColor: "{colors.violation-dark}"
  chip-exclusion:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.flat}"
    padding: "0.65rem 1.1rem"
  stamp-remove:
    backgroundColor: "{colors.violation}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "0.35rem 0.9rem"
  stamp-push:
    backgroundColor: "transparent"
    textColor: "{colors.amber-dark}"
    typography: "{typography.label}"
    padding: "0.35rem 0.9rem"
  stamp-clarify:
    backgroundColor: "transparent"
    textColor: "{colors.clarify}"
    typography: "{typography.label}"
    padding: "0.35rem 0.9rem"
---

# Design System: Redline

## Overview

**Creative North Star: "The Code-Violation Tag"**

Redline's landing page is a building inspector's clipboard: a plain-paper lease sheet at rest, and violation tags wired onto its flagged sentences like carbon-numbered code-violation tickets. The world is paper-and-ink, not screen-and-dashboard — it explicitly refuses the SaaS-dashboard-in-browser-chrome arrangement every AI contract-review competitor ships. Density is calm and editorial at the copy level, then spikes into a stamped, ticketed register at the exact moment a lease sentence becomes a finding.

One color carries the aesthetic: violation-red covers roughly 30–60% of any surface where a flag is present, via the wordmark, the primary action, the "Remove/Modify" stamp fill, and the dollar-impact roundel — never as a background wash, always as a mark on kraft or paper. Kraft, paper white, and graphite ink hold the rest of the page quiet so the red reads as an inspector's mark, not a brand color running everywhere.

Two review rounds refined this build: a bucket-stamp typography error (using the display face instead of the intended mono/ticket face) and low ticket-number contrast against kraft were both corrected before ship, and the exclusion chips were changed off the clarify bucket's dashed-border mark so that mark stays exclusive to one meaning. The system below documents the corrected, shipped state.

**Key Characteristics:**
- One violation-red, used as a mark (stamp, wire, wordmark, roundel), never a field.
- Three-tier typography: a stencilled display face for headers and the wordmark, a monospaced ticket face for every numbered/stamped/dollar value, and a humanist sans for body and quoted clause text.
- A single reusable signature form — the notch-cornered, wire-and-grommet violation tag — carries the world's material metaphor; nothing else on the page imitates paper texture.
- Per-bucket marks are permanent and exclusive: solid red fill (remove/modify), amber outline (push on), dashed graphite outline (clarify). No other element borrows any of these three marks.

## Colors

The palette is a kraft-and-paper stock with one violation-red mark and two supporting accent marks (amber, muted graphite) for the two non-critical finding buckets.

### Primary
- **Violation Red** (`#c4362a`): the wordmark mark, the primary CTA fill, the "Remove/Modify" stamp fill, the dollar-impact roundel outline, text-selection background, and the focus ring. Carries 30–60% of any surface that contains a flag.
- **Violation Red Deep** (`#8f2820`): hover/active state for violation-red fills (primary button hover, dollar-figure text color).

### Secondary
- **Amber** (`#d97f2e`) / **Amber Deep** (`#a85f1f`): reserved exclusively for the "Push On" finding bucket — its highlight wash and its outlined stamp. Not used anywhere outside that bucket.
- **Clarify Graphite** (`#8c8577`): reserved exclusively for the "Clarify" finding bucket — its highlight wash and its dashed-outline stamp.

### Neutral
- **Kraft** (`#e8dcc0`): the violation tag's card stock and the "What Redline Won't Do" section background.
- **Kraft Deep** (`#cdbd97`): borders and dividers on kraft/paper surfaces (lease sheet border, header-link underline, tag-head divider tone).
- **Paper White** (`#f6f1e4`): page background, primary-button text color, tag-amount roundel background.
- **Paper Flat** (`#efe7d4`): the lease-sheet facsimile background (a slightly flatter paper than the page).
- **Graphite Ink** (`#2b2b28`): primary body/heading text.
- **Ink Soft** (`#55534a`): secondary text — lede copy, category labels, ticket numbers.
- **Steel** (`#6b6b63`): tertiary text — disclaimers, footer notes, CTA notes, the wire/grommet mark.

### Named Rules
**The One Mark Rule.** Violation red is a mark, not a background. It appears on stamps, wires, wordmarks, and roundels sitting on kraft or paper — it never fills a full section or card.

**The Bucket-Mark Exclusivity Rule.** Each of the three finding buckets owns one mark and one mark only: solid red fill for remove/modify, amber outline for push-on, dashed graphite outline for clarify. No other component — including generic tags, chips, or labels outside the tag component — reuses any of these three marks. (The build shipped a violation of this rule in an early pass, where the exclusion chips borrowed the clarify bucket's dashed border; it was corrected before ship specifically to protect this rule.)

## Typography

**Display Font:** Big Shoulders Stencil (with Arial Narrow, sans-serif fallback)
**Body Font:** Public Sans (with system-ui, sans-serif fallback)
**Label/Mono Font:** Courier Prime (with Courier New, monospace fallback)

**Character:** A stencilled, uppercase display face against a humanist body sans reads as inspection-tag officialdom paired with plain-language explanation; the monospaced ticket face marks anything that is a number, a stamped classification, or a dollar figure — the register of a machine-numbered form, not narrative prose.

### Hierarchy
- **Display** (900, `clamp(2.3rem, 4.6vw, 3.6rem)`, line-height 1.04): hero H1, uppercase, tight tracking (0.01em). The heaviest single mark on the page.
- **Headline** (900, `clamp(1.7rem, 3.2vw, 2.4rem)`, line-height ~1.15): section H2s ("Every flag cites itself.", "What Redline won't do.", the final CTA headline), uppercase.
- **Title** (700, 0.85rem, uppercase, tracking 0.08em): the violation tag's category label ("Hidden Fee", "Auto-Renewal") — the only mid-weight use of the display face below headline size.
- **Body** (400, 1rem–1.15rem, line-height 1.6–1.65, max ~62ch): lede copy, principle-band body, quoted clause text inside a tag, the lease facsimile's paragraph text.
- **Label** (700, 0.75–0.85rem, tracking 0.03–0.06em, uppercase where stamped): ticket numbers, bucket stamps, exclusion chips, header link, dollar-impact roundel, footer/disclaimer notes. Every numeral in the system — ticket numbers, dollar amounts, flag-marker superscripts — renders in this face.

### Named Rules
**The Numbers-Are-Mono Rule.** Any character that is a ticket number, a dollar figure, a citation superscript, or a stamped classification word renders in Courier Prime, never in the display face. (This was the build's first-review finding: the bucket stamps briefly shipped in the display face and were corrected to mono before ship — the corrected state is the standard, not the original.)

## Layout

The hero is a two-column grid (`minmax(0,1.05fr) minmax(0,0.95fr)`) pairing plain-paper copy at left against the lease-sheet-plus-tag-stack demonstration at right, collapsing to a single column under 900px. Section padding follows one repeated clamp rhythm — `clamp(1.25rem, 5vw, 4rem)` horizontal, `clamp(3rem, 6vw, 5rem)`-scale vertical for content bands — so every section breathes at the same rate regardless of viewport. The violation-tag stack sits in a right-hand column on desktop and stacks to full-width rows, then a single column, as the viewport narrows (900px, then 640px breakpoints). Body copy is capped near 34–62ch for readability against the wide paper stock.

## Elevation & Depth

The system is a hybrid: sections and page chrome are flat (no shadow), but the paper and tag objects carry soft, diffuse drop shadows that read as physical stock lifted off the page — never a hard, offset "sticker" shadow. Depth signals material (paper, kraft, tag stock), not UI chrome.

### Shadow Vocabulary
- **Tag** (`box-shadow: 0 10px 24px -12px rgba(43,43,40,0.45), 0 2px 6px -2px rgba(43,43,40,0.3)`): the violation tag's resting lift off the page, and the primary button's hover state.
- **Tag Soft** (`box-shadow: 0 6px 16px -10px rgba(43,43,40,0.35)`): the primary button's resting shadow, lighter than a tag's.

### Named Rules
**The Soft-Lift Rule.** All shadows in this system are diffuse and directionless (soft blur, no hard offset). A hard-edged, offset "comic sticker" shadow is not part of this world's vocabulary — the material is paper and stamps, not neobrutalist collage.

## Shapes

The violation tag is the system's one distinctive silhouette: a notched top-left corner cut via `clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)`, evoking a torn or die-cut tag stock. Two circular forms recur as functional counterpoints to that notch — the wire-and-grommet hole (a flat, bordered circle, no faked bevel) and the dollar-impact roundel. Everything else is sharp-cornered: buttons and chips use a near-flat 2px radius or no radius at all. The clarify bucket's dashed outline is the system's only dashed stroke and belongs to that bucket alone.

## Components

### Buttons
- **Shape:** near-flat corners (`border-radius: 2px`).
- **Primary:** violation-red fill (`#c4362a`), paper-white text, display-face uppercase label, `0.95rem 1.9rem` padding, soft tag-shadow at rest.
- **Hover / Focus:** fill deepens to `#8f2820`, lifts 2px, shadow intensifies to the full tag shadow; focus-visible adds a 2px violation-red outline at 3px offset.

### Chips (exclusion list)
- **Style:** paper-white background, graphite-ink text, 1px solid kraft-deep border, Courier Prime label type. Flat, no radius.
- **State:** static/display-only — these are declarative statements, not interactive filters, and (post-fix) carry a plain solid border rather than any bucket's dashed or colored mark.

### Cards / Containers
- **Corner Style:** the lease-sheet facsimile is square-cornered; the violation tag is notch-cornered (see Shapes).
- **Background:** paper-flat for the lease sheet; kraft for the violation tag body.
- **Shadow Strategy:** see Elevation & Depth — soft diffuse lift only.
- **Border:** 1px solid kraft-deep on the lease sheet; none on the tag (the clip-path notch and shadow carry its edge).
- **Internal Padding:** ~2rem on the lease sheet; `1.5rem 1.35rem 1.25rem` on the tag body.

### Navigation
- Header and footer are a flat wordmark-plus-link row; the header's secondary link is Courier Prime, underlined in kraft-deep, turning violation-red on hover/focus. No dropdowns or nested nav exist on this surface.

### Violation Tag (signature component)
The system's defining custom pattern: a kraft-stock card, notch-cut at the top-left corner, wired on with a small graphite loop-and-grommet mark, carrying (in order) an optional dollar-impact roundel, a category/ticket-number head rule, a Public Sans quoted clause in curly quotes, and a bucket stamp footer. Each bucket stamp is visually and semantically exclusive (see Colors → Bucket-Mark Exclusivity Rule). Tags enter with a settling rotate-and-drop animation, staggered by an explicit per-tag delay, so they read as being wired on one at a time in ranked order.

## Do's and Don'ts

### Do:
- **Do** keep violation-red to marks (stamps, wires, wordmark, roundel) covering roughly 30–60% of any surface that includes a flag — never a full-bleed field.
- **Do** render every ticket number, dollar figure, and stamped bucket label in Courier Prime — this is load-bearing after the finish-review fix that corrected a display-face regression here.
- **Do** keep the three bucket marks (solid red / amber outline / dashed graphite outline) exclusive to their bucket; no other chip, tag, or label borrows one of these three treatments.
- **Do** use soft, diffuse, directionless shadows for all lift; the tag and tag-soft values are the system's only shadow vocabulary.

### Don't:
- **Don't** introduce a hard-offset "sticker" shadow; this world's depth language is a diffuse paper lift, not a neobrutalist offset shadow.
- **Don't** reuse the clarify bucket's dashed outline outside the clarify stamp — the exclusion chips did this in an earlier pass and were corrected specifically to protect the mark's exclusivity.
- **Don't** render numerals or stamped labels in the display face; Big Shoulders Stencil is for headers, the wordmark, and the tag's category label only.
- **Don't** extend this documented system to the authenticated app shell without a build pass: `.impeccable/surfaces/app-app.md` records a planned surface that inherits this world's tokens and marks (compressed further for daily use — tags shrinking to list-row chips), but no screen in that shell has shipped yet, so it isn't documented here.

## Not canonized

The hero lease-sheet facsimile carries a small uppercase caption above its body text ("Residential Lease Agreement, Section 4 (example text)") that functions as a kicker/eyebrow label. It is recorded here as a one-off defect the build carries — a label device this documentation does not promote into a reusable Label/Eyebrow component or a system rule for future surfaces.
