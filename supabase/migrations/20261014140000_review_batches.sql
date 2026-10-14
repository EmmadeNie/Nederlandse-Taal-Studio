-- Nakijklijsten: every approved proposal from ChatGPT is a batch of sentences
-- to check (the sentences it added or changed), so the checker works through
-- them list by list. Proposals themselves stay docent-only; this returns just
-- title, date and sentence ids, for anyone who may check sentences.
create function public.review_batches()
returns table (id uuid, title text, approved_at timestamptz, sentence_ids text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me public.profiles;
begin
  select * into me from public.profiles where profiles.id = public.current_profile_id();
  if me.id is null or not (me.role in ('nakijker', 'docent', 'reviewer') or me.can_review) then
    raise exception 'Je mag geen zinnen nakijken' using errcode = '42501';
  end if;
  return query
    select p.id, p.title, max((d.value ->> 'at')::timestamptz), array_agg(distinct c.value ->> 'id')
    from public.content_proposals p
    cross join lateral jsonb_array_elements(p.changes) with ordinality as c(value, idx)
    join lateral jsonb_each(p.decisions) as d(key, value) on d.key = (c.idx - 1)::text
    join public.content_items i on i.id = c.value ->> 'id' and i.type = 'sentence'
    where c.value ->> 'type' = 'sentence'
      and c.value ->> 'op' in ('add', 'update')
      and d.value ->> 'status' = 'approved'
    group by p.id, p.title
    order by 3 desc;
end;
$$;

revoke execute on function public.review_batches() from public, anon;
grant execute on function public.review_batches() to authenticated;
