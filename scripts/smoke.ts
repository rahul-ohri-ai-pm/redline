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
}

main().catch((error) => {
  console.error("smoke: pipeline threw an error:", error);
  process.exitCode = 1;
});
