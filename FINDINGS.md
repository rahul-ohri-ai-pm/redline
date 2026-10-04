# FINDINGS

A skeptical pass over https://redline-rosy-six.vercel.app/, signed in, tested
through the browser only, in two rounds. Thirteen documents were analyzed in
total (seven in the first round, six in the second, which was approved after
the first). The second round also covered file upload, the relevance filter,
deletion, the 360px layout, signed-out reach and the first-time-user path.

Findings are ordered most serious first; misleading a reader is treated as
worse than stopping one. Anything seen once and not reproduced is at the
bottom, followed by what held up and what was not checked.

---

# Misleads a reader

## 1. The same lease, with the same profile, gets a materially different report every time it is run

**Steps**

1. Go to https://redline-rosy-six.vercel.app/new and analyze any lease.
2. Open the report, press **Re-run with updated profile**, change nothing,
   press **Save and re-run**.
3. Compare with the report you had before.

**What PRD.md promises**

> "Every flag is sorted into exactly one action bucket — **clarify**, **push
> on**, or **remove/modify** — decided in order by: whether the clause is
> realistically negotiable at all, how one-sided/irreversible it is, and
> dollar amount as a tiebreaker."
> — PRD.md, "What the first version does", item 7

That is a rule about the clause, so the same clause should land in the same
bucket each time.

**What happened instead**

Two pairs of runs on byte-identical text with an identical, unchanged profile:

| | Injection lease, run A | Injection lease, run B |
|---|---|---|
| Flags | 8 | 5 |
| Buckets (remove / push / clarify) | 8 / 0 / 0 | 4 / 0 / 1 |
| Right-of-entry clause ("may enter the Premises at any hour without notice and without Tenant's consent for any reason whatsoever") | REMOVE OR MODIFY, with counter-offer | CLARIFY, no counter-offer |
| Planted instruction to automated reviewers | flagged | not mentioned |
| Flags labelled `UNUSUAL TERM` | 7 | 0 |

| | Spanish lease, run A | Spanish lease, run B |
|---|---|---|
| Flags | 6 | 7 |
| Auto-renewal clause | REMOVE OR MODIFY | PUSH ON |
| Deposit-retention clause | `DEPOSIT DEDUCTION` | `UNUSUAL TERM` |
| California law asserted in a flag | yes | no |

The worst single swing: in run B, the right-of-entry flag's own summary says
it "violates your requirement of 24 hours written notice and California law"
— a breach of the renter's own stated red line — yet it is filed in the
lowest bucket, CLARIFY, which carries no counter-offer.

A renter cannot see this happening. **Re-run** replaces the earlier report
("Re-running replaces it."), so the version that disagreed is gone, and the
renter takes whichever verdict the last press produced as the product's
considered reading of their lease.

**Severity: misleads a reader.**

---

## 2. Flags state legal conclusions the document text does not support

**Steps**

1. With state set to California on /profile, analyze a lease containing a
   three-month security deposit and a no-notice entry clause.
2. Read the summary line on the deposit, entry and early-termination flags.

**What PRD.md promises**

State reference data is scoped to the Q&A box:

> "A Q&A box answers renter questions grounded in the document's text or in
> the state-standard reference data Redline already holds (deposit caps,
> notice-period minimums, and similar)"
> — PRD.md, "What the first version does", item 12

Flags are scoped to the document:

> "Each risk found is flagged with: the exact source sentence, verbatim from
> the parsed text" — PRD.md, item 5

**What happened instead**

Flag summaries assert things about California law that appear nowhere in the
lease. Seen across four separate reports:

- "which exceeds California's legal cap of one month's rent"
- "which exceeds the California cap of one month's rent"
- "which violates California's 24-hour written notice requirement"
- "violates your requirement of 24 hours written notice and California law"
- "a double penalty that California law likely limits"
- "is right at the California cap, so any pet deposit would likely push it
  over the legal limit" — on the sentence "Tenant shall pay a security
  deposit of $1,850.00 prior to move-in.", which says nothing about pets
