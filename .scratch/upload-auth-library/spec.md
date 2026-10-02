Status: ready-for-agent

# Upload Flow, Auth and Library — Spec

Scope note: this spec covers the product surface around the two engine
seams built in `.scratch/red-line/spec.md` (`analyzeDocument`,
`answerQuestion`): getting a lease into the browser and parsed, the intake
questionnaire and saved renter profile, sign-in, and the saved library of
past documents. It does not cover the report screen, the Q&A box UI, or
the state-standard dataset. See Out of Scope and Open Questions.

## Problem Statement

The engines can analyze a lease, but nothing lets a renter hand one over.
There is no way to get a file into the browser and parsed, no place to
answer the intake questions once and reuse the answers, no account to hang
a profile or red lines on, and no place a finished report lives after the
tab closes. Until that surface exists, the engines have no caller.

## Solution

A signed-in renter uploads a lease. The browser extracts text and
per-section readability locally; the original file never leaves the
machine. The document is checked to be a residential lease. The renter
confirms a pre-filled questionnaire (state required, the rest skippable)
and sees their red lines. Analysis runs on the extracted text, and the
document, its sections, the profile it ran against, and the report are
saved to a library the renter can reopen without re-uploading or
re-analyzing.

## User Stories

Upload and parsing

1. As a renter, I want to upload a lease from my device, so that I can get
   an analysis.
2. As a renter, I want the file read in my browser, so that the original
   never leaves my machine.
3. As a renter, I want to be told what file types work before I try one,
   so that I don't find out by failing.
4. As a renter, I want a clear message if my file has no readable text
   (for example a scan), so that I know why it was refused and that no
   guess was made.
5. As a renter, I want to see which pages or sections couldn't be read
   before I start the analysis, so that I can decide whether to continue.
6. As a renter, I want analysis to continue on the parts that did read
   cleanly, so that one bad page doesn't block everything.
7. As a renter, I want a freelance agreement or Terms of Service refused
   with a plain message that this document type isn't supported yet, so
   that I don't get a result calibrated for the wrong thing.
8. As a renter, I want to see a preview of the extracted text before it is
   sent, so that I can see what leaves my browser.

Questionnaire and profile

9. As a renter, I want to be asked for my state before analysis, and be
   unable to start without it, so that flags reflect where I live.
10. As a renter, I want to be told plainly if my state isn't covered yet,
    so that I'm not given an analysis with no state data behind it.
11. As a renter, I want pets, joint lease and renter type to be skippable,
    so that I can get a fast read.
12. As a renter, I want skipped fields to be named on the questionnaire
    and later in the report as lowering precision, so that I know what I
    gave up.
13. As a renter, I want my answers saved and pre-filled next time, and
    editable before each analysis, so that I only change what changed.
14. As a renter, I want to see and edit my list of red lines (add, edit,
    remove, reorder) on the same screen, so that the list that drives the
    analysis is never hidden from me.
15. As a renter, I want my red lines to carry across documents, so that I
    don't rebuild them each time.

Auth

16. As a renter, I want to sign in to my own account, so that my profile,
    red lines and library are mine.
17. As a renter, I want to stay signed in across visits and be able to
    sign out, so that I'm not asked every time on my own device.
18. As a renter, I want to be unable to see anyone else's documents,
    profile or red lines, so that my lease stays private.

Library

19. As a renter, I want each analyzed document saved automatically with
    its report, so that I don't have to remember to save it.
20. As a renter, I want a list of my past documents, newest first, showing
    a title, the date, the state it was analyzed under and the verdict, so
    that I can find the right one.
21. As a renter, I want to open a past document and see the same report as
    before without re-uploading or re-running the model, so that it's
    instant and costs nothing.
22. As a renter, I want a saved report to show the profile it was run
    against, so that I can tell when it's stale (I moved states, added a
    pet).
23. As a renter, I want the saved report to still show every flag with its
    exact source sentence, the skipped sections and the disclaimer, so
    that a reopened report is held to the same standard as a new one.
24. As a renter, I want to re-run the analysis on a saved document with an
    updated profile, so that I don't have to find and re-upload the file.
25. As a renter, I want an empty library to tell me what to do next, so
    that the first visit isn't a blank screen.
26. As a renter, I want to delete a saved document, so that my lease text
    is gone from Redline when I choose.
27. As a renter, I want the title of a saved document prefilled from my
    file name and editable, so that I can recognize it later without
    retyping.

Developer

28. As a developer, I want the original file to have no code path to the
    server or database, so that the privacy rule is structural.
29. As a developer, I want every stored row protected by row-level
    security keyed to the signed-in user, so that a bug in a query can't
    leak another renter's lease.
30. As a developer, I want a saved report's citations re-checked against
    its stored text when it is loaded, so that storage can't quietly break
    the invariant.
