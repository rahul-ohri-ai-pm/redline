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
  amber-dark: "#8f4f17"
  clarify: "#645c4c"
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
  app-verdict:
    fontFamily: "Big Shoulders Stencil, Arial Narrow, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "0.015em"
  app-title:
    fontFamily: "Big Shoulders Stencil, Arial Narrow, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "0.02em"
  app-h2:
    fontFamily: "Big Shoulders Stencil, Arial Narrow, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.04em"
  app-body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  app-note:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.6
  app-label:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.8rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  app-stamp:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.04em"
rounded:
  flat: "0px"
  sharp: "2px"
  notch: "18px"
  circle: "50%"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.75rem"
  lg: "2.4rem"
  section: "clamp(3rem, 6vw, 5rem)"
  pane-pad: "clamp(1rem, 4vw, 3rem)"
  pane-max: "68rem"
  rail: "15rem"
components:
  button-primary:
    backgroundColor: "{colors.violation}"
    textColor: "{colors.paper}"
    typography: "{typography.display}"
    rounded: "{rounded.sharp}"
    padding: "0.95rem 1.9rem"
  button-primary-hover:
    backgroundColor: "{colors.violation-dark}"
  app-button-primary:
    backgroundColor: "{colors.violation}"
    textColor: "{colors.paper}"
    typography: "{typography.app-h2}"
    rounded: "{rounded.sharp}"
    padding: "0.6rem 1.3rem"
  app-button-primary-hover:
    backgroundColor: "{colors.violation-dark}"
  app-button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.app-label}"
    rounded: "{rounded.sharp}"
    padding: "0.4rem 0.85rem"
  app-button-secondary-hover:
    textColor: "{colors.violation-dark}"
  app-button-danger:
    backgroundColor: "{colors.violation}"
    textColor: "{colors.paper}"
    typography: "{typography.app-label}"
    rounded: "{rounded.sharp}"
    padding: "0.4rem 0.85rem"
  app-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.app-body}"
    rounded: "{rounded.sharp}"
    padding: "0.55rem 0.7rem"
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
  app-stamp-remove:
    backgroundColor: "{colors.violation}"
    textColor: "{colors.paper}"
    typography: "{typography.app-stamp}"
    rounded: "{rounded.flat}"
    padding: "0.3rem 0.8rem"
  app-stamp-push:
    backgroundColor: "transparent"
    textColor: "{colors.amber-dark}"
    typography: "{typography.app-stamp}"
    rounded: "{rounded.flat}"
    padding: "0.3rem 0.8rem"
  app-stamp-clarify:
    backgroundColor: "transparent"
    textColor: "{colors.clarify}"
    typography: "{typography.app-stamp}"
    rounded: "{rounded.flat}"
    padding: "0.3rem 0.8rem"
  app-tally:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.app-stamp}"
    rounded: "{rounded.flat}"
    padding: "0.2rem 0.5rem"
  app-tally-empty:
    backgroundColor: "{colors.paper-flat}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.app-stamp}"
    rounded: "{rounded.flat}"
    padding: "0.2rem 0.5rem"
  app-row-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.app-stamp}"
    rounded: "{rounded.flat}"
    padding: "0.12rem 0.45rem"
  app-finding-row:
    backgroundColor: "{colors.kraft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.notch}"
    padding: "1rem 1.15rem 1.1rem"
  app-finding-row-quiet:
    backgroundColor: "{colors.paper-flat}"
    textColor: "{colors.ink-soft}"
  app-nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.app-body}"
    rounded: "{rounded.flat}"
    padding: "0.5rem 0.7rem"
  app-nav-item-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
---

# Design System: Redline

## Overview

**Creative North Star: "The Code-Violation Tag"**

Redline's landing page is a building inspector's clipboard: a plain-paper lease sheet at rest, and violation tags wired onto its flagged sentences like carbon-numbered code-violation tickets. The world is paper-and-ink, not screen-and-dashboard — it explicitly refuses the SaaS-dashboard-in-browser-chrome arrangement every AI contract-review competitor ships. Density is calm and editorial at the copy level, then spikes into a stamped, ticketed register at the exact moment a lease sentence becomes a finding.

One color carries the aesthetic: violation-red covers roughly 30–60% of any surface where a flag is present, via the wordmark, the primary action, the "Remove/Modify" stamp fill, and the dollar-impact roundel — never as a background wash, always as a mark on kraft or paper. Kraft, paper white, and graphite ink hold the rest of the page quiet so the red reads as an inspector's mark, not a brand color running everywhere.

