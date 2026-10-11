-- The docent can put lists in a student's "Mijn flashcards" (klaarzetten).
-- added_by remembers who added a list, so the student sees "Van je docent".
alter table public.flashcard_decks
  add column added_by uuid default public.current_profile_id() references public.profiles (id) on delete set null;

create policy "flashcard_decks: docent manages" on public.flashcard_decks
  for all to authenticated
  using ((select public.is_docent()))
  with check ((select public.is_docent()));
