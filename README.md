Live: https://redline-rosy-six.vercel.app/

# Redline

## Production settings

Four settings have to exist in both places: on Vercel for the production
environment, and in `.env.local` for local work. No values here.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

The two `NEXT_PUBLIC_` ones reach the browser, so they are not secret. The
other two are server-side only.