The world now runs in two registers. **Persuade** is the landing page: viewport-scaled display type, a wired-and-grommeted tag, a staggered entrance. **Operate** is the authenticated shell — add a document, the report, the library, the questionnaire — which inherits the same stock, the same three bucket marks, the same two fonts and the same single 2px radius, and compresses all of it: the tag loses its wire, grommet and dollar roundel and keeps its die-cut corner, kraft stock, dashed head rule, mono ticket number and rotated bucket stamp; type stops scaling with the viewport and lands on a seven-step fixed rem ramp; sections become a hairline rule and a heading rather than boxes; and the entrance choreography is gone entirely. The shell's component vocabulary is defined once, in `app/ui.module.css`, and every screen behind sign-in draws from it.

Two review rounds refined the landing build: a bucket-stamp typography error (using the display face instead of the intended mono/ticket face) and low ticket-number contrast against kraft were both corrected before ship, and the exclusion chips were changed off the clarify bucket's dashed-border mark so that mark stays exclusive to one meaning. The shell round then deepened two bucket colors for contrast across both surfaces. The system below documents the corrected, shipped state of both registers.

**Key Characteristics:**
- One violation-red, used as a mark (stamp, wire, wordmark, roundel, tally, primary button, counter-offer rule), never a field.
- Three-tier typography: a stencilled display face for headers and the wordmark, a monospaced ticket face for every numbered/stamped/labelled value, and a humanist sans for body and quoted clause text.
- A single reusable signature form — the notch-cornered tag — carries the world's material metaphor on both surfaces: wired and grommeted on the landing page, compressed to a notch-cut finding row in the shell.
- Per-bucket marks are permanent, exclusive, and distinguished by kind rather than by lightness: solid red fill (remove/modify), solid amber outline (push on), dashed graphite outline (clarify).
- Kraft stock means "Redline found something". In a working pane the only kraft objects are findings and the one panel that is about to produce them.
- Persuade performs; Operate does not. The shell carries exactly one authored gesture and no entrance animation.

## Colors

The palette is a kraft-and-paper stock with one violation-red mark and two supporting accent marks (amber-deep, graphite) for the two non-critical finding buckets.

### Primary
- **Violation Red** (`#c4362a`): the wordmark mark, the primary CTA fill, the "Remove/Modify" stamp and tally fill, the dollar-impact roundel outline, the counter-offer block's rule, the Q&A error rule, text-selection background, and the focus ring. Carries 30–60% of any surface that contains a flag.
- **Violation Red Deep** (`#8f2820`): hover/active state for violation-red fills (primary button, danger button) and the text color for inline error and copy-confirmation lines.

### Secondary
- **Amber Deep** (`#8f4f17`): the push-on bucket's one mark on both surfaces — text *and* 2px stroke, on the landing tag's stamp and on the shell's stamp, tally and library row chip. Not used outside that bucket.
- *Retired:* the lighter push-on amber (`#d97f2e`) has no use anywhere in the shipped build and is no longer declared: it was the landing tag's push-on stamp stroke until that stroke was deepened to amber-deep, and `--color-amber` has since been removed from `app/globals.css`. It is not part of this system — at 2.20:1 on kraft it cannot be a mark, and a declared-but-unused color that fails the stroke floor is an invitation to reintroduce the defect it just lost. Two highlight washes on the landing page still carry the pre-deepening hues as hardcoded literals (`rgba(217, 127, 46, 0.18)` for push-on and `rgba(140, 133, 119, 0.2)` for clarify); a wash is neither text nor stroke, so no contrast floor applies to them, but they no longer share a hue with the marks they sit beside.
- **Clarify Graphite** (`#645c4c`): the clarify bucket's mark — text and 2px dashed stroke, on the stamp, the tally and the library row chip. Not used outside that bucket.

