/**
 * Guards the `label` contract across the boundary where it was once only a
 * TypeScript doc comment. `composeFlagSummary` drops `label` straight into
 * "This clause ___", so a label written as headline shorthand ("Lump-sum
 * remaining rent + $500 fee") produces broken renter-facing copy. The
 * verb-phrase requirement therefore has to be stated where the model can
 * actually read it — the system prompt and the JSON schema — not just in
 * the interface.
 */

import { describe, expect, it } from "vitest";
import { buildAnalysisMessages, FLAGS_JSON_SCHEMA } from "../analysis/model";
import { composeFlagSummary } from "../analysis/wording";
import type { RenterProfile } from "../analysis/types";

const PROFILE: RenterProfile = { state: "CA" };

function systemPrompt(): string {
  const messages = buildAnalysisMessages("Some lease text.", PROFILE, undefined);
  const system = messages.find((m) => m.role === "system");
  if (!system) throw new Error("no system message in analysis messages");
  return system.content;
}

function labelSchema(): Record<string, unknown> {
  const schema = FLAGS_JSON_SCHEMA.schema as Record<string, any>;
  return schema.properties.flags.items.properties.label;
}

describe("the label contract reaches the model", () => {
  it("tells the model in the system prompt that label is a verb phrase, not a heading", () => {
    const prompt = systemPrompt();

    expect(prompt).toMatch(/label/);
    expect(prompt).toMatch(/verb phrase/i);
    // The prompt must show the sentence the label lands in, so the model
    // can tell it is writing a fragment rather than a title.
    expect(prompt).toMatch(/This clause/);
  });

  it("carries the same requirement in the JSON schema description", () => {
    const label = labelSchema();

    expect(label.type).toBe("string");
    expect(typeof label.description).toBe("string");
    expect(label.description as string).toMatch(/verb phrase/i);
    expect(label.description as string).toMatch(/This clause/);
  });

  it("warns the model off the shorthand that produced the original defect", () => {
    const both = `${systemPrompt()} ${labelSchema().description as string}`;

    // Abbreviations and note-taking punctuation are what leaked internal
    // shorthand into renter-facing summaries.
    expect(both).toMatch(/abbreviat/i);
  });
});

describe("a conforming label composes into readable copy", () => {
  const LABEL = "charges $45 a month for paying rent through the online portal";

  it("reads as one sentence at every confidence level", () => {
    for (const confidence of ["high", "medium", "low"] as const) {
      const summary = composeFlagSummary(confidence, LABEL);

      expect(summary).toMatch(/^[A-Z]/);
      expect(summary).toMatch(/[.!?]$/);
      // "This clause Charges..." or "This clause $45..." is the shape of the
      // bug: the word after the frame has to be a lowercase verb.
      expect(summary).not.toMatch(/This clause (may )?[A-Z$]/);
    }
  });
});
