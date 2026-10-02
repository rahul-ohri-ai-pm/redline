/**
 * Browser side of analysis: posts the extracted text, its sections and the
 * title to `/api/analyze`, and nothing else. Never a file.
 */

import type { Section } from "../analysis/types";
import { buildAnalyzeBody } from "./body";

export type AnalyzeFetch = (
  input: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export type AnalyzeResult =
  | { status: "saved"; id: string; title: string }
  | { status: "signed-out" }
  | { status: "no-profile" }
  | { status: "refused"; documentType: string }
  | { status: "error"; message: string };

export const ANALYZE_ERROR_MESSAGE = "The analysis didn't finish. Nothing was saved. Try again.";

export async function requestAnalysis(
  input: { text: string; sections: Section[]; title: string },
  fetchFn: AnalyzeFetch = (url, init) => fetch(url, init),
): Promise<AnalyzeResult> {
  try {
    const res = await fetchFn("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildAnalyzeBody(input)),
    });
    const body = (await res.json().catch(() => null)) as {
      id?: unknown;
      title?: unknown;
      error?: unknown;
      code?: unknown;
      documentType?: unknown;
    } | null;
    if (res.ok && typeof body?.id === "string") {
      return { status: "saved", id: body.id, title: typeof body.title === "string" ? body.title : "" };
    }
    if (res.status === 401) return { status: "signed-out" };
    if (body?.code === "no-profile") return { status: "no-profile" };
    if (body?.code === "refused" && typeof body.documentType === "string") {
      return { status: "refused", documentType: body.documentType };
    }
    return {
      status: "error",
      message: typeof body?.error === "string" ? body.error : ANALYZE_ERROR_MESSAGE,
    };
  } catch {
    return { status: "error", message: ANALYZE_ERROR_MESSAGE };
  }
}

/** "lease.final.pdf" becomes "lease.final". Pasted text has no file name. */
export function titleFromFileName(name: string | null): string {
  if (!name) return "";
  const base = name.replace(/^.*[\\/]/, "");
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return stem.trim();
}
