-- A lesson in English too: students can switch the title and explanation to English.
alter table public.lessons add column title_en text;
alter table public.lessons add column explanation_en text;

comment on column public.lessons.title_en is 'The lesson title in English (null: Dutch only).';
comment on column public.lessons.explanation_en is 'The explanation in English, the same HTML as explanation (null: Dutch only).';