31. As a developer, I want each file type to have its own parser and its
    own readability checks behind one `parseFile` entry point, so that a
    change to PDF handling can't affect DOCX or plain text.

## Implementation Decisions

**Parsing happens in the browser and produces the engine's inputs.** The
parser outputs `text` and `sections: Section[]` exactly as typed in
`lib/analysis/types.ts` (`ReadableSection` / `UnreadableSection`, with
`reason` on the unreadable ones). Section ids are stable and renter-
readable ("page-4" for paged formats). A section the parser is not
confident in becomes an `UnreadableSection` with `text: null`; its text is
dropped, not passed along.

**Test seam**: one new seam, `parseFile(file)`, which returns
`{ text, sections }` or a refusal with a reason. Everything downstream
uses the existing `analyzeDocument` seam. `parseFile` dispatches by file
type to three separate parsers (plain text, PDF, DOCX). Each has its own
readability checks and its own fixtures and tests; none shares a
readability heuristic with another.

**Supported formats**: text-layer PDF, DOCX, plain text. A file with no
text layer is refused with an explicit message. It is not partially
recovered and not OCR'd (CLAUDE.md, ADR 0009). Approved dependencies:
`pdfjs-dist` (PDF), `mammoth` (DOCX), `@supabase/supabase-js` and
`@supabase/ssr` (auth and database). Each is added in the ticket that
first needs it, not up front.

**Readability signal**: per page for PDF, per block for DOCX, and for plain
text a single check for control or replacement characters and word-like
content. Each heuristic (for example the share of control or replacement
characters, implausibly short text for a full page, no word-like tokens)
is internal to its parser but must err toward marking a section
unreadable. A missed garbled page breaks the invariant; a wrongly skipped
page is disclosed.

**One normalization pass, then freeze.** Whitespace and hyphenation
cleanup happens once, in the browser, before anything else. The normalized
string is what is previewed, sent, analyzed and stored. `verifyCitation`
runs against that same string, so what the renter sees, what the model
saw, and what the citation is checked against are identical.

**Document-type gate**: runs after extraction and before the questionnaire
or the analysis seam. One server-side classification call through
OpenRouter (never a provider SDK) on the extracted text returns
residential lease, freelance agreement, Terms of Service or other. The last
three are refused with the "not supported yet" message. It sits above both
engine seams, as the engine spec requires, and the model call is the
mocked boundary in tests.

**State coverage**: the state picker offers only states present in
`lib/state-standards.ts`. A renter whose state isn't covered is told so on
the questionnaire and cannot proceed, consistent with state being a
required input (PRD "calls I made"). Today that is CA, TX and NY, and
that data is placeholder.

**Questionnaire**: one screen. State (required), pets, joint lease, renter
type (each skippable and distinguishable from "no", since
`RenterProfile.pets === undefined` means not provided), and the red-lines
editor. Pre-filled from the saved profile. Fields the renter skips are
listed so the report can show the precision warning (ADR 0007's third
consequence). Submitting saves the profile and builds the `RenterProfile`
passed to the seam.

**Auth**: Supabase Auth with email magic link only. Analysis, profile,
red lines and library all require a signed-in user; there is no anonymous
analysis. The Supabase client is created lazily, reading env only at call
time, so `npm run build` still succeeds with no Supabase variables set,
matching how `lib/openrouter.ts` behaves today.

**Storage** (Supabase Postgres, migrations in `supabase/migrations/`):

- `profiles`: `user_id` (pk, references auth user), `state`, `pets`,
  `joint_lease`, `renter_type`, `updated_at`. Nullable optional columns,
  so "not provided" is representable.
- `red_lines`: `id`, `user_id`, `text`, `position`.
- `documents`: `id`, `user_id`, `title`, `extracted_text`, `sections`
  (jsonb, the `Section[]` with unreadable ones carrying `text: null`),
  `profile_snapshot` (jsonb, the `RenterProfile` actually used),
  `report` (jsonb, the `Report`), `created_at`.

RLS is enabled on all three tables, with policies allowing a user only
their own rows. There is no column, bucket or endpoint that accepts the
original file. A saved report is stored as the engine returned it, not
recomputed from parts.

**Analysis endpoint**: a server route (Vercel) that requires a session,
accepts `text`, `sections` and the profile, calls `analyzeDocument`, and
writes the document row. It never accepts a file upload. The model key
stays server-side.

**Loading a saved report** re-runs citation verification on every risk
flag against the stored `extracted_text`. A failure is treated as the
invariant breaking: the report is not rendered, and the failure is logged
as a blocker, not shown as a partial report.

**Library**: list view (title, date, state, verdict), open-by-id view and
a delete action. The report view is a thin wrapper; the designed report
screen and Q&A box are a separate, third spec.

**Title**: prefilled from the file name, editable before saving. Only the
title is stored, never the file name as a separate field.

