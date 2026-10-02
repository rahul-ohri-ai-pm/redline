import type { DocumentStore, SavedDocument } from "./types";

/** In-memory DocumentStore for tests. Enforces ownership the way row-level security does. */
export function createMemoryDocumentStore(): DocumentStore {
  const rows = new Map<string, { userId: string; doc: SavedDocument }>();
  let tick = 0;
  const copy = <V>(v: V): V => structuredClone(v);
  const owned = (userId: string, id: string) => {
    const row = rows.get(id);
    return row && row.userId === userId ? row : null;
  };
  return {
    async insert(userId, doc) {
      const saved: SavedDocument = {
        ...copy(doc),
        id: crypto.randomUUID(),
        // Monotonic so "newest first" is testable inside one millisecond.
        createdAt: new Date(Date.UTC(2026, 0, 1) + ++tick * 1000).toISOString(),
      };
      rows.set(saved.id, { userId, doc: copy(saved) });
      return copy(saved);
    },
    async get(userId, id) {
      const row = owned(userId, id);
      return row ? copy(row.doc) : null;
    },
    async list(userId) {
      return [...rows.values()]
        .filter((r) => r.userId === userId)
        .map((r) => copy(r.doc))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async update(userId, id, patch) {
      const row = owned(userId, id);
      if (!row) return false;
      row.doc = { ...row.doc, ...copy(patch) };
      return true;
    },
    async remove(userId, id) {
      if (!owned(userId, id)) return false;
      rows.delete(id);
      return true;
    },
  };
}
