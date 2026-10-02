/**
 * Request handling for `/api/gate`, kept apart from Next's route file so it
 * can be tested with a plain `Request`. No session is required yet; sign-in
 * arrives in tickets 09 and 11.
 */

import { classifyDocument, type ClassifyDeps } from "./classify";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGateRequest(
  request: Request,
  deps: ClassifyDeps = {}
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ error: "Body must be a JSON object with a text field." }, 400);
  }
  const keys = Object.keys(body);
  const text = (body as Record<string, unknown>).text;
  if (keys.length !== 1 || keys[0] !== "text" || typeof text !== "string") {
    return json({ error: "Only a text field is accepted." }, 400);
  }
  if (text.trim() === "") {
    return json({ error: "Text is empty." }, 400);
  }

  const outcome = await classifyDocument(text, deps);
  if (outcome.status === "error") {
    return json({ error: outcome.message }, 502);
  }
  return json({ documentType: outcome.documentType }, 200);
}
