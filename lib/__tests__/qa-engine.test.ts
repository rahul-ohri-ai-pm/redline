import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { answerQuestion, type Answer, type Refusal } from "../qa-engine";
import { getStateStandard } from "../state-standards";
import type { FetchLike } from "../openrouter";

// This suite is deliberately independent of ticket 03's analysis-engine
// fixtures (tests/fixtures/adhesion-lease.sidecar.json, clean-lease.txt,
// partial-extraction-lease.*) and of lib/analysis-engine.ts — it reads its
// own fixture file so a change to either seam's fixtures can't silently
// break the other's suite.
const FIXTURE_PATH = join(
  __dirname,
  "..",
  "..",
  "tests",
  "fixtures",
  "qa-lease-excerpt.txt"
);
const leaseText = readFileSync(FIXTURE_PATH, "utf-8");

/** Builds a canned OpenRouter-shaped success response for structured JSON content. */
function okResponse(content: unknown): ReturnType<FetchLike> extends Promise<infer T>
  ? T
  : never {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: "gen-test-qa",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: JSON.stringify(content) },
          finish_reason: "stop",
        },
      ],
    }),
    text: async () => JSON.stringify(content),
  } as never;
}

function stubFetchReturning(content: unknown): FetchLike {
  return async () => okResponse(content);
}

const renterProfile = { state: "CA" };

