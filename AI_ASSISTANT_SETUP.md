# Swadakta AI Assistant Setup

Swadakta AI must run through a backend, not from browser JavaScript.

## Server-side secret

Add these secrets server-side only:

- `OPENAI_API_KEY`: OpenAI project API key
- `OPENAI_MODEL`: optional model override, default `gpt-5.5`

Use the same names in Supabase Edge Function secrets and Vercel environment variables. Do not place OpenAI keys in `app-config.js`, HTML, public JavaScript, GitHub, or any Vercel env exposed to the browser.

If an API key has ever been pasted into chat, a browser field, or any public file, treat it as compromised: revoke it in the OpenAI dashboard and add a fresh key only through Supabase/Vercel server-side secrets.

## Edge Function

Function name: `swadakta-assistant`

Primary route: Supabase Edge Function `swadakta-assistant`

Fallback route: Vercel Function `/api/ai/assistant`

Both routes accept authenticated POST requests with:

```json
{
  "role": "admin",
  "task": "draft quote follow-up",
  "context": {},
  "draft": ""
}
```

Both routes require a signed-in Supabase session. Admin operations additionally require the signed-in user's `user_id` to exist in `admin_users`.

It returns:

```json
{
  "role": "admin",
  "output": "Draft text...",
  "response_id": "resp_..."
}
```

## Safety boundary

Detailed operating rules live in `AI_OPERATING_BOUNDARIES.md`.

The assistant may draft, summarize, and recommend next steps. It must not release funds, assign a receiver, contact a client, or mark verification complete without founder/admin approval.

Both AI routes include a deterministic protected-action preflight. Direct protected-action prompts return a `Founder approval required` answer without calling the model. Draft-only prompts can still use AI, but the model receives the detected protected-action warning and must keep the answer in review mode.

The app must also work when AI mode is off. In manual mode, AI-only links, the floating assistant, and admin prompt packs are hidden or replaced with manual checklists while the queues, messages, payments, tracking, verification, and admin tools keep working.

The browser helper tries the Supabase Edge Function first. If the Edge Function is unavailable or missing its OpenAI secret, it falls back to the same-origin Vercel Function using the signed-in user's Supabase access token.

## Operating model

Swadakta should not depend on the founder manually remembering every next step. The app should run the routine flow through rules:

- New request arrives.
- App classifies the corridor, service direction, logistics mode, goods category, value band, funds preference, ID requirement, payment state, receiver state, proof state, and release state.
- Founder console shows the exact exception queue.
- AI drafts the next operational note or message only when language, judgment, or prioritization is useful.
- Admin/founder clicks to save or apply anything sensitive.

This is the intended split: automation runs the rails, AI handles the messy wording and reasoning, founder approves the trust-sensitive decisions.

## Action policy

Allowed with admin review:

- Draft client replies, quote messages, receiver briefs, and proof-review notes.
- Summarize request risk, missing information, and next best action.
- Suggest safe admin field values such as `status`, `service_package`, `quote_amount`, `quote_currency`, `payment_due_at`, `funds_status`, `protected_amount`, `release_condition`, `verification_status`, `verification_reason`, `operator_notes`, and `client_report`.
- Save an AI-generated operational draft into `operator_notes` when an admin clicks the dashboard button.

Never autonomous:

- Release or refund money.
- Mark payment as paid/deposit paid based only on AI judgment.
- Mark ID verification as verified.
- Vet, reject, or assign a receiver.
- Send WhatsApp/email/client messages externally.
- Change legal, tax, title, or financial advice boundaries.

The founder/admin must click to apply any suggested field changes.

## Current autonomous behavior

The public app can collect qualified corridor details from clients in the launch regions, including origin, destination, logistics mode, goods category, funds-protection preference, and value band. The admin app then automatically builds action queues for route risk, quote/payment links, funds guardrails, overdue payment, ID checks, receiver assignment, proof review, release decisions, compliance review, and margin risk.

The AI can now generate a draft from those queues and save that draft into the request's internal notes. It still cannot move money, clear customs/legal uncertainty, verify identity, assign receivers, or send external messages by itself.

## Provenance seals

Receivers start with a 25% provenance base score. Admin can adjust the review base and add review notes. The dashboard combines that base with ID verification, vetted status, completed jobs, clean updates, blocked updates, safety issues, cancelled jobs, and disputed milestones to create the visible receiver seal.

Client/job-giver seals are intentionally subtler. They are calculated from profile completeness, ID status, funded work, completed requests, cancellations, and disputes.

AI may summarize provenance risk, but it must not mark ID verified, vet a receiver, or silently raise a provenance score.
