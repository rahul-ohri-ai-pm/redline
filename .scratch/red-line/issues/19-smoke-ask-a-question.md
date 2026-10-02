# 19: Extend the smoke script with a real ask-a-question path

**What to build:** `npm run smoke` also asks the fixture contract one answerable question and one question that should be refused, through the real ask logic against the real model, and prints each answer or refusal with its quoted sentences and whether they verified. When no key is set it says so and skips, as it does today.

**Blocked by:** 17

**Status:** ready-for-agent

- [ ] With a key set, the script prints one answer with its grounding and verified quotes, and one refusal.
- [ ] A quoted sentence that does not verify makes the script exit non-zero.
- [ ] With no key set, the ask path is skipped with a clear message and the rest of the script is unchanged.

## Comments