- "which is far beyond the 30 day standard"

Each sits in the same sentence as the document-derived summary and in the
same block as the verified quote, so the renter cannot tell which half is
checked against their lease and which half is not — directly under a banner
saying this is not legal advice.

**Severity: misleads a reader.**

---

## 3. A lease for a flat in Spain, written in Spanish, is analysed "READ AGAINST CA RULES"

**Steps**

1. Go to https://redline-rosy-six.vercel.app/new
2. Paste a residential lease in Spanish for a flat at "Calle Mayor 44, 3 B,
   Valencia", priced in euros.
3. Press **Show the text** — it returns "THIS LOOKS LIKE A RESIDENTIAL LEASE".
4. Title it, press **Analyze**, open the report. Re-run it once.

**What PRD.md promises**

> "Before analysis, the renter completes a structured intake questionnaire:
> state/jurisdiction (**required** — analysis cannot run without it)"
> — PRD.md, "What the first version does", item 3

**What happened instead**

The document is accepted without a word about jurisdiction, and both runs
stamp the report "READ AGAINST CA RULES", with `STATE / CA` in the profile
block. Nothing in the flow notices euros or a Valencia address. The first run
went further and told the renter the Spanish deposit "exceeds California's
one month deposit cap" and the Spanish entry clause "violates the renter's 24
hour written notice requirement". (That explicit wording did not recur on the
re-run — see finding 1 — but the CA stamp did, both times.)

**Severity: misleads a reader.**

---

## 4. Dangerous clause types are relabelled "UNUSUAL TERM" — the label the PRD reserves for terms that are not danger-ranked

**Steps**

1. Analyze a short lease containing a three-month deposit, "Landlord may
   apply the deposit to any charge Landlord deems appropriate and is not
   obligated to return any portion of it.", a no-notice entry clause and an
   early-termination forfeiture clause.
2. Read the label above each flag. Re-run it.

**What PRD.md promises**

> "...then ranked by danger: hidden/wallet-impacting fees, then auto-renewal,
> then security deposit deduction terms, then early-termination penalties,
> then landlord's right of entry, then guest restrictions, then everything
> else shown as **"unusual" rather than danger-ranked**."
> — PRD.md, "What the first version does", item 6

**What happened instead**

In two of the three runs of that lease, the deposit, deposit-retention, entry
and early-termination clauses were each labelled `UNUSUAL TERM` — seven of
eight flags in one report. The Spanish lease's deposit-retention clause got
the same treatment on its second run after being `DEPOSIT DEDUCTION` on its
first. The labels exist and are used correctly on other runs, so this is not
a missing category: the most expensive clauses in the lease are shown under
the label the product uses for terms nobody ranked.

**Severity: misleads a reader.**

---

## 5. The "counter-offer draft" is usually a template, and sometimes answers a different clause

**Steps**

1. Analyze any lease and read the **COUNTER-OFFER DRAFT** under each
   `REMOVE OR MODIFY` flag.

**What PRD.md promises**

> "...and, for remove/modify flags, **a drafted counter-offer**."
> — PRD.md, "What the first version does", item 5

**What happened instead**

Reproduced across six reports, in three shapes.

a) One fixed sentence with the clause pasted into the middle:

> "Ask the landlord to remove or rewrite this clause — \"Landlord may apply
> the deposit to any charge Landlord deems appropriate and is not obligated
> to return any portion of it.\" — so it doesn't place all of the risk on
> you."

It asks for nothing in particular. It is also what the renter is handed for
the signature block — "By signing below, Tenant acknowledges having read and
understood all provisions of this Agreement..." — which no renter can ask a
landlord to delete. And it was the "counter-offer" to a planted instruction
aimed at automated reviewers.

b) A draft keyed to the clause *type*, so every flag of that type gets the
same text whether or not it fits. A guest clause typed as a hidden fee was
told to "fold it into the stated monthly rent". The sentence "Tenant shall pay
a security deposit of $1,850.00 prior to move-in." — a complaint about the
deposit *amount* — got the deduction-terms draft: "limit deductions to unpaid
rent and damage beyond normal wear and tear, and ... require a written,
itemized accounting".