**Delete**: removes the document row, including its extracted text,
sections, snapshot and report. Not on the PRD's v1 list; added by decision
because stored lease text is sensitive. `PRD.md` needs a matching line.

**Re-run on a saved document** reuses the stored extracted text and
sections with a freshly confirmed profile, and replaces the saved report
and profile snapshot. No report history is kept.

**Copy**: every label, error, empty state and refusal message goes through
the humanizer skill before it is committed (CLAUDE.md). This spec names
what must be said, not the wording.

## Testing Decisions

- Test external behavior: given a file or text, assert on the `text` and
  `Section[]` the parser returns; given a profile and session, assert on
  rows written and rows visible. Not internal heuristics or component
  internals.
- **Seams**: `parseFile` is the one new seam. `analyzeDocument` and
  `answerQuestion` are existing seams. Auth, profile and library behavior
  is tested at the database layer.
- **Parser fixtures, one set per file type**: plain text (clean, and one
  with control characters); PDF (clean, one garbled page, no text layer);
  DOCX (clean, one unreadable block). Each parser's tests live apart from
  the others'. Assert garbled content becomes an `UnreadableSection` with
  `text: null` and a reason, clean content comes through unaltered, and a
  no-text-layer PDF is refused.
- **The normalization invariant is a blocking test**: for the fixture
  files, every sentence of the stored text is found verbatim in the
  string passed to `analyzeDocument`, and a citation verified at analysis
  time still verifies after a save-and-load round trip through the
  database layer.
- **No file leaves the browser**: a test that the analysis request body
  contains only `text`, `sections` and profile fields, and that no route
  or table accepts binary content.
- **RLS tests** against a real Supabase instance (local or test project):
  user A cannot select, update or delete user B's `profiles`, `red_lines`
  or `documents`, and an unauthenticated request reads nothing.
- **Profile**: skipped optional fields round-trip as "not provided", not
  `false`; state is required and an uncovered state blocks submission.
- **Document-type gate**: freelance, ToS and non-document fixtures are
  refused before the analysis seam is called (assert the seam is not
  invoked).
- **Library**: saving, listing order, opening, and the stored-citation
  re-check, including a deliberately corrupted stored sentence that must
  block rendering.
- The model call stays the mocked boundary, as in the engine spec. The
  smoke script can be extended to cover one real upload-to-library path.
- Prior art: `lib/__tests__/` (vitest, injectable deps for the model call).

## Out of Scope

- Anything not on the "what the first version does" list in `PRD.md`.
- Payments/billing, OCR, sharing a document between users. The auth model
  has no roles, teams or share links.
- Judgment changes to either engine seam.
- Sourcing or building the state-standard dataset beyond what exists.
- The report screen and the Q&A box UI, beyond what the library needs to
  reopen a report. They need their own spec (see Open Questions).
- A renter-feedback loop, jurisdiction-agnostic operation, and tuning for
  freelance agreements or ToS, as in the engine spec.
- Q&A history. Nothing in the v1 list says questions or answers are
  saved, so none are stored.
- Account deletion, data export, editing a saved document's text, search,
  folders, tags, report history. Not on the v1 list. (Deleting a single
  saved document is in scope, by decision.)

## Decisions Made

Resolved by the owner while evaluating this spec:

1. Auth is email magic link only.
2. Sign-in is required before the first analysis.
3. Dependencies approved: `pdfjs-dist`, `mammoth`, `@supabase/supabase-js`,
   `@supabase/ssr`.
4. The document-type gate is a model classification call via OpenRouter.
5. A delete-document action is added to v1.
6. Re-run replaces the saved report.
7. The title is prefilled from the file name and editable.
8. The report and Q&A screens get a separate third spec; the library
   uses a thin wrapper.
9. States without data are blocked with a clear message.
10. Test seams: new `parseFile`, existing `analyzeDocument` and
    `answerQuestion`. File types are checked separately, each with its own
    parser, fixtures and tests.

## Further Notes

- The citation invariant is the reason for the normalization decision
  above. If the stored text and the analyzed text can differ by even
  whitespace, a verified citation can stop verifying after a round trip.
- `BUILD-REPORT.md` notes there is no `supabase/` directory yet. The
  Supabase project and keys have to be created by you; keys go in
  `.env.local` only.
- Tickets live in `.scratch/red-line/issues/`, continuing after the
  existing 01 to 04 (so this effort starts at 05), per the project's
  issue-tracker convention of one effort directory. Parser tickets (one per
  file type) and the document-type gate don't depend on Supabase and can
  start first.
- `PRD.md` needs updating for the delete action (a new item in "What the
  first version does") and for the sign-in requirement.
- Relevant ADRs: 0001 (citation invariant), 0007 (questionnaire and
  profile), 0009 (partial extraction). Vocabulary is in `CONTEXT.md`.