describe("answerQuestion", () => {
  it("returns a document-grounded Answer with a verified verbatim citation", async () => {
    const modelResponse = {
      grounding: "document",
      isGeneralAdvice: false,
      answer: "Your late fee is $75 if rent is more than 5 days late.",
      sourceSentences: ["Tenant shall pay a late fee of $75."],
    };

    const result = await answerQuestion(
      leaseText,
      getStateStandard("CA"),
      renterProfile,
      "What's my late fee?",
      { fetchFn: stubFetchReturning(modelResponse), apiKey: "k", model: "m" }
    );

    expect(result.kind).toBe("answer");
    const answer = result as Answer;
    expect(answer.groundedIn).toBe("document");
    expect(answer.sourceSentences).toBeDefined();
    // The single highest-priority check, mirrored from the analysis engine:
    // every cited sentence must be a verbatim substring of the source text.
    for (const sentence of answer.sourceSentences!) {
      expect(leaseText.includes(sentence)).toBe(true);
    }
    expect(answer.text).toContain("$75");
  });

  it("returns a state-standard-grounded Answer, and the answer differs meaningfully by fixture state", async () => {
    // CA fixture: late-fee cap is $50 (typicalAmounts.lateFeeCapUsd), so a
    // $75 late fee documented above exceeds the state's typical figure.
    const caModelResponse = {
      grounding: "state-standard",
      isGeneralAdvice: false,
      answer:
        "Your state's typical late fee cap is $50, so your $75 late fee is above what's typical in CA.",
      sourceSentences: [],
    };

    const caResult = await answerQuestion(
      leaseText,
      getStateStandard("CA"),
      { state: "CA" },
      "Is a $75 late fee normal for my state?",
      { fetchFn: stubFetchReturning(caModelResponse), apiKey: "k", model: "m" }
    );

    expect(caResult.kind).toBe("answer");
    const caAnswer = caResult as Answer;
    expect(caAnswer.groundedIn).toBe("state-standard");
    expect(caAnswer.sourceSentences).toBeUndefined();
    expect(caAnswer.text).toContain("$50");

    // TX fixture: no typical late-fee figure and no cap at all, so the
    // same style of question should be answered differently for TX.
    const txModelResponse = {
      grounding: "state-standard",
      isGeneralAdvice: false,
      answer:
        "Texas has no typical late fee figure or cap on file, so there's no state standard to compare your $75 fee against.",
      sourceSentences: [],
    };

    const txResult = await answerQuestion(
      leaseText,
      getStateStandard("TX"),
      { state: "TX" },
      "Is a $75 late fee normal for my state?",
      { fetchFn: stubFetchReturning(txModelResponse), apiKey: "k", model: "m" }
    );

    expect(txResult.kind).toBe("answer");
    const txAnswer = txResult as Answer;
    expect(txAnswer.groundedIn).toBe("state-standard");
    expect(txAnswer.text).not.toEqual(caAnswer.text);
    expect(txAnswer.text.toLowerCase()).toContain("no");
  });

  it("refuses when state-standard grounding is claimed but no data exists for the state", async () => {
    const modelResponse = {
      grounding: "state-standard",
      isGeneralAdvice: false,
      answer: "This is not backed by any real data.",
      sourceSentences: [],
    };

    const result = await answerQuestion(
      leaseText,
      undefined, // no state-standard data available (e.g. unsupported state)
      { state: "ZZ" },
      "Is my late fee normal for my state?",
      { fetchFn: stubFetchReturning(modelResponse), apiKey: "k", model: "m" }
    );

    expect(result.kind).toBe("refusal");
    expect((result as Refusal).reason).toBe("state-standard-unavailable");
  });

  it("refuses questions that need facts outside both the document and state-standard data", async () => {
    const modelResponse = {
      grounding: "none",
      isGeneralAdvice: false,
      answer:
        "The document doesn't mention any verbal promises, and state data doesn't cover this.",
      sourceSentences: [],
    };

    const result = await answerQuestion(
      leaseText,
      getStateStandard("CA"),
      renterProfile,
      "What did my landlord promise me verbally about repainting?",
      { fetchFn: stubFetchReturning(modelResponse), apiKey: "k", model: "m" }
    );

    expect(result.kind).toBe("refusal");
    const refusal = result as Refusal;
    expect(refusal.reason).toBe("outside-document-and-state-standard");
    expect(refusal.text.length).toBeGreaterThan(0);
  });

  it("refuses general-advice / 'should I sign this' style questions instead of answering", async () => {
    const modelResponse = {
      grounding: "none",
      isGeneralAdvice: true,
      answer: "You should probably sign it, it looks fine.",
      sourceSentences: [],
    };

    const result = await answerQuestion(
      leaseText,
      getStateStandard("CA"),
      renterProfile,
      "Should I sign this lease?",
      { fetchFn: stubFetchReturning(modelResponse), apiKey: "k", model: "m" }
    );

    expect(result.kind).toBe("refusal");
    const refusal = result as Refusal;
    expect(refusal.reason).toBe("general-advice-not-grounded");
    // The renter-facing text must never surface the model's actual opinion.
    expect(refusal.text).not.toContain("You should probably sign it");
  });

  it("rejects a fabricated (non-verbatim) claimed citation rather than passing it through as verified", async () => {
    const modelResponse = {
      grounding: "document",
      isGeneralAdvice: false,
      answer: "Your late fee is $9,999 for any breach.",
      // Not present anywhere in the fixture text — fabricated by the model.
      sourceSentences: [
        "Tenant shall pay a late fee of $9,999 immediately upon any breach.",
      ],
    };

    const result = await answerQuestion(
      leaseText,
      getStateStandard("CA"),
      renterProfile,
      "What's my late fee?",
      { fetchFn: stubFetchReturning(modelResponse), apiKey: "k", model: "m" }
    );

    // Must never surface the fabricated citation as a verified Answer.
    expect(result.kind).toBe("refusal");
    expect((result as Refusal).reason).toBe("citation-could-not-be-verified");
  });

  it("refuses when the model response doesn't match the expected structured shape", async () => {
    const malformed = { unexpected: "shape" };

    const result = await answerQuestion(
      leaseText,
      getStateStandard("CA"),
      renterProfile,
      "What's my late fee?",
      { fetchFn: stubFetchReturning(malformed), apiKey: "k", model: "m" }
    );

    expect(result.kind).toBe("refusal");
    expect((result as Refusal).reason).toBe("model-response-invalid");
  });

  it("sends the document text, state-standard data, and question to the model", async () => {
    const calls: Array<{ body: string }> = [];
    const capturingFetch: FetchLike = async (url, init) => {
      calls.push({ body: (init as { body: string }).body });
      return okResponse({
        grounding: "document",
        isGeneralAdvice: false,
        answer: "Pets are not permitted.",
        sourceSentences: [
          "No pets of any kind are permitted on the premises at any time,",
        ],
      });
    };

    await answerQuestion(
      leaseText,
      getStateStandard("CA"),
      renterProfile,
      "Am I allowed to have a pet?",
      { fetchFn: capturingFetch, apiKey: "k", model: "m" }
    );

    expect(calls).toHaveLength(1);
    const parsedBody = JSON.parse(calls[0].body);
    const userMessage = parsedBody.messages.find(
      (m: { role: string }) => m.role === "user"
    );
    expect(userMessage.content).toContain("Am I allowed to have a pet?");
    expect(userMessage.content).toContain("No pets of any kind are permitted");
    expect(userMessage.content).toContain("CA");
    expect(parsedBody.response_format.type).toBe("json_schema");
  });
});
