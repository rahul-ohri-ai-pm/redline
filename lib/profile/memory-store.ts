import type { ProfileStore, SavedProfile } from "./types";

/** In-memory ProfileStore for tests. Keeps one copy per user, like the database would. */
export function createMemoryProfileStore(): ProfileStore {
  const data = new Map<string, SavedProfile>();
  const copy = (s: SavedProfile): SavedProfile => structuredClone(s);
  return {
    async load(userId) {
      const found = data.get(userId);
      return found ? copy(found) : null;
    },
    async save(userId, saved) {
      data.set(userId, copy(saved));
    },
  };
}
