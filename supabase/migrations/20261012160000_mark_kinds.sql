-- Marked words in sentences (sentence.marks: [{ text, kind, wordId? }]) for
-- fill-in exercises: "Het boek ligt ___ de tafel." The kinds are a vocabulary
-- like themes and tags, so the docent can add one (vocab.add) without a code change.
alter table public.vocabularies drop constraint vocabularies_kind_check;
alter table public.vocabularies add constraint vocabularies_kind_check
  check (kind in ('theme', 'tag', 'grammarTag', 'markKind'));

insert into public.vocabularies (kind, value) values
  ('markKind', 'voorzetsel'),
  ('markKind', 'vraagwoord'),
  ('markKind', 'lidwoord'),
  ('markKind', 'voegwoord')
on conflict (kind, value) do nothing;
