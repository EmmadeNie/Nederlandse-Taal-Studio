-- A lesson can have several word lists and several sentence lists.
-- word_list / sentence_list become arrays of recipes; existing single recipes
-- become a list of one.

alter table public.lessons drop constraint lessons_word_list_check;
alter table public.lessons drop constraint lessons_sentence_list_check;

update public.lessons set word_list = jsonb_build_array(word_list) where jsonb_typeof(word_list) = 'object';
update public.lessons set sentence_list = jsonb_build_array(sentence_list) where jsonb_typeof(sentence_list) = 'object';

alter table public.lessons
  add constraint lessons_word_list_check check (word_list is null or jsonb_typeof(word_list) = 'array'),
  add constraint lessons_sentence_list_check check (sentence_list is null or jsonb_typeof(sentence_list) = 'array');

comment on column public.lessons.word_list is
  'Word lists: [{set?, theme?, partOfSpeech?, level?, upTo?}, …]; matched against the words in the app.';
comment on column public.lessons.sentence_list is
  'Sentence lists: [{set?, theme?, grammarTag?, level?, upTo?}, …]; matched against the sentences in the app.';
