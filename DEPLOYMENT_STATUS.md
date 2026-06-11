# Swadakta Deployment Status

Last checked: June 11, 2026

## Current Vercel State

- Vercel team found: `brownriley37-2646's projects`
- Team ID: `team_StYyDW74Frdhxtyulw3o2EUI`
- Projects listed in that team: none
- Chrome is logged into Vercel for this team.
- Vercel's normal GitHub import flow is waiting for the Vercel GitHub app to be installed/authorized.
- Local `.vercel/project.json`: not present
- `vercel` CLI on PATH: not present
- Vercel connector deployment response: deployment requires `vercel deploy` from the project root or a Git integration that deploys on push.

## Domain

- `swadakta.com` has been purchased in Cloudflare under `swadakta111@gmail.com`.
- DNS is still pending because there is not yet a deployed Vercel project target.
- After Vercel creates the project, add both `swadakta.com` and `www.swadakta.com` to the Vercel project, then copy the exact DNS records Vercel gives into Cloudflare.

## Fastest Go-Live Path

1. In Vercel, click **Install** for the GitHub application.
2. Authorize access to `montouch/swadakta` only, if GitHub offers repository-level selection.
3. Import `montouch/swadakta`.
4. Use the repo root as the project root.
5. Framework preset: Other/static.
6. Build command: leave empty.
7. Output directory: leave empty or use the project root, depending on Vercel's static-project prompt.
8. Deploy `main`.
9. Add both `swadakta.com` and `www.swadakta.com` to the Vercel project.
10. Add the Vercel-provided DNS records in Cloudflare.
11. Redirect `www.swadakta.com` to `swadakta.com`.
12. Verify:
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

## Fallback Path

If GitHub app authorization is not approved, create a manual Vercel deployment by uploading a clean static folder that contains only the public site files. This can get the domain live, but future updates will need manual redeploys until Git integration is connected.

Cloudflare Pages is also ready as a fallback because the repo includes `_headers` and `_redirects`. Cloudflare Direct Upload can publish the static assets from the dashboard, then `swadakta.com` can be attached from the Pages project's **Custom domains** tab. Cloudflare's docs note that Direct Upload projects cannot be switched to Git integration later, so prefer Git import when automatic deployments are available.
