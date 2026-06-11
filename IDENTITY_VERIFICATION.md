# Swadakta Identity Verification

Swadakta should treat every user as a verified counterpart before paid or sensitive work proceeds. That includes global clients, African clients, receivers, runners, shoppers, sourcing agents, or specialist partners.

## Provider Choice

Default Africa provider: Smile ID.

Why:

- Smile ID has Kenya-specific KYC coverage for National ID, passports, Alien IDs, KRA PIN checks, document verification, and AML-style workflows.
- It is built for African identity verification and low-bandwidth capture conditions.
- It supports the exact trust problem Swadakta needs to solve: proving users are real before client funds, receiver assignments, sensitive documents, or local errands are handled.

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

## Current Implementation

- Account profiles default to `identity_verification_provider = 'smile_id'` and `identity_verification_status = 'not_started'` for the Africa-first workflow.
- Public client requests require ID-verification consent and default to request verification status `required`.
- Receiver applications default to `identity_verification_provider = 'smile_id'`.
- Receiver applications default to `identity_verification_status = 'not_started'`.
- Admin can store account-level provider, status, verification link, reference, verified timestamp, and notes for every saved user account.
- Admin can store provider, status, verification link, reference, verified timestamp, and notes.
- Portal users see their account KYC status, provider, and verification link when available.
- Receiver portal also shows the applicant their receiver-specific KYC status, provider, reference, and verification link when available.
- Database constraint blocks `status = 'vetted'` unless ID consent is true and `identity_verification_status = 'verified'`.
- Database trigger blocks assigning any receiver to a client request unless that receiver is vetted and ID-verified.
- Assigned-job access also checks that the receiver remains vetted and ID-verified.

## Operating Workflow

1. Client or receiver creates/opens a portal account and saves an account profile.
2. Founder console sends an account-level Smile ID, Persona, Sumsub, Stripe Identity, or approved-provider verification link.
3. User completes verification.
4. Admin records the result as `verified`, with the provider reference and timestamp.
5. Client requests can proceed to paid or sensitive work only after account/request verification is handled.
6. Receivers also apply through `/portal` for field work.
7. Founder console sends receiver-specific verification where needed and records the provider result.
8. Only then can admin mark the receiver as `Vetted`.
9. Only vetted and verified receivers can be assigned to client jobs.

## Next API Step

Once provider accounts and API credentials are available, add Supabase Edge Functions that:

- Create Smile ID verification jobs/sessions server-side for African users.
- Create Persona, Sumsub, or Stripe Identity verification sessions server-side for wider global users where selected.
- Stores the provider job reference on `partner_applications`.
- Handles provider webhook callbacks.
- Updates `identity_verification_status`, `identity_verified_at`, and notes from provider results.

Provider API secrets must not be placed in browser JavaScript. Store them as Supabase secrets and call the provider only from server-side code.
