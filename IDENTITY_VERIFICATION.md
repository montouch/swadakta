# Swadakta Identity Verification

Swadakta should treat every user as a verified counterpart before paid or sensitive work proceeds. That includes global clients, African clients, receivers, runners, shoppers, sourcing agents, or specialist partners.

## Provider Choice

Default Africa provider: Smile ID.

Current app routing:

- Nigeria or Ghana: Youverify first, then Smile ID, then Sumsub, then manual exception if provider coverage fails.
- Other African countries: Smile ID first, then Sumsub, then country-specific provider if useful, then manual exception.
- Australia, USA, Europe, China, and broader global corridors: Sumsub first, then Smile ID if African ID/corridor evidence is involved, then manual exception.
- Persona and Stripe Identity remain evaluated future rails until the database/provider constraint is expanded and the owner has approved provider accounts.

Why:

- Smile ID has Kenya-specific KYC coverage for National ID, passports, Alien IDs, KRA PIN checks, document verification, and AML-style workflows.
- It is built for African identity verification and low-bandwidth capture conditions.
- It supports the exact trust problem Swadakta needs to solve: proving users are real before client funds, receiver assignments, sensitive documents, or local errands are handled.
- Sumsub is the broader current global fallback because the app already accepts `sumsub` as a provider and Sumsub publishes a supported-documents/countries catalog.
- Youverify is useful for selected African and multi-country KYC/document-capture routes, but Swadakta still treats it as provider-confirmed rather than automatic approval.

Useful provider references:

- https://smile.id/countries/kenya
- https://docs.usesmileid.com/
- https://docs.usesmileid.com/products/for-individuals-kyc/document-verification/enhanced-document-verification
- https://docs.usesmileid.com/supported-id-types/for-individuals-kyc/backed-by-id-authority/supported-countries/kenya/national-id

Global alternatives to evaluate as Swadakta expands:

- Persona government ID verification for wider global document coverage: https://withpersona.com/product/verifications/government-id/
- Sumsub supported documents and KYC workflows: https://sumsub.com/supported-documents/
- Stripe Identity where Stripe supports the business location and use case: https://docs.stripe.com/identity
- Youverify for Africa-specific backup checks: https://youverify.co/

Provider coverage rule:

- Do not promise that a provider will support a user until the exact document, country, and verification level are confirmed in the provider dashboard or API.
- Do not mark Swadakta verified from user screenshots alone. Store provider result evidence, reference, and timestamp.
- Manual review is a fallback only for provider outage, unsupported country/document, document mismatch, suspected fraud, local-law uncertainty, safety risk, or sensitive/high-value work.

## Current Implementation

- Account profiles default to `identity_verification_provider = 'smile_id'` and `identity_verification_status = 'not_started'` for the Africa-first workflow.
- Public client requests require ID-verification consent and default to request verification status `required`.
- Receiver applications default to `identity_verification_provider = 'smile_id'`.
- Receiver applications default to `identity_verification_status = 'not_started'`.
- Admin can store account-level provider, status, verification link, reference, verified timestamp, and notes for every saved user account.
- Admin can store provider, status, verification link, reference, verified timestamp, and notes.
- `/api/identity/start-verification` is the server-side provider handoff used by the existing Stitch Verification page and Account Home form after a request is saved.
- If `SMILE_ID_VERIFICATION_URL`, `SUMSUB_VERIFICATION_URL`, or `YOUVERIFY_VERIFICATION_URL` is configured in Vercel, the endpoint attaches a provider link and reference to the user's open verification request.
- If `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`, and `SUMSUB_LEVEL_NAME` are configured in Vercel, the endpoint creates a native Sumsub WebSDK external link server-side and stores the Sumsub/Swadakta reference.
- If no provider handoff URL is configured yet, the endpoint keeps the request queued and tells the user that paid posting and paid receiver work remain locked until provider evidence is attached.
- `POST /api/identity/sumsub-webhook` is a dedicated public webhook URL rewritten to the shared identity Vercel Function. The handler routes by URL, verifies Sumsub's signed webhook digest, matches the provider external user reference to the Swadakta verification request, and updates account verification from provider evidence.
- Sumsub webhook updates are monotonic for any terminal identity result. A later non-final provider callback such as `submitted` or `manual_review` cannot downgrade an existing `verified`, `failed`, `expired`, or `cancelled` result.
- Account-level provider ID evidence now syncs to matching receiver applications by email. This lets one verified Swadakta account support both client and job-seeker use, while receiver vetting still remains a separate Swadakta review.
- Portal users see their account KYC status, provider, and verification link when available.
- Receiver portal also shows the applicant their receiver-specific KYC status, provider, reference, and verification link when available.
- Database constraint blocks `status = 'vetted'` unless ID consent is true and `identity_verification_status = 'verified'`.
- Database trigger blocks assigning any receiver to a client request unless that receiver is vetted and ID-verified.
- Assigned-job access also checks that the receiver remains vetted and ID-verified.