### Neutral
- **Kraft** (`#e8dcc0`): the violation tag's card stock, the shell's finding row and analyze panel, the navigation rail, the sign-in ground, the Q&A grounding chip, and the "What Redline Won't Do" section background.
- **Kraft Deep** (`#cdbd97`): the 1px hairline that carries structure inside a working pane, plus the lease-sheet border, header-link underline, tag-head dashed divider, and the quote block's 2px left rule.
- **Paper White** (`#f6f1e4`): page background, primary-button text color, the active nav item's sheet, a Q&A answer's ground, and the counter-offer block.
- **Paper Flat** (`#efe7d4`): the lease-sheet facsimile and extracted-text preview, the top strip, a library row at rest, a Q&A history entry, a deprioritized finding, and an opportunity suggestion.
- **Graphite Ink** (`#2b2b28`): primary body/heading text, and the 1px ink hairline used on field borders, secondary buttons and the disclaimer's rule.
- **Ink Soft** (`#55534a`): secondary text — lede copy, category labels, ticket numbers, meta lines, notes.
- **Steel** (`#6b6b63`): tertiary text and the non-bucket outline — disclaimers, footer notes, the wire/grommet mark, the Q&A refusal's rule and chip, and the opportunity suggestion's border.

### Named Rules
**The One Mark Rule.** Violation red is a mark, not a background. It appears on stamps, tallies, wires, wordmarks, roundels, primary buttons and single-pixel rules sitting on kraft or paper — it never fills a full section, card or panel. The sign-in screen's earlier 8px red top border was removed for exactly this reason: it was the one place red ran as a field rather than as a mark.

**The Bucket-Mark Exclusivity Rule.** Each of the three finding buckets owns one mark and one mark only: solid red fill for remove/modify, solid amber-deep outline for push-on, dashed graphite outline for clarify. No other component reuses any of these three marks. Everything in the shell that is *not* a bucket gets its own non-dashed device instead: a deprioritized finding drops to paper-flat stock, a Q&A refusal takes a steel hairline, an opportunity suggestion takes a steel hairline with no notch and no kraft, an empty library is a blank paper sheet, and an empty tally loses its mark to a kraft-deep outline. The single exception is the 1px dashed kraft-deep divider inside a tag head, inherited verbatim from the landing tag — a divider, not a bucket outline.

**The Mark-Not-Lightness Rule.** The three bucket marks are told apart by kind — solid fill, solid outline, dashed outline — never by one being lighter than another. Each must clear 4.5:1 as text and 3:1 as a 2px stroke on all three grounds (kraft, paper, paper-flat). Amber-deep and clarify were deepened from `#a85f1f` and `#8c8577` for this reason: at the old values they measured 2.2–3.6:1, which left two of the three marks distinguished from the third mainly by being paler. They now measure 4.68–5.86:1 on all three grounds, and the rule is satisfied on both surfaces: the landing tag and the shell render each bucket mark in one value for text and stroke alike, so no two marks differ by lightness anywhere in the build. A new bucket color is rejected unless it passes that test, and a bucket's text and its stroke are always the same value — the landing tag briefly stroked push-on in the lighter amber while its text was amber-deep, which failed the stroke floor at 2.20:1 on kraft and has since been corrected to amber-deep for both.

## Typography

**Display Font:** Big Shoulders Stencil (with Arial Narrow, sans-serif fallback)
**Body Font:** Public Sans (with system-ui, sans-serif fallback)
**Label/Mono Font:** Courier Prime (with Courier New, monospace fallback)

**Character:** A stencilled, uppercase display face against a humanist body sans reads as inspection-tag officialdom paired with plain-language explanation; the monospaced ticket face marks anything that is a number, a stamped classification, or a machine-printed label — the register of a machine-numbered form, not narrative prose.

### Hierarchy
- **Display** (900, `clamp(2.3rem, 4.6vw, 3.6rem)`, line-height 1.04): landing hero H1, uppercase, tight tracking (0.01em). The heaviest single mark in the system.
- **Headline** (900, `clamp(1.7rem, 3.2vw, 2.4rem)`, line-height ~1.15): landing section H2s, uppercase.
- **Title** (700, 0.85rem, uppercase, tracking 0.08em): the tag's category label ("Hidden Fee", "Auto-Renewal") — the only mid-weight use of the display face below headline size, on both surfaces.
- **Body** (400, 1rem–1.15rem, line-height 1.6–1.65, max 54–68ch): lede copy, principle-band body, quoted clause text inside a tag, lease facsimile and extracted-text paragraphs.
- **Label** (700, 0.72–0.85rem, tracking 0.03–0.06em, uppercase where stamped): ticket numbers, bucket stamps, tallies, row chips, field labels, provenance chips, meta lines, the disclaimer label, footer notes. Every numeral in the system renders in this face.

