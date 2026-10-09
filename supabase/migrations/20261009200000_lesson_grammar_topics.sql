-- Grammar topics on lessons: the ids of topics in the grammar library
-- (src/data/topics.json, e.g. 'topic.perfectum'), in the order chosen.

alter table public.lessons
  add column topic_ids text[] not null default '{}';
