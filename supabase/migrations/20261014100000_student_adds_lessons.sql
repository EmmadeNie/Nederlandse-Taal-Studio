-- Students put lessons from the lesprogramma on their own leerpad (one by
-- one, a selection, or a whole level), and get a short tour the first time.

-- A student may add a step for a lesson (not a zijpad: no own title or text)
-- to their own leerpad, in one of their own lanes. Everything else on steps
-- stays with the docent (and the existing move/status functions).
create policy "steps: student adds lessons to own leerpad" on public.steps
  for insert to authenticated
  with check (
    student_id = (select public.current_profile_id())
    and lesson_id is not null
    and coalesce(title, '') = ''
    and coalesce(explanation, '') = ''
    and coalesce(extras, '[]'::jsonb) = '[]'::jsonb
    and exists (
      select 1 from public.leerpad_lanes l
      where l.id = lane_id and l.student_id = (select public.current_profile_id())
    )
  );

-- The tour: shown until the student finishes or skips it (on any device).
alter table public.profiles add column onboarded_at timestamptz;
grant update (onboarded_at) on public.profiles to authenticated;
