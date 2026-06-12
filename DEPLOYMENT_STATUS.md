# Swadakta Deployment Status

Last checked: June 13, 2026

## Current Vercel State

- Vercel team found: `brownriley37-2646's projects`
- Team ID: `team_StYyDW74Frdhxtyulw3o2EUI`
- Project: `swadakta`
- Project ID: `prj_1AtCToo5VAYDlIjwddKMK9KaZ7hb`
- Latest production deployment observed: `dpl_yNLSqLg7ZteGXu6PbVgEoWGkhShr`
- Latest production app commit verified: `5bcb3a7` (`Add job acceptance gate to rules flow`)
- Latest GitHub `main` commit locally: `5bcb3a7` (`Add job acceptance gate to rules flow`)
- Production health passed for `https://swadakta.com` with release marker `2026-06-13-job-acceptance-gate-v1`.
- Git integration is connected to `montouch/swadakta` on `main`; the latest push created a fresh production deployment.
- Chrome is logged into Vercel for this team.
- Local `.vercel/project.json`: present locally and ignored by Git.
- `vercel` CLI on PATH: not present.
- A temporary Vercel CLI install was tested under `%TEMP%`, but `whoami`/`deploy` hung without useful output. Use the Vercel dashboard first for manual redeploy and Git-setting checks.
- Vercel connector can inspect deployments, but its deploy helper only returns CLI instructions in this environment.
- Current deployed serverless shape is 12 Node functions. Vercel's Node.js runtime builds `/api` files as functions, so `scripts/check-production.mjs` now guards that budget before deploy; keep shared helpers in `lib/` instead of adding extra files under `api/`. Reference: https://vercel.com/docs/functions/runtimes/node-js
- June 13, 2026 note: Sumsub webhook handling is folded into `/api/identity/start-verification` and exposed by a Vercel rewrite from `/api/identity/sumsub-webhook`, so ID verification automation does not add a 13th function.
- `release.json` is the production freshness marker. If `scripts/check-production.mjs` reports that `/release.json` is missing or that `release_id` does not match the repo, production is stale even if the public pages still load.

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

## Current Deployment Recovery

Use this when production health says the release is stale:

1. Open the Vercel project deployment page:
   - https://vercel.com/brownriley37-2646s-projects/swadakta/deployments
2. Confirm whether a deployment exists for commit `10eb86a`.
3. If it does not exist, open Vercel project Git settings and confirm:
   - Git repository is `montouch/swadakta`.
   - Production branch is `main`.
   - Auto-deploy is enabled for production branch pushes.
   - There is no ignored-build-step rule blocking the latest commits.
4. If Git settings look correct, manually trigger a production redeploy from the dashboard or reconnect the GitHub integration.
5. After deployment is `READY`, run:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/check-production.mjs
```

Production is current only when `https://swadakta.com/release.json` reports `2026-06-13-job-acceptance-gate-v1` or a newer release.

## Fallback Notes

Cloudflare Pages remains a fallback because the repo includes `_headers` and `_redirects`, but Vercel is now the production host. Avoid the Vercel **clone from URL** flow for this project because it attempts to create a duplicate Git repository instead of importing the existing `montouch/swadakta` repo.
