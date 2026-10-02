# 09: Sign in with an email magic link

**What to build:** A renter can sign in with an email magic link, stay signed in across visits, and sign out. Pages that need an account redirect to sign-in when signed out. Sign-in is required before the first analysis; there is no anonymous analysis. The Supabase client is created lazily and reads env only at call time, so `npm run build` still succeeds with no Supabase variables set (matching `lib/openrouter.ts`).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

Dependency: needs `@supabase/supabase-js` and `@supabase/ssr`, approved by the owner. The owner must also create the Supabase project and put the keys in `.env.local` only; no key is ever committed.

- [ ] A renter enters an email, receives a magic link, and lands signed in.
- [ ] The session persists across visits and a sign-out action ends it.
- [ ] Signed-out visits to account pages redirect to sign-in.
- [ ] `npm run build` succeeds with no Supabase env vars set.
- [ ] No secrets are committed; env is read from `.env.local`.
- [ ] Any user-facing copy (sign-in labels, errors, the email prompt) has been through the humanizer skill.

## Comments
