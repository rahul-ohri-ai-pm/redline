/**
 * Request handling for `/api/analyze`, kept apart from Next's route file so
 * it can be tested with a plain `Request` and injected session, stores and
 * model.
 *
 * The body is JSON with exactly three fields: `text`, `sections` and
 * `title`. There is no file field and no multipart path: the original file
 * is parsed in the browser and never reaches this route. The renter's
 * profile and red lines are read from their saved profile on the server, so
 * what ran is what the profile screen shows.
 */

import type { AnalyzeDocumentDeps } from "../analysis-engine";
import { analyzeDocument } from "../analysis-engine";
import { verifyCitation } from "../analysis/citation";
import type { RenterProfile, Section } from "../analysis/types";
import { runAnalysisIfLease, type GatedAnalysisDeps } from "../gate/run";
import { toRenterProfile } from "../profile/mapper";
import type { ProfileStore } from "../profile/types";
import { buildAnalyzeBody, type AnalyzeRequestBody } from "./body";
import type { DocumentStore } from "./types";

export { buildAnalyzeBody, type AnalyzeRequestBody };

export const MAX_TEXT_CHARS = 400_000;
export const MAX_TITLE_CHARS = 200;
const MAX_SECTIONS = 5_000;

const ALLOWED_KEYS = ["text", "sections", "title"] as const;

export interface AnalyzeUser {
  id: string;
}

export interface AnalyzeHandlerDeps {
  /** The signed-in user, or null. */
  getUser: () => Promise<AnalyzeUser | null>;
  documents: DocumentStore;
  profiles: ProfileStore;
  /** Gate and engine, injectable so tests never call a model. */
  gate?: GatedAnalysisDeps;
  /** Used only when `gate.analyze` isn't given. */
  engine?: AnalyzeDocumentDeps;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Control characters other than tab, newline and carriage return. A NUL or
// similar in the text means binary data, not extracted text.
// eslint-disable-next-line no-control-regex
const BINARY_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasOnlyKeys(obj: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(obj).every((k) => keys.includes(k));
}

function parseSections(value: unknown): Section[] | null {
  if (!Array.isArray(value) || value.length > MAX_SECTIONS) return null;
  const out: Section[] = [];
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.id !== "string" || item.id === "") return null;
    if (item.readable === true) {
      if (!hasOnlyKeys(item, ["id", "text", "readable"])) return null;
      if (typeof item.text !== "string" || BINARY_CHARS.test(item.text)) return null;
      out.push({ id: item.id, text: item.text, readable: true });
    } else if (item.readable === false) {
      if (!hasOnlyKeys(item, ["id", "text", "readable", "reason"])) return null;
      if (item.text !== null || typeof item.reason !== "string") return null;
      out.push({ id: item.id, text: null, readable: false, reason: item.reason });
    } else {
      return null;
    }
  }
  return out;
}

export type ParsedBody =
  | { ok: true; value: AnalyzeRequestBody }
  | { ok: false; error: string };

export function parseAnalyzeBody(body: unknown): ParsedBody {
  if (!isPlainObject(body)) return { ok: false, error: "Send a JSON object." };
  if (!hasOnlyKeys(body, ALLOWED_KEYS)) {
    return { ok: false, error: "Only text, sections and title are accepted." };
  }
  const { text, sections, title } = body;
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, error: "The document text is missing." };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return { ok: false, error: "That document is too long to analyze." };
  }
  if (BINARY_CHARS.test(text)) {
    return { ok: false, error: "That doesn't look like extracted text." };
  }
  const parsedSections = parseSections(sections);
  if (!parsedSections) return { ok: false, error: "The sections are malformed." };
  if (typeof title !== "string") return { ok: false, error: "Give the document a title." };
  const cleanTitle = title.replace(/\s+/g, " ").trim();
  if (cleanTitle === "") return { ok: false, error: "Give the document a title." };
  if (cleanTitle.length > MAX_TITLE_CHARS) {
    return { ok: false, error: `Keep the title under ${MAX_TITLE_CHARS} characters.` };
  }
  return { ok: true, value: { text, sections: parsedSections, title: cleanTitle } };
}

/** The id shape of a saved document. Anything else is rejected before a lookup. */
export const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

function analyzeFn(deps: AnalyzeHandlerDeps): NonNullable<GatedAnalysisDeps["analyze"]> {
  return deps.gate?.analyze ?? ((t, s, p) => analyzeDocument(t, s, p, deps.engine ?? {}));
}

