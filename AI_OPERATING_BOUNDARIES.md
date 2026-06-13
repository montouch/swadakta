# Swadakta AI Operating Boundaries

Swadakta can use AI to reduce admin load, but the system must remain useful when AI mode is off.

## Modes

- `AI on` / `AI mode on`: show assistant links, the floating screen assistant, admin prompt packs, draft helpers, and safe recommendation flows.
- `AI off` / `Manual mode`: hide AI-only shortcuts, remove the floating assistant dock, disable assistant-only chat inputs, and keep the manual queues, provider dashboards, verification pages, tracking, messages, payments, and admin tools usable.

The browser preference is stored as `swadakta_ai_mode`. `off` means manual mode; any other value means AI mode is allowed.

## User AI

User AI may help clients and receivers:

- Understand the current page and next step.
- Draft job briefs, messages, proof updates, and issue summaries.
- Navigate to safe Swadakta pages.
- Explain payment, verification, proof, rules, and dispute workflows.
- Prepare sanitized escalation summaries for admin review.

User AI must not see admin-only data, private founder economics, provider secrets, raw identity documents, payment credentials, or other users' private records.

## Admin AI

Admin AI is the operations supervisor. It may:

- Summarize queues and unresolved issues.
- Draft client replies, receiver instructions, payment reminders, proof checklists, and provider handoff notes.
- Rank receiver offers as recommendations using price, timing, proof plan, provenance, verification, vetting, and route fit.
- Convert messy work into compact founder prompts such as `Yes`, `No`, `Need evidence`, `Hold`, `Approve draft`, or `Escalate`.
- Create internal notes or user notifications only after the system avoids raw sensitive data.

Admin AI should ask the founder/admin small questions, then wait. It should not create long manual-review burdens.

## Protected Decisions

These decisions are never autonomous:

- Marking payment as paid, deposit paid, refunded, released, or reconciled.
- Releasing receiver payouts or milestone money.
- Marking ID verification as verified.
- Vetting, rejecting, or assigning a receiver for paid work.
- Changing provenance scores manually.
- Sending WhatsApp, email, SMS, or external messages.
- Clearing restricted goods, customs, tax, legal authority, safety, property-title, high-value, or financial-service questions.
- Adding or removing admin users.
- Exposing private documents or deleting records.

The system needs provider evidence, system evidence, or explicit founder/admin confirmation before any protected decision changes state.

The server AI routes now run a protected-action preflight before the model is called. If a prompt directly asks AI to release/refund money, mark payment paid, verify ID, vet/assign a receiver, change a provenance seal, send an external message, change admin access, provide legal/tax/customs/title/financial advice, or reveal secrets, Swadakta returns a deterministic `Founder approval required` response instead of letting the model improvise. If the user only asks for a draft, summary, checklist, or risk review, the request can continue, but the protected-action warning is passed into the model context.

## Data Boundary

- User AI can send sanitized summaries upward to admin AI.
- Admin AI can send sanitized status, requests for evidence, and approved notifications downward to users.
- User AI cannot command admin AI.
- Admin AI cannot expose admin-only context to users.
- No service role keys, OpenAI keys, payment secrets, ID-provider secrets, or raw provider credentials belong in browser code or model prompts.
- Prompt context should use minimum necessary data: request code, route, status, missing evidence, safe notes, and public workflow facts.

## Manual Fallback

Manual mode must always work:

1. Admin checks provider payment evidence before marking funds paid.
2. Admin checks ID-provider evidence before paid posting, receiver work, or assignment.
3. Admin checks route legality, restricted goods, customs, tax, and safety blockers.
4. Admin confirms milestone proof before release decisions.
5. Admin writes user-facing messages manually when AI is off.

This is the launch rule: automation runs the rails, AI drafts and prioritizes, providers supply evidence, and founder/admin approval controls protected decisions.
