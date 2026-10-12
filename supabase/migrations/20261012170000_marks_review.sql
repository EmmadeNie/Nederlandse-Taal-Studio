-- Marked words (sentence.marks) get their own "checked" stamp, so adding or
-- changing marks doesn't undo the check of the rest of the sentence:
--   * only marks changed → the sentence stays human-verified; just the marks
--     stamp (marksVerifiedBy/At) goes, and the checker checks only the marks;
--   * anything else changed → everything goes, as before.
create or replace function public.sentence_drop_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stamp constant text[] := array['reviewStatus', 'verifiedBy', 'verifiedAt', 'marksVerifiedBy', 'marksVerifiedAt'];
  marks_stamp constant text[] := array['marksVerifiedBy', 'marksVerifiedAt'];
begin
  if new.type = 'sentence'
     and old.data ->> 'reviewStatus' = 'human-verified'
     and new.data ->> 'reviewStatus' = 'human-verified' then
    if (old.data - stamp - 'marks') is distinct from (new.data - stamp - 'marks') then
      new.data := (new.data - array['verifiedBy', 'verifiedAt', 'marksVerifiedBy', 'marksVerifiedAt'])
                  || jsonb_build_object('reviewStatus', 'ai-reviewed');
    elsif (old.data -> 'marks') is distinct from (new.data -> 'marks')
          and (old.data - marks_stamp) is distinct from (new.data - marks_stamp) then
      new.data := new.data - marks_stamp;
    end if;
  end if;
  return new;
end;
$$;

-- review_sentence gets a scope: 'all' (the whole sentence, marks included)
-- or 'marks' (only the marked words of an already checked sentence).
drop function public.review_sentence(text, text, timestamptz, text[], text);

create function public.review_sentence(sentence text, verdict text, seen_version timestamptz, what text[] default '{}', note text default '', scope text default 'all')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  current_version timestamptz;
  item jsonb;
  who text;
begin
  select * into me from public.profiles where id = public.current_profile_id();
  if me.id is null or not (me.role in ('nakijker', 'docent', 'reviewer') or me.can_review) then
    raise exception 'Je mag geen zinnen nakijken' using errcode = '42501';
  end if;
  if scope not in ('all', 'marks') then
    raise exception 'Onbekende scope %', scope using errcode = '22023';
  end if;
  select updated_at, data into current_version, item from public.content_items where id = sentence and type = 'sentence';
  if current_version is null then
    raise exception 'Zin niet gevonden' using errcode = 'P0002';
  end if;
  if current_version > seen_version then
    raise exception 'Deze zin is intussen aangepast; laad opnieuw' using errcode = '40001';
  end if;
  if verdict = 'ok' then
    who := coalesce(nullif(btrim(me.display_name), ''), me.email);
    if scope = 'marks' then
      item := item || jsonb_build_object('marksVerifiedBy', who, 'marksVerifiedAt', now());
    else
      item := item || jsonb_build_object('reviewStatus', 'human-verified', 'verifiedBy', who, 'verifiedAt', now());
      if jsonb_array_length(coalesce(item -> 'marks', '[]')) > 0 then
        item := item || jsonb_build_object('marksVerifiedBy', who, 'marksVerifiedAt', now());
      end if;
    end if;
    update public.content_items set data = item where id = sentence
    returning updated_at into current_version;
  end if;
  insert into public.sentence_reviews (sentence_id, reviewer_id, status, aspects, comment, item_version)
  values (sentence, me.id, verdict, coalesce(what, '{}'), coalesce(note, ''), current_version);
end;
$$;

revoke execute on function public.review_sentence(text, text, timestamptz, text[], text, text) from public, anon;
grant execute on function public.review_sentence(text, text, timestamptz, text[], text, text) to authenticated;
