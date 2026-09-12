import { describe, expect, it } from "vitest";
import { assignBucket, matchesStateStandard } from "../analysis/buckets";
import { stateStandards } from "../state-standards";

describe("matchesStateStandard", () => {
  it("treats a right-of-entry clause as statutory-compliant when its notice meets the state minimum", () => {
    // NY requires 24 hours' notice; a clause granting exactly that meets it.
    expect(
      matchesStateStandard(
        { clauseType: "right-of-entry", oneSidedness: "high", noticeHours: 24 },
        stateStandards.NY
      )
    ).toBe(true);
  });

  it("treats a right-of-entry clause granting zero notice as non-compliant in a 24-hour-notice state", () => {
    expect(
      matchesStateStandard(
        { clauseType: "right-of-entry", oneSidedness: "high", noticeHours: 0 },
        stateStandards.CA
      )
    ).toBe(false);
  });

  it("treats a zero-notice right-of-entry clause as compliant in a state with no entry-notice minimum", () => {
    // TX's fixture has landlordEntryHours: 0 — no notice required is standard there.
    expect(
      matchesStateStandard(
        { clauseType: "right-of-entry", oneSidedness: "high", noticeHours: 0 },
        stateStandards.TX
      )
    ).toBe(true);
  });

  it("treats an auto-renewal notice window well beyond the state minimum as still negotiable", () => {
    // CA's termination-notice minimum is 30 days; a 90-day requirement exceeds it.
    expect(
      matchesStateStandard(
        { clauseType: "auto-renewal", oneSidedness: "high", noticeDays: 90 },
        stateStandards.CA
      )
    ).toBe(false);
  });

  it("treats a deposit-deduction clause as never statutory-matched, regardless of state", () => {
    expect(
      matchesStateStandard(
        { clauseType: "deposit-deduction", oneSidedness: "high", dollarAmount: 1850 },
        stateStandards.CA
      )
    ).toBe(false);
  });

  it("returns false with no state-standard data at all", () => {
    expect(
      matchesStateStandard(
        { clauseType: "right-of-entry", oneSidedness: "high", noticeHours: 24 },
        undefined
      )
    ).toBe(false);
  });
});

describe("assignBucket", () => {
  it("assigns remove-modify to a highly one-sided, non-statutory clause", () => {
    expect(
      assignBucket(
        { clauseType: "deposit-deduction", oneSidedness: "high" },
        stateStandards.CA
      )
    ).toBe("remove-modify");
  });

  it("downgrades to clarify when the clause matches the state standard, even if reported one-sided", () => {
    expect(
      assignBucket(
        { clauseType: "right-of-entry", oneSidedness: "high", noticeHours: 24 },
        stateStandards.NY
      )
    ).toBe("clarify");
  });

  it("assigns clarify to a low one-sidedness clause", () => {
    expect(
      assignBucket({ clauseType: "unusual", oneSidedness: "low" }, stateStandards.CA)
    ).toBe("clarify");
  });

  it("uses dollar amount as a tiebreaker for medium one-sidedness", () => {
    expect(
      assignBucket(
        { clauseType: "hidden-fee", oneSidedness: "medium", dollarAmount: 500 },
        stateStandards.CA
      )
    ).toBe("remove-modify");

    expect(
      assignBucket(
        { clauseType: "hidden-fee", oneSidedness: "medium", dollarAmount: 10 },
        stateStandards.CA
      )
    ).toBe("push-on");
  });
});
