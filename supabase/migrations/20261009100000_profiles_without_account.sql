-- A profile is a person; an account is optional.
--
-- Before: profiles.id = auth.users.id, so a profile (and a leerpad) could only
-- exist after someone had logged in.
-- After:  profiles.id is the profile's own id; profiles.user_id links to the
-- account and stays empty until the person logs in for the first time.
--
-- The docent can create a leerling up front (create_student), with or without
-- an email address, and fill their leerpad. The account gets linked:
--   - automatically on first login when the email address matches, or
--   - through a personal invite link (/uitnodiging/<code>) → claim_invite().
--
-- Everything that used to compare with auth.uid() now compares with
-- current_profile_id().

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

alter table public.profiles
  add column user_id uuid unique references auth.users (id) on delete set null,
  add column invite_code text unique;

update public.profiles set user_id = id;

alter table public.profiles alter column email drop not null;
create unique index profiles_email_unique on public.profiles (lower(email)) where email is not null;

comment on column public.profiles.user_id is 'The login account; null until the person logs in for the first time.';
comment on column public.profiles.invite_code is 'Code for /uitnodiging/<code>; works once (until user_id is set), kept so a reload is recognised.';

-- ---------------------------------------------------------------------------
-- Who am I
-- ---------------------------------------------------------------------------

create function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

alter table public.feedback alter column author_id set default public.current_profile_id();

-- ---------------------------------------------------------------------------
-- First login: link to a prepared profile by email, or create one
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set user_id = new.id
   where user_id is null and lower(email) = lower(new.email);
  if found then
    return new;
  end if;

  insert into public.profiles (id, user_id, email, role)
  values (
    new.id,
    new.id,
    new.email,
    -- The very first docent bootstraps the app; everyone else starts as leerling.
    case when exists (select 1 from public.profiles where role = 'docent' and user_id is not null)
         then 'leerling' else 'docent' end::public.app_role
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Docent: prepare a leerling before they have an account
-- ---------------------------------------------------------------------------

create function public.create_student(student_name text, student_email text default null)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.profiles;
  clean_email text := nullif(lower(btrim(coalesce(student_email, ''))), '');
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan leerlingen toevoegen' using errcode = '42501';
  end if;
  if length(btrim(coalesce(student_name, ''))) = 0 then
    raise exception 'Geef de leerling een naam' using errcode = '23514';
  end if;
  if clean_email is not null and exists (select 1 from public.profiles where lower(email) = clean_email) then
    raise exception 'Er is al iemand met dit e-mailadres' using errcode = '23505';
  end if;
  insert into public.profiles (email, display_name, role, invite_code)
  values (
    clean_email,
    btrim(student_name),
    'leerling',
    substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12)
  )
  returning * into result;
  return result;
end;
$$;

