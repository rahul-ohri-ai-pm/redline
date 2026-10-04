# Redline

**Read your lease before you sign it.**

Live: https://redline-rosy-six.vercel.app

> **Status: work in progress.** This is my capstone project for a
> product-management course that is still running, and it is being built in
> the open. The product works end to end today, and there is a list of known
> defects below that I found myself and have not fixed yet. Do not treat
> anything it says as legal advice.

## The problem

A renter about to sign a residential lease has two options. Read it closely
against no baseline, which is slow and misses the terms that matter, or pay a
lawyer. Lease review runs $200 to $2,000 and averages around $660 flat, which
puts it out of reach for the renter who has the least bargaining power and the
most to lose.

Redline is built for the renter who is going to sign anyway and wants to know
what they are accepting, and which of it is worth raising.

## What it does

- **Risk-ranked clauses.** Each flag is ranked by how much it affects you
  specifically and how one-sided it is on its own terms.
- **Every flag cites its source sentence,** quoted verbatim from your
  document. This is enforced in code, not promised in a prompt.
- **One action per flag:** clarify, push on, or remove and modify.
- **A drafted counter-offer** for each flagged clause.
- **A Q&A box** that answers only from your document or from state-standard
  reference data, and refuses anything it cannot ground.
- **Your own red lines** drive the analysis. Set them once, reorder them, and
  the report ranks against them.
- **A saved library** of past documents, re-runnable against an updated
  profile.

Your file is parsed in the browser. Only the extracted text reaches the
server. The original file is never uploaded or stored.

## What has been verified

| Check | Result |
|---|---|
| Verbatim citation on every flag, checked mechanically against the source text | 15/15, 21/21 and 19/19 across three runs of a long lease, and every flag on seven other documents |
| A lease containing instructions aimed at "any automated review system or AI assistant", telling it to call the lease standard and skip two sections | Ignored on all three runs. Both sections flagged every time |
| Relevance filter (pets set to yes vs no) | Pet clause appears and disappears as expected |
| Grounding refusals in Q&A ("should I sign this?", out-of-document questions) | Refused with a clear reason |
| Unreadable input (scanned PDF, renamed binary, partial extraction) | Refused or disclosed with the location of the skipped part |
| Automated test suite | 254 passing |

## Known defects

Found in a two-round pass over thirteen documents through the browser. The
full list with reproduction steps is in [FINDINGS.md](FINDINGS.md).

- **The same lease, with an unchanged profile, does not produce the same
  report twice.** One run gave eight flags, the next gave five, and a
  right-of-entry clause moved from "remove or modify" to "clarify". This is
  the next thing I am fixing, and it needs a measurement before it needs a
  patch.
- Some flags state legal conclusions the document text does not support.
- Counter-offer drafts are often generic, and occasionally answer a different
  clause than the one flagged.
- Only California, New York and Texas have state-standard data, and nothing
  says so until after sign-in. A lease from outside the United States is still
  read against California rules.
- No lease has ever come back "largely standard", and opportunity flags have
  never fired, so the low-risk path is effectively untested.

## Why the defect list is in the README

The product's own documents commit to an accuracy standard that the model's
judgment has not been measured against yet. `PRODUCT.md` says so directly:
whether the right clauses get flagged, and bucketed correctly, is open. A
legal-adjacent tool that hides that is worse than one that prints it.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 254 tests
npm run typecheck
npm run smoke      # end-to-end path, needs the env below
```

Four settings are needed, in `.env.local` for local work and on Vercel for
production. No values live in this repo.

| Variable | Reaches the browser |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes, not secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes, not secret |
| `OPENROUTER_API_KEY` | no, server only |
| `OPENROUTER_MODEL` | no, server only |

Database schema is in `supabase/migrations`.

## Stack

Next.js on Vercel. Supabase for auth and Postgres with row-level security.
Model access through OpenRouter. PDF and DOCX parsing in the browser via
`pdfjs-dist` and `mammoth`.

## How it was built

Specced first, then built with AI coding agents against that spec. The
product thinking lives in `PRODUCT.md` and `PRD.md`, the decisions in
`docs/adr/` as ten architecture decision records, and the build itself in
nineteen written tickets under `.scratch/red-line/issues/`. `FINDINGS.md` is
the skeptical pass over the result.

## What is next

1. Measure the run-to-run variance in the known defects list, publish the
   number, fix it, publish the delta.
2. An eval set of labeled leases with an accuracy target, so "did it flag the
   right clauses" has an answer.
3. Fix the overreaching flags and the generic counter-offers.
4. State the three-state scope before sign-in, not after.

## Not legal advice

Redline is an analysis tool. It does not practice law, does not know your
circumstances, and can be wrong in the ways listed above. Decisions about a
contract you are signing should involve a lawyer.