c) Identical drafts on every pair of same-type flags in a report (01/02,
03/04, 05/06, 07/08, 09/10 on one lease).

A renter who copies these — the button works and says "COPIED" — sends their
landlord either their own lease back or an answer to a different clause.

**Severity: misleads a reader.**

---

## 6. Flags the product itself is unsure about are filed in the strongest bucket, with a demand to remove the clause

**Steps**

1. Analyze a low-risk lease (e.g. one where the tenant pays utilities and
   nothing else is unusual), or the repository's `adhesion-lease.txt` with a
   red line saved.
2. Look for `REMOVE OR MODIFY` flags whose summary begins "It looks like…"
   and ends "though that's worth confirming with the landlord before you
   sign."

**What PRD.md promises**

> "Each flag's wording tracks the model's actual certainty about that
> specific flag — hedged when uncertain, stated flatly when clear-cut."
> — PRD.md, item 9

together with item 7's bucket rule (negotiability, one-sidedness, then
dollars).

**What happened instead**

The wording is hedged, but the bucket is not. Two examples, on different
leases:

- "It looks like this clause makes you pay for water and trash on top of
  electricity and gas, though that's worth confirming..." on "Tenant is
  responsible for electricity, gas, water and trash." — `REMOVE OR MODIFY`,
  with a counter-offer to remove or rewrite the clause. It was the only flag
  on that lease.