### The shell's fixed ramp
Behind sign-in, type does not scale with the viewport. Seven fixed rem steps carry every font-size in the shell, and nothing in the shell sets a size outside them:

- `0.72rem` — stamps, tallies, row chips, provenance chips, quiet notes
- `0.8rem` — mono field labels, secondary buttons, ticket numbers, meta and strip text
- `0.88rem` — secondary prose: notes, hints, the standing disclaimer
- `1rem` — body, quoted lease text, form controls
- `1.15rem` — the summary lead, primary button labels, panel titles and legends
- `1.5rem` — the wordmark and the screen name in the top strip
- `1.9rem` — the report verdict, and sign-in's own title (dropping one step at 720px)

### Named Rules
**The Numbers-Are-Mono Rule.** Any character that is a ticket number, a dollar figure, a citation superscript, a stamped classification word, a tally count, a red-line index or a mono field label renders in Courier Prime, never in the display face. (This was the landing build's first-review finding: the bucket stamps briefly shipped in the display face and were corrected to mono before ship — the corrected state is the standard.)

**The Quotes-Are-Prose Rule.** A sentence lifted from the renter's own lease is prose: Public Sans, typographic quotes, 1rem, left-ruled in 2px kraft-deep. Never Courier, never a code block, never monospaced "evidence" styling. Courier is for numerals, stamps, labels and ticket numbers; the quoted clause is the one thing on a finding the renter has to actually read.

**The Fixed-Ramp Rule.** The landing page sizes type against the viewport; a working screen does not move under the renter. Every font-size behind sign-in comes from one of the seven rem steps above. Adding an eighth step, or a `clamp()`, to a shell screen is a change to the system, not a local decision.

## Layout

**Landing.** The hero is a two-column grid (`minmax(0,1.05fr) minmax(0,0.95fr)`) pairing plain-paper copy at left against the lease-sheet-plus-tag-stack demonstration at right, collapsing to a single column under 900px. Section padding follows one repeated clamp rhythm — `clamp(1.25rem, 5vw, 4rem)` horizontal, `clamp(3rem, 6vw, 5rem)`-scale vertical — so every section breathes at the same rate. The tag stack stacks to full-width rows, then one column, at 900px and 640px. Body copy is capped near 34–62ch.

**Shell.** A two-part frame: a 15rem kraft navigation rail and the working pane (`grid-template-columns: 15rem minmax(0, 1fr)`, min-height 100vh). The pane opens with a slim top strip on paper-flat under a kraft hairline, then the screen's content. Three tokens hold the two in alignment: a `clamp(1rem, 4vw, 3rem)` gutter, a 68rem measure, and a frame width of measure-plus-two-gutters — so the screen name, the tallies and every line of content below land on the same two edges. Inside a pane, sections are separated by 1.1rem of top padding over a kraft hairline, with 1.1–1.6rem between them; prose is capped at 54–68ch and forms at 22–44rem.

Breakpoints: **760px** collapses the questionnaire's three-up row to one column. **720px** is the phone frame — the rail becomes a drawer, every control takes a 2.75rem minimum touch target, form fields take 1rem to stop iOS zooming, the verdict drops a step, and long strings get `overflow-wrap: anywhere`. **480px** drops the library row's bucket chips under the document title instead of squeezing it.

### Named Rules
**The Drawer-Not-Bottom-Bar Rule.** At 720px and below the rail collapses to a top bar carrying the wordmark and a Menu button, which opens a panel holding the three links, the signed-in email and Sign out. It is not a bottom nav: the rail holds five things and a bottom bar fits three at 360px with no room for the email or Sign out, and it would sit on top of the Q&A box and the keyboard — which is the screen a renter has open mid-call.

**The One-Measure Rule.** The top strip's contents and every screen's content share the 68rem measure and the same gutter. A shell screen that sets its own width breaks the frame's two edges, and is wrong even when it looks fine alone.

## Elevation & Depth

The system is a hybrid: sections and page chrome are flat (no shadow), but the paper and tag objects carry soft, diffuse drop shadows that read as physical stock lifted off the page — never a hard, offset "sticker" shadow. Depth signals material (paper, kraft, tag stock), not UI chrome. The shell narrows this further: inside a working pane, structure is carried by hairline rules rather than by lift, and the only lifted objects are the ones that are literally stock — a finding row, a paper sheet, the extracted-text preview, the analyze panel, the sign-in card, and a primary button.

### Shadow Vocabulary
- **Tag** (`box-shadow: 0 10px 24px -12px rgba(43,43,40,0.45), 0 2px 6px -2px rgba(43,43,40,0.3)`): the landing violation tag's resting lift, the sign-in card, and the primary button's hover state.
- **Tag Soft** (`box-shadow: 0 6px 16px -10px rgba(43,43,40,0.35)`): the resting shadow for a shell finding row, paper sheet, text preview, analyze panel and primary button — lighter than a landing tag's.

### Named Rules
**The Soft-Lift Rule.** All shadows in this system are diffuse and directionless (soft blur, no hard offset). A hard-edged, offset "comic sticker" shadow is not part of this world's vocabulary — the material is paper and stamps, not neobrutalist collage.

**The Hairline-Section Rule.** A section in a working pane is a 1px kraft-deep rule plus a heading, not a box. An early engineering pass gave every block the same 2px border and the report lost all hierarchy: a disclaimer looked exactly like a finding. The one rule that is ink rather than kraft is the standing disclaimer's, so a legal notice is not mistaken for one more labelled field.

## Shapes

The notched tag is the system's one distinctive silhouette: a die-cut top-left corner via `clip-path: polygon(...)`, 20px on the landing tag and 18px everywhere in the shell. On the landing page two circular forms recur as functional counterpoints — the wire-and-grommet hole and the dollar-impact roundel; neither crosses into the shell. Everything else is sharp-cornered: the shell has exactly one radius, 2px, on buttons, fields and the focus ring, and nothing else.

The clarify bucket's dashed outline is the system's only dashed stroke and belongs to that bucket alone (the tag head's inherited dashed divider excepted). A library row is the one place the notch is a state rather than a property: the row sits square on paper-flat and takes the die-cut corner on hover and focus, which is the row saying it opens into a finding. On touch screens (≤720px) the notch is always on, because there is no hover to reveal it.

## Components

### Buttons
- **Shape:** near-flat corners (`border-radius: 2px`) everywhere, on both surfaces.
- **Primary (landing):** violation-red fill, paper-white text, display-face uppercase label, `0.95rem 1.9rem` padding, soft tag-shadow at rest.
- **Primary (shell):** the same fill and face at `0.6rem 1.3rem` and the 1.15rem step — the compressed version of the same button. Used for Analyze, Ask, Save, and the empty library's call to action.
- **Secondary (shell):** paper-white ground, 1px ink border, Courier Prime uppercase 0.8rem label. The default control for everything that is not the screen's one commitment.
- **Danger (shell):** the secondary button's geometry with a violation-red fill — delete confirmation only.
- **Hover / Focus:** primary deepens to `#8f2820`, lifts 2px, shadow intensifies to the full tag shadow; secondary swaps its border and text to violation red without moving. Focus-visible is a 2px violation-red outline at 3px offset, globally.
- **Disabled:** 0.5 opacity, no shadow, no lift.

### Chips
- **Exclusion chips (landing):** paper-white background, graphite-ink text, 1px kraft-deep border, Courier Prime label type, flat. Static and declarative, and deliberately carrying no bucket's mark.
- **Library row chips (shell):** the three bucket marks at row scale — same marks, same meanings, 2px borders, 0.72rem mono, `0.12rem 0.45rem` padding. A bucket with nothing in it falls back to a kraft-deep outline in ink-soft.
- **Provenance and category chips (shell):** the Q&A grounding chip is mono on kraft; the refusal chip is steel text with no border; an opportunity suggestion's label is mono ink-soft. None of them is dashed or colored like a bucket.

### Cards / Containers
- **Corner Style:** square for sheets and panels; notch-cut for findings and the analyze panel.
- **Background:** paper-flat for the lease sheet, text preview, library row at rest, Q&A history entry and top strip; kraft for findings, the analyze panel and the rail; paper-white for an answer, a counter-offer and the active nav item.
- **Shadow Strategy:** see Elevation & Depth — soft diffuse lift only, and only on things that are stock.
- **Border:** 1px kraft-deep hairline on sheets and rows; 1px ink on fields, notices and the disclaimer rule; none on a notch-cut tag (the clip-path and shadow carry its edge).
- **Internal Padding:** ~2rem on the landing lease sheet; `1rem 1.15rem 1.1rem` on a shell finding row; `0.75–0.85rem` vertical on notices, answers and suggestions; `1.25rem 1.3rem` on a paper sheet.

### Inputs / Fields
- **Style:** full-width, paper-white ground, 1px ink border, 2px radius, `0.55rem 0.7rem` padding, inherited body font. A field label is Courier Prime 0.8rem uppercase in ink-soft, stacked above with a 0.3rem gap.
- **Focus:** the global 2px violation-red outline at 3px offset. No glow, no border-color animation.
- **Platform controls stay platform controls:** the select and the file input keep native behavior and only take the palette — the file input's button wears the same mono secondary-button treatment. Nothing here reinvents a dropdown.
- **Error:** an inline line in violation-red-deep, or a paper block with a 1px violation-red rule when the error stops the flow (an unsupported state, a failed parse).
- **Phone:** controls take a 2.75rem minimum height and fields take 1rem type.

### Navigation
- **Landing:** a flat wordmark-plus-link row in header and footer; the secondary link is Courier Prime, underlined in kraft-deep, turning violation-red on hover/focus.
- **Shell rail:** 15rem of kraft with a kraft-deep right rule. The wordmark (display face, 1.5rem, with the Redline mark) sits at the top; three nav links below in 1rem body type; the signed-in email (mono 0.8rem) and Sign out pinned to the bottom above a kraft-deep rule.
- **Active state:** the current screen's link becomes a paper-white sheet with a kraft-deep border and bolder text — a sheet pulled forward out of the kraft rail. There is no colored edge bar; the kraft-to-paper change *is* the state.
- **Mobile:** see The Drawer-Not-Bottom-Bar Rule.

### Top Strip (signature frame component)
A slim paper-flat band under a kraft hairline, styled by the frame and filled by each screen. It carries the screen's name as the page's `h1` in the 1.5rem display step, an optional back link before it, and at the right a mono aside (the document's file number and saved date) plus — on an open report only — that document's three bucket tallies. Because the name is the `h1`, the strip is the screen's heading rather than a second one. The back link is drawn as a link and not as a label: an arrow plus a sentence-case 0.8rem phrase, because in small uppercase it stacked over the title at phone width and read as a kicker rather than as navigation.

### Finding Row (signature component, shell)
The landing violation tag compressed for daily use: a kraft card, die-cut at the top-left (18px), carrying a head rule (display-face category and mono ticket number over a 1px dashed kraft-deep divider), the quoted lease sentence in Public Sans with typographic quotes and a 2px kraft-deep left rule, the plain-English summary, and the bucket stamp. The wire, the grommet and the dollar roundel do not come across. A deprioritized finding keeps the same content on paper-flat stock in ink-soft with no lift — not a dashed box, because dashed is clarify's. A drafted counter-offer sits inside the finding as a paper-white block with a 1px violation-red rule: the one place the renter gets words to send. Summary, quote and note share one 64ch measure, because capping only the summary made the card read as two columns.

### Tallies (shell)
A row of per-document counts in the top strip, each wearing its bucket's mark and nothing else — the same solid red fill, amber-deep outline and dashed graphite outline the stamps use, at 0.72rem with a 1rem tabular count, and without the stamp's rotation, because three tilted marks in a slim strip reads as noise. An empty bucket loses its mark entirely and reads as paper, so red stays proportional to what was actually found. Tallies are always per open document; no screen shows an account-wide count, and the library's per-document row chips are what the renter compares leases with.

### Notices (shell)
Three weights, one shape: paper with a hairline rule, where only the rule's color changes. Default is a 1px ink rule on paper-flat; alert is a 1px violation-red rule on paper-white; quiet is a 1px kraft-deep rule. A notice title is the display face at 1rem, uppercase. The standing legal disclaimer is not a notice box at all — it is a mono label in full ink over body text, under a 1px ink rule running the pane's full measure, present on every report and inside the first screenful.

### Q&A outcomes (shell)
Three results, three different grounds, none of them dashed. An **answer** sits on paper-white under a kraft hairline and shows a mono-on-kraft chip naming what it stood on. A **refusal** sits on paper-white with a steel hairline and a steel mono chip naming its boundary. An **error** sits on paper-white with a violation-red hairline and a retry button. The question and its history entries sit on paper-flat.

### Opportunity suggestions (shell)
Advice about what the lease leaves out, so there is no sentence to quote (ADR 0010). A suggestion is paper-flat with a 1px steel border, a mono ink-soft label, and plain prose: no notch, no kraft, no bucket color, no quote block. A suggestion must never read as a finding.

### Sign-in (shell boundary)
The inspector's clipboard before anything is on it: a paper-flat sheet centred on a full kraft ground, with the wordmark stamped at its head above a kraft-deep rule, the screen title at the 1.9rem step, one field, one primary button, and a mono status line in the register of a form receipt once the link is sent. No tag is wired on and no example lease text appears — there is nothing to find yet, and inventing a clause here would be a claim.

### Violation Tag (signature component, landing)
The landing page's defining pattern: a kraft-stock card, notch-cut at the top-left (20px), wired on with a small graphite loop-and-grommet mark, carrying (in order) an optional dollar-impact roundel, a category/ticket-number head rule, a Public Sans quoted clause in curly quotes, and a bucket stamp footer. Tags enter with a settling rotate-and-drop animation, staggered by an explicit per-tag delay, so they read as being wired on one at a time in ranked order.

### Named Rules
**The One-Gesture Rule.** The shell has exactly one authored motion: a bucket stamp straightens from `-3deg` to `0deg` over 180ms when the renter reaches the row it belongs to (hover or focus-within). There is deliberately no entrance choreography behind sign-in — no stagger, no settle, no fade-in — unlike the landing page's tag-settle. Persuade performs; Operate does not. Everything else in the shell that moves is a 180ms state transition on color, border or lift, and all of it is suppressed under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** keep violation-red to marks (stamps, tallies, wordmark, primary buttons, the counter-offer rule, single-pixel alert rules) — never a full-bleed field or a panel ground.
- **Do** render every ticket number, dollar figure, tally count, stamped bucket label and mono field label in Courier Prime — this is load-bearing after the finish-review fix that corrected a display-face regression here.
- **Do** keep the three bucket marks (solid red / solid amber-deep outline / dashed graphite outline) exclusive to their bucket, distinguished by kind rather than lightness, and clearing 4.5:1 as text and 3:1 as stroke on kraft, paper and paper-flat.
- **Do** use soft, diffuse, directionless shadows for all lift; the tag and tag-soft values are the system's only shadow vocabulary, and only objects that are literally stock get one.
- **Do** take every shell font-size from the seven-step fixed rem ramp, and every shell corner from either the 2px radius or the 18px notch.
- **Do** build a shell screen out of the shared vocabulary in `app/ui.module.css`, aliasing it under the screen's own class name when a local test needs to find the control in that file.
- **Do** separate sections in a working pane with a hairline rule and a heading, and keep the pane on the one 68rem measure and shared gutter.
- **Do** quote the renter's lease in Public Sans with typographic quotes, and keep bucket tallies scoped to the open document.

### Don't:
- **Don't** introduce a hard-offset "sticker" shadow; this world's depth language is a diffuse paper lift, not a neobrutalist offset shadow.
- **Don't** reuse the clarify bucket's dashed outline outside the clarify stamp, tally and row chip — the exclusion chips did this in an earlier pass and were corrected specifically to protect the mark's exclusivity. The tag head's inherited dashed divider is the one exception.
- **Don't** render numerals or stamped labels in the display face; Big Shoulders Stencil is for headers, the wordmark, screen names, panel titles and the tag's category label only.
- **Don't** set quoted lease text in Courier or style it as code; Courier is for numbers, stamps, labels and ticket numbers.
- **Don't** put kraft stock on anything in a working pane that is not a finding or the panel about to produce findings — kraft is how the eye locates what Redline found.
- **Don't** let an opportunity suggestion take a notch, kraft, a quote block or a bucket mark; it is advice, not a finding (ADR 0010).
- **Don't** add entrance animation to a shell screen, or a second authored gesture; the stamp straightening on row hover is the whole motion budget behind sign-in.
- **Don't** give the shell a bottom nav, a second radius, a `clamp()` font-size, or a boxed section; each one breaks a rule above that the build already settled.
- **Don't** ground a panel in violation red — including a thick colored top border, which sign-in shipped at 8px and lost for exactly this reason.

## Not canonized

- The landing hero's lease-sheet facsimile carries a small uppercase caption above its body text ("Residential Lease Agreement, Section 4 (example text)") that functions as a kicker/eyebrow label. It is recorded here as a one-off defect the build carries — a label device this documentation does not promote into a reusable Label/Eyebrow component or a system rule for any surface.
