-- One lane per board can be the "middle lane" (e.g. To do): the board opens
-- scrolled so that lane is the third one visible. At most one per board; the
-- app clears the others when it sets one.
alter table public.lesson_lanes add column is_focus boolean not null default false;
alter table public.leerpad_lanes add column is_focus boolean not null default false;

create unique index lesson_lanes_one_focus on public.lesson_lanes (is_focus) where is_focus;
create unique index leerpad_lanes_one_focus on public.leerpad_lanes (student_id) where is_focus;
