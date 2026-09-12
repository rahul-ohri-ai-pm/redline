import { describe, expect, it } from "vitest";
import {
  getStateStandard,
  stateStandards,
  type StateStandard,
} from "../state-standards";

describe("stateStandards fixture data", () => {
  it("gives CA a strict 1-month deposit cap and a banned fee type", () => {
    const ca = stateStandards.CA;
    expect(ca.depositCap.maxMonthsRent).toBe(1);
    expect(ca.bannedFees.length).toBeGreaterThan(0);
    expect(ca.bannedFees.map((f) => f.id)).toContain("credit-check-fee-cap");
  });

  it("gives TX no statutory deposit cap and no banned fees, distinct from CA", () => {
    const tx = stateStandards.TX;
    expect(tx.depositCap.maxMonthsRent).toBeNull();
    expect(tx.bannedFees).toEqual([]);
    expect(tx.typicalAmounts.lateFeeCapUsd).toBeNull();
  });

  it("keeps landlord-entry notice and lease-termination notice distinct per state", () => {
    const ca = stateStandards.CA;
    const ny = stateStandards.NY;

    // Different fields, not aliases of each other.
    expect(ca.noticePeriods.landlordEntryHours).not.toBe(
      ca.noticePeriods.leaseTerminationDays
    );
    // NY's termination notice is longer than CA's, exercising a real
    // cross-state difference rather than a shared constant.
    expect(ny.noticePeriods.leaseTerminationDays).toBeGreaterThan(
      ca.noticePeriods.leaseTerminationDays
    );
  });

  it("provides typical amounts distinct from hard caps for opportunity-flag framing", () => {
    const ny = stateStandards.NY;
    expect(ny.typicalAmounts.typicalDepositMonthsRent).toBe(1);
    expect(ny.typicalAmounts.lateFeeCapUsd).toBe(50);
  });

  it("has at least 3 states in the fixture", () => {
    expect(Object.keys(stateStandards).length).toBeGreaterThanOrEqual(3);
  });
});

describe("getStateStandard", () => {
  it("returns the matching state's data", () => {
    const result = getStateStandard("CA");
    expect(result).toBeDefined();
    expect(result?.state).toBe("CA");
    expect(result?.depositCap.maxMonthsRent).toBe(1);
  });

  it("is case-insensitive", () => {
    const result = getStateStandard("ca");
    expect(result).toEqual(stateStandards.CA);
  });

  it("returns undefined for an unlisted state rather than throwing", () => {
    expect(() => getStateStandard("ZZ")).not.toThrow();
    expect(getStateStandard("ZZ")).toBeUndefined();
  });

  it("returns undefined for a state genuinely absent from the fixture (not just a typo)", () => {
    // FL is a real state code but deliberately not in this fixture set;
    // this pins the "missing data is a handled case" contract.
    expect(getStateStandard("FL")).toBeUndefined();
  });

  it("returned objects satisfy the StateStandard shape for every field group", () => {
    const result = getStateStandard("TX") as StateStandard;
    expect(result).toMatchObject({
      state: "TX",
      depositCap: { maxMonthsRent: null },
      noticePeriods: {
        landlordEntryHours: expect.any(Number),
        leaseTerminationDays: expect.any(Number),
      },
      bannedFees: [],
      typicalAmounts: {
        typicalDepositMonthsRent: expect.any(Number),
      },
    });
  });
});
