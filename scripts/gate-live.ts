/**
 * Optional live check of the document-type gate (`npx tsx scripts/gate-live.ts`).
 * Runs the real OpenRouter call on the gate fixtures. Skips with a message
 * when OPENROUTER_API_KEY is not set in .env.local. Not part of the test suite.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { classifyDocument } from "../lib/gate/classify";

const envPath = path.resolve(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    const k = t.slice(0, eq).trim();
    if (!(k in process.env)) process.env[k] = t.slice(eq + 1).trim();
  }
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("OPENROUTER_API_KEY is not set in .env.local; skipping the live gate check.");
    return;
  }
  const fx = path.resolve(__dirname, "..", "tests", "fixtures");
  for (const f of ["clean-lease.txt", "gate/freelance-agreement.txt", "gate/terms-of-service.txt", "gate/non-document.txt"]) {
    const r = await classifyDocument(readFileSync(path.join(fx, f), "utf8"));
    console.log(f.padEnd(34), JSON.stringify(r));
  }
}
void main();
