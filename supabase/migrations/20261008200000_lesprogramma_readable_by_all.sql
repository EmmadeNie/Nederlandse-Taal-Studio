-- Every logged-in user may view the lesprogramma (students view only).
-- Writing stays docent-only via the existing "docent write" policies.

drop policy "lesson_lanes: staff read" on public.lesson_lanes;
create policy "lesson_lanes: read for everyone logged in" on public.lesson_lanes
  for select to authenticated using (true);

drop policy "lessons: staff or planned for me" on public.lessons;
create policy "lessons: read for everyone logged in" on public.lessons
  for select to authenticated using (true);
