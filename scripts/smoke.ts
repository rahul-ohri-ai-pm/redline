/**
 * End-to-end smoke script (`npm run smoke`).
 *
 * Runs the fixture adhesion lease through the real `analyzeDocument`
 * pipeline — no stubbed model, the actual `lib/openrouter.ts` call — and
 * prints every risk flag with its source sentence, so a human can eyeball
 * that the citation invariant holds against a live model response.
 *
 * Requires `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` to be set (e.g. via
 * `.env.local`, loaded below). If they're absent, this prints a clear
 * message and exits non-zero rather than silently doing nothing.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { analyzeDocument } from "../lib/analysis-engine";
import { verifyCitation } from "../lib/analysis/citation";
import type { Report } from "../lib/analysis/types";
import { handleAskRequest } from "../lib/ask/handler";
import { createMemoryDocumentStore } from "../lib/documents/memory-store";

function loadEnvLocal(): void {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    console.error(
      "smoke: OPENROUTER_API_KEY and/or OPENROUTER_MODEL are not set — " +
        "cannot run the pipeline against a real model. Set them in .env.local and re-run."
    );
    process.exitCode = 1;
    return;
  }

  const fixturePath = path.resolve(__dirname, "..", "tests", "fixtures", "adhesion-lease.txt");
  const text = readFileSync(fixturePath, "utf8");

  console.log(`smoke: analyzing ${fixturePath} (${text.length} chars) against live model...`);

  const report = await analyzeDocument(text, [], { state: "CA" });

  console.log(`\nverdict: ${report.verdict}`);
  console.log(report.verdictMessage);
  console.log(`\ndisclaimer: ${report.disclaimer}`);
  console.log(`skippedSections: ${report.skippedSections.length}`);

  console.log(`\nriskFlags: ${report.riskFlags.length}`);
  let verifiedCount = 0;
  for (const flag of report.riskFlags) {
    const verified = verifyCitation(flag.sourceSentence, text, []);
    if (verified) verifiedCount += 1;
    console.log(`\n- [${flag.bucket}] (${flag.clauseType}, confidence: ${flag.confidence})`);
    console.log(`  summary: ${flag.summary}`);
    console.log(`  source sentence: "${flag.sourceSentence}"`);
    console.log(`  citation verified against fixture text: ${verified ? "YES" : "NO"}`);
    if ("counterOffer" in flag) {
      console.log(`  counter-offer: ${flag.counterOffer}`);
    }
  }

  console.log(`\nopportunityFlags: ${report.opportunityFlags.length}`);
  for (const opp of report.opportunityFlags) {
    console.log(`- ${opp.suggestion}`);
  }

  console.log(
    `\nsmoke: ${verifiedCount}/${report.riskFlags.length} risk flags survived citation verification.`
  );

  if (verifiedCount !== report.riskFlags.length) {
    console.error("smoke: FAILED — a risk flag with an unverified citation reached the report.");
    process.exitCode = 1;
  }

  await smokeAsk(text, report);
}

/**
 * Asks the fixture lease one answerable and one must-refuse question through
 * the real ask handler (same path as /api/ask) against the live model.
 * Fails on: an unverified quote, an error/refusal for the answerable
 * question, or an answer to the refusal question.
 */
async function smokeAsk(text: string, report: Report): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    console.log("\nsmoke: ask path skipped, OPENROUTER_API_KEY and/or OPENROUTER_MODEL are not set.");
    return;
  }

  const user = { id: "smoke-user" };
  const store = createMemoryDocumentStore();
  const doc = await store.insert(user.id, {
    title: "adhesion-lease.txt",
    extractedText: text,
    sections: [],
    profileSnapshot: { state: "CA" },
    report,
  });

  const ask = async (question: string): Promise<{ status: number; body: Record<string, unknown> }> => {
    const res = await handleAskRequest(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, question }),
      }),
      { getUser: async () => user, store },
    );
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  };

  const cases = [
    { question: "How much is the monthly convenience fee, and what is it for?", expect: "answer" },
    { question: "Should I sign this lease?", expect: "refusal" },
  ] as const;

  let failed = false;
  for (const c of cases) {
    console.log(`\nask (expect ${c.expect}): "${c.question}"`);
    const { status, body } = await ask(c.question);
    if (body.kind === "answer") {
      const quotes = (body.sourceSentences as string[] | undefined) ?? [];
      console.log(`  answer: ${body.text}`);
      console.log(`  grounded in: ${body.groundedIn}`);
      for (const q of quotes) {
        const ok = verifyCitation(q, text, []);
        if (!ok) failed = true;
        console.log(`  quote: "${q}"\n    verified: ${ok ? "YES" : "NO"}`);
      }
      if (quotes.length === 0) console.log("  quotes: none");
      if (c.expect !== "answer") {
        console.error("  FAILED: expected a refusal but got an answer.");
        failed = true;
      }
    } else if (body.kind === "refusal") {
      console.log(`  refusal (${body.reason}): ${body.text}`);
      if (c.expect !== "refusal") {
        console.error("  FAILED: expected an answer but got a refusal.");
        failed = true;
      }
    } else {
      console.error(`  FAILED: HTTP ${status}, code ${body.code}: ${body.error}`);
      failed = true;
    }
  }

  if (failed) {
    console.error("\nsmoke: ask path FAILED.");
    process.exitCode = 1;
  } else {
    console.log("\nsmoke: ask path OK (answer quotes verified, refusal refused).");
  }
}

main().catch((error) => {
  console.error("smoke: pipeline threw an error:", error);
  process.exitCode = 1;
});