- "It looks like this clause acknowledges in the signature block that you
  read and agreed to the fee, renewal, deposit, entry, guest, and early
  termination sections ... though that's worth confirming" — `REMOVE OR
  MODIFY`, ranked above two guest-restriction flags.

The renter is told the product isn't sure, then handed the most aggressive
action it has.

**Severity: misleads a reader.**

---

## 7. No lease is ever "largely standard", and opportunity flags never appear

**Steps**

1. Paste the repository's own `tests/fixtures/clean-lease.txt` — a lease
   written to be fair (21-day itemized deposit return, 24 hours' notice,
   no auto-renewal, landlord must re-rent) — and analyze it.
2. Separately, analyze a short benign lease (rent, deposit equal to one
   month, 24 hours' notice, utilities).

**What PRD.md promises**

> "When a lease has few or no risk flags, Redline still looks for
> **opportunity flags** — general, advisory suggestions of favorable terms
> the renter could ask for — before falling back to a bare "this lease is
> largely standard" verdict"
> — PRD.md, item 10

> "a lease with little or no risk shows opportunity flags or, only when there
> is truly nothing to say, the bare "largely standard" verdict"
> — PRD.md, "What good looks like"

**What happened instead**

The clean fixture came back **RISKS FOUND** with eight flags (1 remove, 7
clarify). One is labelled `AUTO-RENEWAL` on "This Agreement shall end
automatically at the conclusion of the Initial Term..." — a clause whose own
flag summary admits the lease "ends automatically and does not renew on its
own". The benign lease came back **RISKS FOUND** with one flag (finding 6).
Neither report contained an opportunity flag.

Across all thirteen analyses, every report — and all eight documents now in
the library, including the account owner's own "CA Test Doc 1" — reads "Risks
found". The PRD accepts over-flagging (item 8), but the path it promises for a
clean lease is never reached, and the auto-renewal label on a non-renewal
clause is a factual mislabel, not an over-cautious one.

**Severity: misleads a reader.**

---

## 8. Text added to the paste box after the type check is silently left out of the analysis

**Steps**

1. Go to https://redline-rosy-six.vercel.app/new and paste page 1 of a lease.
2. Press **Show the text**; it passes as a residential lease.
3. Paste page 2 into the box below page 1 — here: "PAGE 2. Landlord may
   enter at any time without notice. Tenant shall pay a monthly fee of $200
   for building amenities."
4. Give it a title and press **Analyze**.

(Checked by intercepting the analyze request in the page, so no analysis was
spent.)

**What PRD.md promises**

> "Redline analyzes whatever portion of the document parsed cleanly. Any page
> or section it couldn't confidently read is skipped and explicitly disclosed
> to the renter — never guessed at."
> — PRD.md, item 4

**What happened instead**

After step 3, the box shows both pages but the panel still reads "THIS LOOKS
LIKE A RESIDENTIAL LEASE" and **Analyze** stays live. The request sent on
**Analyze** contains page 1 only — the no-notice entry clause and the $200
fee never reach the analysis, and nothing on screen says so. The only clue is
the "TEXT FROM PASTED TEXT" panel lower down, which silently still shows page
1. Reproduced twice, with different text.

(The same mechanism does mean the type check cannot be bypassed by swapping
in a non-lease afterwards — see "What held up".)

**Severity: misleads a reader.**

---

## 9. Plainly legible text is reported as "scrambled, not recognizable words" and dropped

**Steps**

1. Go to https://redline-rosy-six.vercel.app/new
2. Paste a lease whose title block uses rule lines:

   ```
   ===========================================
   RESIDENTIAL LEASE AGREEMENT
   ===========================================
   ```
3. Press **Show the text**.

**What PRD.md promises**

> "Any page or section it couldn't confidently read is skipped and explicitly
> disclosed to the renter — **never guessed at**." — PRD.md, item 4

**What happened instead**

> **1 SECTION COULDN'T BE READ** ... paragraph 1 — Most of it is scrambled,
> not recognizable words.

The paragraph reads "RESIDENTIAL LEASE AGREEMENT" between two rule lines; it
is dropped from the text that gets analyzed. Reproduced on a 200,000-character
lease with rule-lined schedule headings, which produced "98 SECTIONS COULDN'T
BE READ", every one a clean heading. For comparison, the repository's
genuinely scrambled DOCX fixture gets a different, accurate message ("Its
letters look scrambled", with the location), so the false one is specific to
rule-line text.

**Severity: misleads a reader.**

---

# Stops a reader

## 10. Only California, New York and Texas are supported, and nothing says so until after sign-in

**Steps**

1. Read https://redline-rosy-six.vercel.app/ top to bottom, then the
   sign-in page and the signed-out /new page.
2. Sign in and open /profile. Choose **My state isn't listed**.

**What PRD.md promises**

> "**Chose to require jurisdiction/state at intake.** ... **Worse off:** a
> renter who doesn't know or won't disclose their state is blocked from
> using the product at all — this is **friction at the front door**, not a
> degraded result."
> — PRD.md, "The calls I made, and what I gave up"

and the landing page's own promise: "Paste in a lease and Redline hands back
a numbered list of exactly which sentences to worry about."

**What happened instead**

None of the landing page, the sign-in page or the signed-out /new page
mentions states. The landing page's "WHAT REDLINE WON'T DO." list names four
limits — no verdict, not legal advice, residential leases only, no scans —
but not this one. A renter in any of the other 47 states finds out only after
giving an email, opening the magic link and reaching the profile page:

> "Redline has no rules for your state yet, so it can't analyze a lease
> there. You can't continue."

**Save profile** greys out and the page offers no way onward. Reproduced
twice. The block the PRD wanted at the front door sits behind sign-up.

**Severity: stops a reader.**

---

## 11. A new visitor does the work before learning an account is required

**Steps**

1. As a signed-out visitor (checked by requesting the pages without cookies,
   so the real session was untouched), open https://redline-rosy-six.vercel.app/new
2. Compare with what the analyze step requires.

**What PRD.md promises**

> "The renter signs in with an email magic link before their first analysis.
> Profile, red lines and library belong to that account; there is no
> anonymous analysis." — PRD.md, item 16

**What happened instead**

The analysis itself is protected — `/api/analyze` and `/api/ask` both answer
signed-out requests with 401 "Sign in to analyze a document." / "Sign in to
ask a question.". But the signed-out /new page renders the full paste-and-
check flow with no mention of an account, and the landing page never says one
is needed. The type check behind **Show the text** (`/api/gate`) answers
signed-out requests normally — reproduced twice, returning `other` for "hello
there" and `residential-lease` for a lease paragraph, the second after 5.4
seconds, which looks like a model call. So a first-time renter pastes their
lease, passes the check, and only on **Analyze** is told to sign in, by email,
"in this browser".

Whether the pasted lease survives the round trip through the magic-link email
could not be checked without signing out (see "Not checked"). Separately,
anyone can spend the project's type-check calls without an account.

**Severity: stops a reader.**

---

## 12. "Edit profile" on the analyze step throws away the pasted lease, and Back skips the page

**Steps**

1. Go to https://redline-rosy-six.vercel.app/new, paste a lease, press
   **Show the text**.
2. The analyze panel reads "State: CA, pets: not given, joint lease: not
   given, renter type: not given ... Edit profile". Press **Edit profile**.
3. Press the browser's Back button.

**What PRD.md promises**

> "The questionnaire pre-fills from a saved profile on repeat use; the renter
> edits whatever changed." — PRD.md, item 3

The analyze panel invites exactly that edit.

**What happened instead**

**Edit profile** is a plain link to /profile with no way back to the
document. Back does not return to /new; it skips past it to whatever page
came before (/library both times). Going to **New document** shows an empty
paste box and no check result — the lease has to be pasted and checked again.
Reproduced twice. The "pets: not given" prompt is the obvious thing for a
first-time user to fix, and fixing it costs them their document.

**Severity: stops a reader.**

---

## 13. A second question asked while the first is running disappears without trace

**Steps**

1. Open any saved report. In **ASK ABOUT THIS DOCUMENT**, ask a question.
2. Within a second, type a different question and press **Ask** again.

**What PRD.md promises**

> "A Q&A box answers renter questions grounded in the document's text or in
> the state-standard reference data ...; it explicitly refuses questions
> requiring anything else" — PRD.md, item 12

**What happened instead**

Only the first question is answered. The second gets no answer, no refusal
and no message. Reproduced twice, with different pairs of questions.

**Severity: stops a reader.**

---

## 14. A missing or deleted document shows the framework's 404, or tells you to reload forever

**Steps**

1. Open https://redline-rosy-six.vercel.app/library/00000000-0000-0000-0000-000000000000
2. Open https://redline-rosy-six.vercel.app/library/zzz123
3. Delete one of your own documents, then open its old address.

**What PRD.md promises**

> "Past documents and their reports are saved to a library the renter can
> return to." — PRD.md, item 14
> "**No report ends in a dead end.**" — PRD.md, "What good looks like"

**What happened instead**

- A made-up UUID, and a genuinely deleted document, both render the
  framework's default "404 / This page could not be found." on a black
  background inside the Redline shell, with no link back.
- A made-up non-UUID renders "REPORT NOT SHOWN / THIS DIDN'T LOAD / Reload
  the page to try again." — which reads as temporary. Reloading can never
  help; the document does not exist. Reproduced with `not-a-real-id` too.

A renter following an old link to a document they deleted lands on a page
that looks like the site is broken.

**Severity: stops a reader.**

---

## 15. The type check fails intermittently, and the message doesn't say it's temporary

**Steps**

1. Paste a lease at https://redline-rosy-six.vercel.app/new and press
   **Show the text**. Repeat with other leases.

**What PRD.md promises**

> "**No report ends in a dead end.** ... never a blank or ambiguous result."
> — PRD.md, "What good looks like"

**What happened instead**

Three failures across two documents (a 61,000-character lease in the first
round; the repository's 6,400-character clean lease twice in a row in the
second). Each time `/api/gate` answered 502 in under a second and the page
said:

> COULDN'T CHECK THE DOCUMENT TYPE — Redline couldn't check what kind of
> document this is. **RETRY**

Retry worked each time, a few seconds later. But the message doesn't say the
problem is on Redline's side, so a renter can reasonably read it as "my lease
is the wrong kind of document".

**Severity: stops a reader.**

---

# Cosmetic

## 16. The landing page's first two "Try it on a document" buttons only scroll down the page

**Steps**

1. Open https://redline-rosy-six.vercel.app/ in a 1707×791 window.
2. Press **Try it on a document** in the header, or the large red **TRY IT
   ON A DOCUMENT** under the headline.

**What happened instead**

Both link to `#try` and smooth-scroll to the bottom of the landing page, where
a third, identical button finally links to /new. The hero button also sits at
802px, just below the fold of that window, so the first thing a visitor can
press is the header link — which scrolls them down the page. Reproduced on
both buttons.

