-- A profile is made on the first real login, not when the login mail is sent.
--
-- Before: signInWithOtp creates the auth user as soon as the mail goes out, and
-- on_auth_user_created made a profile right away. A typo in the email address
-- (or a mail nobody opens) left a leerling in the app who can never log in.
-- After:  the profile is made (or a profile the docent made is linked) once
-- the address is proven: when email_confirmed_at or last_sign_in_at gets set,
-- i.e. when the link is clicked or the code is typed. Accounts that never get
-- that far stay as a bare row in auth.users and are invisible in the app.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Not proven yet: wait for the first login.
  if new.email_confirmed_at is null and new.last_sign_in_at is null then
    return new;
  end if;
  -- Already has a profile (fires again on a later update): nothing to do.
  if exists (select 1 from public.profiles where user_id = new.id) then
    return new;
  end if;

  update public.profiles
     set user_id = new.id
   where user_id is null and lower(email) = lower(new.email);
  if found then
    return new;
  end if;

  insert into public.profiles (id, user_id, email, role)
  values (
    new.id,
    new.id,
    new.email,
    -- The very first docent bootstraps the app; everyone else starts as leerling.
    case when exists (select 1 from public.profiles where role = 'docent' and user_id is not null)
         then 'leerling' else 'docent' end::public.app_role
  );
  return new;
end;
$$;

-- Insert: users made already confirmed (admin API, or confirmations off).
-- Update: the first login of a user made by signInWithOtp.
drop trigger on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  when (new.email_confirmed_at is not null or new.last_sign_in_at is not null)
  execute function public.handle_new_user();

create trigger on_auth_user_confirmed
  after update of email_confirmed_at, last_sign_in_at on auth.users
  for each row
  when (old.email_confirmed_at is null and old.last_sign_in_at is null
        and (new.email_confirmed_at is not null or new.last_sign_in_at is not null))
  execute function public.handle_new_user();
