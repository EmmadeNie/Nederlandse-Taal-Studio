-- A role for someone who only checks sentences ("Zinnen nakijken"), e.g. on a
-- phone: sees nothing else in the app. Its own migration: a new enum value
-- can't be used in the transaction that adds it.
alter type public.app_role add value if not exists 'nakijker';
