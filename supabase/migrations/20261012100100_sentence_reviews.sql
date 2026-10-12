-- Checking sentences (their parts and pronouns) one by one: "klopt" or
-- "klopt niet" with what and a comment. A review belongs to the version of
-- the sentence that was seen (item_version = its updated_at then); when the
-- sentence changes later, it is checked again.
create table public.sentence_reviews (
  id           uuid primary key default gen_random_uuid(),
  sentence_id  text not null references public.content_items (id) on delete cascade,
  reviewer_id  uuid default public.current_profile_id() references public.profiles (id) on delete set null,
  status       text not null check (status in ('ok', 'issue')),
  aspects      text[] not null default '{}',
  comment      text not null default '',
  item_version timestamptz not null,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create index sentence_reviews_sentence_idx on public.sentence_reviews (sentence_id, created_at desc);
create index sentence_reviews_open_idx on public.sentence_reviews (created_at) where status = 'issue' and resolved_at is null;

alter table public.sentence_reviews enable row level security;
revoke all on public.sentence_reviews from anon;

create policy "sentence_reviews: read own or as staff" on public.sentence_reviews
  for select to authenticated
  using (reviewer_id = (select public.current_profile_id()) or (select public.current_app_role()) in ('docent', 'reviewer'));

create policy "sentence_reviews: docent resolves" on public.sentence_reviews
  for update to authenticated
  using ((select public.is_docent()))
  with check ((select public.is_docent()));

create policy "sentence_reviews: docent deletes" on public.sentence_reviews
  for delete to authenticated
  using ((select public.is_docent()));

-- Record a verdict on a sentence. "ok" also marks the sentence itself as
-- checked by a person (reviewStatus human-verified, verifiedBy, verifiedAt);
-- the review then points at that new version, so it doesn't look outdated.
create function public.review_sentence(sentence text, verdict text, seen_version timestamptz, what text[] default '{}', note text default '')
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
  if me.id is null or me.role not in ('nakijker', 'docent', 'reviewer') then
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

revoke execute on function public.review_sentence(text, text, timestamptz, text[], text) from public, anon;
grant execute on function public.review_sentence(text, text, timestamptz, text[], text) to authenticated;

-- "Checked" belongs to the exact sentence that was checked: when anything else
-- in a verified sentence changes (a proposal, an edit), the mark goes away and
-- the sentence comes back in the checkers' queue.
create or replace function public.sentence_drop_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stamp constant text[] := array['reviewStatus', 'verifiedBy', 'verifiedAt'];
begin
  if new.type = 'sentence'
     and old.data ->> 'reviewStatus' = 'human-verified'
     and (old.data - stamp) is distinct from (new.data - stamp)
     and new.data ->> 'reviewStatus' = 'human-verified' then
    new.data := (new.data - array['verifiedBy', 'verifiedAt']) || jsonb_build_object('reviewStatus', 'ai-reviewed');
  end if;
  return new;
end;
$$;

drop trigger if exists sentence_drop_verified on public.content_items;
create trigger sentence_drop_verified
  before update on public.content_items
  for each row execute function public.sentence_drop_verified();