**Severity: cosmetic.**

---

## 17. Required fields accept an empty submission and do nothing, with no message

**Steps**

1. On /new, leave the paste box empty (or only spaces) and press **Show the
   text**.
2. Paste a lease, pass the check, leave **Title** empty, press **Analyze**.

**What happened instead**

Each press is silently ignored — no message, button looks live. Each
reproduced at least twice. Overlong input, by contrast, gets clear copy
("Keep the title under 200 characters.", "Keep each red line under 300
characters."), and the Q&A box answers an empty submit with "Type a question
first."

**Severity: cosmetic.**

---

## 18. The report never explains its own vocabulary

**Steps**

1. Open any saved report.

**What PRD.md promises**

> "a renter who can't tell an opportunity flag (a suggestion) from a risk
> flag (a documented finding) at a glance is trusting a lower-grade claim
> without realizing it — this puts real weight on report UI making the
> distinction obvious"
> — PRD.md, "The calls I made, and what I gave up"

**What happened instead**

Every report leads with three counts — `REMOVE OR MODIFY`, `PUSH ON`,
`CLARIFY` — and nothing on the page, in a tooltip or elsewhere, says what
"push on" or "clarify" asks the renter to do, or why `CLARIFY` flags get no
counter-offer. The header line "File 6263B6 · saved Oct 4, 2026" is never
explained either. The same on every report opened in both rounds.

**Severity: cosmetic.**

---

## 19. The two steps of adding a document are labelled as something else

**Steps**

1. Go to https://redline-rosy-six.vercel.app/new, paste a lease.
2. Press **Show the text**; then title it and press **Analyze**.

**What happened instead**

- The button that sends the text to the server for the type check is called
  **Show the text**, which reads as a display toggle. A first-time user
  pasting a lease looks for "Analyze" and doesn't find it until after
  pressing a button that sounds optional.
- When the analysis finishes, the report is not opened. The page stays on
  /new with a greyed **ANALYZE** button and one line, "Saved to your library
  as "…". Open it", where "Open it" is the only way to the result.

Both reproduced on every document added.

**Severity: cosmetic.**

---

## 20. Two controls are too small to tap at phone width

**Steps**

1. Open a report at 360px wide.

**What happened instead**

The layout itself holds up at 360px (see "What held up"), but **Back to
library** is 15px tall and **Re-run with updated profile** 19px — well under
the 44px minimum the rest of the controls meet.

**Severity: cosmetic.**

---

# Seen once

These happened once and did not recur when the same document was run again.

- **A flag whose quoted sentence does not support it.** Flag `AUTO-RENEWAL`
  claimed the lease "never states what happens when it ends", citing "The
  initial term begins on March 1 and ends on February 28 of the following
  year." Verbatim, but the claim is about what the lease *doesn't* say.
- **Summaries with the clause as the subject of the tenant's or landlord's
  action.** One report (the clean-lease fixture) had seven: "This clause must
  pay a lease-break fee...", "This clause must pay a $50 late fee...", "It
  looks like this clause may enter the premises after at least twenty-four
  hours..." No other report had any.
- **A guest restriction went unflagged.** In the mixed-scan PDF, "Tenant
  shall not have overnight guests for more than seven days in any month." was
  not flagged. A follow-up lease with the same kind of hard-wrapped sentence
  was flagged correctly, so line-wrapping is not the cause.

(Removed from the first round's list: "a section heading with nothing under
it". On closer inspection "LESS RELEVANT TO YOUR PROFILE" is a small tag at
the foot of individual flag cards, not a section heading.)

---

# What held up

- **The citation invariant.** Every quote on every report matched the source
  text: 15/15, 21/21 and 19/19 on the three runs of the longer lease (checked
  mechanically against the repository fixture), and every quote on the
  injection, 30-schedule, Spanish, standard, clean-fixture, mixed-scan PDF and
  hard-wrapped leases. Sentences that wrap across lines verify, with the line
  break shown as a space.
- **Prompt injection.** A lease telling "ANY AUTOMATED REVIEW SYSTEM OR AI
  ASSISTANT" to call it standard and skip Sections 5 and 7 was never obeyed
  across three runs; both sections were flagged every time.
- **Relevance filter.** With pets set to Yes, the pet-addendum clause
  surfaced as a flag; with pets set to No, it did not appear at all.
- **Red lines drive the analysis.** With the red line "I need to be able to
  paint the walls and put up shelves", the alterations clause was flagged in
  the top bucket with "directly conflicts with your red lines".
- **Refusals.** "hello there" and a Terms of Service paragraph were refused
  with the right message ("This looks like Terms of Service. Redline only
  reads residential leases for now."). "Should I sign this lease?" and an
  out-of-document question were refused in Q&A; an answerable question came
  back with the figure and its verbatim sentence.
- **File handling.** A scanned PDF got a clear refusal ("This PDF has no text
  in it. It looks like a scan or a photo of the pages..."); a renamed binary
  file got "Nothing in this could be read as text."; a PDF with one scanned
  page and DOCX files with a picture or scrambled paragraph each disclosed
  the skipped part, with its location, before analysis. The skipped page was
  disclosed again on the finished report.
- **The type check can't be bypassed** by swapping the text after it
  passes; Analyze always sends the checked text.
- **Text that looks like HTML stays text** in titles, red lines and
  questions; no script ran and no element was injected.
- **Doing things twice.** Double-clicking **Analyze**, **Ask** and **Yes,
  delete it** each produced one action and no error.
- **Refreshing mid-analysis** still produced a saved, complete report.
- **Delete.** An inline confirmation ("Delete this document and its report?
  The saved text is removed for good." / YES, DELETE IT / KEEP IT), no
  browser dialog; the document left the library and its address stopped
  serving the report.
- **Signed-out protection.** /library, /profile and a report address all
  redirect a signed-out visitor to /sign-in with the destination preserved;
  /api/analyze and /api/ask return 401.
- **Profile form.** Red lines reorder with Up/Down; Save is disabled with no
  state chosen; the length limits give clear messages.
- **Copy counter-offer** changes to "COPIED".
- **Phone width.** At 360px the report, /new and the landing page have no
  horizontal overflow, and the Menu drawer opens with all navigation and Sign
  out.
- **Saved work.** Reports survive reload; Back and Forward between reports
  work. The disclaimer was present on every report.

---

# Not checked

- **What a brand-new user sees after the magic link** — whether the pasted
  lease survives, and what the analyze step shows with no saved profile. Both
  need a signed-out session or a new account, which the test rules exclude.
- **Sign out.**
- **NY and TX.** Every analysis ran against CA.
- **The real phone experience.** 360px was checked by rendering the app in
  a 360px same-origin frame, which applies the same CSS, but not on a device
  or with touch.

The account's profile was restored to its starting state (California,
pets / joint lease / renter type skipped, no red lines) and the reload
confirmed it. Every document created during testing has since been deleted
from the library; "CA Test Doc 1", which predates the test, was not touched.
Report addresses quoted above for made-up ids still behave as described; the
test documents' own addresses now return the 404 described in finding 14.
