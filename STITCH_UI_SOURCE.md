# Stitch UI Source Contract

Google Stitch is the visual source of truth for Swadakta workflow screens.

The production app may layer in metadata, route links, script tags, Supabase/Auth wiring, payment provider calls, AI guardrails, and hidden state needed for functionality. It should not invent replacement visual page designs in code.

When the visual direction changes, update the matching screen in Stitch first, export/import that exact screen, then reconnect the functional hooks. Code-only work is allowed for backend, auth, health checks, data wiring, validation, and provider integrations, but not for creating a substitute page design.

## Required screen sources

| Route | Stitch source |
| --- | --- |
| `/` | `swadakta_home_final_ux_refined` |
| `/auth` | `support_auth_swadakta_final_ux_coverage` |
| `/login` | `welcome_swadakta_final_ux` |
| `/portal` | `dashboard_swadakta_mobile_final_ux`, `account_setup_profile_swadakta_final_ux_coverage`, `find_work_swadakta_final_ux` |
| `/assistant` | `ai_assistant_swadakta_final_ux_coverage` |
| `/brief` | `create_brief_swadakta_final_ux` |
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

## Guardrail

Every required workflow screen must include:

- `data-stitch-source` with the matching Stitch folder name or names.
- `data-stitch-integration` describing the allowed functional layer.

Run the health check before every demo or deploy:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/check-production.mjs
```

If the health check says a Stitch source marker is missing, restore the page from Stitch or update the exported Stitch source first, then reconnect the functional hooks.
