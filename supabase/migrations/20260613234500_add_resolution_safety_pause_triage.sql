create or replace function app_private.resolution_ai_triage(
  input_issue_type text,
  input_desired_outcome text,
  input_severity text,
  input_founder_required boolean
)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select concat_ws(
    ' ',
    case
      when input_severity = 'safety' then 'Safety issue: contact local emergency services first if anyone may be in immediate danger; then pause risky activity, preserve proof, and request founder/provider review.'
      when input_severity = 'legal' then 'Legal/compliance issue: pause quoting, buying, shipping, or release until human review.'
      when input_severity = 'payment' then 'Payment issue: freeze milestone release until provider evidence is checked.'
      else 'Routine issue: ask for missing proof, timeline, and preferred outcome before escalation.'
    end,
    case
      when input_issue_type in ('proof_missing', 'poor_quality') then 'Ask both sides for dated photos, receipts, location notes, or provider records.'
      when input_issue_type in ('payment_refund', 'payment_dispute') then 'Collect provider reference, amount, payment rail, and exact disputed milestone.'
      when input_issue_type = 'restricted_item' then 'Check item legality and courier/postal acceptance before any movement.'
      when input_issue_type = 'receiver_safety' then 'Capture who may be at risk, where the person is, whether emergency services or police were contacted, and which communication or handoff should stop.'
      when input_issue_type = 'delay' then 'Request the blocker, next checkpoint, and revised ETA.'
      else 'Summarize facts, evidence gaps, and the next safe message.'
    end,
    case
      when input_founder_required then 'Protected decision: AI may draft and summarize, but cannot refund, release money, mark payment paid, replace a receiver, approve ID, or clear legal/import risk.'
      else 'AI may draft the next message and checklist; admin review is only needed if evidence or risk changes.'
    end,
    concat('Requested outcome:', replace(input_desired_outcome, '_', ' ') || '.')
  );
$$;
