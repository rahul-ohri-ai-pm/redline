import { describe, expect, it } from "vitest";
import { createMemoryProfileStore } from "../memory-store";
import { submitProfile } from "../service";
import { rowsToSavedProfile, answersToRow, toRenterProfile } from "../mapper";
import { coveredStates, skippedFields, validateProfileInput } from "../validate";
import { stateStandards } from "../../state-standards";
import type { ProfileStore } from "../types";

const lines = (...texts: string[]) => texts.map((text) => ({ text }));

describe("state coverage", () => {
  it("offers exactly the states in the state-standard data", () => {
    expect(coveredStates()).toEqual(Object.keys(stateStandards).sort());
  });

  it("requires a state", async () => {
    const store = createMemoryProfileStore();
    const r = await submitProfile(store, "u1", { state: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.state).toBeTruthy();
    expect(await store.load("u1")).toBeNull();
  });

  it("refuses an uncovered state and writes nothing", async () => {
    const store = createMemoryProfileStore();
    const r = await submitProfile(store, "u1", { state: "WA", pets: "yes" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.state).toMatch(/cover/i);
    expect(await store.load("u1")).toBeNull();
  });

  it("accepts a covered state in any letter case", () => {
    const code = coveredStates()[0];
    const r = validateProfileInput({ state: code.toLowerCase() });
    expect(r.ok && r.value.answers.state).toBe(code);
  });
});

describe("not provided versus no", () => {
  it("round-trips skipped fields as absent, not false", async () => {
    const store = createMemoryProfileStore();
    await submitProfile(store, "u1", { state: "CA" });
    const saved = await store.load("u1");
    expect(saved?.answers).toEqual({ state: "CA" });
    expect(saved?.answers.pets).toBeUndefined();
    expect("pets" in (saved?.answers ?? {})).toBe(false);
  });

  it("keeps an explicit no as false", async () => {
    const store = createMemoryProfileStore();
    await submitProfile(store, "u1", { state: "TX", pets: "no", jointLease: "yes" });
    const saved = await store.load("u1");
    expect(saved?.answers.pets).toBe(false);
    expect(saved?.answers.jointLease).toBe(true);
  });

  it("maps database nulls to undefined and back", () => {
    const row = { user_id: "u", state: "NY", pets: null, joint_lease: false, renter_type: null };
    const saved = rowsToSavedProfile(row, []);
    expect(saved.answers).toEqual({ state: "NY", jointLease: false });
    const back = answersToRow("u", saved.answers);
    expect(back.pets).toBeNull();
    expect(back.joint_lease).toBe(false);
    expect(back.renter_type).toBeNull();
  });

  it("names the skipped fields", () => {
    expect(skippedFields({ state: "CA" })).toEqual(["pets", "joint lease", "renter type"]);
    expect(skippedFields({ state: "CA", pets: false, renterType: "roommate" })).toEqual([
      "joint lease",
    ]);
  });

  it("rejects an unknown renter type", () => {
    const r = validateProfileInput({ state: "CA", renterType: "landlord" });
    expect(r.ok).toBe(false);
  });
});

describe("saved profile", () => {
  it("pre-fills on a second visit", async () => {
    const store = createMemoryProfileStore();
    await submitProfile(store, "u1", {
      state: "NY",
      pets: "yes",
      renterType: "roommate",
      redLines: lines("No entry without notice"),
    });
    const again = await store.load("u1");
    expect(again?.answers).toEqual({ state: "NY", pets: true, renterType: "roommate" });
    expect(again?.redLines.map((r) => r.text)).toEqual(["No entry without notice"]);
  });

  it("returns the RenterProfile shape the engine takes", async () => {
    const store = createMemoryProfileStore();
    const r = await submitProfile(store, "u1", {
      state: "CA",
      pets: "no",
      redLines: lines("Auto-renewal", "Waiver of jury trial"),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.profile).toEqual({
        state: "CA",
        pets: false,
        redLines: ["Auto-renewal", "Waiver of jury trial"],
      });
    }
  });

  it("keeps each user's data separate", async () => {
    const store = createMemoryProfileStore();
    await submitProfile(store, "a", { state: "CA", redLines: lines("A line") });
    await submitProfile(store, "b", { state: "TX" });
    expect((await store.load("a"))?.answers.state).toBe("CA");
    expect((await store.load("b"))?.redLines).toEqual([]);
  });

  it("reports a failed save without claiming success", async () => {
    const failing: ProfileStore = {
      load: async () => null,
      save: async () => {
        throw new Error("down");
      },
    };
    const r = await submitProfile(failing, "u1", { state: "CA" });
    expect(r.ok).toBe(false);
  });
});

describe("red lines", () => {
  async function saveLines(store: ProfileStore, texts: { id?: string; text: string }[]) {
    const r = await submitProfile(store, "u1", { state: "CA", redLines: texts });
    if (!r.ok) throw new Error("save failed");
    return r.saved.redLines;
  }

  it("adds, edits, removes and reorders across saves", async () => {
    const store = createMemoryProfileStore();
    const first = await saveLines(store, [{ text: "one" }, { text: "two" }, { text: "three" }]);
    expect(first.map((l) => l.text)).toEqual(["one", "two", "three"]);

    const [one, two, three] = first;
    // reorder, edit "two", remove "one", add a new line
    await saveLines(store, [three, { id: two.id, text: "two, edited" }, { text: "four" }]);
    const loaded = await store.load("u1");
    expect(loaded?.redLines.map((l) => l.text)).toEqual(["three", "two, edited", "four"]);
    expect(loaded?.redLines[1].id).toBe(two.id);
    expect(loaded?.redLines.some((l) => l.id === one.id)).toBe(false);
  });

  it("drops blank lines and trims whitespace", () => {
    const r = validateProfileInput({ state: "CA", redLines: lines("  keep   me ", "   ", "") });
    expect(r.ok && r.value.redLines.map((l) => l.text)).toEqual(["keep me"]);
  });

  it("rejects an over-long line", () => {
    const r = validateProfileInput({ state: "CA", redLines: lines("x".repeat(301)) });
    expect(r.ok).toBe(false);
  });

  it("toRenterProfile lists red lines in order", () => {
    const p = toRenterProfile({
      answers: { state: "CA" },
      redLines: [
        { id: "1", text: "b" },
        { id: "2", text: "a" },
      ],
    });
    expect(p.redLines).toEqual(["b", "a"]);
  });
});
