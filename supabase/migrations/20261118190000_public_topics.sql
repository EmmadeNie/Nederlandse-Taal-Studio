-- Grammar topics for the public pages (SEO, /grammatica/…), built at deploy time.
-- Only what those pages show: title, level, summary and the short explanation.
-- The full explanation, exercises and everything else stay for logged-in users.
create or replace function public.public_topics()
returns table (
  slug text,
  title text,
  title_en text,
  level text,
  category text,
  summary text,
  summary_en text,
  short text,
  short_en text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    substr(c.id, length('topic.') + 1),
    c.data->>'title',
    c.data->>'titleEn',
    c.data->>'introducedAtLevel',
    c.data->>'category',
    c.data->>'summary',
    c.data->>'summaryEn',
    c.data->>'short',
    c.data->>'shortEn',
    c.updated_at
  from public.content_items c
  where c.type = 'topic'
    and c.id like 'topic.%'
    and coalesce(c.data->>'reviewStatus', '') <> 'draft'
    and coalesce(c.data->>'short', '') <> ''
  order by c.data->>'introducedAtLevel' nulls last, c.data->>'title';
$$;

revoke all on function public.public_topics() from public;
grant execute on function public.public_topics() to anon, authenticated;
