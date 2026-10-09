-- New leerpaden start with the lanes Backlog, To do, Doing, Done (the same
-- in both UI languages). Existing leerpaden keep their lanes.
create or replace function public.ensure_leerpad_lanes(student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if student is distinct from public.current_profile_id() and not public.is_docent() then
    raise exception 'Je mag dit leerpad niet aanmaken' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('leerpad:' || student::text));
  if not exists (select 1 from public.leerpad_lanes where student_id = student) then
    insert into public.leerpad_lanes (student_id, name, position)
    select student, n, i
    from unnest(array['Backlog', 'To do', 'Doing', 'Done']) with ordinality as x(n, i);
  end if;
end;
$$;
