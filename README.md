# ms-global-server

Node.js API for **MS-GLOBAL**: MongoDB auth, referrals, organization profile, published site content, and **owner studio** routes (`/api/site/studio/*`).

Used by:

- Public shop (Vercel storefront) — `VITE_API_URL` → this server
- Owner control panel / Site Studio (separate Vercel project) — same API

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, PUBLIC_SITE_URL, STUDIO_URL, FRONTEND_URL
npm run dev
```

Create the owner account once:

```bash
npm run seed:admin
```

## Production

### Vercel (this repo)

Uses [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) — default export from `src/app.ts`.

**Project settings (important):**

| Setting | Value |
|---------|--------|
| Framework Preset | **Other** (or Express if listed) |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build` (optional typecheck) or leave default |
| **Output Directory** | **empty** — do not set `dist` |

In **Settings → Environment Variables** (Production):

| Variable | Required |
|----------|----------|
| `MONGODB_URI` | Yes — Atlas connection string |
| `JWT_SECRET` | Yes — long random string |
| `PUBLIC_SITE_URL` | Yes — shop Vercel URL |
| `STUDIO_URL` | Yes — studio Vercel URL (when ready) |
| `FRONTEND_URL` | Shop URL (CORS fallback) |
| `CORS_ORIGINS` | Optional comma list of allowed origins |

After first deploy, run `npm run seed:admin` locally with the same `MONGODB_URI`, or seed via a one-off script.

Test: `https://YOUR-API.vercel.app/health` → `{ "ok": true }`

### Node host (Render / Railway)

```bash
npm run build
npm start
```

Set env vars from `.env.example`.

After deploy, set on **both** Vercel frontends:

- `VITE_API_URL=https://your-api-host`

And on this server:

- `PUBLIC_SITE_URL` = shop Vercel URL
- `STUDIO_URL` = studio Vercel URL
- `FRONTEND_URL` / `CORS_ORIGINS` = both origins

## Main website repo

Shop + studio UI live in [Ms-Global](https://github.com/movizishfaq/Ms-Global). This repo is **API only**.
