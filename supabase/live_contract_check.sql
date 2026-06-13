-- Swadakta live production contract check.
-- Run read-only in Supabase SQL editor or through the Supabase MCP execute_sql tool.
-- Expected result for launch-critical sections: ok = total and missing_or_bad is null.

with
required_tables(name) as (
  values
    ('admin_users'),
    ('account_profiles'),
    ('service_requests'),
    ('partner_applications'),
    ('field_updates'),
    ('fund_milestones'),
    ('identity_verification_requests'),
    ('resolution_cases'),
    ('job_offers'),
    ('account_notifications')
),
table_state as (
  select
    rt.name,
    c.relname is not null as exists,
    coalesce(c.relrowsecurity, false) as rls_enabled
  from required_tables rt
  left join pg_class c on c.relname = rt.name
  left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
),
required_policies(name) as (
  values
    ('Admins can read own admin profile'),
    ('Authenticated users can read permitted account profiles'),
    ('Users can create own account profile'),
    ('Users can update own account profile'),
    ('Verified accounts can submit service requests'),
    ('Admins can read service requests'),
    ('Admins can update service requests'),
    ('Anyone can apply as partner'),
    ('Admins can read partner applications'),
    ('Admins can update partner applications'),
    ('Admins can read field updates'),
    ('Admins can read fund milestones'),
    ('Admins can create fund milestones'),
    ('Admins can update fund milestones'),
    ('Users and admins can read identity verification requests'),
    ('Users can create own identity verification requests'),
    ('Admins can update identity verification requests'),
    ('Authenticated can read visible resolution cases'),
    ('Admins can update resolution cases'),
    ('Authenticated can read visible job offers'),
    ('Admins can update job offers'),
    ('Users can read own account notifications')
),
policy_state as (
  select
    rp.name,
    p.policyname is not null as exists
  from required_policies rp
  left join pg_policies p on p.schemaname = 'public' and p.policyname = rp.name
),
required_rpcs(schema_name, name) as (
  values
    ('public','save_account_profile'),
    ('public','get_my_account_profile'),
    ('public','track_service_request'),
    ('public','list_my_service_requests'),
    ('public','submit_service_review'),
    ('public','update_account_identity_verification'),
    ('public','list_my_partner_applications'),
    ('public','list_my_assigned_jobs'),
    ('public','submit_assigned_job_update'),
    ('public','request_account_identity_verification'),
    ('public','list_my_identity_verification_requests'),
    ('public','list_identity_verification_requests'),
    ('public','update_identity_verification_request'),
    ('public','create_resolution_case'),
    ('public','list_request_resolution_cases'),
    ('public','list_resolution_cases'),
    ('public','update_resolution_case'),
    ('public','list_marketplace_jobs'),
    ('public','submit_job_offer'),
    ('public','list_my_job_offers'),
    ('public','list_job_offers_for_admin'),
    ('public','update_job_offer_status'),
    ('public','list_tracking_job_offers'),
    ('public','list_my_notifications'),
    ('public','mark_my_notification'),
    ('public','create_account_notification'),
    ('app_private','is_admin'),
    ('app_private','resolution_ai_triage')
),
rpc_state as (
  select
    rr.schema_name,
    rr.name,
    p.proname is not null as exists
  from required_rpcs rr
  left join pg_namespace n on n.nspname = rr.schema_name
  left join pg_proc p on p.pronamespace = n.oid and p.proname = rr.name
),
storage_policy_state as (
  select
    required.name,
    p.policyname is not null as exists
  from (values
    ('Swadakta proof uploaders can read own files'),
    ('Swadakta proof uploaders can insert own files'),
    ('Swadakta proof uploaders can delete own files')
  ) as required(name)
  left join pg_policies p on p.schemaname = 'storage' and p.tablename = 'objects' and p.policyname = required.name
),
bucket_state as (
  select
    id,
    public,
    file_size_limit,
    allowed_mime_types,
    id = 'swadakta-proof' as id_ok,
    public is false as private_ok,
    file_size_limit = 6291456 as size_ok,
    allowed_mime_types @> array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'audio/webm',
      'audio/mpeg'
    ]::text[] as mime_ok
  from storage.buckets
  where id = 'swadakta-proof'
)
select
  'tables' as section,
  count(*)::int as total,
  count(*) filter (where exists and rls_enabled)::int as ok,
  jsonb_agg(name order by name) filter (where not exists or not rls_enabled) as missing_or_bad
from table_state
union all
select
  'policies',
  count(*)::int,
  count(*) filter (where exists)::int,
  jsonb_agg(name order by name) filter (where not exists)
from policy_state
union all
select
  'rpcs',
  count(*)::int,
  count(*) filter (where exists)::int,
  jsonb_agg(schema_name || '.' || name order by schema_name, name) filter (where not exists)
from rpc_state
union all
select
  'storage_policies',
  count(*)::int,
  count(*) filter (where exists)::int,
  jsonb_agg(name order by name) filter (where not exists)
from storage_policy_state
union all
select
  'proof_bucket',
  1,
  count(*) filter (where id_ok and private_ok and size_ok and mime_ok)::int,
  jsonb_agg(to_jsonb(bucket_state)) filter (where not (id_ok and private_ok and size_ok and mime_ok))
from bucket_state;
