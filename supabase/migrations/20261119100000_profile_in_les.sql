-- Lesleerlingen: the students the docent actually teaches. They get a
-- one-click switcher at the top of the Leerpaden page; everyone else stays
-- in the dropdown. Only a docent sets it (clients can't update this column
-- directly; see the column grants on profiles).
alter table public.profiles add column in_les boolean not null default false;

comment on column public.profiles.in_les is 'The docent gives this student lessons (quick switcher on Leerpaden).';

create function public.set_in_les(target_user uuid, taught boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan dit wijzigen' using errcode = '42501';
  end if;
  update public.profiles set in_les = coalesce(taught, false) where id = target_user;
  if not found then
    raise exception 'Leerling niet gevonden' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_in_les(uuid, boolean) from public, anon;
grant execute on function public.set_in_les(uuid, boolean) to authenticated;
