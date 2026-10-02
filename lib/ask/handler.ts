/**
 * Request handling for `/api/ask`, kept apart from Next's route file so it
 * can be tested with a plain `Request` and an injected session, store and
 * answer function.
 *
 * The body is exactly `{ documentId, question }`. Lease text never comes
 * from the browser: it is read from the stored row, so an answer is always
 * checked against the same text the report was (ADR 0001, ADR 0008).
 */

import { verifyCitation } from "../analysis/citation";
import { DOCUMENT_ID_PATTERN } from "../documents/analyze-handler";
import type { DocumentStore } from "../documents/types";
import { defaultBlockerLogger, type BlockerLogger } from "../library/load";
import type { CallModelDeps } from "../openrouter";
import { answerQuestion, type QaResult, type RenterProfile } from "../qa-engine";
import { getStateStandard, type StateStandard } from "../state-standards";

import { MAX_QUESTION_CHARS } from "./limits";

export { MAX_QUESTION_CHARS };

export type AnswerFn = (
  text: string,
  stateStandard: StateStandard | undefined,
  profile: RenterProfile,
  question: string,
) => Promise<QaResult>;

export interface AskHandlerDeps {
  /** The signed-in user, or null. */
  getUser: () => Promise<{ id: string } | null>;
  store: DocumentStore;
  /** Injectable so tests never call a model. Defaults to the Q&A engine. */
  answer?: AnswerFn;
  /** Used only when `answer` isn't given. */
  engine?: CallModelDeps;
  logger?: BlockerLogger;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const ASK_FAILED = "That question didn't get an answer. Try again.";

export type ParsedAsk = { ok: true; documentId: string; question: string } | { ok: false; error: string };

export function parseAskBody(body: unknown): ParsedAsk {
  if (!isPlainObject(body)) return { ok: false, error: "Send a JSON object." };
  const keys = Object.keys(body);
  if (keys.length !== 2 || !keys.includes("documentId") || !keys.includes("question")) {
    return { ok: false, error: "Send only a document id and a question." };
  }
  const { documentId, question } = body;
  if (typeof documentId !== "string" || !DOCUMENT_ID_PATTERN.test(documentId)) {
    return { ok: false, error: "Send only the id of a saved document." };
  }
  if (typeof question !== "string" || question.trim() === "") {
    return { ok: false, error: "Type a question first." };
  }
  const trimmed = question.trim();
  if (trimmed.length > MAX_QUESTION_CHARS) {
    return { ok: false, error: `Keep the question under ${MAX_QUESTION_CHARS} characters.` };
  }
  return { ok: true, documentId, question: trimmed };
}

export async function handleAskRequest(request: Request, deps: AskHandlerDeps): Promise<Response> {
  const log = deps.logger ?? defaultBlockerLogger;

  const user = await deps.getUser();
  if (!user) return json({ error: "Sign in to ask a question.", code: "signed-out" }, 401);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ error: "Body must be JSON.", code: "bad-request" }, 415);
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Body must be JSON.", code: "bad-request" }, 400);
  }
  const parsed = parseAskBody(raw);
  if (!parsed.ok) return json({ error: parsed.error, code: "bad-request" }, 400);

  let doc;
  try {
    doc = await deps.store.get(user.id, parsed.documentId);
  } catch {
    return json({ error: "This document didn't load. Try again.", code: "load-failed" }, 500);
  }
  if (!doc) return json({ error: "That document isn't in your library.", code: "not-found" }, 404);

  const profile = doc.profileSnapshot;
  const answer: AnswerFn =
    deps.answer ?? ((t, s, p, q) => answerQuestion(t, s, p, q, deps.engine ?? {}));

  let result: QaResult;
  try {
    result = await answer(doc.extractedText, getStateStandard(profile.state), profile, parsed.question);
  } catch {
    return json({ error: ASK_FAILED, code: "ask-failed" }, 502);
  }

  if (result.kind === "refusal") {
    // The engine reports an unverifiable quote or an unreadable model reply
    // as a refusal. Neither is a boundary the renter hit: the model failed,
    // so the box must offer a retry rather than show a refusal.
    if (result.reason === "citation-could-not-be-verified") {
      log("Q&A answer dropped: quoted sentence not found in stored text", {
        documentId: doc.id,
        reason: result.reason,
      });
      return json({ error: ASK_FAILED, code: "ask-failed" }, 502);
    }
    if (result.reason === "model-response-invalid") {
      return json({ error: ASK_FAILED, code: "ask-failed" }, 502);
    }
    return json({ kind: "refusal", reason: result.reason, text: result.text }, 200);
  }

  const quotes = result.sourceSentences ?? [];
  if ((result.groundedIn === "document" || result.groundedIn === "both") && quotes.length === 0) {
    log("Q&A answer dropped: document-grounded answer quotes nothing", { documentId: doc.id });
    return json({ error: ASK_FAILED, code: "ask-failed" }, 502);
  }
  const bad = quotes.filter((q) => !verifyCitation(q, doc.extractedText, doc.sections));
  if (bad.length > 0) {
    log("Q&A answer dropped: quoted sentence not found in stored text", {
      documentId: doc.id,
      quoteCount: bad.length,
    });
    return json({ error: ASK_FAILED, code: "ask-failed" }, 502);
  }

  return json(
    {
      kind: "answer",
      text: result.text,
      groundedIn: result.groundedIn,
      sourceSentences: quotes,
    },
    200,
  );
}
