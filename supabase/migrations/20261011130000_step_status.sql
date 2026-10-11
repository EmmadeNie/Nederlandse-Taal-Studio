-- A status per step on a student's leerpad: during class, homework, homework
-- done, ongoing (null = none). The docent and the student themselves set it,
-- through set_step_status (students can't update steps directly).
alter table public.steps add column status text
  check (status in ('in_class', 'homework', 'homework_done', 'ongoing'));

create function public.set_step_status(step uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select student_id into owner from public.steps where id = step;
  if owner is null then
    raise exception 'Stap niet gevonden' using errcode = 'P0002';
  end if;
  if owner is distinct from public.current_profile_id() and not public.is_docent() then
    raise exception 'Je mag de status van deze stap niet wijzigen' using errcode = '42501';
  end if;
  update public.steps set status = new_status where id = step;
end;
$$;

revoke execute on function public.set_step_status(uuid, text) from public, anon;
grant execute on function public.set_step_status(uuid, text) to authenticated;
