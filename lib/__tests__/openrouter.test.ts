import { describe, expect, it } from "vitest";
import { callModel, OpenRouterError, type FetchLike } from "../openrouter";

/** Builds a canned OpenRouter-shaped success response for a given content string. */
function okResponse(content: string): ReturnType<FetchLike> extends Promise<infer T>
  ? T
  : never {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: "gen-test-123",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
          },
          finish_reason: "stop",
        },
      ],
    }),
    text: async () => content,
  } as never;
}

describe("callModel", () => {
  it("parses and returns the structured content from a canned OpenRouter response", async () => {
    const structuredPayload = {
      flags: [
        {
          citation: "Tenant shall pay a $500 non-refundable pet fee.",
          bucket: "remove-modify",
        },
      ],
      disclaimer: "This is not legal advice.",
    };

    const calls: Array<{ url: string; init?: unknown }> = [];
    const stubFetch: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return okResponse(JSON.stringify(structuredPayload));
    };

    const result = await callModel(
      { messages: [{ role: "user", content: "Analyze this lease." }] },
      { fetchFn: stubFetch, apiKey: "test-key", model: "test/model" }
    );

    expect(result).toEqual(structuredPayload);

    // Assert the wrapper actually built the request the contract promises,
    // rather than just happening to parse whatever came back.
    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");

    const parsedBody = JSON.parse((init as { body: string }).body);
    expect(parsedBody.model).toBe("test/model");
    expect(parsedBody.provider).toEqual({
      order: ["fireworks"],
      allow_fallbacks: false,
      require_parameters: true,
    });
    expect(parsedBody.reasoning).toEqual({ effort: "low" });
    expect(parsedBody.response_format).toEqual({ type: "json_object" });

    const headers = (init as { headers: Record<string, string> }).headers;
    expect(headers.Authorization).toBe("Bearer test-key");
  });

  it("requests json_schema mode with the given schema when jsonSchema is passed", async () => {
    const schema = {
      type: "object",
      properties: { answer: { type: "string" } },
      required: ["answer"],
    };

    const stubFetch: FetchLike = async () =>
      okResponse(JSON.stringify({ answer: "yes" }));

    let capturedBody: Record<string, unknown> = {};
    const capturingFetch: FetchLike = async (url, init) => {
      capturedBody = JSON.parse((init as { body: string }).body);
      return stubFetch(url, init);
    };

    const result = await callModel(
      {
        messages: [{ role: "user", content: "Q?" }],
        jsonSchema: { name: "answer_schema", schema },
      },
      { fetchFn: capturingFetch, apiKey: "test-key", model: "test/model" }
    );

    expect(result).toEqual({ answer: "yes" });
    expect(capturedBody.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "answer_schema", strict: true, schema },
    });
  });

  it("throws an OpenRouterError on a non-2xx response instead of failing silently", async () => {
    const stubFetch: FetchLike = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
      text: async () => "internal server error",
    });

    await expect(
      callModel(
        { messages: [{ role: "user", content: "hi" }] },
        { fetchFn: stubFetch, apiKey: "test-key", model: "test/model" }
      )
    ).rejects.toBeInstanceOf(OpenRouterError);
  });

  it("throws an OpenRouterError when the model's message content isn't valid JSON", async () => {
    const stubFetch: FetchLike = async () => okResponse("not valid json {{{");

    await expect(
      callModel(
        { messages: [{ role: "user", content: "hi" }] },
        { fetchFn: stubFetch, apiKey: "test-key", model: "test/model" }
      )
    ).rejects.toThrow(OpenRouterError);
  });

  it("throws an OpenRouterError when the response has no message content at all", async () => {
    const stubFetch: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [] }),
      text: async () => "",
    });

    await expect(
      callModel(
        { messages: [{ role: "user", content: "hi" }] },
        { fetchFn: stubFetch, apiKey: "test-key", model: "test/model" }
      )
    ).rejects.toThrow(OpenRouterError);
  });

  it("throws without making any network call when no API key is available", async () => {
    let called = false;
    const stubFetch: FetchLike = async () => {
      called = true;
      return okResponse("{}");
    };

    await expect(
      callModel(
        { messages: [{ role: "user", content: "hi" }] },
        { fetchFn: stubFetch, model: "test/model" } // no apiKey, and env var unset in test env
      )
    ).rejects.toThrow(/OPENROUTER_API_KEY/);

    expect(called).toBe(false);
  });
});
