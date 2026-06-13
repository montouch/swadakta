# Swadakta Deployment Status

Last checked: June 13, 2026

## Current Vercel State

- Vercel team found: `brownriley37-2646's projects`
- Team ID: `team_StYyDW74Frdhxtyulw3o2EUI`
- Project: `swadakta`
- Project ID: `prj_1AtCToo5VAYDlIjwddKMK9KaZ7hb`
- Latest production app release verified: `2026-06-13-route-safe-sumsub-webhook-v1`
- Latest production app behavior verified: `POST /api/identity/sumsub-webhook` reaches Sumsub-specific setup/signature handling instead of the normal signed-in user flow.
- Latest pushed GitHub `main` commit observed during rate limit: `0892a04` (`Guard Sumsub webhook route health`)
- Latest deployed GitHub `main` commit observed before the rate limit: `e1de751` (`Keep Sumsub webhook route within identity function`)
- Production health passed for `https://swadakta.com` with release marker `2026-06-13-route-safe-sumsub-webhook-v1`.
- Commit `0892a04` is not live yet because Vercel returned `Deployment rate limited - retry in 24 hours.` Its code is a checker/release-marker guard for the Sumsub route behavior already verified manually on production.
- Git integration is connected to `montouch/swadakta` on `main`; the latest push created a fresh production deployment.
- Chrome is logged into Vercel for this team.
- Local `.vercel/project.json`: present locally and ignored by Git.
- `vercel` CLI on PATH: not present.
- A temporary Vercel CLI install was tested under `%TEMP%`, but `whoami`/`deploy` hung without useful output. Use the Vercel dashboard first for manual redeploy and Git-setting checks.
- Vercel connector can inspect deployments, but its deploy helper only returns CLI instructions in this environment.
- Current deployed serverless shape is 12 Node functions. Vercel's Node.js runtime builds `/api` files as functions, so `scripts/check-production.mjs` now guards that budget before deploy; keep shared helpers in `lib/` instead of adding extra files under `api/`. Reference: https://vercel.com/docs/functions/runtimes/node-js
- June 13, 2026 note: Sumsub webhook handling is folded into `/api/identity/start-verification` and exposed by a Vercel rewrite from `/api/identity/sumsub-webhook`, so ID verification automation does not add a 13th function.
- June 13, 2026 rate-limit note: Vercel currently reports deployment rate limiting on new pushes. Vercel's published limits page lists Hobby deployments as limited per 86,400-second window. During a rate-limit window, keep improvements local, run local/static checks, and avoid repeated pushes unless production must be fixed.
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

Use this when production health says the release is stale, or when GitHub shows a failed Vercel status:

1. Run the deployment-state checker:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/deployment-state.mjs
```

2. Open the Vercel project deployment page when the checker says the Vercel state needs review:
   - https://vercel.com/brownriley37-2646s-projects/swadakta/deployments
3. Check the GitHub commit status if the checker cannot reach GitHub:
   - `https://api.github.com/repos/montouch/swadakta/commits/<sha>/status`
4. If the failure says `Deployment rate limited - retry in 24 hours`, do not keep pushing cosmetic changes. Wait for the deployment window to reset or upgrade the Vercel plan if launch urgency justifies it.
5. If the failure is not a rate limit, open Vercel project Git settings and confirm:
   - Git repository is `montouch/swadakta`.
   - Production branch is `main`.
   - Auto-deploy is enabled for production branch pushes.
   - There is no ignored-build-step rule blocking the latest commits.
6. If Git settings look correct, manually trigger a production redeploy from the dashboard or reconnect the GitHub integration.
7. After deployment is `READY`, run:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/check-production.mjs
```

Production is current only when `https://swadakta.com/release.json` reports the local `release.json` `release_id`.

During a Vercel rate-limit window:

- Do not add extra files under `api/`; keep the 12-function shape stable.
- Batch local changes into one commit after running local syntax/secret/targeted checks.
- Delay pushes that are not urgent because each push will create another failed Vercel status until the limit resets.
- Before the first retry push, run `git status --short`, `git log --oneline -5`, and the targeted local checks for the files changed.

## Fallback Notes

Cloudflare Pages remains a fallback because the repo includes `_headers` and `_redirects`, but Vercel is now the production host. Avoid the Vercel **clone from URL** flow for this project because it attempts to create a duplicate Git repository instead of importing the existing `montouch/swadakta` repo.
