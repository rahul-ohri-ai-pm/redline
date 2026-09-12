/**
 * The single boundary through which Redline calls a model.
 *
 * Per CLAUDE.md's settled stack decision, model access goes through
 * OpenRouter's OpenAI-compatible chat-completions endpoint via a plain
 * `fetch` — never a provider SDK. No other module in this codebase should
 * call a model directly; the analysis engine and Q&A engine both call
 * `callModel` from here.
 *
 * `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are read from
 * `process.env` at call time, not at module load time, so importing this
 * module (and therefore booting the app) never fails when they're unset.
 * The failure only happens if `callModel` is actually invoked without them.
 */

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** A JSON Schema request for OpenRouter's `json_schema` response format. */
export interface JsonSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
}

export interface CallModelOptions {
  messages: ChatMessage[];
  /** When provided, requests strict json_schema-mode structured output. */
  jsonSchema?: JsonSchemaSpec;
}

/** The shape of `fetch` — the seam tests substitute a stub for. */
export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export interface CallModelDeps {
  /**
   * Injectable fetch-like function. Defaults to the global `fetch`.
   * Tests pass a stub here to avoid a real network call.
   */
  fetchFn?: FetchLike;
  /** Overrides `process.env.OPENROUTER_API_KEY`. Tests pass a fake key here. */
  apiKey?: string;
  /** Overrides `process.env.OPENROUTER_MODEL`. Tests pass a fake model id here. */
  model?: string;
}

/**
 * Thrown for every failure mode of `callModel`: missing config, network
 * failure, a non-2xx response from OpenRouter, or a response that doesn't
 * parse as the JSON the callers expect. Callers should never see a
 * swallowed failure — it's always one of these, thrown.
 */
export class OpenRouterError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "OpenRouterError";
    this.cause = cause;
  }
}

/**
 * Calls the model via OpenRouter and returns the parsed JSON content of
 * its response — never a raw HTTP response.
 *
 * Provider routing is pinned to Fireworks with no fallback, reasoning
 * effort is set to low, and the request asks for structured JSON output
 * (json_schema mode when `jsonSchema` is supplied, otherwise json_object
 * mode).
 */
export async function callModel(
  options: CallModelOptions,
  deps: CallModelDeps = {}
): Promise<unknown> {
  const fetchFn: FetchLike = deps.fetchFn ?? (fetch as unknown as FetchLike);
  const apiKey = deps.apiKey ?? process.env.OPENROUTER_API_KEY;
  const model = deps.model ?? process.env.OPENROUTER_MODEL;

  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not set. Set it in .env.local before calling the model."
    );
  }
  if (!model) {
    throw new OpenRouterError(
      "OPENROUTER_MODEL is not set. Set it in .env.local before calling the model."
    );
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages: options.messages,
    provider: {
      order: ["fireworks"],
      allow_fallbacks: false,
      require_parameters: true,
    },
    // Documented OpenRouter request field for normalized reasoning effort
    // across underlying providers. Assumption: if OpenRouter ever renames
    // this field, it's the one place in the codebase that needs updating.
    reasoning: { effort: "low" },
    response_format: options.jsonSchema
      ? {
          type: "json_schema",
          json_schema: {
            name: options.jsonSchema.name,
            strict: options.jsonSchema.strict ?? true,
            schema: options.jsonSchema.schema,
          },
        }
      : { type: "json_object" },
  };

  let response: Awaited<ReturnType<FetchLike>>;
  try {
    response = await fetchFn(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    throw new OpenRouterError("Network error calling OpenRouter.", err);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      // ignore — we still want to surface the status code below
    }
    throw new OpenRouterError(
      `OpenRouter request failed with status ${response.status}${
        details ? `: ${details}` : ""
      }`
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (err) {
    throw new OpenRouterError("OpenRouter response was not valid JSON.", err);
  }

  const content = extractMessageContent(payload);
  if (typeof content !== "string") {
    throw new OpenRouterError(
      "OpenRouter response did not include a message content string."
    );
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new OpenRouterError(
      "Model response content was not valid JSON.",
      err
    );
  }
}

function extractMessageContent(payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null) return undefined;
  const choices = (payload as Record<string, unknown>).choices;
  if (!Array.isArray(choices) || choices.length === 0) return undefined;
  const first = choices[0];
  if (typeof first !== "object" || first === null) return undefined;
  const message = (first as Record<string, unknown>).message;
  if (typeof message !== "object" || message === null) return undefined;
  return (message as Record<string, unknown>).content;
}
