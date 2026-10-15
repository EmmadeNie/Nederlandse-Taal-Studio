-- 🚩 for words and verbs too, not only sentences. A flag is a remark in
-- sentence_reviews (the table holds remarks on any content item; its
-- sentence_id references content_items). review_sentence only takes
-- sentences and checks a version; flagging needs neither, so it gets its own
-- function, for the docent.
create function public.flag_item(item text, kind text, note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  version timestamptz;
begin
  if not public.is_docent() then
    raise exception 'Alleen de docent kan markeren' using errcode = '42501';
  end if;
  if kind not in ('weghalen', 'aanpassen') then
    raise exception 'Onbekende markering %', kind using errcode = '22023';
  end if;
  select updated_at into version from public.content_items where id = item;
  if version is null then
    raise exception 'Niet gevonden' using errcode = 'P0002';
  end if;
  insert into public.sentence_reviews (sentence_id, reviewer_id, status, aspects, comment, item_version)
  values (item, public.current_profile_id(), 'issue', array[kind], coalesce(note, ''), version);
end;
$$;

revoke execute on function public.flag_item(text, text, text) from public, anon;
grant execute on function public.flag_item(text, text, text) to authenticated;
