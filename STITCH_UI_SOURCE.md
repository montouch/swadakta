# Stitch UI Source Contract

Google Stitch is the visual source of truth for Swadakta workflow screens.

The production app may layer in metadata, route links, script tags, Supabase/Auth wiring, payment provider calls, AI guardrails, and hidden state needed for functionality. It should not invent replacement visual page designs in code.

When the visual direction changes, update the matching screen in Stitch first, export/import that exact screen, then reconnect the functional hooks. Code-only work is allowed for backend, auth, health checks, data wiring, validation, and provider integrations, but not for creating a substitute page design.

## Required screen sources

| Route | Stitch source |
| --- | --- |
| `/` | `swadakta_home_final_ux_refined` |
| `/about` | `about_possibilities_swadakta_final_ux_prompted` |
| `/auth` | `support_auth_swadakta_final_ux_coverage` |
| `/login` | `welcome_swadakta_final_ux` |
| `/portal` | `dashboard_swadakta_signed_in`, `dashboard_swadakta_mobile_signed_in`, `account_setup_profile_swadakta_final_ux_coverage`, `find_work_swadakta_final_ux` |
| `/assistant` | `ai_assistant_swadakta_final_ux_coverage` |
| `/brief` | `create_brief_swadakta_final_ux`, `post_a_job_swadakta_final_ux` |
| `/corridor` | `corridor_place_intelligence_swadakta_final_ux_coverage` |
| `/tracking` | `track_request_swadakta_final_ux_calm` |
| `/messages` | `messages_proof_swadakta_final_ux_coverage` |
| `/notifications` | `notifications_swadakta_final_ux_coverage` |
| `/verification` | `verification_center_swadakta_final_ux_coverage` |
| `/trust` | `trust_rules_swadakta_final_ux_coverage` |
| `/payments` | `payment_milestones_swadakta_final_ux_coverage` |
| `/resolution` | `dispute_resolution_swadakta_final_ux_coverage` |
| `/rules` | `trust_rules_swadakta_final_ux_coverage` |
| `/admin` | `admin_console_swadakta_final_ux_exception_cockpit` redirect |
| `/admin-ops` | `admin_console_swadakta_final_ux_exception_cockpit` |
| `/admin-verification` | `admin_verification_queue_swadakta_final_ux_coverage` |
| `/admin-readiness` | `admin_readiness_launch_gate_swadakta_final_ux_coverage` |

## Stitch visual polish QA

Every Stitch screen export must pass this visual standard before it is copied into the live site:

- Tabs, chips, buttons, cards, sidebars, top bars, bottom mobile nav, request workflow tabs, Find Jobs filters, and admin tabs must be symmetrical, evenly spaced, visually balanced, and aligned to the same grid rhythm.
- Words must fit inside their tabs, buttons, cards, and tiles on phone, tablet, and desktop. No text may spill out, clip, overlap icons, wrap awkwardly, or push nearby content out of alignment.
- Phone layouts are the priority check. Use shorter labels, familiar icons, stacked mobile labels, controlled two-line wrapping, and at least 44px touch targets.
- Keep the Final UX look consistent: white/light pages for normal users, black/dark pages for admin only, glass panels, soft 3D tiles/buttons, simple visual-first layouts, and less copy wherever an icon plus short label is clearer.
- Fix small visual defects before export: uneven tab widths, crowded filters, misaligned chips, inconsistent icon/text gaps, cramped mobile rows, button labels touching edges, unequal card heights, and text overflowing tiles.

Stitch prompt used for this project:

```text
Create a screen named "Swadakta UI Polish QA - Mobile Symmetry". It must show the final design standard for every Swadakta page: all tabs, chips, buttons, cards, nav items, sidebars, top bars, bottom mobile nav, request workflow tabs, Find Jobs filters, and admin tabs must be symmetrical, evenly spaced, visually balanced, and mobile-safe. Words must always fit inside tabs/cards/buttons on phone, tablet, and desktop with no clipping, spilling, overlap, cramped wrapping, or misaligned icons. Use shorter labels, icons, stacked mobile labels, equal padding, 44px minimum touch targets, aligned grids, equal card heights, and clean glass/3D Final UX styling. Include desktop and phone examples. White/light pages are normal users; black/dark pages are admin only.
```

## Guardrail

Every required workflow screen must include:

- `data-stitch-source` with the matching Stitch folder name or names.
- `data-stitch-integration` describing the allowed functional layer.

Run the health check before every demo or deploy:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/check-production.mjs
```

If the health check says a Stitch source marker is missing, restore the page from Stitch or update the exported Stitch source first, then reconnect the functional hooks.