-- Change name/email of a leerling who hasn't logged in yet.
create function public.update_pending_student(student uuid, student_name text, student_email text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_email text := nullif(lower(btrim(coalesce(student_email, ''))), '');
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan leerlingen aanpassen' using errcode = '42501';
  end if;
  if clean_email is not null and exists (
    select 1 from public.profiles where lower(email) = clean_email and id <> student
  ) then
    raise exception 'Er is al iemand met dit e-mailadres' using errcode = '23505';
  end if;
  update public.profiles
     set display_name = coalesce(nullif(btrim(student_name), ''), display_name),
         email = clean_email
   where id = student and user_id is null;
  if not found then
    raise exception 'Deze leerling heeft al een account' using errcode = '23514';
  end if;
end;
$$;

-- Remove a prepared leerling (and their leerpad) who never logged in.
create function public.delete_pending_student(student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan leerlingen verwijderen' using errcode = '42501';
  end if;
  delete from public.profiles where id = student and user_id is null;
  if not found then
    raise exception 'Deze leerling heeft al een account' using errcode = '23514';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Link an account to a prepared profile
-- ---------------------------------------------------------------------------

-- Moves the login account of profile `source` onto the prepared profile
-- `target` (which has no account yet). The source profile is folded in: its
-- feedback moves over, its empty lanes go, and it is removed. The prepared
-- profile takes the email address the person actually logs in with.
-- Internal: only called by claim_invite() and link_account_to_student().
create function public.fold_profile_into(source uuid, target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  src public.profiles;
  tgt public.profiles;
begin
  select * into src from public.profiles where id = source;
  select * into tgt from public.profiles where id = target;
  if src.id is null or tgt.id is null then
    raise exception 'Profiel niet gevonden' using errcode = 'P0002';
  end if;
  if tgt.user_id is not null then
    raise exception 'Deze leerling heeft al een account' using errcode = '23514';
  end if;
  if src.user_id is null then
    raise exception 'Dit profiel heeft nog geen account' using errcode = '23514';
  end if;
  if src.role <> 'leerling' then
    raise exception 'Dit account is docent of reviewer en kan niet worden gekoppeld' using errcode = '23514';
  end if;
  if exists (select 1 from public.steps where student_id = src.id) then
    raise exception 'Dit account heeft al een eigen leerpad' using errcode = '23514';
  end if;

  update public.feedback set author_id = tgt.id where author_id = src.id;
  delete from public.leerpad_lanes where student_id = src.id;
  delete from public.profiles where id = src.id;
  update public.profiles
     set user_id = src.user_id,
         email = src.email,
         language = coalesce(language, src.language)
   where id = tgt.id;
end;
$$;

revoke execute on function public.fold_profile_into(uuid, uuid) from public, anon, authenticated;

-- Leerling: called after logging in via /uitnodiging/<code>.
create function public.claim_invite(code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited public.profiles;
  mine uuid := public.current_profile_id();
begin
  if auth.uid() is null then
    raise exception 'Log eerst in' using errcode = '42501';
  end if;
  select * into invited from public.profiles where invite_code = code;
  if invited.id is null then
    raise exception 'Deze uitnodiging is niet geldig' using errcode = 'P0002';
  end if;
  -- Already linked to this account (by email, or a reload of the invite link): nothing to do.
  if invited.user_id = auth.uid() then
    return;
  end if;
  if invited.user_id is not null then
    raise exception 'Deze uitnodiging is al gebruikt' using errcode = '23514';
  end if;
  perform public.fold_profile_into(mine, invited.id);
end;
$$;

-- Docent: the student made an account with another email address and never
-- used the invite link. Link that account to the prepared profile.
create function public.link_account_to_student(prepared uuid, account_profile uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan accounts koppelen' using errcode = '42501';
  end if;
  perform public.fold_profile_into(account_profile, prepared);
end;
$$;

-- ---------------------------------------------------------------------------
-- Existing functions: compare with the profile, not the account
-- ---------------------------------------------------------------------------

create or replace function public.set_user_role(target_user uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_app_role() is distinct from 'docent' then
    raise exception 'Alleen een docent kan rollen wijzigen' using errcode = '42501';
  end if;
  if target_user = public.current_profile_id() then
    raise exception 'Je kunt je eigen rol niet wijzigen' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target_user;
end;
$$;

create or replace function public.move_step(step uuid, to_lane uuid, new_position double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select student_id into owner from public.steps where id = step;
  if owner is null then
    raise exception 'Stap niet gevonden' using errcode = 'P0002';
  end if;
  if owner is distinct from public.current_profile_id() and not public.is_docent() then
    raise exception 'Je mag deze stap niet verplaatsen' using errcode = '42501';
  end if;
  update public.steps set lane_id = to_lane, position = new_position where id = step;
end;
$$;

create or replace function public.ensure_leerpad_lanes(student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  names text[];
begin
  if student is distinct from public.current_profile_id() and not public.is_docent() then
    raise exception 'Je mag dit leerpad niet aanmaken' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('leerpad:' || student::text));
  if not exists (select 1 from public.leerpad_lanes where student_id = student) then
    select case when p.language = 'en'
             then array['To do', 'This week', 'In progress', 'Done']
             else array['Te doen', 'Deze week', 'Bezig', 'Klaar'] end
      into names
      from public.profiles p where p.id = student;
    insert into public.leerpad_lanes (student_id, name, position)
    select student, n, i from unnest(coalesce(names, array['Te doen', 'Deze week', 'Bezig', 'Klaar'])) with ordinality as x(n, i);
  end if;
end;
$$;

revoke execute on function public.create_student(text, text) from public, anon;
revoke execute on function public.update_pending_student(uuid, text, text) from public, anon;
revoke execute on function public.delete_pending_student(uuid) from public, anon;
revoke execute on function public.claim_invite(text) from public, anon;
revoke execute on function public.link_account_to_student(uuid, uuid) from public, anon;
grant execute on function public.create_student(text, text) to authenticated;
grant execute on function public.update_pending_student(uuid, text, text) to authenticated;
grant execute on function public.delete_pending_student(uuid) to authenticated;
grant execute on function public.claim_invite(text) to authenticated;
grant execute on function public.link_account_to_student(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Policies: "own" means the current profile
-- ---------------------------------------------------------------------------

drop policy "profiles: read own or as staff" on public.profiles;
create policy "profiles: read own or as staff" on public.profiles
  for select to authenticated
  using (id = (select public.current_profile_id()) or (select public.current_app_role()) in ('docent', 'reviewer'));

drop policy "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select public.current_profile_id()))
  with check (id = (select public.current_profile_id()));

drop policy "feedback: read own or as staff" on public.feedback;
create policy "feedback: read own or as staff" on public.feedback
  for select to authenticated
  using (author_id = (select public.current_profile_id()) or (select public.current_app_role()) in ('docent', 'reviewer'));

drop policy "feedback: insert as self" on public.feedback;
create policy "feedback: insert as self" on public.feedback
  for insert to authenticated
  with check (
    author_id = (select public.current_profile_id())
    and (author_name is null or (select public.current_app_role()) = 'docent')
  );

drop policy "feedback: delete own or as docent" on public.feedback;
create policy "feedback: delete own or as docent" on public.feedback
  for delete to authenticated
  using (author_id = (select public.current_profile_id()) or (select public.current_app_role()) = 'docent');

drop policy "leerpad_lanes: read own or staff" on public.leerpad_lanes;
create policy "leerpad_lanes: read own or staff" on public.leerpad_lanes
  for select to authenticated
  using (student_id = (select public.current_profile_id()) or (select public.is_staff()));

drop policy "leerpad_lanes: insert own or docent" on public.leerpad_lanes;
create policy "leerpad_lanes: insert own or docent" on public.leerpad_lanes
  for insert to authenticated
  with check (student_id = (select public.current_profile_id()) or (select public.is_docent()));

drop policy "leerpad_lanes: update own or docent" on public.leerpad_lanes;
create policy "leerpad_lanes: update own or docent" on public.leerpad_lanes
  for update to authenticated
  using (student_id = (select public.current_profile_id()) or (select public.is_docent()))
  with check (student_id = (select public.current_profile_id()) or (select public.is_docent()));

drop policy "leerpad_lanes: delete own or docent" on public.leerpad_lanes;
create policy "leerpad_lanes: delete own or docent" on public.leerpad_lanes
  for delete to authenticated
  using (student_id = (select public.current_profile_id()) or (select public.is_docent()));

drop policy "steps: read own or staff" on public.steps;
create policy "steps: read own or staff" on public.steps
  for select to authenticated
  using (student_id = (select public.current_profile_id()) or (select public.is_staff()));
