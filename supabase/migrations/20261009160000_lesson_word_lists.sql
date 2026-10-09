-- A lesson can show a word list: a "recipe" over the word data (src/data/*.json),
-- like exercises already work. New words with a matching theme appear by themselves.
--   { "theme": "dieren", "partOfSpeech": "adjective", "level": "A1", "upTo": true }
-- Every key is optional; null = no word list.
alter table public.lessons
  add column word_list jsonb check (word_list is null or jsonb_typeof(word_list) = 'object');

comment on column public.lessons.word_list is
  'Word list recipe: {theme?, partOfSpeech?, level?, upTo?}; matched against the word JSON in the app.';
