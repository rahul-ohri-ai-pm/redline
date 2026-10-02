# 13: Delete a saved document

**What to build:** A renter can delete a saved document from the library. The row is removed, including its extracted text, sections, profile snapshot and report. This is a deliberate addition to the PRD's v1 list (owner decision), because stored lease text is sensitive. `PRD.md` needs a matching line.

**Blocked by:** 12

**Status:** done

- [x] A delete action in the library removes the document and its stored text, with a confirmation step.
- [x] After deletion the document no longer appears in the list and cannot be opened by id.
- [x] A user cannot delete another user's document (row-level-security test).
- [x] `PRD.md` lists the delete action under "What the first version does".
- [x] Any user-facing copy (confirmation, errors) has been through the humanizer skill.

## Comments
