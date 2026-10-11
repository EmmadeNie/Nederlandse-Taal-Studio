-- Docent: delete a leerling, also one who has logged in: leerpad (lanes,
-- steps, notes, statuses), profile and login account. Their feedback stays,
-- without an author.

alter table public.feedback alter column author_id drop not null;
alter table public.feedback drop constraint feedback_author_id_fkey;
alter table public.feedback
  add constraint feedback_author_id_fkey foreign key (author_id) references public.profiles (id) on delete set null;

create function public.delete_student(student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles;
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan leerlingen verwijderen' using errcode = '42501';
  end if;
  select * into target from public.profiles where id = student;
  if not found then
    raise exception 'Leerling niet gevonden' using errcode = 'P0002';
  end if;
  if target.role <> 'leerling' then
    raise exception 'Alleen leerlingen kunnen worden verwijderd' using errcode = '42501';
  end if;

  -- Steps first: their lanes can't go while steps point at them.
  delete from public.steps where student_id = student;
  delete from public.leerpad_lanes where student_id = student;
  delete from public.profiles where id = student;
  if target.user_id is not null then
    delete from auth.users where id = target.user_id;
  end if;
end;
$$;

revoke execute on function public.delete_student(uuid) from public, anon;
grant execute on function public.delete_student(uuid) to authenticated;
