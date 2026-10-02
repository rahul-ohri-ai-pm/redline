import { stateStandards } from "../state-standards";
import type { ProfileAnswers, RedLine, SavedProfile } from "./types";

export const RENTER_TYPES = ["individual", "roommate", "co-signer"] as const;
export const MAX_RED_LINES = 25;
export const MAX_RED_LINE_LENGTH = 300;

/** States that have state-standard data. Read from the data module, never listed here. */
export function coveredStates(): string[] {
  return Object.keys(stateStandards).sort();
}

export function isCoveredState(code: string): boolean {
  return coveredStates().includes(code.trim().toUpperCase());
}

export type FieldKey = "state" | "pets" | "jointLease" | "renterType" | "redLines";

export type ValidationResult =
  | { ok: true; value: SavedProfile }
  | { ok: false; errors: Partial<Record<FieldKey, string>> };

export interface RawProfileInput {
  state?: string | null;
  /** "yes", "no", or empty/absent for not provided. */
  pets?: string | null;
  jointLease?: string | null;
  renterType?: string | null;
  redLines?: { id?: string | null; text?: string | null }[] | null;
}

function triState(v: string | null | undefined): boolean | undefined | "invalid" {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "") return undefined;
  if (s === "yes") return true;
  if (s === "no") return false;
  return "invalid";
}

export function validateProfileInput(
  raw: RawProfileInput,
  newId: () => string = () => crypto.randomUUID(),
): ValidationResult {
  const errors: Partial<Record<FieldKey, string>> = {};
  const answers: ProfileAnswers = { state: "" };

  const state = (raw.state ?? "").trim().toUpperCase();
  if (!state) {
    errors.state = "Choose your state to continue.";
  } else if (!isCoveredState(state)) {
    errors.state = "Redline doesn't cover your state yet, so it can't analyze a lease there.";
  } else {
    answers.state = state;
  }

  const pets = triState(raw.pets);
  if (pets === "invalid") errors.pets = "Choose yes, no, or skip.";
  else if (pets !== undefined) answers.pets = pets;

  const joint = triState(raw.jointLease);
  if (joint === "invalid") errors.jointLease = "Choose yes, no, or skip.";
  else if (joint !== undefined) answers.jointLease = joint;

  const rt = (raw.renterType ?? "").trim();
  if (rt !== "") {
    if ((RENTER_TYPES as readonly string[]).includes(rt)) answers.renterType = rt;
    else errors.renterType = "Pick one of the listed renter types, or skip.";
  }

  const redLines: RedLine[] = [];
  for (const item of raw.redLines ?? []) {
    const text = (item.text ?? "").trim().replace(/\s+/g, " ");
    if (!text) continue;
    if (text.length > MAX_RED_LINE_LENGTH) {
      errors.redLines = `Keep each red line under ${MAX_RED_LINE_LENGTH} characters.`;
      break;
    }
    redLines.push({ id: item.id?.trim() || newId(), text });
  }
  if (!errors.redLines && redLines.length > MAX_RED_LINES) {
    errors.redLines = `You can keep up to ${MAX_RED_LINES} red lines.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { answers, redLines } };
}

export { skippedFields } from "./skipped";
