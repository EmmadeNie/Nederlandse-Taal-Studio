-- UI language per user ('nl' or 'en'). Null until the user's first visit,
-- when the app stores the language it picked from the browser.
alter table public.profiles
  add column language text check (language in ('nl', 'en'));

grant update (language) on public.profiles to authenticated;

-- Default lanes in the student's own language.
create or replace function public.ensure_leerpad_lanes(student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  names text[];
begin
  if student is distinct from auth.uid() and not public.is_docent() then
    raise exception 'Je mag dit leerpad niet aanmaken' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('leerpad:' || student::text));
  if not exists (select 1 from public.leerpad_lanes where student_id = student) then
    select case when p.language = 'en'
             then array['To do', 'This week', 'In progress', 'Done']
             else array['Te doen', 'Deze week', 'Bezig', 'Klaar'] end
      into names
      from public.profiles p where p.id = student;
    insert into public.leerpad_lanes (student_id, name, position)
    select student, n, i from unnest(coalesce(names, array['Te doen', 'Deze week', 'Bezig', 'Klaar'])) with ordinality as x(n, i);
  end if;
end;
$$;
