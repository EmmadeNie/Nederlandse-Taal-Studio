-- A list in "Mijn flashcards" can be set to done by hand: it moves to
-- "Afgerond" and is left out of "Alles door elkaar".
alter table public.flashcard_decks add column done_at timestamptz;
