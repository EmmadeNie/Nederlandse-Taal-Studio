-- Lesprogramma (master board) and leerpaden (one board per student).
--
-- Terms (NL / EN):
--   Lesprogramma / Curriculum     the master board: lesson_lanes + lessons
--   Les / Lesson                  a master card: title, level, labels, explanation, links
--   Leerpad / Learning path       a student's board: leerpad_lanes + steps
--   Stap / Step                   a card on a leerpad linked to a lesson (content comes from the lesson)
--   Zijpad / Side path            a card on a leerpad without a lesson (own content, this student only)
--   Extra's / Extras              links added to a step for this student only
--
-- Who can do what:
--   docent    manages the lesprogramma, plans lessons on leerpaden, adds zijpaden/extras/notes
--   reviewer  reads the lesprogramma and all leerpaden
--   leerling  reads their own leerpad and the lessons on it; creates/renames/deletes own lanes
--             and moves own steps (via move_step)
-- Notes on a step (step_notes) are for the docent only; students never see them.

create function public.is_docent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'docent', false)
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('docent', 'reviewer'), false)
$$;

-- ---------------------------------------------------------------------------
-- Lesprogramma
-- ---------------------------------------------------------------------------

create table public.lesson_lanes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) > 0),
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id             uuid primary key default gen_random_uuid(),
  lane_id        uuid not null references public.lesson_lanes (id) on delete restrict,
  position       double precision not null default 0,
  title          text not null check (length(btrim(title)) > 0),
  level          text check (level in ('A0', 'A1', 'A2', 'B1', 'B2')),
  categories     text[] not null default '{}',
  -- Markdown, rendered with the same renderer as topic explanations.
  explanation    text not null default '',
  -- [{ "label": "Google Doc", "url": "https://…" }]. Links to app content come later.
  links          jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),
  trello_card_id text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index lessons_lane_idx on public.lessons (lane_id, position);

-- ---------------------------------------------------------------------------
-- Leerpaden
-- ---------------------------------------------------------------------------

create table public.leerpad_lanes (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (length(btrim(name)) > 0),
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

create index leerpad_lanes_student_idx on public.leerpad_lanes (student_id, position);

create table public.steps (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  -- restrict: a lane can only be deleted once it is empty.
  lane_id     uuid not null references public.leerpad_lanes (id) on delete restrict,
  position    double precision not null default 0,
  -- Set for a stap; null for a zijpad. restrict: take a lesson off all leerpaden before deleting it.
  lesson_id   uuid references public.lessons (id) on delete restrict,
  -- Zijpad content (ignored for a stap, whose content comes from the lesson).
  title       text,
  level       text check (level in ('A0', 'A1', 'A2', 'B1', 'B2')),
  categories  text[] not null default '{}',
  explanation text not null default '',
  -- Extras: links for this student only, shown under the lesson's own links.
  extras      jsonb not null default '[]'::jsonb check (jsonb_typeof(extras) = 'array'),
  created_at  timestamptz not null default now(),
  constraint steps_lesson_or_title check (lesson_id is not null or length(btrim(coalesce(title, ''))) > 0)
);

create index steps_lane_idx on public.steps (lane_id, position);
create index steps_student_idx on public.steps (student_id);
create index steps_lesson_idx on public.steps (lesson_id);

-- A step's lane must belong to the same student.
create function public.check_step_lane()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.leerpad_lanes l where l.id = new.lane_id and l.student_id = new.student_id
  ) then
    raise exception 'Deze lane hoort niet bij dit leerpad' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger steps_lane_matches_student
  before insert or update of lane_id, student_id on public.steps
  for each row execute function public.check_step_lane();

create table public.step_notes (
  step_id    uuid primary key references public.steps (id) on delete cascade,
  note       text not null default '',
  updated_at timestamptz not null default now()
);

-- Move a step to another lane/position. Students may move their own steps;
-- the docent may move anyone's. Everything else on a step is docent-only.
create function public.move_step(step uuid, to_lane uuid, new_position double precision)
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
  if owner is distinct from auth.uid() and not public.is_docent() then
    raise exception 'Je mag deze stap niet verplaatsen' using errcode = '42501';
  end if;
  update public.steps set lane_id = to_lane, position = new_position where id = step;
end;
$$;

revoke execute on function public.move_step(uuid, uuid, double precision) from public, anon;
grant execute on function public.move_step(uuid, uuid, double precision) to authenticated;

-- Give a leerpad its default lanes the first time it is opened (by the
-- student or the docent). Locked per student so two tabs can't double them.
create function public.ensure_leerpad_lanes(student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if student is distinct from auth.uid() and not public.is_docent() then
    raise exception 'Je mag dit leerpad niet aanmaken' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('leerpad:' || student::text));
  if not exists (select 1 from public.leerpad_lanes where student_id = student) then
    insert into public.leerpad_lanes (student_id, name, position)
    values (student, 'Te doen', 1), (student, 'Deze week', 2), (student, 'Bezig', 3), (student, 'Klaar', 4);
  end if;
end;
$$;

revoke execute on function public.ensure_leerpad_lanes(uuid) from public, anon;
grant execute on function public.ensure_leerpad_lanes(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.lesson_lanes  enable row level security;
alter table public.lessons       enable row level security;
alter table public.leerpad_lanes enable row level security;
alter table public.steps         enable row level security;
alter table public.step_notes    enable row level security;

revoke all on public.lesson_lanes, public.lessons, public.leerpad_lanes, public.steps, public.step_notes from anon;

-- Lesprogramma: staff read, docent writes.
create policy "lesson_lanes: staff read" on public.lesson_lanes
  for select to authenticated using ((select public.is_staff()));
create policy "lesson_lanes: docent write" on public.lesson_lanes
  for all to authenticated using ((select public.is_docent())) with check ((select public.is_docent()));

-- Students may read the lessons that are on their own leerpad.
create policy "lessons: staff or planned for me" on public.lessons
  for select to authenticated using (
    (select public.is_staff())
    or exists (select 1 from public.steps s where s.lesson_id = lessons.id and s.student_id = (select auth.uid()))
  );
create policy "lessons: docent write" on public.lessons
  for all to authenticated using ((select public.is_docent())) with check ((select public.is_docent()));

-- Leerpad lanes: owner and docent manage, reviewers read.
create policy "leerpad_lanes: read own or staff" on public.leerpad_lanes
  for select to authenticated using (student_id = (select auth.uid()) or (select public.is_staff()));
create policy "leerpad_lanes: insert own or docent" on public.leerpad_lanes
  for insert to authenticated with check (student_id = (select auth.uid()) or (select public.is_docent()));
create policy "leerpad_lanes: update own or docent" on public.leerpad_lanes
  for update to authenticated
  using (student_id = (select auth.uid()) or (select public.is_docent()))
  with check (student_id = (select auth.uid()) or (select public.is_docent()));
create policy "leerpad_lanes: delete own or docent" on public.leerpad_lanes
  for delete to authenticated using (student_id = (select auth.uid()) or (select public.is_docent()));

-- Steps: owner and staff read; only the docent writes directly (students move via move_step).
create policy "steps: read own or staff" on public.steps
  for select to authenticated using (student_id = (select auth.uid()) or (select public.is_staff()));
create policy "steps: docent write" on public.steps
  for all to authenticated using ((select public.is_docent())) with check ((select public.is_docent()));

-- Notes: docent only.
create policy "step_notes: docent only" on public.step_notes
  for all to authenticated using ((select public.is_docent())) with check ((select public.is_docent()));
