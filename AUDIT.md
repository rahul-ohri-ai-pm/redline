# Redline — repository audit

Date: 2026-10-04. Branch `master`, working tree clean at `8a1b922`.

Sources of truth read in full: `CLAUDE.md`, `PRODUCT.md`, `PRD.md`, `CONTEXT.md`,
`DESIGN.md`, `docs/adr/0001`–`0010`, `.impeccable/surfaces/app-app.md`,
`.scratch/red-line/spec.md`, `.scratch/upload-auth-library/spec.md`, all nineteen
tickets under `.scratch/red-line/issues/`, and `BUILD-REPORT.md`.
`BUILD-REPORT.md` is treated as a dated record of earlier runs, not current state;
where it now disagrees with the code that is called out in finding 14.

Findings are ordered by how much a renter would be hurt if they are wrong.

---

## 1. The deployed product does not work for a renter at all

**What is wrong.** `README.md:1` names `https://redline-rosy-six.vercel.app/` as
the live address. The landing page loads, but nothing behind it functions. There
is no Supabase project wired to the deployment and no working OpenRouter key, so
every path a renter could take dead-ends:

| Probe | Result |
|---|---|
| `GET /` | `200`, 25,942 bytes — landing page renders |
| `GET /sign-in` | `200`, renders the **"Sign-in isn't set up on this deployment, so there are no accounts here"** branch (`app/sign-in/page.tsx:21,35`) |
| `GET /library` | `307` → `/sign-in?next=%2Flibrary` |
| `GET /profile` | `307` → `/sign-in?next=%2Fprofile` |
| `GET /new` | `200` — the upload screen renders signed-out |
| `POST /api/gate` (valid lease text) | `502 {"error":"The document check didn't go through."}` |
| `POST /api/analyze` | `401 {"error":"Sign in to analyze a document.","code":"signed-out"}` |

The sign-in branch tells the renter "You can still paste or upload a lease on the
New document page." That invitation is false on this deployment. `/new` renders,
the file parses in the browser, and then the document-type gate — the very next
step — returns `502`. The renter cannot get past the first server call.

**Evidence.** `app/sign-in/page.tsx:21` (`isSupabaseConfigured()`),
`lib/supabase/env.ts:19-24` (returns `null` with no `NEXT_PUBLIC_SUPABASE_URL` /
`_ANON_KEY`), `app/sign-in/SignInForm.tsx:9` (the `not_configured` message),
`app/api/gate/route.ts:5-7`, `lib/documents/analyze-handler.ts:201`. Live probes
run 2026-10-04.

**What it would take to close it.** Create the Supabase project, apply
`supabase/migrations/0001_profiles_and_red_lines.sql` and `0002_documents.sql`,
set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`OPENROUTER_API_KEY` and a valid `OPENROUTER_MODEL` in the Vercel project, add
`<origin>/auth/callback` to Supabase's redirect URLs, redeploy, then walk the
whole flow once by hand. `supabase/README.md` already documents every step.

---

## 2. State-standard data is fabricated, covers three states, and reaches the renter as legal-sounding fact

**What is wrong.** `PRODUCT.md:160-163` records this data as a "Data dependency
not yet sourced". That is still true, and the consequences are larger than the
phrase suggests.

`lib/state-standards.ts:94-158` holds exactly three states — CA, TX, NY — and the
module's own header (`lib/state-standards.ts:13-23`) says:

> PLACEHOLDER DATA — NOT LEGALLY AUTHORITATIVE. [...] It is NOT sourced from any
> state's actual statutes and must never be shown to a user as verified legal fact.

Three things stand on it, and all three leak it to the renter:

1. **The jurisdiction gate.** `lib/profile/validate.ts:9-15,50-52` builds the
   allowed state list straight from `Object.keys(stateStandards)`. A renter in
   any of the other 47 states is blocked at the questionnaire with "Redline
   doesn't cover your state yet, so it can't analyze a lease there." The gate is
   not an editorial choice about coverage; it is an artifact of a fixture file
   having three entries.
2. **Counter-offers.** `lib/analysis/counter-offer.ts:26-33` injects
   `stateStandard.noticePeriods.landlordEntryHours` into drafted text: a CA renter
   is told to "Ask the landlord to require at least 24 hours' written notice".
   That 24 is fixture data.
3. **Q&A grounding and flag summaries.** `lib/qa-engine.ts:120-153` serializes
   the whole fixture record into the Q&A system prompt as authoritative reference
   data. A live smoke run on 2026-10-04 produced the flag summary *"sets the
   security deposit at one month rent of $1850, **which meets the California one
   month cap**"* — a fabricated statutory claim, stated to the renter as fact,
   on exactly the kind of question (deposit caps) a renter would act on.

This is the sharpest conflict in the repo. `CLAUDE.md`'s rule is "Never state
anything the document text doesn't support", with Q&A permitted to draw on
"state-standard reference data". The code honours the letter and breaks the
intent: the reference data is invented.

