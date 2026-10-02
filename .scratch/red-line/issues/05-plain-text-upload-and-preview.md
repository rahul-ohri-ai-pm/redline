# 05: Upload a plain-text lease and preview the extracted text

**What to build:** A renter picks a plain-text lease in the browser and sees the extracted text before anything is sent anywhere. This ticket introduces the `parseFile(file) → { text, sections } | Refusal` seam described in `.scratch/upload-auth-library/spec.md`, dispatching by file type to a separate parser (this ticket builds the plain-text one only). The text is normalized once and frozen: that string is what is previewed, and later what is sent, analyzed and stored. Plain-text readability is checked on its own (control or replacement characters, no word-like content), and anything failing becomes an `UnreadableSection` with `text: null` and a reason. The original file has no path to the server.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A clean `.txt` file returns `{ text, sections }` with readable sections, and the renter sees the extracted text in a preview.
- [x] Normalization runs once; the previewed string is the string later handed to `analyzeDocument`.
- [x] A `.txt` file with garbled or control-character content produces an `UnreadableSection` with `text: null` and a reason, and the renter is told what couldn't be read before continuing. The heuristic errs toward marking a section unreadable.
- [x] An unsupported file type is refused with a message naming the supported types.
- [x] No network request carries the file; the browser only ever produces text.
- [x] Tests for the plain-text parser use their own fixtures and assert on the returned `text` and `Section[]`, not on heuristic internals.
- [x] Any user-facing copy has been through the humanizer skill.

## Comments
