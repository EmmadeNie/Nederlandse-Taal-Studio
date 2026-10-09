-- Files attached to lessons (lesprogramma): worksheets, PDFs, images, audio.
--
-- The docent uploads; everyone who is logged in can view and download
-- (the lesprogramma itself is readable by everyone logged in, students
-- see the files through the steps on their leerpad).
-- Files live in the private Storage bucket "lesson-files" under
-- <lesson id>/<random>-<file name>; lesson_attachments keeps the metadata.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-files',
  'lesson-files',
  false,
  20 * 1024 * 1024,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
    'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'
  ]
)
on conflict (id) do nothing;

create table public.lesson_attachments (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  storage_path text not null unique,
  file_name    text not null check (length(btrim(file_name)) > 0),
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0),
  uploaded_by  uuid references public.profiles (id) on delete set null default public.current_profile_id(),
  created_at   timestamptz not null default now()
);

create index lesson_attachments_lesson_idx on public.lesson_attachments (lesson_id, created_at);

alter table public.lesson_attachments enable row level security;
revoke all on public.lesson_attachments from anon;

create policy "lesson_attachments: read for everyone logged in" on public.lesson_attachments
  for select to authenticated using (true);
create policy "lesson_attachments: docent write" on public.lesson_attachments
  for all to authenticated
  using ((select public.is_docent()))
  with check ((select public.is_docent()));

-- Storage: same rules for the files themselves.
create policy "lesson-files: read for everyone logged in" on storage.objects
  for select to authenticated using (bucket_id = 'lesson-files');
create policy "lesson-files: docent uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'lesson-files' and (select public.is_docent()));
create policy "lesson-files: docent updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'lesson-files' and (select public.is_docent()))
  with check (bucket_id = 'lesson-files' and (select public.is_docent()));
create policy "lesson-files: docent deletes" on storage.objects
  for delete to authenticated using (bucket_id = 'lesson-files' and (select public.is_docent()));
