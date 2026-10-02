# 17: Q&A box on the report screen

**What to build:** A renter asks a question about their saved document from the report screen and gets either a grounded answer or a clear refusal. A new ask handler takes a session, a document id and a question only (never text), loads that user's stored document and profile snapshot, calls `answerQuestion` with the stored text and the state-standard data, and returns an answer or a refusal. Every sentence an answer quotes is re-verified against the stored text before it is returned; a failed check becomes an error, never a shown answer (ADR 0008, ADR 0001). The box shows the grounding (document, state data or both) and the quoted sentences, shows refusals as a clear boundary with the engine's wording (general-advice and unanswerable-factual stay distinct), shows a wait state, and offers a retry on failure, which is never presented as a refusal. Questions and answers stay on the page for the session and are not stored. Signed-in only.

**Blocked by:** 15

**Status:** ready-for-agent

- [ ] The ask route requires a session, accepts only a document id and a question, and another user's document id returns not-found.
- [ ] An answerable question returns an answer whose quoted sentences are found verbatim in the stored text.
- [ ] An unanswerable factual question and a general-advice question each return a refusal.
- [ ] A fabricated quoted sentence from the model becomes an error and is never shown (blocking test).
- [ ] A model failure returns an error distinct from a refusal, and the box offers a retry.
- [ ] The box shows grounding and quotes, session-only history, and a wait state; nothing is stored.
- [ ] Handler tests use an injected session, store and model stub built from the sidecar fixtures; no key is needed.
- [ ] Any user-facing copy has been through the humanizer skill.

## Comments
