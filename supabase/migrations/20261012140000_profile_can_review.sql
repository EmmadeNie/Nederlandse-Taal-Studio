-- Checking sentences as an extra right, apart from the role: a leerling can
-- also check sentences (Zinnen nakijken) without losing her leerpad.
-- Only a docent sets it (clients can't update this column directly).
alter table public.profiles add column can_review boolean not null default false;

create function public.set_can_review(target_user uuid, allowed boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan dit wijzigen' using errcode = '42501';
  end if;
  update public.profiles set can_review = coalesce(allowed, false) where id = target_user;
end;
$$;

revoke execute on function public.set_can_review(uuid, boolean) from public, anon;
grant execute on function public.set_can_review(uuid, boolean) to authenticated;

-- review_sentence: also for anyone with can_review.
create or replace function public.review_sentence(sentence text, verdict text, seen_version timestamptz, what text[] default '{}', note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  current_version timestamptz;
begin
  select * into me from public.profiles where id = public.current_profile_id();
  if me.id is null or not (me.role in ('nakijker', 'docent', 'reviewer') or me.can_review) then
    raise exception 'Je mag geen zinnen nakijken' using errcode = '42501';
  end if;
  select updated_at into current_version from public.content_items where id = sentence and type = 'sentence';
  if current_version is null then
    raise exception 'Zin niet gevonden' using errcode = 'P0002';
  end if;
  if current_version > seen_version then
    raise exception 'Deze zin is intussen aangepast; laad opnieuw' using errcode = '40001';
  end if;
  if verdict = 'ok' then
    update public.content_items
       set data = data || jsonb_build_object(
             'reviewStatus', 'human-verified',
             'verifiedBy', coalesce(nullif(btrim(me.display_name), ''), me.email),
             'verifiedAt', now())
     where id = sentence
     returning updated_at into current_version;
  end if;
  insert into public.sentence_reviews (sentence_id, reviewer_id, status, aspects, comment, item_version)
  values (sentence, me.id, verdict, coalesce(what, '{}'), coalesce(note, ''), current_version);
end;
$$;

