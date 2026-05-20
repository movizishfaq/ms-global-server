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

```bash
npm run build
npm start
```

Host on Render, Railway, Fly.io, etc. Set env vars from `.env.example`.

After deploy, set on **both** Vercel frontends:

- `VITE_API_URL=https://your-api-host`

And on this server:

- `PUBLIC_SITE_URL` = shop Vercel URL
- `STUDIO_URL` = studio Vercel URL
- `FRONTEND_URL` / `CORS_ORIGINS` = both origins

## Main website repo

Shop + studio UI live in [Ms-Global](https://github.com/movizishfaq/Ms-Global). This repo is **API only**.
