create index if not exists job_offers_receiver_user_id_idx
  on public.job_offers (receiver_user_id)
  where receiver_user_id is not null;
