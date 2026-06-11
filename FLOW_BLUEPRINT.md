# Swadakta Flow Blueprint

This is the simplified website flow to use before rebuilding the interface in Google Stitch.

## Decision

Swadakta should not feel like separate client, receiver, and admin products. It should feel like one trusted corridor account with role-based paths inside it.

The winning flow is:

1. Landing page explains the promise in one sentence.
2. Primary action is `Create account`.
3. Account creation asks one question: `How do you want to use Swadakta?`
4. User chooses `Client`, `Job seeker`, or `Both`.
5. The signed-in account shows the relevant next steps.
6. Identity verification is tied to the person, current country/base, and risk level.
7. Founder/admin only appears for protected exceptions.

## Comparable Product Review

- Upwork supports client and freelancer profiles under one login and warns against duplicate accounts.
  Source: https://support.upwork.com/hc/en-us/articles/211067558-How-to-be-a-client-and-a-freelancer-on-Upwork
- Fiverr starts accounts as client accounts, then lets users activate a freelancer/seller path later.
  Source: https://help.fiverr.com/hc/en-us/articles/360050063113-Creating-your-Fiverr-account
- Taskrabbit separates the worker onboarding path but keeps the steps simple: account, profile, location/skills, identity verification.
  Source: https://support.taskrabbit.com/hc/en-us/articles/46260467885979-How-Do-I-Become-a-Tasker
- Airbnb makes identity verification a platform trust layer for both sides and may re-verify after account changes or risk signals.
  Source: https://www.airbnb.com/help/article/1237

## Review Pass 1

The old Swadakta flow asks a new user to understand client portal, receiver portal, tracking, admin, AI desk, pricing, and intake before they know what account they need. That is too much cognitive load.

Fix: make the first decision simple: `I need help`, `I want work`, or `Both`.

## Review Pass 2

Swadakta is not only a diaspora-to-Kenya service anymore. It is a corridor marketplace with trust, proof, payments, compliance, and receiver accountability.

Fix: avoid country-specific account labels. Kenya can remain an early operating lane, but the account flow should say `current country`, `operating base`, and `coverage areas`.

## Final Site Structure

### 1. Landing Page

Goal: explain Swadakta quickly and move users to one account.

Hero:

- Headline: `One account for trusted help and paid corridor work.`
- Supporting copy: `Request errands, sourcing, parcel handoffs, proof checks, family support, or business operations. Or get verified to receive paid corridor work.`
- Primary CTA: `Create account`
- Secondary CTA: `Start a brief`
- Secondary CTA: `Apply for work`

First section:

- `Client mode`: request help, receive quotes, pay safely, track proof.
- `Job seeker mode`: apply, verify ID, add coverage/skills, receive assigned jobs.
- `Both mode`: one account can request jobs and receive jobs.

### 2. Account Page

One login/register form:

- Email
- Password
- Mobile / WhatsApp backup number for account creation
- Account type:
  - Client
  - Job seeker
  - Both
- Buttons: `Sign in`, `Create account`
- Secondary options: `Continue with Google`, `Continue with Apple`, `Forgot password?`, `Email code fallback`
- Mobile login can be added later after SMS/WhatsApp provider setup; until then the mobile number is stored as a backup contact.

After login:

- Account profile card:
  - Full name
  - WhatsApp
  - Current country or diaspora base
  - Operating base or coverage area
  - Preferred currency
  - Account role
  - Verification status
  - Request verification button

### 3. Client Dashboard

Visible inside the same account:

- Start a new brief
- See linked requests
- Track a request by code
- View quote, payment state, proof requirements, milestones, and final report
- Leave a review after completion

### 4. Job Seeker Dashboard

Visible inside the same account:

- Apply for work
- Select coverage areas
- Select work categories
- Add availability and transport/access notes
- View vetting status
- View provenance score
- See assigned jobs only after:
  - ID verified
  - application vetted
  - job funded or approved
  - assignment made

### 5. Verification Flow

Every user can request verification from the account card.

Verification status belongs to the person, but Swadakta can require re-checks when:

- user changes current country or operating base
- user changes legal name or contact identity
- user becomes a job seeker after being client-only
- user handles sensitive documents
- user works on a high-value job
- user handles goods that may involve customs or restricted categories
- the payment route or corridor creates extra risk

Provider logic:

- Africa-first: Smile ID.
- Wider global fallback: Sumsub, Persona, Stripe Identity, or manual provider review.
- Swadakta should not store raw ID documents in the normal app UI.
- Verification links should be provider-hosted, with only status/reference stored in Swadakta.

### 6. Admin / Founder Console

Admin is not a normal user path.

Admin handles:

- protected payment decisions
- ID review exceptions
- receiver vetting
- high-value escrow/milestone release
- unsupported corridors
- legal/customs uncertainty
- disputes, refunds, and safety issues

AI handles:

- routine triage
- missing-info checklists
- quote draft preparation
- client update drafts
- receiver brief drafts
- proof checklist preparation
- admin note drafts

AI must not autonomously:

- release funds
- mark ID verified
- assign risky receivers
- send external legal/payment commitments
- approve restricted goods
- handle disputes without founder approval

## Google Stitch Build Prompt

Build a clean HD glass-style SaaS website for `Swadakta`, a trusted global corridor concierge and job marketplace. Use the visual direction of the provided SaaS reference: white and pale blue glass sections, glossy 3D buttons/objects, clean black text, generous spacing, simple cards, and a professional trust-focused marketplace feel.

Create these screens:

1. Landing page with hero, clear one-account message, CTAs for `Create account`, `Start a brief`, and `Apply for work`.
2. Account/login page with email/password sign-in, account creation, mobile/WhatsApp backup number, social sign-in options, password reset, and account type selector: Client, Job seeker, Both.
3. Signed-in account dashboard with profile, verification status, and three tabs: Client, Job seeker, Both/Overview.
4. Client brief flow: route, task location, service type, proof needed, goods/logistics, payment preference, consent, submit.
5. Job seeker onboarding flow: identity, current country/base, coverage areas, categories, availability, transport/access, references, submit.
6. Request tracking page: request code, status, payment, milestones, proof, report, review.
7. Admin/founder console concept: action queues for ID, payment, receiver vetting, proof, compliance, release decisions, and AI drafts.

Design rules:

- One account, not separate portals.
- A user can be both client and job seeker.
- Do not lead with email-link-first language. Use normal account language: sign in, create account, password reset, social sign-in, email code fallback.
- Verification follows the person but can require re-check when country/base, role, value, or risk changes.
- Admin should feel hidden/operational, not a public marketing path.
- Use simple language; no jargon like receiver unless explained as job seeker/field partner.
- Keep the page clean, bright, glassy, and intuitive.
