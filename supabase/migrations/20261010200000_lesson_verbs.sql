-- A lesson can show verbs, chosen one by one, as conjugation tiles.
alter table public.lessons add column verb_ids text[] not null default '{}';

comment on column public.lessons.verb_ids is
  'Verbs shown in the lesson (ids of words with a conjugation), in this order.';
