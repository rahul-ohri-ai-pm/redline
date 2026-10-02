/**
 * Browser side of the gate: posts the extracted text, and only the text, to
 * `/api/gate`. Any failure becomes an `error` outcome, never a pass.
 */

import { isDocumentType, type GateOutcome } from "./types";

export type GateFetch = (
  input: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export const GATE_ERROR_MESSAGE =
  "Redline couldn't check what kind of document this is.";

export async function requestGate(
  text: string,
  fetchFn: GateFetch = (input, init) => fetch(input, init)
): Promise<GateOutcome> {
  try {
    const res = await fetchFn("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { status: "error", message: GATE_ERROR_MESSAGE };
    const body = (await res.json()) as { documentType?: unknown } | null;
    const type = body?.documentType;
    if (!isDocumentType(type)) {
      return { status: "error", message: GATE_ERROR_MESSAGE };
    }
    return type === "residential-lease"
      ? { status: "pass", documentType: type }
      : { status: "refused", documentType: type };
  } catch {
    return { status: "error", message: GATE_ERROR_MESSAGE };
  }
}
