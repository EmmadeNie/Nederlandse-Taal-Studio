-- Sentence lists on lessons, like word lists: a recipe over the sentence
-- bank (src/data/sentences.json), e.g. {"set": "mijn-eerste-ontmoetingsgesprek"}
-- or {"theme": "communicatie", "level": "A1"}. The sentences are computed
-- in the app, so sentences added later appear by themselves.

alter table public.lessons
  add column sentence_list jsonb check (sentence_list is null or jsonb_typeof(sentence_list) = 'object');
