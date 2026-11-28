# Activity log

Everything logged-in users do ends up in `public.activity_log`, for dashboards later.
Visitors without an account are not logged.

- **source `app`**: views and clicks, sent by [src/lib/activity.js](../src/lib/activity.js) in batches (every 5 s and when the tab is hidden or closed).
- **source `db`**: every insert/update/delete on the tables users write to, by the trigger in `supabase/migrations/20261128100000_activity_log.sql`. Writes by scripts, migrations and the auth server are not logged.

Only the docent can read the log. Users can add their own `app` events and nothing else.

## Columns

| column | what |
|---|---|
| `created_at` | when the server got it |
| `client_at` | when it happened on the device (app events) |
| `profile_id` | who (`profiles.id`) |
| `session_id` | one visit: per browser tab, new after 30 min without activity. Edits carry it too (header `x-nts-session`) |
| `event` | see below |
| `target_type`, `target_id` | what it was about (lesson, page, card, table name + row id) |
| `path` | the page it happened on |
| `data` | details (jsonb) |

## Events

| event | when | target / data |
|---|---|---|
| `app_open` | first event of a page load | data: `referrer`, `utm_*`, `width`, `standalone`, `browser_lang` |
| `page_view` | another page (path) | target: page id; data: `param`, `query` |
| `filter` | filters/search in the query string changed (1.5 s after typing stops) | target: page id; data: `query` |
| `app_hide` / `app_show` | tab hidden / back | |
| `sign_in` / `sign_out` | logging in without a page load / logging out | |
| `lesson_open` | a lesson opened (leerpad or lesprogramma) | target: lesson (or step for a zijpad); data: `from`, `step_id`, `locked`, `student_id` (docent looking at a student) |
| `lesson_tab` | another tab in a lesson | target: lesson; data: `tab` |
| `plan_locked` | the "not in your plan" dialog/page shown | data: `kind` |
| `plan_locked_see_plans` | clicked through to the plans | |
| `flashcard_start` / `flashcard_answer` / `flashcard_round_done` | flashcards | target: list or card; data: `knew`, `dir`, `cards`, `hard` |
| `drill_start` / `drill_answer` / `drill_round_done` | Invullen, Vervoegen, Voornaamwoorden | target: drill or question; data: `kind`, `right`, `typed` (wrong answers only) |
| `insert` / `update` / `delete` (source `db`) | any change | target: table + row id; data: `new` (insert), `changed` + `old` + `new` (update), nothing (delete) |

Long texts in `data` become `[N chars]`; email addresses are left out. When a profile is deleted, its events and what was logged about that profile go too.

To log something new: `track("event_name", { targetType, targetId, data })` from `src/lib/activity.js`, and add it to the table above.

## Example queries

```sql
-- One student's visits, in order
select session_id, client_at, event, target_type, target_id, path, data
from activity_log
where profile_id = '<profile id>'
order by session_id, coalesce(client_at, created_at), id;

-- Most opened lessons, last 30 days
select l.title, count(*) opens, count(distinct a.profile_id) students
from activity_log a join lessons l on l.id::text = a.target_id
where a.event = 'lesson_open' and a.created_at > now() - interval '30 days'
group by 1 order by 2 desc;

-- Active students per day
select created_at::date day, count(distinct profile_id)
from activity_log group by 1 order by 1;

-- Where new visits come from (utm tags from the videos)
select data->>'utm_source' source, data->>'utm_campaign' campaign, count(*)
from activity_log where event = 'app_open' group by 1, 2 order by 3 desc;

-- Hardest flashcards
select target_id card, count(*) filter (where not (data->>'knew')::boolean) missed, count(*) answers
from activity_log where event = 'flashcard_answer'
group by 1 order by 2 desc limit 20;
```

If the table gets too big for Postgres (slow dashboard queries, close to the plan's size limit), move the events to an event store (ClickHouse, BigQuery, PostHog). Only `activity.js` and the trigger write here, so only those two need to change.
