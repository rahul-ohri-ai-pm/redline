# 11: Analyze a document and save it to the library

**What to build:** A signed-in renter uploads a lease, passes the document-type gate, confirms the questionnaire, and runs the analysis through a server route. The document is saved automatically: title (prefilled from the file name and editable, with only the title stored, never the file name as a separate field), extracted text, sections, the profile snapshot actually used, and the report exactly as the engine returned it. This is the first ticket where upload, profile and engine meet.

**Blocked by:** 05, 08, 09, 10

**Status:** done

- [x] A `documents` table exists via a migration with row-level security limiting a user to their own rows.
- [x] The analysis route requires a session, accepts only `text`, `sections` and profile fields (never a file), and calls `analyzeDocument`; the model key stays server-side.
- [x] A test confirms the request body carries no binary content and no route or table accepts the original file.
- [x] A blocking test: a citation verified at analysis time still verifies against the stored `extracted_text` after a save-and-load round trip.
- [x] The stored text is the same normalized string that was previewed and analyzed.
- [x] The saved report includes the skipped sections and the disclaimer, unchanged.
- [x] Row-level-security tests show user A cannot read, update or delete user B's documents.
- [x] Any user-facing copy has been through the humanizer skill.

## Comments
