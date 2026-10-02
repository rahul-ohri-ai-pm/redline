import type { RenterProfile } from "../analysis/types";
import type {
  ProfileAnswers,
  ProfileRow,
  RedLine,
  RedLineRow,
  SavedProfile,
} from "./types";

/** undefined (not provided) becomes null; false stays false. */
const toNullable = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

export function rowsToSavedProfile(row: ProfileRow, redLineRows: RedLineRow[]): SavedProfile {
  // null (not provided) leaves the key absent; true and false are kept.
  const answers: ProfileAnswers = { state: row.state };
  if (row.pets !== null && row.pets !== undefined) answers.pets = row.pets;
  if (row.joint_lease !== null && row.joint_lease !== undefined) {
    answers.jointLease = row.joint_lease;
  }
  if (row.renter_type !== null && row.renter_type !== undefined) {
    answers.renterType = row.renter_type;
  }
  const redLines = [...redLineRows]
    .sort((a, b) => a.position - b.position)
    .map((r) => ({ id: r.id, text: r.text }));
  return { answers, redLines };
}

export function answersToRow(userId: string, a: ProfileAnswers): ProfileRow {
  return {
    user_id: userId,
    state: a.state,
    pets: toNullable(a.pets),
    joint_lease: toNullable(a.jointLease),
    renter_type: toNullable(a.renterType),
  };
}

export function redLinesToRows(userId: string, lines: RedLine[]): RedLineRow[] {
  return lines.map((l, position) => ({ id: l.id, user_id: userId, text: l.text, position }));
}

/** The shape the analysis engine takes. Optional fields are absent when not provided. */
export function toRenterProfile(saved: SavedProfile): RenterProfile {
  return { ...saved.answers, redLines: saved.redLines.map((r) => r.text) };
}
