-- Allow .csv files (e.g. Quizlet word lists) on lessons.
update storage.buckets
   set allowed_mime_types = array_append(allowed_mime_types, 'text/csv')
 where id = 'lesson-files' and not ('text/csv' = any (allowed_mime_types));
