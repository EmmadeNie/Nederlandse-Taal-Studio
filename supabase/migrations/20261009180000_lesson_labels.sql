-- Real labels for lessons instead of free-text categories.
--
-- A label has a Dutch and an English name (shown in the UI language) and a
-- colour from a fixed palette. Lessons keep an ordered list of label ids.
-- The existing free-text categories are carried over: every distinct value
-- becomes a label (Dutch name only; the English name is filled in later and falls back to Dutch).

create table public.labels (
  id         uuid primary key default gen_random_uuid(),
  name_nl    text not null check (length(btrim(name_nl)) > 0),
  name_en    text not null default '',
  color      text not null default 'gray'
             check (color in ('gray', 'blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'teal')),
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

create unique index labels_name_nl_key on public.labels (lower(btrim(name_nl)));

alter table public.labels enable row level security;
revoke all on public.labels from anon;

create policy "labels: read for everyone logged in" on public.labels
  for select to authenticated using (true);
create policy "labels: docent write" on public.labels
  for all to authenticated
  using ((select public.is_docent()))
  with check ((select public.is_docent()));

alter table public.lessons add column label_ids uuid[] not null default '{}';

-- Carry over the categories, most used first, colours round the palette.
with used as (
  select btrim(c) as name, count(*) as n
  from public.lessons, unnest(categories) as c
  where length(btrim(c)) > 0
  group by btrim(c)
), ranked as (
  select name, row_number() over (order by n desc, name) as rn from used
)
insert into public.labels (name_nl, name_en, color, position)
select name, '',
       (array['blue', 'green', 'purple', 'orange', 'teal', 'pink', 'yellow', 'red', 'gray'])[((rn - 1) % 9) + 1],
       rn
from ranked;

update public.lessons l
set label_ids = array(
  select lb.id
  from unnest(l.categories) with ordinality as c(name, ord)
  join public.labels lb on lower(btrim(lb.name_nl)) = lower(btrim(c.name))
  group by lb.id
  order by min(c.ord)
)
where cardinality(l.categories) > 0;

alter table public.lessons drop column categories;

-- Deleting a label takes it off every lesson.
create function public.remove_label_from_lessons()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.lessons set label_ids = array_remove(label_ids, old.id) where old.id = any (label_ids);
  return old;
end;
$$;

create trigger labels_remove_from_lessons
  before delete on public.labels
  for each row execute function public.remove_label_from_lessons();
