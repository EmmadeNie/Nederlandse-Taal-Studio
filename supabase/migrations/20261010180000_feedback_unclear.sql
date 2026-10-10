-- Feedback on lessons: a category for explanations that are not clear.
alter table public.feedback drop constraint feedback_category_check;
alter table public.feedback add constraint feedback_category_check check (category in (
  'taalfout', 'verkeerd-niveau', 'te-moeilijk', 'te-makkelijk',
  'vertaling', 'tag-metadata', 'onduidelijk', 'app', 'overig'));
