alter table public.exercise_logs add column if not exists rpe numeric(3, 1);
alter table public.exercise_logs add column if not exists rest_seconds integer;

alter table public.exercise_logs drop constraint if exists exercise_logs_rpe_valid;
alter table public.exercise_logs add constraint exercise_logs_rpe_valid
check (rpe is null or (rpe >= 1 and rpe <= 10));

alter table public.exercise_logs drop constraint if exists exercise_logs_rest_valid;
alter table public.exercise_logs add constraint exercise_logs_rest_valid
check (rest_seconds is null or rest_seconds >= 0);

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  level text not null default 'error',
  source text not null,
  route text,
  message text not null,
  details jsonb,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint app_error_events_level_valid check (level in ('info', 'warning', 'error')),
  constraint app_error_events_source_not_blank check (length(trim(source)) > 0),
  constraint app_error_events_message_not_blank check (length(trim(message)) > 0)
);

create index if not exists app_error_events_user_created_idx on public.app_error_events(user_id, created_at desc);
create index if not exists app_error_events_source_created_idx on public.app_error_events(source, created_at desc);

alter table public.app_error_events enable row level security;

drop policy if exists "app_error_events_select_own" on public.app_error_events;
create policy "app_error_events_select_own"
on public.app_error_events for select
using (auth.uid() = user_id);

drop policy if exists "app_error_events_insert_own_or_anon" on public.app_error_events;
create policy "app_error_events_insert_own_or_anon"
on public.app_error_events for insert
with check (
  auth.uid() = user_id
  or (auth.uid() is null and user_id is null)
);
