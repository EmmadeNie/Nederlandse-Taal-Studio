-- "Mijn flashcards": the lists someone added to practise. A deck points at a
-- list (it is not a copy), so it follows changes to the lesson or set:
--   {"lesson": "<uuid>", "part": "words" | "sentences" | "verbs"}
--   {"set": "<set id>"}
create table public.flashcard_decks (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null default public.current_profile_id() references public.profiles (id) on delete cascade,
  source     jsonb not null check (jsonb_typeof(source) = 'object'),
  title      text not null check (length(btrim(title)) > 0),
  created_at timestamptz not null default now(),
  unique (profile_id, source)
);

create index flashcard_decks_profile_idx on public.flashcard_decks (profile_id, created_at);

alter table public.flashcard_decks enable row level security;
revoke all on public.flashcard_decks from anon;

create policy "flashcard_decks: own" on public.flashcard_decks
  for all to authenticated
  using (profile_id = (select public.current_profile_id()))
  with check (profile_id = (select public.current_profile_id()));
