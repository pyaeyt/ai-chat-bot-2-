# Deploy on Railway

## 1. Prepare the repo

- **`package.json`** must define:
  - `"build": "next build"`
  - `"start": "next start"`
- An **`engines.node`** range is set in this repo (`>=20.9.0`) so Railway picks a compatible Node version.
- **Commit and push** to GitHub (or another Git host Railway supports), then connect that repository in the Railway dashboard.

```bash
git add -A
git status   # review
git commit -m "Your message"
git push origin main
```

## 2. Create the service

In [Railway](https://railway.app): **New project** → deploy from your Git repo → select this app’s root (where `package.json` lives). Railway will run `npm install`, `npm run build`, and `npm run start` (or equivalent).

## 3. Environment variables

Add the same variables you use locally (e.g. in `.env.local`), **without** committing secrets:

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon / publishable key |
| `GEMINI_API_KEYS1`, … | Server-side; add as many as you use |
| `GEMINI_API_KEY` | Optional single-key fallback |
| `GEMINI_MODEL` / `GEMINI_MODEL_FALLBACKS` | Optional |

In **Supabase → Authentication → URL configuration**, add your Railway app URL and `/auth/callback` to **Redirect URLs** if you use email confirmation or OAuth.
