insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'swadakta-proof',
  'swadakta-proof',
  false,
  6291456,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
    'audio/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Swadakta proof uploaders can read own files" on storage.objects;
create policy "Swadakta proof uploaders can read own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'swadakta-proof'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select app_private.is_admin())
  )
);

drop policy if exists "Swadakta proof uploaders can insert own files" on storage.objects;
create policy "Swadakta proof uploaders can insert own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'swadakta-proof'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Swadakta proof uploaders can delete own files" on storage.objects;
create policy "Swadakta proof uploaders can delete own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'swadakta-proof'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
