-- ⭐ "Belangrijk" on a step of a leerpad: the student (or the docent) marks
-- what they find important. Set through a function like the status, so the
-- student may change this one field of their own steps and nothing else.
alter table public.steps add column important boolean not null default false;

create function public.set_step_important(step uuid, value boolean)
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
    raise exception 'Je mag deze stap niet wijzigen' using errcode = '42501';
  end if;
  update public.steps set important = coalesce(value, false) where id = step;
end;
$$;

revoke execute on function public.set_step_important(uuid, boolean) from public, anon;
grant execute on function public.set_step_important(uuid, boolean) to authenticated;
