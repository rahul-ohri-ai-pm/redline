import { describe, expect, it } from "vitest";
import { composeFlagSummary } from "../analysis/wording";

describe("composeFlagSummary", () => {
  it("states a high-confidence flag flatly, with no hedging language", () => {
    const text = composeFlagSummary(
      "high",
      "lets the landlord keep the entire deposit for any reason"
    );

    expect(text).toContain("lets the landlord keep the entire deposit for any reason");
    expect(text).not.toMatch(/\b(may|might|could|possibly|perhaps)\b/i);
  });

  it("hedges a low-confidence flag with uncertainty language the high-confidence version lacks", () => {
    const highText = composeFlagSummary(
      "high",
      "charges a recurring fee not disclosed as rent"
    );
    const lowText = composeFlagSummary(
      "low",
      "charges a recurring fee not disclosed as rent"
    );

    expect(lowText).toMatch(/\b(may|might|could)\b/i);
    expect(highText).not.toMatch(/\b(may|might|could)\b/i);
    // The two must actually read differently, not just differ by a prefix.
    expect(lowText).not.toBe(highText);
  });

  it("hedges a medium-confidence flag, distinct from both high and low wording", () => {
    const label = "requires notice well beyond what's typical";
    const high = composeFlagSummary("high", label);
    const medium = composeFlagSummary("medium", label);
    const low = composeFlagSummary("low", label);

    expect(medium).toMatch(/\b(may|might|could)\b/i);
    expect(medium).not.toBe(high);
    expect(medium).not.toBe(low);
  });
});
