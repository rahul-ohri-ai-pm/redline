import { describe, expect, it } from "vitest";
import { verifyCitation } from "../analysis/citation";
import type { Section } from "../analysis/types";

describe("verifyCitation", () => {
  const text =
    "This Agreement shall automatically renew for a successive term. Tenant shall pay rent monthly.";

  it("verifies a sentence that is an exact verbatim substring of the text", () => {
    expect(
      verifyCitation(
        "This Agreement shall automatically renew for a successive term.",
        text
      )
    ).toBe(true);
  });

  it("rejects a fabricated sentence that never appears in the text", () => {
    expect(
      verifyCitation(
        "This Agreement grants the tenant unlimited free parking for life.",
        text
      )
    ).toBe(false);
  });

  it("rejects a paraphrase that is close but not verbatim", () => {
    expect(
      verifyCitation(
        "This Agreement automatically renews for another term.",
        text
      )
    ).toBe(false);
  });

  it("verifies against a readable section's text even when not in the top-level text", () => {
    const sections: Section[] = [
      { id: "s1", readable: true, text: "Landlord may enter with 24 hours notice." },
      { id: "s2", readable: false, text: null, reason: "garbled" },
    ];
    expect(
      verifyCitation("Landlord may enter with 24 hours notice.", "", sections)
    ).toBe(true);
  });

  it("never treats an unreadable section's (null) text as a match source", () => {
    const sections: Section[] = [
      { id: "s1", readable: false, text: null, reason: "garbled" },
    ];
    expect(verifyCitation("anything", "unrelated text", sections)).toBe(false);
  });
});
