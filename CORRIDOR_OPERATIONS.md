# Swadakta Corridor Operating Model

Last updated: June 11, 2026

Swadakta should become a corridor operating layer, not a manual admin agency. The app should collect the brief, classify route and risk, require ID consent, route routine work to vetted receivers, and ask the founder only when the system reaches a protected decision.

## Launch Regions

Initial public regions:

- Africa
- Australia
- USA
- Europe
- China

Active launch lane:

- Africa to Australia, and Australia to Africa

Pilot lanes:

- Africa to USA
- Africa to Europe
- Africa to China
- USA, Europe, or China to Africa

Founder-review lanes:

- Any route that does not include Africa
- Any route outside the launch regions
- Any route where the receiver, courier, customs, payment, tax, or legal requirement is unclear

This keeps the vision global while protecting the business from promising coverage before Swadakta has vetted receivers, payment rails, courier rules, and local knowledge in that lane.

## Roles

Client:

- The person who creates and funds a request.
- May be outside Africa, inside Africa, or requesting work between any launch regions.
- Must consent to identity checks before paid, sensitive, high-value, or dispute-prone work proceeds.

Receiver/operator:

- The person or specialist partner who performs the physical, digital, sourcing, or verification task.
- Must be ID verified, vetted, and scored before receiving paid work.
- Starts with a 25% provenance seal and earns higher trust through verified identity, clean work, strong proof, and good reviews.

Founder:

- Owns protected decisions: money release, refunds, disputes, ID overrides, legal/customs uncertainty, high-value jobs, blocked jobs, and unsupported corridor lanes.
- Should not manually shepherd every normal request.

AI/autopilot:

- Classifies route, goods, logistics, value band, ID need, proof need, payment state, and founder-review status.
- Drafts client replies, receiver briefs, quote language, missing-info checks, and proof-review summaries.
- Never releases funds, verifies identity, assigns a receiver, sends external messages, or clears legal/customs risk without founder approval.

## Autopilot Flow

1. Client submits the intake with origin, destination, task location, direction, item/goods category, logistics mode, preferred payment, and compliance acknowledgement.
2. App classifies the route:
   - Active lane can proceed through AI triage.
   - Pilot lane needs founder review before quoting or assignment.
   - Unsupported lane needs founder approval or polite decline.
3. App classifies goods/logistics:
   - Digital-only and no-goods tasks can proceed through normal proof and ID rules.
   - Physical goods, courier/post, airport handoff, valuables, documents, food/plant/animal products, medicine/health products, cosmetics, or unsure items trigger compliance review.
4. App classifies money:
   - Quote-first always.
   - Provider-confirmed funds only.
   - Milestone release only after proof review.
   - No claim of licensed escrow unless a regulated escrow/payment provider is actually used.
5. Receiver is assigned only after ID and vetting gates pass.
6. Receiver submits proof links and updates.
7. AI can summarize the proof, but founder or authorized operator approves client-facing reports, milestone releases, disputes, and refunds.

## Legal And Shipping Rules

Swadakta should not promise that any physical item can be bought, shipped, carried, imported, or exported until the lane-specific rules are checked.

Risk triggers:

- Food, plants, seeds, animal products, soil, timber, or biological goods.
- Medicine, supplements, medical devices, chemicals, cosmetics, or health products.
- Cash, jewellery, high-value electronics, controlled documents, IDs, passports, title documents, or original legal records.
- Weapons, controlled goods, counterfeit items, sanctioned goods, restricted technology, or anything the user is unsure about.
- Airport handoffs or traveller hand-carry arrangements.
- Any client asking Swadakta to hide value, misdescribe goods, avoid customs, or bypass a law.

Useful compliance references:

- Australia Post customs declarations and CN23: https://auspost.com.au/business/shipping/parcels-international/customs
- Australia Post overseas parcel guidance: https://auspost.com.au/sending/parcels-overseas
- Australian Border Force prohibited goods: https://www.abf.gov.au/importing-exporting-and-manufacturing/prohibited-goods
- Australian Border Force importing by post or mail: https://www.abf.gov.au/buying-online/importing-by-post-or-mail
- Australian agriculture/biosecurity mailing rules: https://www.agriculture.gov.au/biosecurity-trade/travelling/bringing-mailing-goods
- Kenya Revenue Authority postal parcel clearance: https://www.kra.go.ke/news-center/blog/1523-procedures-for-clearance-of-your-imported-postal-parcels
- KRA customs and border control FAQ: https://www.kra.go.ke/helping-tax-payers/faqs/customs-and-border-control
- Posta Kenya tracking: https://postglobal.posta.co.ke/postglobaltrack/Track.aspx

## Identity Verification Strategy

Launch recommendation:

- Use Smile ID as the default Africa/Kenya verification layer because it is built for African identity checks, biometrics, AML screening, and low-bandwidth capture.
- Add Persona or Sumsub as the wider global verification layer when Swadakta starts verifying users across 200+ country-style document coverage.
- Consider Stripe Identity where Stripe is already the payment provider and the required region/use case is supported.

Operational rule:

- Every user can create an account, but paid/sensitive work is blocked until the relevant client, receiver, or mixed-role account is verified.
- Re-check identity at high-risk moments: high-value milestones, new payout destination, dispute, document/title work, or suspicious behavior.

Useful provider references:

- Smile ID: https://www.smileidentity.com/
- Stripe Identity: https://docs.stripe.com/identity
- Persona Government ID: https://withpersona.com/product/verifications/government-id/
- Sumsub supported documents: https://sumsub.com/supported-documents/

## Payment Strategy

Launch rails:

- Stripe for card payments in supported currencies.
- PayPal for invoice/order flow where clients prefer it.
- Wise or bank transfer for international transfers where settlement and receipt trails are clearer.
- M-Pesa through Safaricom Daraja for KES collection after business PayBill/Till, API credentials, and callback configuration are ready.

Milestone release rule:

- Client payment confirmation and receiver payout release are separate decisions.
- Receiver payout should be released bit by bit only after proof, client scope, dispute status, and founder margin are checked.
- The public app can show protected-funds and release status, but internal margin, receiver payout, and payment fees stay in the founder console.

## What To Build Next

1. Add provider-backed ID verification session creation for client and receiver accounts.
2. Add file upload for proof packs, receipts, ID provider results, and shipping labels using private storage.
3. Add route-specific compliance checklists for Africa, Australia, USA, Europe, and China lanes.
4. Add receiver availability, categories, country coverage, payout preference, and provenance sorting.
5. Add notification automation for missing info, quote sent, payment confirmed, receiver assigned, proof submitted, and milestone review.
6. Add marketplace-style job matching only after vetting and payout controls are mature.
