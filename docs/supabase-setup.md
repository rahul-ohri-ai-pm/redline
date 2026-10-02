# Supabase setup (owner steps)

Redline runs without Supabase: pasting or uploading a lease and the document-type check work with no account. Sign-in, the library and red lines need a project. Until one is configured, `/sign-in` says sign-in isn't set up and account pages redirect to it.

1. Create a project at supabase.com (any region).
2. Authentication, Providers: make sure Email is enabled.
3. Authentication, URL Configuration:
   - Site URL: your deployed origin (for local work, `http://localhost:3000`).
   - Redirect URLs: add `<origin>/auth/callback` for each origin you use, for example `http://localhost:3000/auth/callback` and `https://<your-vercel-domain>/auth/callback`.
4. Project Settings, API: copy the project URL and the anon (public) key.
5. Put them in `.env.local` (never commit this file) and in the Vercel project's environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```

6. Restart `npm run dev`. Open `/sign-in`, enter an email, and open the link in the same browser you requested it from. The link carries a one-time code tied to that browser.

Notes

- Supabase's built-in email sender is rate limited and meant for testing. Set up custom SMTP in Authentication settings before real use.
- The app reads only the anon key. Never put the service role key in these variables.
- Account pages are the paths under `/account`, `/library` and `/profile`. Pages call `requireUser()` from `lib/supabase/server.ts`, and the middleware redirects signed-out visits to those prefixes.
- Magic-link delivery and the code exchange have not been run against a real project in this repo; only the logic around them is tested.
