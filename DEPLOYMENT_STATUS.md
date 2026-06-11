# Swadakta Deployment Status

Last checked: June 11, 2026

## Current Vercel State

- Vercel team found: `brownriley37-2646's projects`
- Team ID: `team_StYyDW74Frdhxtyulw3o2EUI`
- Projects listed in that team: none
- Local `.vercel/project.json`: not present
- `vercel` CLI on PATH: not present
- Vercel connector deployment response: deployment requires `vercel deploy` from the project root or a Git integration that deploys on push.

## Domain Availability

Vercel domain checker results on June 11, 2026:

- `swadakta.com`: available, `$11.25 USD` for 1 year
- `swadakta.co`: available, `$17.99 USD` for 1 year

Recheck immediately before purchase because domain availability and pricing can change.

Purchase/search URL:

- https://vercel.com/domains/search?q=swadakta.com

## Fastest Go-Live Path

1. In Vercel, create a new project from `montouch/swadakta`.
2. Use the repo root as the project root.
3. Framework preset: Other/static.
4. Build command: leave empty.
5. Output directory: leave empty or use the project root, depending on Vercel's static-project prompt.
6. Deploy `main`.
7. Buy or connect `swadakta.com`.
8. Add both `swadakta.com` and `www.swadakta.com` to the Vercel project.
9. Redirect `www.swadakta.com` to `swadakta.com`.
10. Verify:
    - `https://swadakta.com/`
    - `https://swadakta.com/privacy`
    - `https://swadakta.com/terms`
    - `https://swadakta.com/sitemap.xml`
    - `https://swadakta.com/.well-known/security.txt`

## CLI Path

When Vercel CLI is installed and authenticated:

```powershell
vercel link
vercel deploy --prod
```

After linking, `.vercel/project.json` should exist locally but should not be committed.