**Evidence.** `lib/state-standards.ts:13-23,94-158`; `lib/profile/validate.ts:9-15,50-52`;
`lib/analysis/counter-offer.ts:26-33`; `lib/qa-engine.ts:120-153,186-200`;
`app/(app)/profile/ProfileForm.tsx:14-18` (the three display names);
live smoke output, 2026-10-04.

**What it would take to close it.** Either (a) source real per-state data for the
states you intend to ship, or (b) until then, suppress every renter-facing use of
it: drop the state-standard block from the Q&A prompt, remove the hours injection
from the right-of-entry counter-offer, and say on the profile screen that state
coverage is a pilot. Option (b) is a day's work and removes the fabricated-legal-
claim exposure; option (a) is the real fix. Do not ship (a) without a dated
source per value.

---

## 3. No real end-to-end run has ever happened — confirmed

**What is wrong.** Your fourth bullet is correct, and understated. There is no
Supabase project anywhere in this repo's history:

- `.env.local` contains only `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. No
  Supabase variables at all, so the authenticated screens cannot render locally.
- Migrations `0001` and `0002` declare row-level security correctly
  (`supabase/migrations/0001_profiles_and_red_lines.sql:25-26`,
  `0002_documents.sql:22`, 24 policy statements across the two files) but **have
  never been applied to a database**.
- `npm test` skips 12 tests in 2 files:
  `lib/profile/__tests__/rls.test.ts` and `lib/documents/__tests__/rls.test.ts`,
  both printing `SKIPPED: set SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY and
  SUPABASE_TEST_ANON_KEY to run the real row-level-security tests.`
  (`lib/documents/__tests__/rls.test.ts:14-23`).
- `supabase/README.md:24` states it plainly: *"Magic-link delivery and the code
  exchange have not been run against a real project in this repo; only the logic
  around them is tested."*

So: no magic link has been sent or redeemed, no RLS policy has been exercised
against a live instance, no row has been written to `documents`, and `/api/ask`
has never read from a real database.

The screenshots in `.impeccable/review/` (`desktop-library.png`,
`desktop-new.png`, `desktop-profile.png`, `desktop.png`, `mobile.png`, dated
2026-10-04) show the authenticated screens genuinely rendered in a browser — but
against a fixture harness, not Supabase. `desktop-library.png` shows documents
dated "Sep 28, 2026" and "Aug 2, 2026" and a rail with no "Signed in as" block,
because `user` was `null` (`app/(app)/layout.tsx:22`). **That harness is not in
the repo** — `git status` is clean and `.impeccable/review/` is ignored — so the
screens cannot be re-rendered today without rebuilding it.

**What it would take to close it.** A throwaway Supabase project, the two
migrations applied, the three `SUPABASE_TEST_*` variables set so the 12 gated
tests actually run, and one manual pass: sign in by magic link → save a profile →
upload a lease → analyze → open the report → ask a question → delete. Until that
happens, tickets 09–14 are claims, not results (see finding 5).

---

## 4. The local model path is broken by a malformed `.env.local`, so nothing has been exercised against a real model recently either

**What is wrong.** `npm run smoke` fails immediately:

```
smoke: pipeline threw an error: OpenRouterError: OpenRouter request failed with
status 400: {"error":{"message":"z-ai/glm-5.3-flashREDLINE_PREVIEW=out is not a
valid model ID","code":400}}
```

The resolved model id is `z-ai/glm-5.3-flashREDLINE_PREVIEW=out` — a model name
with a second variable's assignment glued onto the end. `.env.local` is missing a
line break between `OPENROUTER_MODEL` and the variable after it, and the naive
parser at `scripts/smoke.ts:22-34` splits only on `\n`, so it reads the whole run
together as one value. Next.js's own loader produces the same value, which is the
most likely reason `/api/gate` returns `502` in production too (finding 1).

This is a configuration defect, not a code defect: re-running with
`OPENROUTER_MODEL=z-ai/glm-5.3-flash` set in the environment, the entire pipeline
works — 20 risk flags, every one `citation verified against fixture text: YES`.
`scripts/smoke.ts` itself behaves correctly and exits `1` on failure (verified).

**Evidence.** `npm run smoke` output 2026-10-04; `scripts/smoke.ts:22-34,168-171`;
`lib/openrouter.ts:154`. I did not read or modify `.env.local` beyond its key
names.

**What it would take to close it.** Fix the line break in `.env.local`. Then
re-run `npm run smoke` and keep the output. Consider making
`scripts/smoke.ts`'s parser reject a value containing an embedded `WORD=`, so the
next malformed file fails loudly at parse time rather than at the API.

> **Resolved 2026-10-04, after this audit was written.** The line was split into
> `OPENROUTER_MODEL=z-ai/glm-5.3-flash` and `REDLINE_PREVIEW=out`. `npm run smoke`
> now exits `0`: 14 risk flags, **14/14 citations verified**, the answerable
> question grounded in the document with both quotes verified, and "Should I sign
> this lease?" refused as `general-advice-not-grounded`. Nothing reads
> `REDLINE_PREVIEW` anywhere in the repo. The hardening suggestion above
> (reject an embedded `WORD=`) is still open. Findings 1, 2 and 3 are unaffected —
> the deployed site still has no key and no Supabase project.

---

## 5. Tickets marked done whose acceptance criteria were never demonstrated

All nineteen tickets in `.scratch/red-line/issues/` carry `Status: done` with every
checkbox `[x]`. I spot-checked the five highest-risk. Three are genuinely done.
Two are not, and a third is partial.

**Not done — ticket 10 (`10-profile-and-red-lines.md:17`):**
> - [x] Row-level-security tests against a real Supabase instance show user A
>   cannot read, update or delete user B's profile or red lines, and an
>   unauthenticated request reads nothing.

The tests exist (`lib/profile/__tests__/rls.test.ts`) and are well written. They
have never run — 6 of them skip on every `npm test`. "Tests against a real
instance show X" is false; "tests are written that would show X" is true.

**Not done — ticket 11 (`11-analyze-and-save.md:21`):**
> - [x] Row-level-security tests show user A cannot read, update or delete user
>   B's documents.

Same: `lib/documents/__tests__/rls.test.ts`, 6 tests, all skipped. Tickets 13
(`13-delete-document.md:12`) and 14 (`14-re-run-saved-document.md:14`) carry the
same unmet criterion and should be reopened with 10 and 11.

**Partial — ticket 09 (`09-magic-link-sign-in.md:15`):**
> - [x] A renter enters an email, receives a magic link, and lands signed in.

No magic link has ever been sent (`supabase/README.md:24`). The logic around it is
tested (`lib/supabase/__tests__/auth.test.ts`, 18 tests) and `npm run build`
genuinely succeeds with no Supabase variables, which is the ticket's fourth
criterion and does hold. But the first criterion describes an outcome nobody has
observed.

**Genuinely done — ticket 03 (analysis engine).** Every claim checks out. The
blocking citation filter is real (`lib/analysis-engine.ts:105-108`), buckets are
exclusive (`lib/analysis/buckets.ts`), counter-offers attach only to
`remove-modify` (`lib/analysis-engine.ts:138-150`), unreadable sections are
excluded from the model input (`lib/analysis-engine.ts:90-91`) and surfaced
(`:81-84`), and the 42 tests behind it pass. The live smoke run independently
confirms the citation filter against real model output.

**Genuinely done — ticket 17 (Q&A box).** The ask route takes only a document id
and a question (`lib/ask/handler.ts:56-74`), loads text server-side from the
stored row (`:97`), and re-verifies every quote before returning
(`:136-143`). A fabricated quote becomes a `502` plus a `BLOCKER:` log line, never
a shown answer (`:118-124`). 14 tests cover it.

---

## 6. The citation invariant holds on the risk-flag and Q&A paths, with two narrow exceptions

`CLAUDE.md`'s one invariant is enforced in more places than it needs to be, which
is the right posture. Traced end to end:

| Stage | Where | Behaviour on failure |
|---|---|---|
| Analysis time | `lib/analysis-engine.ts:105-108` | Candidate is **dropped**; never becomes a `RiskFlag` |
| Re-run, before overwrite | `lib/documents/analyze-handler.ts:178-184` | `502`, old report left untouched |
| Every load of a saved report | `lib/library/load.ts:79-87` | `{ok:false, reason:"citation-failed"}`, **all-or-nothing** — no partial report, plus a `BLOCKER:` log (`:25-27`) |
| Report render | `app/(app)/library/[id]/page.tsx:32-55` | Only reachable through `loadReport`; failure renders "A quote no longer matches" and no flags |
| Q&A, in engine | `lib/qa-engine.ts:161-168,263-271` | Refusal with `citation-could-not-be-verified` |
| Q&A, in handler | `lib/ask/handler.ts:131-143` | `502` + `BLOCKER:` log; the refusal is never shown as a boundary |

`verifyCitation` (`lib/analysis/citation.ts:24-38`) is a plain substring check with
no normalisation or fuzzy matching, which is correct per ADR 0001. The report
view-model passes `sourceSentence` through untouched
(`lib/report/view-model.ts:122`). The fresh-analysis save path has only the
engine's filter and no second check, unlike re-run — that is fine, since the
engine is the enforcement point, but the asymmetry is worth knowing.

**Exception A — the library list shows counts derived from unverified flags.**
`listLibrary` (`lib/library/load.ts:40-52`) tallies `d.report.riskFlags` with no
citation check, and `app/(app)/library/page.tsx:66-82` renders those tallies as
bucket chips. A document whose stored text has drifted shows "3 remove or modify"
in the list and then refuses to render when opened. No sentence is displayed, so
the invariant's letter holds, but the renter is shown a count that the report
itself will not stand behind. Closing it: run the same verification in
`listLibrary`, or mark a row that fails.

**Exception B — a state-standard-grounded Q&A answer is never checked against
anything.** When the model returns `grounding: "state-standard"`,
`lib/qa-engine.ts:252-260` only checks that fixture data *exists* for the state;
the answer prose itself is returned unverified, and `sourceSentences` are dropped.
That is by design (ADR 0008 exempts state-standard answers from citation), but
combined with finding 2 it means the one Q&A path with no verification at all is
the path grounded in invented data.

Opportunity flags carry no citation and are rendered in their own section with
explicit "there's no sentence to quote" copy
(`app/(app)/library/[id]/page.tsx:177-195`) — correct per ADR 0010.

**Verdict: the invariant holds everywhere a sentence is rendered. It does not
extend to derived counts, and it cannot reach the one answer type that quotes
nothing.**

---

## 7. Scope: PRD and PRODUCT item-by-item

### `PRD.md:59-118`, "What the first version does"

| # | Item | State | Evidence |
|---|---|---|---|
| 1 | Client-side parse, only text sent | **Built** | `lib/parse/{plain-text,pdf,docx}.ts`; `app/(app)/new/UploadPreview.tsx:63` parses in-browser; `lib/documents/analyze-handler.ts:213-217` rejects a non-JSON body |
| 2 | Refuse non-lease documents | **Built** | `lib/gate/{classify,run,handler}.ts`; `UploadPreview.tsx:195-205`; 26 tests |
| 3 | Intake questionnaire before analysis, pre-filled | **Partly built** | Fields and pre-fill exist (`ProfileForm.tsx:53-59`), but it is a **separate prerequisite screen**, not a step in the analysis flow. `/new` refuses with "Save your profile first so Redline knows your state" (`analyze-handler.ts:224-227`) and sends the renter away. The PRD describes a questionnaire *in* the flow |
| 4 | Analyze what parsed; disclose what didn't | **Built** | `lib/analysis-engine.ts:81-91`; `library/[id]/page.tsx:106-127` |
| 5 | Verbatim sentence + bucket + counter-offer | **Built, weakly on the counter-offer** | Sentence and bucket solid. Counter-offers are a **7-entry lookup keyed by clause type** (`lib/analysis/counter-offer.ts:17-38`), not drafted per clause — the smoke run returned the same sentence for four different `$`-amount fee clauses |
| 6 | Relevance filter, then danger ranking | **Partly built** | Danger order is complete (`lib/analysis/ranking.ts:14-22`). The deterministic relevance filter uses **only two signals**: `pets === false` plus the literal string "pet", and whether red lines mention "guest" (`ranking.ts:49-73`). `jointLease` and `renterType` are collected, stored, shown — and have no relevance rule at all (`ranking.ts:41-47` documents this honestly) |
| 7 | Exactly one action bucket | **Built** | `lib/analysis/buckets.ts`; 10 tests; `types.ts` makes it a required discriminant |
| 8 | Over-flag on borderline | **Built, uncalibrated** | See finding 9 |
| 9 | Confidence-calibrated wording | **Built** | `lib/analysis/wording.ts`; visible in smoke output ("It looks like… though that's worth confirming") |
| 10 | Opportunity flags before "largely standard" | **Built** | `lib/analysis/opportunities.ts`; `view-model.ts:170` |
| 11 | Standing disclaimer | **Built** | `lib/analysis/copy.ts`; `library/[id]/page.tsx:100-103`; visible above the fold in `.impeccable/review/desktop.png` |
| 12 | Q&A grounded or refusing | **Built** | `lib/qa-engine.ts`, `lib/ask/`; but see finding 2 on what "state-standard" means here |
| 13 | Red lines feed the relevance filter | **Partly built** | Red lines reach the model prompt (`lib/analysis/model.ts:101-103`), so they do drive the analysis. The deterministic filter uses them for **one** thing: guest-restriction deprioritisation (`ranking.ts:60-70`) |
| 14 | Saved library | **Built** | `lib/library/load.ts`; `app/(app)/library/` |
| 15 | Delete a saved document | **Built** | `lib/library/delete.ts`; `DeleteButton.tsx`; 6 tests |
| 16 | Magic-link sign-in, no anonymous analysis | **Built in code, never exercised** | `lib/supabase/auth.ts`, `app/auth/callback/route.ts`, `middleware.ts`; see finding 3 |

### `PRODUCT.md:111-133`, "In scope for v1"

Every bullet maps onto the PRD rows above and carries the same verdict. The one
PRODUCT-specific line worth separating is `PRODUCT.md:120-122`, the bucket
assignment axis (negotiability → one-sidedness → dollar amount): that order is
implemented and tested in `lib/analysis/buckets.ts`.

### Built but on neither list

Nothing substantive. Three small additions, all defensible:
- `/api/gate` as a standalone route the browser calls before analysis — an
  implementation split of PRD item 2, not a new capability (but see finding 12).
- Re-run on a saved document (ticket 14), a build-time addition.
- `app/(app)/library/[id]/CopyButton.tsx`, copy-to-clipboard for counter-offers.

### Out-of-scope creep

**None.** A full grep across `lib/`, `app/` and `supabase/` for OCR, payments,
billing, subscriptions, sharing and invites returns only comments explaining why
OCR is excluded (`lib/analysis/citation.ts:18`, `lib/parse/pdf.ts:12`,
`lib/parse/docx.ts:14`) and one test fixture named "OCR-like". Freelance
agreements and Terms of Service appear only as refusal labels in the gate
(`lib/gate/classify.ts:42-43`, `lib/gate/types.ts:4-5`) — which is PRD item 2
working as specified, not tuning. This is clean.

---

## 8. Verification: what the four checks actually said, and what they do not cover

All four were run on 2026-10-04 against the working tree at `8a1b922`.

**`npm run typecheck`** — exit `0`, no output. Clean.

**`npm test`** — exit `0`.
```
Test Files  23 passed | 2 skipped (25)
     Tests  254 passed | 12 skipped (266)
  Duration  1.36s
```
The 12 skipped are the RLS suites (finding 3).

**`npm run build`** — exit `0`. Compiled in 2.2s, 11 routes, middleware 94.9 kB.
`/` static; `/library`, `/library/[id]`, `/new`, `/profile`, `/sign-in` and the
three API routes dynamic. No warnings.

**Impeccable `detect --json` over `app/`** — 7 findings, **all `severity:
advisory`, zero blocking**:
- `app/components/ViolationTag.module.css:89` — `font-size: 0.62rem` off ramp
- `app/components/ViolationTag.module.css:130` — `font-size: 0.95rem` off ramp
- `app/page.module.css:14` — `font-size: 1.4rem` off ramp
- `app/page.module.css:169` — undocumented color `rgba(217, 127, 46, 0.18)`
- `app/page.module.css:173` — undocumented color `rgba(140, 133, 119, 0.2)`
- `app/page.module.css:213` — `font-size: 1.08rem` off ramp
- `app/page.module.css:269` — `font-size: 0.92rem` off ramp

Every hit is on the landing surface (`ViolationTag` is imported only by
`app/page.tsx:92,101,109`), where `DESIGN.md:277` explicitly exempts type from the
fixed ramp. The two color hits are finding 11.

### What these four do **not** cover

- **No real model call.** All 254 tests stub the OpenRouter boundary. The only
  thing that exercises a real model is `npm run smoke`, which needs
  `OPENROUTER_API_KEY` — and is currently broken by the malformed
  `OPENROUTER_MODEL` (finding 4).
- **No real database.** Supabase is not configured in `.env.local`, so the
  authenticated screens cannot be rendered locally without a fixture harness, and
  no one has exercised the real signed-in flow against a real Supabase instance.
  The harness used for `.impeccable/review/*.png` is not in the repo.
- **No browser test of any kind.** There is no Playwright, Cypress or jsdom
  render test. `app/__tests__/mobile-touch-targets.test.ts` is 13 assertions that
  parse CSS text for `min-height` inside a `max-width: 720px` block — useful, but
  it proves nothing about layout, focus order or what a renter sees.
- **No accessibility check.** No axe, no contrast assertion in CI. The contrast
  ratios in `DESIGN.md:253` are prose claims, not tested values.
- **No judgment validation.** Named as open in `PRD.md:142-147` and
  `PRODUCT.md:156-158`, and still open. Nothing verifies that the right clauses
  get flagged or bucketed.

---

## 9. Over-flagging is unbounded and the counter-offer is boilerplate

**What is wrong.** `PRD.md:207-213` accepts over-flagging and names the "smoke
detector that beeps at everything" risk as unresolved. In practice the variance is
extreme. On one 6,640-character fixture lease, the same code has returned:

- **20** flags (smoke run, 2026-10-04, this audit)
- **14** flags (smoke run, 2026-10-04, after the finding-4 fix)
- **19**, then **13** (`BUILD-REPORT.md:155`)
- **1**, then **16** (earlier runs, same line)

Six runs of the same code against the same lease, spanning 1 to 20 findings.
A renter who gets 1 flag and a renter who gets 20 are looking at the same lease.
The 20-flag run also split a single $45 portal fee across two separate
`remove-modify` findings — one for the fee, one for the sentence saying it is
non-refundable — each with the identical templated counter-offer, because
`draftCounterOffer` keys only on `clauseType`
(`lib/analysis/counter-offer.ts:17-38`).

Separately, the counter-offer the design round was reviewed against is not the
counter-offer that ships. `.impeccable/review/desktop.png` shows *"Please remove
the $45 monthly portal fee, or confirm in writing that rent may be paid by check
or bank transfer at no additional charge"* — specific, fixture-authored prose. The
engine actually produces *"Ask the landlord to remove this fee, or fold it into
the stated monthly rent…"* for every hidden-fee flag in the document.

**What it would take to close it.** This is the PRD's acknowledged open question,
so the honest close is a decision rather than a patch: either commit to a flag
cap plus de-duplication by source sentence, or state a noise budget and measure
against it. The counter-offer gap is smaller and concrete — pass the flag's
summary and dollar figure into the drafting step so the text references the clause
it belongs to.

---

## 10. The shell design round's final state was never reviewed — confirmed

**What is wrong.** Your first bullet is correct, and the contract the round was
run under required the review explicitly.
`.impeccable/surfaces/app-app.md:75-77`:

> FINISH: unreviewed and undocumented is unfinished; this build ends with the
> finish review, the verdict, DESIGN.md, and every shipping raster carrying its
> provenance

`DESIGN.md` was written (commit `8a1b922`). The verdict was not. There is no
finish-review record anywhere in the repo: `.impeccable/design.json` carries no
score, verdict, round or budget field, and `DESIGN.md`'s only two references to a
finish review (`:218`, `:387`) are both about the **landing** round's display-face
regression, not the shell.

What the artifacts do show is a fix budget being spent rather than banked:
`DESIGN.md:218` records the landing round's two passes, `DESIGN.md:236` records
the shell round deepening two bucket colors — and the same sentence records a
defect **carried rather than fixed** (finding 11), which is what a spent budget
looks like.

**What it would take to close it.** Re-render the shell screens, run the
finish-reviewer against `.impeccable/surfaces/app-app.md`'s direction contract,
and record the verdict. Because the fixture harness is gone (finding 3), this now
costs rebuilding the harness first — or, better, do it against a real Supabase
instance so the review covers the account block in the rail, which has never been
rendered at all (`app/(app)/layout.tsx:22-29`).

---

## 11. The two landing washes are stale literals — confirmed, and the surface contract has drifted too

**What is wrong.** Your second bullet is correct in every particular.
`app/page.module.css:169` and `:173`:

```css
.flagPush    { background: rgba(217, 127, 46, 0.18); }
.flagClarify { background: rgba(140, 133, 119, 0.2); }
```

Those are `#d97f2e` and `#8c8577` — the pre-deepening hues. The marks beside them
now render in `#8f4f17` and `#645c4c` (`app/globals.css:11-12`). The Impeccable
detector flags both as undocumented colors, and `DESIGN.md:236` already records
the situation verbatim:

> Two highlight washes on the landing page still carry the pre-deepening hues as
> hardcoded literals [...] they no longer share a hue with the marks they sit
> beside.

So this is documented, not hidden — but documented-and-carried, which is what
finding 10 is about. The retirement note's other claim does check out:
`--color-amber` is genuinely absent from `app/globals.css`.

**Also drifted, not previously recorded:** `.impeccable/surfaces/app-app.md:38-46`
— the direction contract the round was built against — still names
`amber push-on (#D97F2E)` and `clarify graphite (#8C8577)` as the OWN-WORLD
tokens, and a `20px die-cut top-left corner` for the shell. The shipped values are
`#8f4f17`, `#645c4c` and `--notch: 18px` (`app/globals.css:11-12,36`). Anyone
re-running the finish review against that contract would score the build against
superseded values.

**What it would take to close it.** Derive the two washes from the current tokens
(`color-mix(in srgb, var(--color-amber-dark) 18%, transparent)` or equivalent),
and amend the surface file's OWN-WORLD line to the shipped values before any
re-review.

---

## 12. `/api/gate` is an unauthenticated model-spend endpoint on a public URL

**What is wrong.** `app/api/gate/route.ts:5-7` calls `handleGateRequest` with no
session check. `lib/gate/handler.ts:3` says so in its own header: *"No session is
required yet."* The middleware matcher excludes `api/` entirely
(`middleware.ts:10`), so nothing upstream guards it either. `/api/analyze` and
`/api/ask` both check (`analyze-handler.ts:201`, `ask/handler.ts:79-80`); the gate
does not, and there is no rate limit anywhere.

Anyone can POST arbitrary text to the deployed URL and spend a model call per
request. `BUILD-REPORT.md:97` flagged this during the second run — *"Anyone can hit
the gate and spend a model call. Consider adding a session check or rate limit"* —
and it has not been addressed.

**What it would take to close it.** Add the same `getUser()` check the other two
routes use, or a per-IP rate limit. The flow already requires sign-in before
analysis, so requiring it before the gate costs the renter nothing.

---

## 13. Accessibility and interaction states, screen by screen

Checked against the code. Global baseline is good: `:focus-visible` is a 2px
violation-red outline at 3px offset applied globally (`app/globals.css:106-109`),
every interactive control inherits it, and no `outline: none` appears anywhere.
Gaps below; none fixed.

**Global**
- **No skip-to-content link.** Every shell page puts the wordmark, three nav
  links and a Sign out button before `<main>` (`app/(app)/layout.tsx:15-32`). A
  keyboard user tabs through five controls on every single page. WCAG 2.4.1.

**Report (`app/(app)/library/[id]/page.tsx`)**
- States are complete: load failure and citation failure each get a distinct
  `role="alert"` notice with useful text (`:37-55`); empty skipped-sections says
  "Every section was read" (`:111`); suggestions section is suppressed when empty.
- `CopyButton` (`CopyButton.tsx:22-30`) swaps its label to "Copied" but leaves the
  `role="status"` span empty on success — only failure is announced. Minor.
- No hover/focus distinction documented for `blockquote` quotes; they are not
  interactive, so this is correct.

**Q&A box (`QaBox.tsx`)** — the strongest screen in the app.
- Has every state: empty ("No questions yet", `:106`), waiting (`role="status"`,
  `:114`), answer with grounding chip, refusal with its own chip, error with a
  Retry button, and a disabled submit while waiting (`:99`).
- Gap: the textarea has `maxLength` but no visible character counter, so a renter
  hits a silent ceiling at 500 characters.
- Gap: `aria-live="polite"` sits on the `<ol>` (`:108`) while entries are
  prepended; the announcement works but the whole list is the live region, which
  is noisier than wrapping each outcome.

**Add a document (`UploadPreview.tsx` + `AnalyzePanel.tsx`)**
- Strong state coverage: parse busy (`:136`), parse refusal (`:138`), skipped
  sections (`:150`), gate checking (`:175`), gate pass/refuse/error with Retry
  (`:178,195,207`), analyze busy, saved, and four distinct error branches
  (`AnalyzePanel.tsx:144-170`).
- **Gap: the Analyze button is disabled with no programmatic reason.**
  `canAnalyze` (`AnalyzePanel.tsx:74-75`) goes false when there is no saved
  profile or the title is empty. The explanation sits in a sibling `<p>` that is
  not linked by `aria-describedby`, and an empty title produces no message at all
  — the button just stops working.
- Gap: `<input type="file">` (`UploadPreview.tsx:106-111`) is the raw browser
  control, unstyled by the design system; `DESIGN.md`'s Components section has no
  entry for it.

**Profile and red lines (`ProfileForm.tsx`)** — the weakest screen.
- **Focus is lost on every red-line edit.** Adding a line does not focus the new
  input (`:245`); removing one leaves focus on a button that no longer exists
  (`:232`); moving a line to position 0 disables the Up button that currently has
  focus (`:213-220`). Three separate focus-loss paths in one fieldset.
- **Field errors are not announced.** `errors.pets`, `errors.jointLease`,
  `errors.renterType` and `errors.redLines` render as plain `<p>` with no
  `role="alert"` and no `aria-describedby` link to their input (`:148-174,240`).
  Only `errors.form` and the re-run error are announced (`:259-269`). A screen
  reader user who submits a bad renter type gets silence.
- No error summary and no focus move to the first invalid field on failed submit.
- Good: the state blocker is in an `aria-live="polite"` region (`:137`), the
  skipped-fields precision note is `role="status"` (`:177`), red-line inputs have
  `srOnly` labels, and the Up/Down/Remove buttons carry indexed `aria-label`s.

**Library (`page.tsx`, `DeleteButton.tsx`)**
- **`DeleteButton` loses focus when it expands.** Clicking Delete replaces the
  button with a confirm/cancel pair (`DeleteButton.tsx:43-56` → `:58-85`) and
  moves focus nowhere. A keyboard user is dropped to the document body mid-task,
  on a destructive action.
- Good: confirmation step, disabled states on both confirm buttons while pending,
  `role="group"` with an accessible name, and a `role="alert"` error that says the
  document is still there.
- **Gap: the empty state lies when Supabase is unconfigured.**
  `app/(app)/library/page.tsx:22` only populates `entries` when `client` is
  truthy, and `loadFailed` stays `false`. With no Supabase, the renter sees
  "Nothing saved yet" rather than a configuration error.
- Row hover/focus is handled (the notch appears on both, and is pinned on at
  ≤720px per `DESIGN.md:329`).

**Drawer (`RailMenu.tsx`)** — mostly right.
- Correct: `aria-expanded`, `aria-controls`, Escape closes and restores focus to
  the button (`:23-33`), closes on navigation (`:19-21`), and the panel is
  `display: none` when closed (`app/(app)/shell.module.css:240-249`) so there are
  no phantom tab stops. Touch targets are 2.75rem (`:222-227,250-254`).
- Gap: focus is not moved into the panel when it opens, and there is no focus
  trap — a keyboard user opens the menu and is still on the button.

**Sign-in (`SignInForm.tsx`)** — complete. Labelled input, `autoComplete="email"`,
disabled submit while sending with a "Sending" label, `aria-live` status region,
distinct copy for sent / invalid email / send failed / not configured, and an
expired-link `role="alert"` on the page (`app/sign-in/page.tsx:42`).

---

## 14. Where `BUILD-REPORT.md` now disagrees with the code

Treated as history, as instructed. Four disagreements worth naming.

**Stale — the header.** `BUILD-REPORT.md:3` says *"all fourteen tickets"*. There
are nineteen; tickets 15–19 landed later and are covered further down the same
file.

**Still true, not fixed.** `BUILD-REPORT.md:97` — *"`/api/gate` has no session
check; `/api/analyze` does. Anyone can hit the gate and spend a model call."*
Verified still accurate (finding 12). This is the most actionable line in the file.

**Your third bullet — lines 100 and 150.** Both are stale, but neither is quite
"a defect since fixed left standing as a record":

- **Line 100** — *"Design hook flagged thick side-stripe borders; replaced with
  full borders / a top bar. The app shell brief's 'left-edge color bar' is only
  used for list-row chips, if at all."* This never described a standing defect; it
  records a fix already applied. It is now also superseded: the left-edge color
  bar was dropped entirely in the design round, and the row chips are bucket
  marks, not bars (`.impeccable/surfaces/app-app.md:46-49`, `DESIGN.md:333`).
- **Line 150** — *"Nothing was seen in a browser. The 360px behaviour of ticket 18
  is CSS reasoning only [...] Someone should look at 360px once."* This is now
  **false**: `.impeccable/review/mobile.png` and five desktop captures exist, all
  dated 2026-10-04, from the shell design round. The screens have been seen. What
  has *not* happened is seeing them with real data (finding 3).

So: confirm that both lines are out of date; refute the framing that they record
fixed defects. One records a fix, one records a gap that has since been partly
closed.

**Still true and important.** `BUILD-REPORT.md:146-148` (the "Not verified"
block) and `:155` (the flag-count variance) both hold exactly as written.

---

## 15. Smaller items

- **The disclaimer is not re-verified on load.** `PRD.md:129` promises "no code
  path that produces a report without it", but `loadReport`
  (`lib/library/load.ts:74-87`) checks only `riskFlags`. A stored report with an
  empty `disclaimer` would render the hardcoded "Not legal advice" label
  (`app/(app)/library/[id]/page.tsx:101`) above empty text. The engine always sets
  it, so this is latent, not live.
- **`STATE_NAMES` is hardcoded** in `app/(app)/profile/ProfileForm.tsx:14-18`
  while the option list comes from `coveredStates()`. A fourth state added to
  `lib/state-standards.ts` would render as a bare two-letter code. The comment on
  `:13` is aware of this.
- **`CONTEXT.md:106-111` asks for a `CLAUDE.md` edit** that has not been made:
  *"This amends CLAUDE.md's current 'answers only from the document' wording —
  update that line when CLAUDE.md is next revised."* `CLAUDE.md:5` still says
  "answers only from the document", though `CLAUDE.md:40-43` does carry the
  state-standard allowance. Minor inconsistency inside the governing document.
- **Humanizer compliance is unverifiable from the repo.** `CLAUDE.md:44-48` makes
  it a gate on all user-facing copy and every ticket asserts it. Nothing records
  the runs. Read directly, the copy is good — "Redline didn't check these, so the
  flags below say nothing about them", "One of the sentences this report quotes is
  no longer in the saved text" — but the claim rests on assertion.

---

## What is genuinely done

This is a real build, and most of it is solid work.

- **The citation invariant is enforced for real,** at four independent points, and
  it survives contact with a live model: a smoke run on 2026-10-04 produced 20
  flags and every single one verified verbatim against the fixture text. The
  all-or-nothing load behaviour (`lib/library/load.ts:79-87`) is the right call
  and is correctly wired to the one screen that renders sentences.
- **The judgment layer is complete and well factored.** Nine focused modules under
  `lib/analysis/`, with buckets, danger ranking, confidence-calibrated wording,
  opportunity flags, partial-extraction handling and the disclaimer all built and
  tested. The ADR trail (0001–0010) is genuinely load-bearing — the code cites it
  and follows it.
- **Three independent parsers**, each with its own readability heuristic,
  fixtures and tests, none sharing logic, all erring toward "unreadable" — exactly
  what tickets 05–07 asked for. 34 tests. The client-side-only constraint holds:
  no file has a path to the server.
- **254 passing tests, clean typecheck, clean production build**, and the
  Impeccable detector returns zero blocking findings.
- **The Q&A box and its handler** are the best-built surface in the app: a
  minimal request shape, text read server-side from the stored row, double
  verification, refusals kept distinct from errors, and a complete set of UI
  states including retry.
- **The design system is real and the code follows it.** All eleven color tokens
  in `DESIGN.md` match `app/globals.css:2-12` exactly; the retired `--color-amber`
  really is gone; the seven-step type ramp (`app/globals.css:24-30`) matches
  `DESIGN.md:272-279` step for step, and **every single `font-size` in every shell
  stylesheet is one of those tokens** — the Fixed-Ramp Rule holds without
  exception. The 2px radius, the 18px notch, the global focus ring and the
  720px/760px/480px breakpoints all check out as documented.
- **The report screen works and looks right.** `.impeccable/review/desktop.png`
  shows the verdict, summary, disclaimer and skipped-sections all above the fold,
  with the first finding's verbatim quote and counter-offer immediately below —
  which is ticket 16's first acceptance criterion, met.
- **Scope discipline is excellent.** Nothing out-of-scope has crept in: no OCR, no
  payments, no sharing, no freelance or ToS tuning. The exclusions are not just
  absent, they are explained in the code at the points where someone would be
  tempted.

The gap between this and a working product is almost entirely operational — a
Supabase project, a corrected environment file, a real dataset behind
`lib/state-standards.ts`, and one person walking the flow end to end. The code is
in better shape than the deployment suggests.
