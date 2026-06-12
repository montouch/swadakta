# Swadakta Deployment Status

Last checked: June 11, 2026

## Current Vercel State

- Vercel team found: `brownriley37-2646's projects`
- Team ID: `team_StYyDW74Frdhxtyulw3o2EUI`
- Project: `swadakta`
- Project ID: `prj_1AtCToo5VAYDlIjwddKMK9KaZ7hb`
- Latest production deployment: `dpl_6pAJQhrByR2SAdF95sy6RmQ3Mehy`
- Latest production app commit verified: `40d7f89` (`Add account-wide ID verification and auth redirect fix`)
- Git integration is connected to `montouch/swadakta` on `main`; pushes deploy automatically.
- Chrome is logged into Vercel for this team.
- Local `.vercel/project.json`: not present
- `vercel` CLI on PATH: not present
- Vercel connector can inspect deployments, but the local `vercel` CLI is still not installed.
- Current deployed serverless shape is 12 Node functions. Vercel's Node.js runtime builds `/api` files as functions, so `scripts/check-production.mjs` now guards that budget before deploy; keep shared helpers in `lib/` instead of adding extra files under `api/`. Reference: https://vercel.com/docs/functions/runtimes/node-js

## Domain

- `swadakta.com` is purchased in Cloudflare under `swadakta111@gmail.com`.
- `swadakta.com`, `www.swadakta.com`, and `swadakta.vercel.app` are assigned to the Vercel project with valid configuration.
- Cloudflare Domain Connect added the Vercel verification and DNS records:
  - `_vercel` TXT verification for `swadakta.com`
  - `_vercel` TXT verification for `www.swadakta.com`
  - apex CNAME/flattened record to `f0cf7e5aed3dc57f.vercel-dns-017.com`
  - `www` CNAME to `f0cf7e5aed3dc57f.vercel-dns-017.com`
- `www.swadakta.com` redirects to `https://swadakta.com` through `vercel.json`.

## Verified Production URLs

- `https://swadakta.com/` returns `200 OK`
- `https://www.swadakta.com/` returns `308 Permanent Redirect` to `https://swadakta.com/`
- `https://www.swadakta.com/privacy` returns `308 Permanent Redirect` to `https://swadakta.com/privacy`
- `https://swadakta.com/privacy` returns `200 OK`
- `https://swadakta.com/.well-known/security.txt` returns `200 OK`
- Production responses include CSP, HSTS, referrer, permissions, frame, and content-type hardening headers.

## Supabase Auth

- Auth Site URL is set to `https://swadakta.com`.
- Auth Redirect URLs include `https://swadakta.com/**`.
- Admin secure email sign-in has been verified in Chrome for `swadakta111@gmail.com`.

## CLI Path

When Vercel CLI is installed and authenticated:

```powershell
vercel link
vercel deploy --prod
```

After linking, `.vercel/project.json` should exist locally but should not be committed.

## Fallback Notes

Cloudflare Pages remains a fallback because the repo includes `_headers` and `_redirects`, but Vercel is now the production host. Avoid the Vercel **clone from URL** flow for this project because it attempts to create a duplicate Git repository instead of importing the existing `montouch/swadakta` repo.
