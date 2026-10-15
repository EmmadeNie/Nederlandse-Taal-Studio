-- The docent flags sentences (🚩 Weghalen / Aanpassen) as remarks in
-- sentence_reviews (status 'issue', aspect 'weghalen' or 'aanpassen', via
-- review_sentence). Sentences flagged "weghalen" and not yet handled stay out
-- of the exercises; students can't read sentence_reviews, so this returns
-- just those ids, for everyone.
create function public.hidden_sentence_ids()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select distinct sentence_id
  from public.sentence_reviews
  where status = 'issue' and resolved_at is null and 'weghalen' = any(aspects);
$$;

revoke execute on function public.hidden_sentence_ids() from public, anon;
grant execute on function public.hidden_sentence_ids() to authenticated;
