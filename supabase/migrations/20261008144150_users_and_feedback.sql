-- Users (profiles + roles) and feedback.
--
-- Roles:
--   docent   - the teacher; admin. Sees and manages everything, assigns roles.
--   reviewer - reviews content; sees all feedback.
--   leerling - student; sees only their own feedback.
--
-- New sign-ups become 'leerling'. The very first user ever becomes 'docent'
-- so the app can be bootstrapped without SQL; after that only a docent can
-- change roles (via public.set_user_role).

-- ---------------------------------------------------------------------------
-- Roles & profiles
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('docent', 'reviewer', 'leerling');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  role         public.app_role not null default 'leerling',
  created_at   timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user: display name and app role.';

alter table public.profiles enable row level security;

-- Role of the current user. security definer so policies on profiles can
-- call it without recursing into profiles' own RLS.
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Create a profile whenever a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when exists (select 1 from public.profiles) then 'leerling' else 'docent' end::public.app_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Who can read profiles: yourself; docent and reviewers can read everyone
-- (they need author names on feedback).
create policy "profiles: read own or as staff"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.current_app_role()) in ('docent', 'reviewer')
  );

-- Users may only change their own display name. The role column is not
-- updatable by clients at all (column privileges below); roles go through
-- set_user_role().
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Docent-only: change someone's role. A docent cannot change their own role,
-- which also guarantees there is always at least one docent.
create function public.set_user_role(target_user uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_app_role() is distinct from 'docent' then
    raise exception 'Alleen een docent kan rollen wijzigen' using errcode = '42501';
  end if;
  if target_user = auth.uid() then
    raise exception 'Je kunt je eigen rol niet wijzigen' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target_user;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Feedback
-- ---------------------------------------------------------------------------

create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Original author name for entries imported from the old localStorage/JSON
  -- feedback. Null for feedback written in the app (use the profile instead).
  author_name text,
  item_type   text not null,
  item_id     text,
  item_label  text,
  category    text not null check (category in (
                'taalfout', 'verkeerd-niveau', 'te-moeilijk', 'te-makkelijk',
                'vertaling', 'tag-metadata', 'app', 'overig')),
  message     text not null check (length(btrim(message)) > 0),
  created_at  timestamptz not null default now()
);

create index feedback_item_id_idx on public.feedback (item_id);
create index feedback_author_id_idx on public.feedback (author_id);
create index feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

create policy "feedback: read own or as staff"
  on public.feedback for select
  to authenticated
  using (
    author_id = (select auth.uid())
    or (select public.current_app_role()) in ('docent', 'reviewer')
  );

-- Everyone writes feedback as themselves. Only a docent may set author_name
-- (used when importing old feedback files).
create policy "feedback: insert as self"
  on public.feedback for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (author_name is null or (select public.current_app_role()) = 'docent')
  );

create policy "feedback: delete own or as docent"
  on public.feedback for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or (select public.current_app_role()) = 'docent'
  );

revoke all on public.feedback from anon;
revoke update on public.feedback from authenticated;

-- Live updates in the app (Realtime respects the select policy above).
alter publication supabase_realtime add table public.feedback;
