/**
 * Browser side of the Q&A box: posts a document id and a question to
 * `/api/ask`, and nothing else. A failed call is `error`, never `refusal`.
 */

import type { GroundedIn, RefusalReason } from "../qa-engine";

export type AskFetch = (
  input: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export type AskResult =
  | { status: "answer"; text: string; groundedIn: GroundedIn; sourceSentences: string[] }
  | { status: "refusal"; reason: RefusalReason; text: string }
  | { status: "signed-out" }
  | { status: "error"; message: string };

export const ASK_ERROR_MESSAGE = "That question didn't get an answer. Try again.";

export async function requestAnswer(
  documentId: string,
  question: string,
  fetchFn: AskFetch = (url, init) => fetch(url, init),
): Promise<AskResult> {
  try {
    const res = await fetchFn("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, question }),
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* fall through to the generic error */
    }
    const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    if (res.status === 401) return { status: "signed-out" };
    if (res.ok && d.kind === "answer" && typeof d.text === "string" && Array.isArray(d.sourceSentences)) {
      return {
        status: "answer",
        text: d.text,
        groundedIn: d.groundedIn as GroundedIn,
        sourceSentences: d.sourceSentences.filter((s): s is string => typeof s === "string"),
      };
    }
    if (res.ok && d.kind === "refusal" && typeof d.text === "string") {
      return { status: "refusal", reason: d.reason as RefusalReason, text: d.text };
    }
    return { status: "error", message: typeof d.error === "string" ? d.error : ASK_ERROR_MESSAGE };
  } catch {
    return { status: "error", message: ASK_ERROR_MESSAGE };
  }
}
