# Bay frontend (React + TypeScript + Vite + Tailwind)

This is a minimal starter frontend scaffold intended to be integrated with the existing PHP backend or migrated to Supabase. It is configured for local development and for deployment to Vercel.

Quick start

1. Install dependencies

```bash
cd frontend
npm install
```

2. Local dev (Vite)

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

Supabase integration

- Create a Supabase project and copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Create a `.env` in `frontend/` with:

```
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- Use `@supabase/supabase-js` in the app to connect (see Supabase docs).

Wiring example (done in this scaffold)

- `src/lib/supabaseClient.ts` creates the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/App.tsx` runs a simple check against a `test` table and shows connection status.
- To verify locally: set the env vars, run `npm run dev`, and confirm the page shows `Status: ok`.

If you don't have a `test` table, either create one in Supabase or change the query in `src/App.tsx` to a table you have.

Deploy to Vercel

- Push the repo to GitHub and import the `bay` repo into Vercel.
- Set the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings.
- Vercel will auto-deploy the `frontend` folder (set Root to `frontend` in the import settings) and provide a staging URL.

Notes

- Dev proxy: `vite.config.ts` includes a `/api` proxy to `http://localhost` so you can call your PHP endpoints under `/api/...` during development.
- This scaffold is intentionally minimal; I can continue and wire Supabase auth, example API calls to your PHP backend, and CI (Vercel) config if you want.

Vercel deployment (automated)

- I added `frontend/vercel.json` to configure a static SPA build and a GitHub Actions workflow at `.github/workflows/deploy-vercel.yml` that builds `frontend` and deploys to Vercel.
- To enable automatic deploys you must:
	1. Push this repository to GitHub.
	2. In the GitHub repo settings, add the following secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
	3. Import the repo into Vercel or create a new project and set the **Root Directory** to `frontend`.
	4. In Vercel project settings set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.

Manual deploy (one-time) using Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel login
vercel --prod
```

The CLI will ask for the project/org; choose or create a project and then add environment variables in the Vercel dashboard.

Security note: Do not share your `VERCEL_TOKEN` or Supabase anon key in chat. Add them as secrets in GitHub/Vercel dashboards.