## Operating Workflow

1. Client or receiver creates/opens a portal account and saves an account profile.
2. The app saves a verification request, then calls `/api/identity/start-verification` to prepare a Smile ID, Sumsub, Youverify, or approved-provider link when configured.
3. User completes verification.
4. If Sumsub signed webhook evidence is configured, Swadakta records the result automatically. Otherwise admin records the provider result as `verified`, with the provider reference and timestamp.
5. When the account becomes provider-verified, Swadakta syncs that provider evidence to any receiver application using the same email. This does not make the receiver `Vetted`; it only proves the ID gate.
6. Client requests can proceed to paid or sensitive work only after account/request verification is handled.
7. Receivers also apply through `/portal` for field work.
8. Founder console reviews receiver suitability, proof standards, coverage, provenance, and safety before vetting.
9. Only then can admin mark the receiver as `Vetted`.
10. Only vetted and verified receivers can be assigned to client jobs.

## Next API Step

Current Vercel handoff setup:

- `SMILE_ID_VERIFICATION_URL`: hosted Smile ID or provider-approved handoff URL.
- `SUMSUB_VERIFICATION_URL`: hosted Sumsub/WebSDK or provider-approved handoff URL.
- `YOUVERIFY_VERIFICATION_URL`: hosted Youverify or provider-approved handoff URL.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Vercel secret used by `/api/identity/start-verification` to attach the provider reference/link to the user's saved request.

Native Sumsub setup:

- `SUMSUB_APP_TOKEN`: Sumsub app token from the Sumsub dashboard.
- `SUMSUB_SECRET_KEY`: Sumsub secret key used to sign REST requests.
- `SUMSUB_LEVEL_NAME`: Sumsub verification level name for Swadakta users.
- `SUMSUB_WEBSDK_LINK_TTL_SECONDS`: optional WebSDK external-link lifetime; defaults to 1800 seconds.
- `SUMSUB_WEBHOOK_SECRET`: Sumsub webhook secret for `POST /api/identity/sumsub-webhook`.
- Sumsub webhook URL: `https://swadakta.com/api/identity/sumsub-webhook`.

The handoff endpoint is not a verification result. It must not mark anyone verified. It only prepares the provider route, stores the reference/link, and keeps the paid-action gate locked.

Once provider accounts and API credentials are available, add provider-specific server functions or extend the Vercel handoff so it can:

- Create Smile ID verification jobs/sessions server-side for African users.
- Keep Sumsub WebSDK links and signed webhook results active for wider global users where selected.
- Create Persona or Stripe Identity verification sessions server-side if the provider and owner legal setup are later approved.
- Store the provider job reference on account verification requests and `partner_applications`.
- Handle provider webhook callbacks.
- Updates `identity_verification_status`, `identity_verified_at`, and notes from provider results.

Provider API secrets must not be placed in browser JavaScript. Store them as Supabase secrets and call the provider only from server-side code.
