# 08: Document-type gate

**What to build:** After extraction and before the questionnaire, Redline classifies the uploaded text as residential lease, freelance agreement, Terms of Service or other. Anything that isn't a residential lease is refused with a plain message that this document type isn't supported yet. The classification is one server-side model call through OpenRouter on the extracted text only (never a provider SDK). The gate sits above both engine seams, so a refused document never reaches `analyzeDocument` or `answerQuestion`.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] A residential lease passes the gate and proceeds.
- [ ] A freelance agreement, a Terms of Service document and a non-document each get the "not supported yet" refusal.
- [ ] A test asserts the analysis seam is never called for a refused document.
- [ ] The classification call goes through the existing OpenRouter module, reads env only at call time, and is the mocked boundary in tests.
- [ ] Only extracted text is sent; the original file is not.
- [ ] A classification failure or malformed model response results in a visible error with a retry, never a silent pass.
- [ ] Any user-facing copy has been through the humanizer skill.

## Comments
