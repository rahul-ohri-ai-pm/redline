import type { RenterProfile } from "../analysis/types";

/** The saved questionnaire answers, without red lines. */
export type ProfileAnswers = Omit<RenterProfile, "redLines">;

export interface RedLine {
  id: string;
  text: string;
}

export interface SavedProfile {
  answers: ProfileAnswers;
  redLines: RedLine[];
}

/** Row shapes as stored (snake_case, null = not provided). */
export interface ProfileRow {
  user_id: string;
  state: string;
  pets: boolean | null;
  joint_lease: boolean | null;
  renter_type: string | null;
  updated_at?: string;
}

export interface RedLineRow {
  id: string;
  user_id: string;
  text: string;
  position: number;
}

/**
 * Data access for the profile and red lines. Every method acts for the
 * given user only. The Supabase implementation relies on row-level
 * security as well as filtering on the user id.
 */
export interface ProfileStore {
  /** Null when the user has never saved a profile. */
  load(userId: string): Promise<SavedProfile | null>;
  /** Saves answers and the full, ordered red-line list. */
  save(userId: string, data: SavedProfile): Promise<void>;
}
