-- Subscriptions (minimal, set by hand by the docent; no payments yet).
--   gratis    Taal Studio Gratis: look around, open nothing
--   trial     Taal Studio Trial (proefperiode): everything, for now
--   compleet  Taal Studio Compleet: everything
--   onderweg  Taal Studio Onderweg: practise only (flashcards, invullen, vervoegen)
-- Only leerlingen are limited; staff always have everything.
-- plan_notice: a message the student sees once in the app ('trial_ended').

alter table public.profiles
  add column plan text not null default 'trial'
    check (plan in ('gratis', 'trial', 'compleet', 'onderweg')),
  add column plan_notice text
    check (plan_notice in ('trial_ended'));

-- Everyone who is already here keeps everything; new students start with a trial.
update public.profiles set plan = 'compleet';

-- Students can't change their own plan: no column grant on plan / plan_notice.

create function public.set_user_plan(target_user uuid, new_plan text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_plan text;
begin
  if not public.is_docent() then
    raise exception 'Alleen een docent kan het abonnement wijzigen' using errcode = '42501';
  end if;
  select plan into old_plan from public.profiles where id = target_user;
  if old_plan is null then
    raise exception 'Gebruiker niet gevonden' using errcode = 'P0002';
  end if;
  update public.profiles
     set plan = new_plan,
         -- Trial → Gratis: the student is told once in the app; any other change clears the message.
         plan_notice = case when old_plan = 'trial' and new_plan = 'gratis' then 'trial_ended' else null end
   where id = target_user;
end;
$$;

revoke execute on function public.set_user_plan(uuid, text) from public, anon;
grant execute on function public.set_user_plan(uuid, text) to authenticated;

-- The student closes the message.
create function public.dismiss_plan_notice()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set plan_notice = null where id = public.current_profile_id();
$$;

revoke execute on function public.dismiss_plan_notice() from public, anon;
grant execute on function public.dismiss_plan_notice() to authenticated;