const RERUN_UNCHANGED = "The re-run failed. Your earlier report is unchanged. Try again in a minute.";

/**
 * Re-run mode: the body is `{ documentId }` and nothing else. The stored
 * text and sections are analyzed again against the renter's current saved
 * profile and red lines, and the report and profile snapshot on the same
 * row are replaced. No history is kept.
 *
 * The document-type gate is skipped on purpose: the stored text was gated
 * when it was first saved, and it has not changed since. Nothing the
 * browser sends can supply text here.
 */
async function handleRerun(
  raw: Record<string, unknown>,
  userId: string,
  deps: AnalyzeHandlerDeps,
): Promise<Response> {
  if (
    !hasOnlyKeys(raw, ["documentId"]) ||
    typeof raw.documentId !== "string" ||
    !DOCUMENT_ID_PATTERN.test(raw.documentId)
  ) {
    return json({ error: "Send only the id of a saved document." }, 400);
  }
  const id = raw.documentId;

  let doc;
  try {
    doc = await deps.documents.get(userId, id);
  } catch {
    return json({ error: "This document didn't load. Try again.", code: "load-failed" }, 500);
  }
  if (!doc) return json({ error: "That document isn't in your library.", code: "not-found" }, 404);

  let profile: RenterProfile;
  try {
    const saved = await deps.profiles.load(userId);
    if (!saved) {
      return json(
        { error: "Save your profile first so Redline knows your state.", code: "no-profile" },
        409,
      );
    }
    profile = toRenterProfile(saved);
  } catch {
    return json({ error: "Your saved profile didn't load. Try again.", code: "profile-failed" }, 500);
  }

  let report;
  try {
    report = await analyzeFn(deps)(doc.extractedText, doc.sections, profile);
  } catch {
    return json({ error: RERUN_UNCHANGED, code: "analysis-failed" }, 502);
  }
  // The engine already drops flags it can't cite. This is a second check on
  // the same invariant before anything is written over the old report.
  for (const flag of report.riskFlags) {
    if (!verifyCitation(flag.sourceSentence, doc.extractedText, doc.sections)) {
      return json({ error: RERUN_UNCHANGED, code: "analysis-failed" }, 502);
    }
  }

  try {
    const ok = await deps.documents.update(userId, id, { report, profileSnapshot: profile });
    if (!ok) return json({ error: "That document isn't in your library.", code: "not-found" }, 404);
    return json({ id: doc.id, title: doc.title }, 200);
  } catch {
    return json(
      { error: "The re-run finished but didn't save. Your earlier report is unchanged. Try again.", code: "save-failed" },
      500,
    );
  }
}

export async function handleAnalyzeRequest(
  request: Request,
  deps: AnalyzeHandlerDeps,
): Promise<Response> {
  const user = await deps.getUser();
  if (!user) return json({ error: "Sign in to analyze a document.", code: "signed-out" }, 401);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ error: "Send JSON with the extracted text, not a file." }, 415);
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }
  if (isPlainObject(raw) && "documentId" in raw) {
    return handleRerun(raw, user.id, deps);
  }
  const parsed = parseAnalyzeBody(raw);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { text, sections, title } = parsed.value;

  let profile: RenterProfile;
  try {
    const saved = await deps.profiles.load(user.id);
    if (!saved) {
      return json(
        { error: "Save your profile first so Redline knows your state.", code: "no-profile" },
        409,
      );
    }
    profile = toRenterProfile(saved);
  } catch {
    return json({ error: "Your saved profile didn't load. Try again.", code: "profile-failed" }, 500);
  }

  const gateDeps: GatedAnalysisDeps = { ...deps.gate, analyze: analyzeFn(deps) };

  let result;
  try {
    result = await runAnalysisIfLease(text, sections, profile, gateDeps);
  } catch {
    return json({ error: "The analysis failed. Try again in a minute.", code: "analysis-failed" }, 502);
  }
  if (result.status === "error") {
    return json({ error: result.message, code: "gate-failed" }, 502);
  }
  if (result.status === "refused") {
    return json(
      { error: "Redline only reads residential leases for now.", code: "refused", documentType: result.documentType },
      422,
    );
  }

  try {
    const saved = await deps.documents.insert(user.id, {
      title,
      extractedText: text,
      sections,
      profileSnapshot: profile,
      report: result.report,
    });
    return json({ id: saved.id, title: saved.title }, 201);
  } catch {
    return json({ error: "The analysis finished but didn't save. Try again.", code: "save-failed" }, 500);
  }
}
