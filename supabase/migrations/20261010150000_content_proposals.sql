-- Proposals: content changes (from ChatGPT) that the docent reviews one by one.
--
-- `changes` is the changeset as pasted: an array of operations
-- (add/update/delete an item, set.create/update/delete, set.addItem/
-- removeItem/moveItem); see docs/content-briefing-voor-chatgpt.md.
-- `decisions` records what happened to each change, keyed by its index:
-- {"0": {"status": "approved" | "rejected", "at": "…", "error": "…"}}.
-- Approved changes are applied through content_items / sets (and so show
-- up in content_history); this table only keeps the proposal and the verdicts.

create table public.content_proposals (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(btrim(title)) > 0),
  summary    text not null default '',
  changes    jsonb not null check (jsonb_typeof(changes) = 'array' and jsonb_array_length(changes) > 0),
  decisions  jsonb not null default '{}'::jsonb check (jsonb_typeof(decisions) = 'object'),
  status     text not null default 'open' check (status in ('open', 'done')),
  created_by uuid references public.profiles (id) on delete set null default public.current_profile_id(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_proposals_status_idx on public.content_proposals (status, created_at desc);

alter table public.content_proposals enable row level security;
revoke all on public.content_proposals from anon;

create policy "content_proposals: docent only" on public.content_proposals
  for all to authenticated
  using ((select public.is_docent()))
  with check ((select public.is_docent()));
