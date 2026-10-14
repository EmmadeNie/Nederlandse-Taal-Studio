-- A list in Mijn flashcards can be practised in several ways (flashcards,
-- Vervoegen, Invullen). done_kinds holds the ones the student finished; when
-- all that apply are done, the app also sets done_at (the list is afgerond).
alter table public.flashcard_decks add column done_kinds text[] not null default '{}';
