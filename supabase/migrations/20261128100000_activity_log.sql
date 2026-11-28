-- Activity log: one row per thing a logged-in user does, for later dashboards.
--
-- Two sources write here:
--   source 'app': the app sends views and clicks (page_view, lesson_open,
--                 flashcard_answer, ...) through src/lib/activity.js.
--   source 'db':  a trigger on every table users write to logs each
--                 insert/update/delete, so no edit can be missed.
--
-- session_id ties a visit together (and gives the order). The app sends it
-- with every request in the x-nts-session header, so edits get it too.
--
-- Plain append-only table on purpose. If it ever gets too big, move it to an
-- event store (ClickHouse, BigQuery, PostHog): the shape of a row stays the same.

create table public.activity_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  -- When it happened on the device (the app sends events in batches).
  client_at   timestamptz,
  profile_id  uuid default public.current_profile_id()
              references public.profiles (id) on delete cascade,
  session_id  uuid,
  source      text not null check (source in ('app', 'db')),
  event       text not null check (char_length(event) between 1 and 60),
  target_type text check (char_length(target_type) <= 60),
  target_id   text check (char_length(target_id) <= 200),
  path        text check (char_length(path) <= 500),
  data        jsonb check (pg_column_size(data) <= 8192)
);

comment on table public.activity_log is
  'Everything logged-in users do: app events (views, clicks) and db changes. Append-only.';

create index activity_log_created_at on public.activity_log using brin (created_at);
create index activity_log_profile on public.activity_log (profile_id, created_at);
create index activity_log_target on public.activity_log (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Access: users add their own app events; only the docent reads.

alter table public.activity_log enable row level security;
revoke all on public.activity_log from anon;
revoke update, delete, truncate on public.activity_log from authenticated;

create policy "activity_log: add own app events" on public.activity_log
  for insert to authenticated
  with check (source = 'app' and profile_id = public.current_profile_id());

create policy "activity_log: docent reads" on public.activity_log
  for select to authenticated
  using (public.is_docent());

-- ---------------------------------------------------------------------------
-- Request context the app sends along (see src/lib/supabase.js).

create function public.activity_request_header(name text)
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('request.headers', true), '')::jsonb ->> name
$$;

-- Long texts (lesson explanations, ...) and big json become a short marker,
-- so a row stays small. Email addresses are left out.
create function public.activity_compact(row_data jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(key,
    case
      when jsonb_typeof(value) = 'string' and char_length(value #>> '{}') > 200
        then to_jsonb('[' || char_length(value #>> '{}') || ' chars]')
      when jsonb_typeof(value) in ('object', 'array') and pg_column_size(value) > 1000
        then to_jsonb('[' || jsonb_typeof(value) || ', ' || pg_column_size(value) || ' bytes]')
      else value
    end), '{}'::jsonb)
  from jsonb_each(row_data)
  where key <> 'email'
$$;

-- ---------------------------------------------------------------------------
-- The db trigger. tg_argv[0] is the key column when it is not "id".

create function public.activity_log_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor    uuid := public.current_profile_id();
  old_row  jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  new_row  jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  key_col  text := coalesce(tg_argv[0], 'id');
  row_id   text := coalesce(new_row, old_row) ->> key_col;
  changed  text[];
  details  jsonb;
  session  text := public.activity_request_header('x-nts-session');
begin
  -- Only what people do in the app: no migrations, scripts or the auth server.
  if auth.uid() is null or actor is null then
    return null;
  end if;

  -- A deleted profile: drop what was logged about it (its own events go by cascade).
  if tg_table_name = 'profiles' and tg_op = 'DELETE' then
    delete from public.activity_log where target_type = 'profiles' and target_id = row_id;
  end if;
  -- The actor's own profile is gone (deleting their own account): nothing to attach it to.
  if not exists (select 1 from public.profiles where id = actor) then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into changed
      from jsonb_each(new_row) n
     where n.value is distinct from old_row -> n.key
       and n.key not in ('updated_at');
    if changed is null then
      return null;
    end if;
    details := jsonb_build_object(
      'changed', to_jsonb(changed),
      'old', public.activity_compact((select jsonb_object_agg(key, value) from jsonb_each(old_row) where key = any (changed))),
      'new', public.activity_compact((select jsonb_object_agg(key, value) from jsonb_each(new_row) where key = any (changed)))
    );
  elsif tg_op = 'INSERT' then
    details := jsonb_build_object('new', public.activity_compact(new_row));
  end if;
  -- DELETE: only which row, not its contents.

  insert into public.activity_log (profile_id, session_id, source, event, target_type, target_id, path, data)
  values (
    actor,
    case when session ~ '^[0-9a-fA-F-]{36}$' then session::uuid end,
    'db',
    lower(tg_op),
    tg_table_name,
    row_id,
    left(public.activity_request_header('x-nts-path'), 500),
    details
  );
  return null;
end;
$$;

revoke execute on function public.activity_log_change() from public, anon, authenticated;

-- Every table users write to (not content_history / activity_log themselves).
create trigger activity_log after insert or update or delete on public.profiles
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.steps
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.step_notes
  for each row execute function public.activity_log_change('step_id');
create trigger activity_log after insert or update or delete on public.leerpad_lanes
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.lessons
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.lesson_lanes
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.lesson_attachments
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.labels
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.flashcard_decks
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.sentence_reviews
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.feedback
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.content_proposals
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.content_items
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.sets
  for each row execute function public.activity_log_change();
create trigger activity_log after insert or update or delete on public.vocabularies
  for each row execute function public.activity_log_change();
