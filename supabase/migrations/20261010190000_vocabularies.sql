-- The vocabularies for themes, word tags and grammar tags, editable without a
-- code change: the docent approves a "vocab.add" in a
-- proposal from ChatGPT. Validation and the pickers in the app read these.
-- Seeded with the lists that lived in src/data/schema.js (still the fallback
-- for scripts and before loading). Order of the rows = order in the pickers.

create table public.vocabularies (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('theme', 'tag', 'grammarTag')),
  value      text not null check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_by uuid references public.profiles (id) on delete set null default public.current_profile_id(),
  created_at timestamptz not null default now(),
  unique (kind, value)
);

alter table public.vocabularies enable row level security;
revoke all on public.vocabularies from anon;

create policy "vocabularies: read when signed in" on public.vocabularies
  for select to authenticated using (true);
create policy "vocabularies: docent adds" on public.vocabularies
  for insert to authenticated with check ((select public.is_docent()));
create policy "vocabularies: docent removes" on public.vocabularies
  for delete to authenticated using ((select public.is_docent()));

insert into public.vocabularies (kind, value) values
  ('theme', 'eten'),
  ('theme', 'fruit'),
  ('theme', 'dieren'),
  ('theme', 'kleuren'),
  ('theme', 'mensen'),
  ('theme', 'familie'),
  ('theme', 'kleding'),
  ('theme', 'huis'),
  ('theme', 'keuken'),
  ('theme', 'badkamer'),
  ('theme', 'huishouden'),
  ('theme', 'apparaten'),
  ('theme', 'dingen'),
  ('theme', 'plaatsen'),
  ('theme', 'vervoer'),
  ('theme', 'beweging'),
  ('theme', 'sport'),
  ('theme', 'vrije-tijd'),
  ('theme', 'tijd'),
  ('theme', 'werk'),
  ('theme', 'school'),
  ('theme', 'communicatie'),
  ('theme', 'emoties'),
  ('theme', 'weer'),
  ('theme', 'natuur'),
  ('theme', 'zintuigen'),
  ('theme', 'lichaam'),
  ('theme', 'nummers'),
  ('theme', 'beschrijvend'),
  ('theme', 'dagelijks-leven'),
  ('theme', 'grammatica'),
  ('theme', 'uitspraak'),
  ('tag', 'regelmatig-ww'),
  ('tag', 'onregelmatig-ww'),
  ('tag', 'hulpwerkwoord'),
  ('tag', 'modaal-werkwoord'),
  ('tag', 'scheidbaar-ww'),
  ('tag', 'formeel'),
  ('tag', 'informeel'),
  ('tag', 'vraagwoord'),
  ('grammarTag', 'tegenwoordige-tijd'),
  ('grammarTag', 'verleden-tijd'),
  ('grammarTag', 'perfectum'),
  ('grammarTag', 'plusquamperfectum'),
  ('grammarTag', 'futurum'),
  ('grammarTag', 'inversie'),
  ('grammarTag', 'woordvolgorde'),
  ('grammarTag', 'bijzin'),
  ('grammarTag', 'voegwoorden'),
  ('grammarTag', 'indirecte-rede'),
  ('grammarTag', 'relatieve-bijzin'),
  ('grammarTag', 'modale-werkwoorden'),
  ('grammarTag', 'scheidbare-werkwoorden'),
  ('grammarTag', 'reflexieve-werkwoorden'),
  ('grammarTag', 'dubbele-infinitief'),
  ('grammarTag', 'passief'),
  ('grammarTag', 'er'),
  ('grammarTag', 'waar-prepositie'),
  ('grammarTag', 'hoeven'),
  ('grammarTag', 'positiewerkwoorden'),
  ('grammarTag', 'werkwoord-als-adjectief'),
  ('grammarTag', 'te-infinitief'),
  ('grammarTag', 'om-te'),
  ('grammarTag', 'aan-het'),
  ('grammarTag', 'gebiedende-wijs'),
  ('grammarTag', 'vragen'),
  ('grammarTag', 'ontkenning'),
  ('grammarTag', 'lidwoorden'),
  ('grammarTag', 'de-het'),
  ('grammarTag', 'voornaamwoorden'),
  ('grammarTag', 'voorzetsels'),
  ('grammarTag', 'vervoegen'),
  ('grammarTag', 'klinkers'),
  ('grammarTag', 'lettergrepen'),
  ('grammarTag', 'uitspraak');
