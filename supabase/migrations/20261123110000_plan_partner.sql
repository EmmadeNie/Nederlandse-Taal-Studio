-- Taal Studio Partner: a fourth plan above Compleet (€100 a month, set by hand by the docent).
-- It unlocks everything Compleet does; its extras (live help with the lesson board, priority
-- for the student's ideas) happen outside the app. Only the allowed values change here.
-- The check comes from 20261106100000_plans.sql, where Postgres named it profiles_plan_check.

alter table public.profiles drop constraint profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
    check (plan in ('gratis', 'trial', 'compleet', 'onderweg', 'partner'));
