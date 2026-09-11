# Redline

Reads a contract, lease, freelance agreement, or terms of service and returns:
plain-English summary, risk-ranked clauses each citing the exact source
sentence, a drafted counter-offer per flagged clause, a Q&A box that answers
only from the document or state-standard reference data, an editable list
of the user's own red lines that drives the analysis, and a saved library
of past documents.

## Stack (settled, do not reconsider)

- Next.js, deployed on Vercel.
- Supabase for auth and database.
- Model access goes through OpenRouter, never a provider SDK directly.
- The uploaded file is parsed client-side, in the browser. Only extracted
  text is ever sent to the server or stored — never the original file.

## The one invariant

Every risk flag must cite the exact sentence it came from, verbatim from the
parsed text. A flag that cannot show its source sentence is a bug, not an
edge case — treat it as a blocker, not a follow-up.

## Scope

Build exactly the capabilities listed above and stop. If an implementation
step suggests an obvious "next feature" not on that list, ask before adding
it rather than building it.

Excluded on purpose, do not add even as a stub: payments/billing, OCR for
scanned documents, sharing a document between users. OCR is excluded because
a citation pointing at misread text is worse than no citation — it would
undermine the one invariant above, not just be out of scope.

## Rules

- Never state anything the document text doesn't support. If the text
  doesn't say it, the product doesn't claim it — this applies to summaries,
  flags, and counter-offers. Q&A answers may also draw on state-standard
  reference data (deposit caps, notice-period minimums, and similar), but
  must refuse anything requiring more than that or the document text.
- Secrets live only in `.env.local`. Never commit a key — treat any key that
  touches git history as already compromised and needing rotation.
- Ask before adding a dependency.
- All copy a user reads in this product, meaning the landing page, UI
  labels, error messages and empty states, has to be run through the
  humanizer skill before it is committed. Copy that reads as though a
  model wrote it is a defect, not a matter of taste.

## Before deciding what to build

- `research/summary.md` — user research findings; read before deciding what
  the product should do.
- `PRD.md` (once it exists) — the brief; read before building anything.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` at the repo root + `docs/adr/`. See `docs/agents/domain.md`.
