-- Content in the database instead of src/data/*.json.
--
-- content_items: every word, sentence, grammar topic and exercise. `id` is the
-- existing content id ('word.hond', 'sentence.…', 'topic.…', 'exercise.…') and
-- `type` matches its prefix. `data` holds the item's fields exactly as in the
-- JSON (introducedAtLevel, partOfSpeech, conjugation, …) without id and sets,
-- so the app and ChatGPT's changesets use the same shape.
--
-- sets: an ordered group of items of ONE type (a dialogue, the verbs of an
-- exercise). Membership lives only here, in item_ids; the database checks that
-- every id exists, has the set's type and occurs once.
--
-- content_history: every change to either table (who, when, old and new).
--
-- Read: everyone logged in. Write: docent. The content itself is moved in
-- separately (data, not schema).

create table public.content_items (
  id         text primary key check (id ~ '^(word|sentence|topic|exercise)\.[a-z0-9][a-z0-9._-]*$'),
  type       text not null check (type in ('word', 'sentence', 'topic', 'exercise')),
  data       jsonb not null check (jsonb_typeof(data) = 'object' and not (data ? 'id') and not (data ? 'sets')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null default public.current_profile_id(),
  constraint content_items_type_matches_id check (id like type || '.%')
);

create index content_items_type_idx on public.content_items (type);

create table public.sets (
  id         text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  type       text not null check (type in ('word', 'sentence', 'exercise')),
  title      text not null check (length(btrim(title)) > 0),
  level      text check (level in ('A0', 'A1', 'A2', 'B1', 'B2')),
  item_ids   text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null default public.current_profile_id()
);

create table public.content_history (
  id          bigint generated always as identity primary key,
  target_kind text not null check (target_kind in ('item', 'set')),
  target_id   text not null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  old_value   jsonb,
  new_value   jsonb,
  changed_by  uuid references public.profiles (id) on delete set null,
  changed_at  timestamptz not null default now()
);

create index content_history_target_idx on public.content_history (target_kind, target_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- Integrity

-- An item keeps its id and type: sets and lessons refer to it by id.
create function public.content_items_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.type is distinct from old.type then
    raise exception 'Id en type van een item kunnen niet veranderen' using errcode = '23514';
  end if;
  new.updated_at := now();
  new.updated_by := public.current_profile_id();
  return new;
end;
$$;

create trigger content_items_guard
  before update on public.content_items
  for each row execute function public.content_items_guard();

-- Every id in a set exists, has the set's type and occurs once.
create function public.sets_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  missing text;
begin
  if (select count(distinct x) from unnest(new.item_ids) as x) <> cardinality(new.item_ids) then
    raise exception 'Set %: een item staat er meer dan eens in', new.id using errcode = '23514';
  end if;
  select string_agg(x, ', ') into missing
  from unnest(new.item_ids) as x
  where not exists (select 1 from public.content_items c where c.id = x and c.type = new.type);
  if missing is not null then
    raise exception 'Set % (%): onbekende items of verkeerd type: %', new.id, new.type, missing
      using errcode = '23503';
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.type is distinct from old.type then
      raise exception 'Id en type van een set kunnen niet veranderen' using errcode = '23514';
    end if;
    new.updated_at := now();
    new.updated_by := public.current_profile_id();
  end if;
  return new;
end;
$$;

create trigger sets_validate
  before insert or update on public.sets
  for each row execute function public.sets_validate();

-- Deleting an item takes it out of every set (so no set points at nothing).
create function public.content_items_leave_sets()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.sets
  set item_ids = array_remove(item_ids, old.id)
  where type = old.type and old.id = any (item_ids);
  return old;
end;
$$;

create trigger content_items_leave_sets
  before delete on public.content_items
  for each row execute function public.content_items_leave_sets();

-- ---------------------------------------------------------------------------
-- History (written by triggers only)

create function public.content_history_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.content_history (target_kind, target_id, action, old_value, new_value, changed_by)
  values (
    case tg_table_name when 'sets' then 'set' else 'item' end,
    coalesce(new.id, old.id),
    lower(tg_op),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    public.current_profile_id()
  );
  return null;
end;
$$;

create trigger content_items_history
  after insert or update or delete on public.content_items
  for each row execute function public.content_history_log();

create trigger sets_history
  after insert or update or delete on public.sets
  for each row execute function public.content_history_log();

revoke execute on function public.content_history_log() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Access

alter table public.content_items enable row level security;
alter table public.sets enable row level security;
alter table public.content_history enable row level security;
revoke all on public.content_items, public.sets, public.content_history from anon;

create policy "content_items: read for everyone logged in" on public.content_items
  for select to authenticated using (true);
create policy "content_items: docent write" on public.content_items
  for all to authenticated
  using ((select public.is_docent()))
  with check ((select public.is_docent()));

create policy "sets: read for everyone logged in" on public.sets
  for select to authenticated using (true);
create policy "sets: docent write" on public.sets
  for all to authenticated
  using ((select public.is_docent()))
  with check ((select public.is_docent()));

create policy "content_history: docent reads" on public.content_history
  for select to authenticated using ((select public.is_docent()));
