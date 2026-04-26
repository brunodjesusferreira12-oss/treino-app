-- Fortynex - Supabase/PostgreSQL schema
-- Apply in the Supabase SQL Editor. This script is safe for fresh projects and
-- also upgrades the previous Treino App schema with sports, gamification and battles.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.calculate_level(total_points integer)
returns integer
language plpgsql
immutable
as $$
begin
  return greatest(1, floor(coalesce(total_points, 0) / 250.0)::integer + 1);
end;
$$;

create or replace function public.calculate_current_streak(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_day date := timezone('America/Fortaleza', now())::date;
  expected_day date := current_day;
  unique_days date[];
  streak integer := 0;
  idx integer;
begin
  select coalesce(array_agg(day_key order by day_key desc), '{}')
  into unique_days
  from (
    select distinct (timezone('America/Fortaleza', executed_at))::date as day_key
    from public.workout_executions
    where user_id = target_user_id
      and completed = true
  ) days;

  if array_length(unique_days, 1) is null then
    return 0;
  end if;

  for idx in 1..array_length(unique_days, 1) loop
    if unique_days[idx] = expected_day then
      streak := streak + 1;
      expected_day := expected_day - 1;
    elsif idx = 1 and unique_days[idx] = current_day - 1 then
      streak := 1;
      expected_day := current_day - 2;
    else
      exit;
    end if;
  end loop;

  return streak;
end;
$$;

create or replace function public.touch_assistant_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.assistant_conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  height_cm numeric(5, 2),
  target_weight_kg numeric(6, 2),
  default_workouts_seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists height_cm numeric(5, 2);
alter table public.profiles add column if not exists target_weight_kg numeric(6, 2);

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint sports_slug_not_blank check (length(trim(slug)) > 0),
  constraint sports_name_not_blank check (length(trim(name)) > 0)
);

insert into public.sports (slug, name, description)
values
  ('musculacao', 'Musculacao', 'Forca, hipertrofia e progressao por carga.'),
  ('pilates', 'Pilates', 'Controle corporal, postura, respiracao e estabilidade.'),
  ('crossfit', 'Crossfit', 'Potencia, condicionamento, rounds e performance.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

create table if not exists public.user_sport_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  selected_for_date date not null,
  created_at timestamptz not null default now(),
  constraint user_sport_sessions_unique_day unique (user_id, selected_for_date)
);

create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint assistant_messages_role_valid check (role in ('user', 'assistant')),
  constraint assistant_messages_content_not_blank check (length(trim(content)) > 0)
);

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

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_on date not null,
  weight_kg numeric(6, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint body_measurements_weight_positive check (weight_kg > 0),
  constraint body_measurements_unique_day unique (user_id, recorded_on)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport_id uuid references public.sports(id) on delete restrict,
  name text not null,
  day_of_week text,
  scheduled_days text[] not null default '{}',
  category text not null,
  objective text,
  notes text,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workouts_name_not_blank check (length(trim(name)) > 0),
  constraint workouts_category_not_blank check (length(trim(category)) > 0),
  constraint workouts_has_scheduled_day check (cardinality(scheduled_days) > 0)
);

alter table public.workouts
  add column if not exists sport_id uuid references public.sports(id) on delete restrict;

update public.workouts
set sport_id = (
  select id from public.sports where slug = 'musculacao'
)
where sport_id is null;

alter table public.workouts
  alter column sport_id set not null;

create table if not exists public.workout_sections (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  title text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sections_title_not_blank check (length(trim(title)) > 0),
  constraint workout_sections_order_positive check (order_index >= 0)
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  section_id uuid not null references public.workout_sections(id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  sets integer,
  reps text,
  duration text,
  distance text,
  load_default numeric(8, 2),
  notes text,
  video_url text,
  muscle_group text,
  is_priority boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_name_not_blank check (length(trim(name)) > 0),
  constraint exercises_order_positive check (order_index >= 0),
  constraint exercises_sets_positive check (sets is null or sets > 0),
  constraint exercises_load_positive check (load_default is null or load_default >= 0)
);

create table if not exists public.workout_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  sport_id uuid references public.sports(id) on delete set null,
  workout_name text not null,
  executed_at timestamptz not null default now(),
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_executions_name_not_blank check (length(trim(workout_name)) > 0)
);

alter table public.workout_executions
  add column if not exists sport_id uuid references public.sports(id) on delete set null;

update public.workout_executions executions
set sport_id = workouts.sport_id
from public.workouts workouts
where executions.workout_id = workouts.id
  and executions.sport_id is null;

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.workout_executions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  section_title text,
  prescription text,
  load_used numeric(8, 2),
  reps_done text,
  rpe numeric(3, 1),
  rest_seconds integer,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_logs_name_not_blank check (length(trim(exercise_name)) > 0),
  constraint exercise_logs_load_positive check (load_used is null or load_used >= 0),
  constraint exercise_logs_rpe_valid check (rpe is null or (rpe >= 1 and rpe <= 10)),
  constraint exercise_logs_rest_valid check (rest_seconds is null or rest_seconds >= 0),
  constraint exercise_logs_execution_exercise_unique unique (execution_id, exercise_id)
);

alter table public.exercise_logs add column if not exists rpe numeric(3, 1);
alter table public.exercise_logs add column if not exists rest_seconds integer;

create table if not exists public.gamification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport_id uuid references public.sports(id) on delete set null,
  event_type text not null,
  points integer not null,
  reference_type text,
  reference_id text,
  description text,
  created_at timestamptz not null default now(),
  constraint gamification_events_type_not_blank check (length(trim(event_type)) > 0),
  constraint gamification_events_points_positive check (points > 0)
);

create table if not exists public.user_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  total_points integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_points_total_nonnegative check (total_points >= 0),
  constraint user_points_level_positive check (level >= 1),
  constraint user_points_streak_nonnegative check (current_streak >= 0)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  sport_slug text,
  created_at timestamptz not null default now(),
  constraint badges_slug_not_blank check (length(trim(slug)) > 0),
  constraint badges_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  constraint user_badges_unique unique (user_id, badge_id)
);

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  sport_id uuid references public.sports(id) on delete set null,
  battle_type text not null,
  scoring_mode text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending',
  winner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint battles_title_not_blank check (length(trim(title)) > 0),
  constraint battles_valid_range check (ends_at >= starts_at),
  constraint battles_valid_status check (status in ('pending', 'active', 'ended')),
  constraint battles_valid_type check (battle_type in ('head_to_head', 'consistency', 'volume')),
  constraint battles_valid_scoring check (scoring_mode in ('points', 'workouts', 'exercises', 'sport_points'))
);

create table if not exists public.battle_participants (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  joined_at timestamptz not null default now(),
  constraint battle_participants_unique unique (battle_id, user_id),
  constraint battle_participants_valid_role check (role in ('challenger', 'opponent'))
);

create table if not exists public.battle_scores (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint battle_scores_unique unique (battle_id, user_id),
  constraint battle_scores_nonnegative check (score >= 0)
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

drop trigger if exists assistant_conversations_set_updated_at on public.assistant_conversations;
create trigger assistant_conversations_set_updated_at
before update on public.assistant_conversations
for each row execute function public.set_updated_at();

drop trigger if exists assistant_messages_touch_conversation on public.assistant_messages;
create trigger assistant_messages_touch_conversation
after insert on public.assistant_messages
for each row execute function public.touch_assistant_conversation();

drop trigger if exists body_measurements_set_updated_at on public.body_measurements;
create trigger body_measurements_set_updated_at
before update on public.body_measurements
for each row execute function public.set_updated_at();

drop trigger if exists workout_sections_set_updated_at on public.workout_sections;
create trigger workout_sections_set_updated_at
before update on public.workout_sections
for each row execute function public.set_updated_at();

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

drop trigger if exists workout_executions_set_updated_at on public.workout_executions;
create trigger workout_executions_set_updated_at
before update on public.workout_executions
for each row execute function public.set_updated_at();

drop trigger if exists exercise_logs_set_updated_at on public.exercise_logs;
create trigger exercise_logs_set_updated_at
before update on public.exercise_logs
for each row execute function public.set_updated_at();

drop trigger if exists user_points_set_updated_at on public.user_points;
create trigger user_points_set_updated_at
before update on public.user_points
for each row execute function public.set_updated_at();

drop trigger if exists battles_set_updated_at on public.battles;
create trigger battles_set_updated_at
before update on public.battles
for each row execute function public.set_updated_at();

drop trigger if exists battle_scores_set_updated_at on public.battle_scores;
create trigger battle_scores_set_updated_at
before update on public.battle_scores
for each row execute function public.set_updated_at();

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists sports_slug_idx on public.sports(slug);
create index if not exists user_sport_sessions_user_date_idx on public.user_sport_sessions(user_id, selected_for_date desc);
create index if not exists assistant_conversations_user_updated_idx on public.assistant_conversations(user_id, updated_at desc);
create index if not exists assistant_messages_conversation_created_idx on public.assistant_messages(conversation_id, created_at desc);
create index if not exists assistant_messages_user_created_idx on public.assistant_messages(user_id, created_at desc);
create index if not exists app_error_events_user_created_idx on public.app_error_events(user_id, created_at desc);
create index if not exists app_error_events_source_created_idx on public.app_error_events(source, created_at desc);
create index if not exists body_measurements_user_recorded_idx on public.body_measurements(user_id, recorded_on desc);
create index if not exists workouts_user_sport_updated_idx on public.workouts(user_id, sport_id, updated_at desc);
create index if not exists workouts_scheduled_days_idx on public.workouts using gin(scheduled_days);
create index if not exists workout_sections_workout_order_idx on public.workout_sections(workout_id, order_index);
create index if not exists exercises_workout_order_idx on public.exercises(workout_id, order_index);
create index if not exists exercises_section_order_idx on public.exercises(section_id, order_index);
create index if not exists workout_executions_user_sport_date_idx on public.workout_executions(user_id, sport_id, executed_at desc);
create index if not exists workout_executions_workout_date_idx on public.workout_executions(workout_id, executed_at desc);
create index if not exists exercise_logs_execution_idx on public.exercise_logs(execution_id);
create index if not exists exercise_logs_exercise_idx on public.exercise_logs(exercise_id) where exercise_id is not null;
create index if not exists gamification_events_user_date_idx on public.gamification_events(user_id, created_at desc);
create index if not exists gamification_events_user_sport_idx on public.gamification_events(user_id, sport_id, created_at desc);
create unique index if not exists gamification_events_reference_unique_idx
  on public.gamification_events(user_id, event_type, reference_type, reference_id)
  where reference_type is not null and reference_id is not null;
create index if not exists user_badges_user_earned_idx on public.user_badges(user_id, earned_at desc);
create index if not exists battles_creator_date_idx on public.battles(created_by, starts_at desc);
create index if not exists battles_sport_status_idx on public.battles(sport_id, status, starts_at desc);
create index if not exists battle_participants_user_idx on public.battle_participants(user_id, joined_at desc);
create index if not exists battle_scores_battle_score_idx on public.battle_scores(battle_id, score desc);

create or replace function public.user_participates_in_battle(target_battle_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    return false;
  end if;

  return exists (
    select 1
    from public.battle_participants
    where battle_id = target_battle_id
      and user_id = actor_id
  );
end;
$$;

create or replace function public.ensure_reference_badges()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.badges (slug, name, description, icon, sport_slug)
  values
    ('primeiro-treino', 'Primeiro treino concluido', 'Conclua sua primeira sessao para iniciar a jornada.', 'sparkles', null),
    ('semana-perfeita', 'Semana perfeita', 'Conclua cinco treinos na mesma semana.', 'calendar', null),
    ('especialista-musculacao', 'Especialista em musculacao', 'Complete cinco treinos de musculacao.', 'dumbbell', 'musculacao'),
    ('especialista-pilates', 'Especialista em pilates', 'Complete cinco treinos de pilates.', 'flower-2', 'pilates'),
    ('especialista-crossfit', 'Especialista em crossfit', 'Complete cinco treinos de crossfit.', 'flame', 'crossfit'),
    ('vencedor-de-batalha', 'Vencedor de batalha', 'Venca um duelo contra outro competidor.', 'swords', null),
    ('sequencia-7-dias', 'Sequencia de 7 dias', 'Mantenha sete dias consecutivos com treino concluido.', 'zap', null),
    ('dez-treinos', '10 treinos concluidos', 'Acumule dez treinos finalizados.', 'target', null),
    ('cinquenta-exercicios', '50 exercicios concluidos', 'Some cinquenta exercicios concluidos no historico.', 'medal', null)
  on conflict (slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sport_slug = excluded.sport_slug;
end;
$$;

create or replace function public.sync_user_badges_internal(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  week_start timestamptz := date_trunc('week', timezone('America/Fortaleza', now()));
  week_end timestamptz := date_trunc('week', timezone('America/Fortaleza', now())) + interval '6 days 23 hours 59 minutes 59 seconds';
  workout_count integer := 0;
  exercise_count integer := 0;
  current_streak_value integer := 0;
  battle_wins integer := 0;
  weekly_workouts integer := 0;
  musculacao_count integer := 0;
  pilates_count integer := 0;
  crossfit_count integer := 0;
begin
  perform public.ensure_reference_badges();

  select count(*)
  into workout_count
  from public.workout_executions
  where user_id = target_user_id
    and completed = true;

  select count(*)
  into exercise_count
  from public.exercise_logs logs
  inner join public.workout_executions executions
    on executions.id = logs.execution_id
  where executions.user_id = target_user_id
    and logs.completed = true;

  select coalesce(current_streak, 0)
  into current_streak_value
  from public.user_points
  where user_id = target_user_id;

  select count(*)
  into battle_wins
  from public.battles
  where winner_user_id = target_user_id;

  select count(*)
  into weekly_workouts
  from public.workout_executions
  where user_id = target_user_id
    and completed = true
    and executed_at >= week_start
    and executed_at <= week_end;

  select count(*)
  into musculacao_count
  from public.workout_executions executions
  inner join public.sports sports
    on sports.id = executions.sport_id
  where executions.user_id = target_user_id
    and executions.completed = true
    and sports.slug = 'musculacao';

  select count(*)
  into pilates_count
  from public.workout_executions executions
  inner join public.sports sports
    on sports.id = executions.sport_id
  where executions.user_id = target_user_id
    and executions.completed = true
    and sports.slug = 'pilates';

  select count(*)
  into crossfit_count
  from public.workout_executions executions
  inner join public.sports sports
    on sports.id = executions.sport_id
  where executions.user_id = target_user_id
    and executions.completed = true
    and sports.slug = 'crossfit';

  if workout_count >= 1 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'primeiro-treino'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if weekly_workouts >= 5 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'semana-perfeita'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if musculacao_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'especialista-musculacao'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if pilates_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'especialista-pilates'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if crossfit_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'especialista-crossfit'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if battle_wins >= 1 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'vencedor-de-batalha'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if current_streak_value >= 7 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'sequencia-7-dias'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if workout_count >= 10 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'dez-treinos'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if exercise_count >= 50 then
    insert into public.user_badges (user_id, badge_id)
    select target_user_id, id from public.badges where slug = 'cinquenta-exercicios'
    on conflict (user_id, badge_id) do nothing;
  end if;
end;
$$;

create or replace function public.sync_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'authenticated user required';
  end if;

  if auth.uid() is distinct from target_user_id
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed to sync another user';
  end if;

  perform public.sync_user_badges_internal(target_user_id);
end;
$$;

create or replace function public.award_gamification_event(
  target_user_id uuid,
  target_sport_id uuid default null,
  target_event_type text default null,
  target_points integer default null,
  target_reference_type text default null,
  target_reference_id text default null,
  target_description text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  inserted_rows integer := 0;
  computed_total_points integer := 0;
  streak_value integer := 0;
begin
  if actor_id is null
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'authenticated user required';
  end if;

  if target_user_id is null or target_event_type is null or target_points is null then
    raise exception 'target_user_id, target_event_type and target_points are required';
  end if;

  if target_points <= 0 then
    raise exception 'target_points must be positive';
  end if;

  if actor_id is distinct from target_user_id
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role' then
    if target_reference_type <> 'battle-result'
      or target_reference_id is null
      or target_reference_id !~* '^[0-9a-f-]{36}$'
      or not exists (
        select 1
        from public.battle_participants
        where battle_id = target_reference_id::uuid
          and user_id = actor_id
      ) then
      raise exception 'not allowed to award points for this user';
    end if;
  end if;

  insert into public.user_points (user_id, total_points, level, current_streak)
  values (target_user_id, 0, 1, 0)
  on conflict (user_id) do nothing;

  insert into public.gamification_events (
    user_id,
    sport_id,
    event_type,
    points,
    reference_type,
    reference_id,
    description
  )
  values (
    target_user_id,
    target_sport_id,
    target_event_type,
    target_points,
    target_reference_type,
    target_reference_id,
    target_description
  )
  on conflict do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows = 0 then
    return false;
  end if;

  select coalesce(sum(points), 0)
  into computed_total_points
  from public.gamification_events
  where user_id = target_user_id;

  streak_value := public.calculate_current_streak(target_user_id);

  update public.user_points
  set
    total_points = computed_total_points,
    level = public.calculate_level(computed_total_points),
    current_streak = streak_value,
    updated_at = now()
  where user_id = target_user_id;

  perform public.sync_user_badges_internal(target_user_id);

  return true;
end;
$$;

create or replace function public.sync_battle_scores(target_battle_id uuid)
returns table (
  battle_id uuid,
  status text,
  winner_user_id uuid,
  sport_id uuid,
  user_id uuid,
  score integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  battle_row public.battles%rowtype;
  computed_status text;
  top_user uuid;
  top_score integer;
  second_user uuid;
  second_score integer;
begin
  if actor_id is null
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'authenticated user required';
  end if;

  select *
  into battle_row
  from public.battles
  where id = target_battle_id;

  if not found then
    raise exception 'battle not found';
  end if;

  if actor_id is not null
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role'
    and not exists (
      select 1
      from public.battle_participants
      where battle_id = target_battle_id
        and user_id = actor_id
    ) then
    raise exception 'not allowed to read this battle';
  end if;

  computed_status := case
    when now() < battle_row.starts_at then 'pending'
    when now() > battle_row.ends_at then 'ended'
    else 'active'
  end;

  with participant_scores as (
    select
      participants.user_id,
      coalesce(sum(
        case
          when events.id is null then 0
          when battle_row.sport_id is not null and events.sport_id is distinct from battle_row.sport_id then 0
          when battle_row.scoring_mode = 'workouts' and events.event_type = 'COMPLETE_WORKOUT' then 1
          when battle_row.scoring_mode = 'exercises' and events.event_type = 'COMPLETE_EXERCISE' then 1
          when battle_row.scoring_mode = 'sport_points' and battle_row.sport_id is not null and events.sport_id = battle_row.sport_id then events.points
          when battle_row.scoring_mode = 'sport_points' and battle_row.sport_id is null then events.points
          when battle_row.scoring_mode = 'points' then events.points
          else 0
        end
      ), 0)::integer as score
    from public.battle_participants participants
    left join public.gamification_events events
      on events.user_id = participants.user_id
     and events.created_at >= battle_row.starts_at
     and events.created_at <= battle_row.ends_at
    where participants.battle_id = target_battle_id
    group by participants.user_id
  )
  insert into public.battle_scores (battle_id, user_id, score)
  select target_battle_id, participant_scores.user_id, participant_scores.score
  from participant_scores
  on conflict (battle_id, user_id) do update
  set
    score = excluded.score,
    updated_at = now();

  if computed_status = 'ended' then
    select scores.user_id, scores.score
    into top_user, top_score
    from public.battle_scores scores
    where scores.battle_id = target_battle_id
    order by scores.score desc, scores.user_id
    limit 1;

    select scores.user_id, scores.score
    into second_user, second_score
    from public.battle_scores scores
    where scores.battle_id = target_battle_id
    order by scores.score desc, scores.user_id
    offset 1
    limit 1;

    if top_score is not null and second_score is not null and top_score > second_score then
      battle_row.winner_user_id := top_user;
    else
      battle_row.winner_user_id := null;
    end if;
  else
    battle_row.winner_user_id := null;
  end if;

  update public.battles
  set
    status = computed_status,
    winner_user_id = battle_row.winner_user_id,
    updated_at = now()
  where id = target_battle_id;

  return query
  select
    target_battle_id,
    computed_status,
    battle_row.winner_user_id,
    battle_row.sport_id,
    scores.user_id,
    scores.score
  from public.battle_scores scores
  where scores.battle_id = target_battle_id
  order by scores.score desc, scores.user_id;
end;
$$;

create or replace function public.list_battle_candidates()
returns table (
  id uuid,
  full_name text,
  avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'authenticated user required';
  end if;

  return query
  select
    profiles.id,
    coalesce(profiles.full_name, split_part(profiles.email, '@', 1)) as full_name,
    profiles.avatar_url
  from public.profiles
  where profiles.id <> auth.uid()
  order by coalesce(profiles.full_name, profiles.email);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  insert into public.user_points (user_id, total_points, level, current_streak)
  values (new.id, 0, 1, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.seed_default_workouts_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  seeded_at timestamptz;
  musculacao_id uuid;
  pilates_id uuid;
  crossfit_id uuid;
  workout_id uuid;
  section_id uuid;
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if auth.uid() is distinct from target_user_id
    and session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed to seed workouts for this user';
  end if;

  select default_workouts_seeded_at
  into seeded_at
  from public.profiles
  where id = target_user_id;

  if seeded_at is not null then
    return;
  end if;

  if exists (select 1 from public.workouts where user_id = target_user_id) then
    update public.profiles
    set default_workouts_seeded_at = now()
    where id = target_user_id;
    return;
  end if;

  select id into musculacao_id from public.sports where slug = 'musculacao';
  select id into pilates_id from public.sports where slug = 'pilates';
  select id into crossfit_id from public.sports where slug = 'crossfit';

  insert into public.workouts (
    user_id, sport_id, name, day_of_week, scheduled_days, category, objective, notes
  )
  values (
    target_user_id,
    musculacao_id,
    'Upper Push Premium',
    'monday',
    array['monday', 'thursday'],
    'hipertrofia',
    'Peito, ombros e triceps com foco em carga, volume e constancia.',
    'Treino de empurrar para dias de musculacao com blocos claros e execucao objetiva.'
  )
  returning id into workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Ativacao', 0)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, notes, video_url, muscle_group)
  values
    (workout_id, section_id, 'Scapula Push-Up', 0, 2, '12', 'Ative cintura escapular antes da parte principal.', 'https://www.youtube.com/watch?v=J0DnG1_S92I', 'ombros'),
    (workout_id, section_id, 'Band Pull Apart', 1, 2, '15', 'Use controle total na abertura.', 'https://www.youtube.com/watch?v=JObYtU7Y7ag', 'costas');

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Forca principal', 1)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, load_default, video_url, muscle_group, is_priority)
  values
    (workout_id, section_id, 'Supino com halteres', 0, 4, '8-10', 20, 'https://www.youtube.com/watch?v=VmB1G1K7v94', 'peito', true),
    (workout_id, section_id, 'Supino inclinado', 1, 3, '10', 18, 'https://www.youtube.com/watch?v=8iPEnn-ltC8', 'peito', true),
    (workout_id, section_id, 'Desenvolvimento com halteres', 2, 3, '10', 12, 'https://www.youtube.com/watch?v=qEwKCR5JCog', 'ombros', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Complementar', 2)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, video_url, muscle_group)
  values
    (workout_id, section_id, 'Crucifixo', 0, 3, '12', 'https://www.youtube.com/watch?v=eozdVDA78K0', 'peito'),
    (workout_id, section_id, 'Triceps corda', 1, 3, '12', 'https://www.youtube.com/watch?v=vB5OHsJ3EME', 'triceps'),
    (workout_id, section_id, 'Elevacao lateral', 2, 3, '15', 'https://www.youtube.com/watch?v=3VcKaXpzqRo', 'ombros');

  insert into public.workouts (
    user_id, sport_id, name, day_of_week, scheduled_days, category, objective, notes
  )
  values (
    target_user_id,
    musculacao_id,
    'Lower Strength Builder',
    'tuesday',
    array['tuesday'],
    'forca',
    'Forca de inferiores com posterior, core e panturrilha.',
    'Treino de base para dias de perna com foco em progressao de carga.'
  )
  returning id into workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Preparacao', 0)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, video_url, muscle_group)
  values
    (workout_id, section_id, 'Glute Bridge', 0, 2, '15', 'https://www.youtube.com/watch?v=wPM8icPu6H8', 'gluteos'),
    (workout_id, section_id, 'Bodyweight Squat', 1, 2, '12', 'https://www.youtube.com/watch?v=aclHkVaku9U', 'quadriceps');

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Forca principal', 1)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, load_default, video_url, muscle_group, is_priority)
  values
    (workout_id, section_id, 'Back Squat', 0, 4, '6', 40, 'https://www.youtube.com/watch?v=ultWZbUMPL8', 'quadriceps', true),
    (workout_id, section_id, 'Romanian Deadlift', 1, 4, '8', 35, 'https://www.youtube.com/watch?v=2SHsk9AzdjA', 'posterior', true),
    (workout_id, section_id, 'Leg Press', 2, 3, '12', 80, 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', 'quadriceps', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Core e estabilidade', 2)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, video_url, muscle_group)
  values
    (workout_id, section_id, 'Bulgarian Split Squat', 0, 3, '10 cada perna', null, 'https://www.youtube.com/watch?v=2C-uNgKwPLE', 'quadriceps'),
    (workout_id, section_id, 'Standing Calf Raise', 1, 4, '15', null, 'https://www.youtube.com/watch?v=gwLzBJYoWlI', 'panturrilha'),
    (workout_id, section_id, 'Prancha frontal', 2, 3, null, '40s', 'https://www.youtube.com/watch?v=ASdvN_XEl_c', 'core');

  insert into public.workouts (
    user_id, sport_id, name, day_of_week, scheduled_days, category, objective, notes
  )
  values (
    target_user_id,
    musculacao_id,
    'Pull and Arms',
    'friday',
    array['friday'],
    'hipertrofia',
    'Costas, biceps e saude escapular para fechar a semana.',
    'Treino de puxar com foco em densidade e estabilidade.'
  )
  returning id into workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Ativacao', 0)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, video_url, muscle_group)
  values
    (workout_id, section_id, 'Face Pull leve', 0, 2, '15', 'https://www.youtube.com/watch?v=rep-qVOkqgk', 'ombros'),
    (workout_id, section_id, 'Scap Pull-Up', 1, 2, '8', 'https://www.youtube.com/watch?v=cZptlM4D6k4', 'costas');

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Forca principal', 1)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, video_url, muscle_group, is_priority)
  values
    (workout_id, section_id, 'Puxada aberta', 0, 4, '10', 'https://www.youtube.com/watch?v=CAwf7n6Luuc', 'costas', true),
    (workout_id, section_id, 'Remada baixa', 1, 4, '10', 'https://www.youtube.com/watch?v=GZbfZ033f74', 'costas', true),
    (workout_id, section_id, 'Barra fixa assistida', 2, 3, '6', 'https://www.youtube.com/watch?v=eGo4IYlbE5g', 'costas', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Finalizacao', 2)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, video_url, muscle_group)
  values
    (workout_id, section_id, 'Face Pull', 0, 3, '15', 'https://www.youtube.com/watch?v=rep-qVOkqgk', 'ombros'),
    (workout_id, section_id, 'Rosca direta', 1, 3, '10', 'https://www.youtube.com/watch?v=kwG2ipFRgfo', 'biceps'),
    (workout_id, section_id, 'Rosca martelo', 2, 3, '12', 'https://www.youtube.com/watch?v=zC3nLlEvin4', 'biceps');

  insert into public.workouts (
    user_id, sport_id, name, day_of_week, scheduled_days, category, objective, notes
  )
  values (
    target_user_id,
    pilates_id,
    'Pilates Core e Controle',
    'wednesday',
    array['wednesday'],
    'pilates solo',
    'Controle de centro, respiracao e alinhamento para sessao fluida.',
    'Sessao base de pilates com foco em precisao e estabilidade.'
  )
  returning id into workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Respiracao', 0)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, duration, notes, muscle_group)
  values
    (workout_id, section_id, 'Breathing Reset', 0, 2, '60s', 'Respire em 360 graus antes da parte principal.', 'respiracao'),
    (workout_id, section_id, 'Pelvic Clock', 1, 2, '45s', 'Ative o centro e controle a pelve.', 'pilates');

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Controle', 1)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, video_url, muscle_group, is_priority)
  values
    (workout_id, section_id, 'Hundred', 0, 3, null, '40s', 'https://www.youtube.com/watch?v=PrGjTtpIYfA', 'core', true),
    (workout_id, section_id, 'Roll Up', 1, 3, '10', null, 'https://www.youtube.com/watch?v=iQ4g-g2rFvE', 'core', true),
    (workout_id, section_id, 'Single Leg Stretch', 2, 3, '12 cada lado', null, 'https://www.youtube.com/watch?v=Qx7Xw9T0-4E', 'core', true),
    (workout_id, section_id, 'Swan Prep', 3, 3, '10', null, 'https://www.youtube.com/watch?v=Q4aPq0b9VEg', 'mobilidade', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Estabilidade', 2)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, video_url, muscle_group)
  values
    (workout_id, section_id, 'Side Kick', 0, 3, '12 cada lado', null, 'https://www.youtube.com/watch?v=Jm3kA0mWCXQ', 'pilates'),
    (workout_id, section_id, 'Shoulder Bridge', 1, 3, '12', null, 'https://www.youtube.com/watch?v=m2Zx-57cSok', 'gluteos'),
    (workout_id, section_id, 'Mermaid Stretch', 2, 2, null, '40s', 'https://www.youtube.com/watch?v=QleN1M2v2Lk', 'mobilidade');

  insert into public.workouts (
    user_id, sport_id, name, day_of_week, scheduled_days, category, objective, notes
  )
  values (
    target_user_id,
    pilates_id,
    'Pilates Mobilidade e Estabilidade',
    'saturday',
    array['saturday'],
    'mobilidade',
    'Melhorar postura, mobilidade toracica e estabilidade do tronco.',
    'Sessao complementar para dias de recuperacao ativa.'
  )
  returning id into workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Preparacao', 0)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, video_url, muscle_group)
  values
    (workout_id, section_id, 'Cat Cow', 0, 2, '10', 'https://www.youtube.com/watch?v=wBq3zWA2Jj8', 'mobilidade'),
    (workout_id, section_id, 'Thoracic Rotation', 1, 2, '12 cada lado', 'https://www.youtube.com/watch?v=K4dmZ5_n6uU', 'mobilidade');

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Sessao principal', 1)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, video_url, muscle_group)
  values
    (workout_id, section_id, 'Spine Twist', 0, 3, '12', null, 'https://www.youtube.com/watch?v=2G3QH2YI7aA', 'pilates'),
    (workout_id, section_id, 'Bird Dog', 1, 3, '12', null, 'https://www.youtube.com/watch?v=wiFNA3sqjCA', 'estabilidade'),
    (workout_id, section_id, 'Side Plank Hold', 2, 3, null, '30s', 'https://www.youtube.com/watch?v=K2VljzCC16g', 'core'),
    (workout_id, section_id, 'Leg Circle', 3, 3, '10 cada lado', null, 'https://www.youtube.com/watch?v=9fX9P0wTFdA', 'pilates');

  insert into public.workouts (
    user_id, sport_id, name, day_of_week, scheduled_days, category, objective, notes
  )
  values (
    target_user_id,
    crossfit_id,
    'Crossfit Barbell Power',
    'monday',
    array['monday'],
    'tecnica',
    'Potencia com barra, padrao tecnico e blocos de forca.',
    'Sessao de crossfit orientada para tecnica com barra e potencia.'
  )
  returning id into workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Aquecimento', 0)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, video_url, muscle_group)
  values
    (workout_id, section_id, 'Air Squat', 0, 2, '15', 'https://www.youtube.com/watch?v=aclHkVaku9U', 'corpo inteiro'),
    (workout_id, section_id, 'PVC Pass Through', 1, 2, '12', 'https://www.youtube.com/watch?v=xL4s4fK2yqI', 'mobilidade');

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Barbell power', 1)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, load_default, video_url, muscle_group, is_priority)
  values
    (workout_id, section_id, 'Clean Pull', 0, 5, '3', 30, 'https://www.youtube.com/watch?v=5vVSGITznQk', 'levantamento olimpico', true),
    (workout_id, section_id, 'Push Press', 1, 5, '5', 25, 'https://www.youtube.com/watch?v=iaBVSJm78ko', 'ombros', true),
    (workout_id, section_id, 'Front Squat', 2, 4, '5', 35, 'https://www.youtube.com/watch?v=tlf3K2WqhaM', 'quadriceps', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Finisher', 2)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, distance, duration, video_url, muscle_group)
  values
    (workout_id, section_id, 'Row', 0, 4, '250m', null, 'https://www.youtube.com/watch?v=EQ33tJf9S2Q', 'cardio'),
    (workout_id, section_id, 'Box Jump', 1, 4, null, null, 'https://www.youtube.com/watch?v=52rU5r0C1kM', 'crossfit');

  insert into public.workouts (
    user_id, sport_id, name, day_of_week, scheduled_days, category, objective, notes
  )
  values (
    target_user_id,
    crossfit_id,
    'Crossfit Engine and Skill',
    'thursday',
    array['thursday'],
    'metcon',
    'Rounds, cardio e skills de ginastica para condicao geral.',
    'Sessao com volume de condicionamento e habilidades base de crossfit.'
  )
  returning id into workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Skill', 0)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, video_url, muscle_group)
  values
    (workout_id, section_id, 'Double Under Practice', 0, 5, null, '40s', 'https://www.youtube.com/watch?v=1BZM7T3boTQ', 'cardio'),
    (workout_id, section_id, 'Kipping Swing', 1, 4, '10', null, 'https://www.youtube.com/watch?v=h0fB45X0Ux0', 'ginastica');

  insert into public.workout_sections (workout_id, title, order_index)
  values (workout_id, 'Metcon', 1)
  returning id into section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, video_url, muscle_group, is_priority)
  values
    (workout_id, section_id, 'Thruster', 0, 4, '10', null, 'https://www.youtube.com/watch?v=L219ltL15zk', 'crossfit', true),
    (workout_id, section_id, 'Burpee Over Bar', 1, 4, '12', null, 'https://www.youtube.com/watch?v=auBLPXO8Fww', 'crossfit', true),
    (workout_id, section_id, 'Kettlebell Swing', 2, 4, '15', null, 'https://www.youtube.com/watch?v=YSxHifyIrv0', 'corpo inteiro', true),
    (workout_id, section_id, 'Assault Bike', 3, 4, null, '40s', 'https://www.youtube.com/watch?v=oB6Xq9ZkX7c', 'cardio', false);

  update public.profiles
  set default_workouts_seeded_at = now()
  where id = target_user_id;
end;
$$;

revoke all on function public.seed_default_workouts_for_user(uuid) from public;
grant execute on function public.seed_default_workouts_for_user(uuid) to service_role;

create or replace function public.seed_my_default_workouts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authenticated user required';
  end if;

  perform public.seed_default_workouts_for_user(current_user_id);
end;
$$;

revoke all on function public.seed_my_default_workouts() from public;
grant execute on function public.seed_my_default_workouts() to authenticated;

revoke all on function public.ensure_reference_badges() from public;
grant execute on function public.ensure_reference_badges() to authenticated, service_role;

revoke all on function public.sync_user_badges(uuid) from public;
grant execute on function public.sync_user_badges(uuid) to authenticated, service_role;

revoke all on function public.award_gamification_event(uuid, uuid, text, integer, text, text, text) from public;
grant execute on function public.award_gamification_event(uuid, uuid, text, integer, text, text, text) to authenticated, service_role;

revoke all on function public.sync_battle_scores(uuid) from public;
grant execute on function public.sync_battle_scores(uuid) to authenticated, service_role;

revoke all on function public.list_battle_candidates() from public;
grant execute on function public.list_battle_candidates() to authenticated, service_role;

revoke all on function public.user_participates_in_battle(uuid) from public;
grant execute on function public.user_participates_in_battle(uuid) to authenticated, service_role;

revoke all on function public.touch_assistant_conversation() from public;
grant execute on function public.touch_assistant_conversation() to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.sports enable row level security;
alter table public.user_sport_sessions enable row level security;
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.app_error_events enable row level security;
alter table public.body_measurements enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sections enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_executions enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.gamification_events enable row level security;
alter table public.user_points enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.battles enable row level security;
alter table public.battle_participants enable row level security;
alter table public.battle_scores enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "sports_select_authenticated" on public.sports;
create policy "sports_select_authenticated"
on public.sports for select
using (auth.role() = 'authenticated');

drop policy if exists "user_sport_sessions_select_own" on public.user_sport_sessions;
create policy "user_sport_sessions_select_own"
on public.user_sport_sessions for select
using (auth.uid() = user_id);

drop policy if exists "user_sport_sessions_insert_own" on public.user_sport_sessions;
create policy "user_sport_sessions_insert_own"
on public.user_sport_sessions for insert
with check (auth.uid() = user_id);

drop policy if exists "user_sport_sessions_update_own" on public.user_sport_sessions;
create policy "user_sport_sessions_update_own"
on public.user_sport_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_sport_sessions_delete_own" on public.user_sport_sessions;
create policy "user_sport_sessions_delete_own"
on public.user_sport_sessions for delete
using (auth.uid() = user_id);

drop policy if exists "assistant_conversations_select_own" on public.assistant_conversations;
create policy "assistant_conversations_select_own"
on public.assistant_conversations for select
using (auth.uid() = user_id);

drop policy if exists "assistant_conversations_insert_own" on public.assistant_conversations;
create policy "assistant_conversations_insert_own"
on public.assistant_conversations for insert
with check (auth.uid() = user_id);

drop policy if exists "assistant_conversations_update_own" on public.assistant_conversations;
create policy "assistant_conversations_update_own"
on public.assistant_conversations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "assistant_messages_select_own" on public.assistant_messages;
create policy "assistant_messages_select_own"
on public.assistant_messages for select
using (auth.uid() = user_id);

drop policy if exists "assistant_messages_insert_own" on public.assistant_messages;
create policy "assistant_messages_insert_own"
on public.assistant_messages for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.assistant_conversations
    where assistant_conversations.id = assistant_messages.conversation_id
      and assistant_conversations.user_id = auth.uid()
  )
);

drop policy if exists "assistant_messages_delete_own" on public.assistant_messages;
create policy "assistant_messages_delete_own"
on public.assistant_messages for delete
using (auth.uid() = user_id);

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

drop policy if exists "body_measurements_select_own" on public.body_measurements;
create policy "body_measurements_select_own"
on public.body_measurements for select
using (auth.uid() = user_id);

drop policy if exists "body_measurements_insert_own" on public.body_measurements;
create policy "body_measurements_insert_own"
on public.body_measurements for insert
with check (auth.uid() = user_id);

drop policy if exists "body_measurements_update_own" on public.body_measurements;
create policy "body_measurements_update_own"
on public.body_measurements for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "body_measurements_delete_own" on public.body_measurements;
create policy "body_measurements_delete_own"
on public.body_measurements for delete
using (auth.uid() = user_id);

drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own"
on public.workouts for select
using (auth.uid() = user_id);

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own"
on public.workouts for insert
with check (auth.uid() = user_id);

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own"
on public.workouts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own"
on public.workouts for delete
using (auth.uid() = user_id);

drop policy if exists "workout_sections_select_owned_workouts" on public.workout_sections;
create policy "workout_sections_select_owned_workouts"
on public.workout_sections for select
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "workout_sections_insert_owned_workouts" on public.workout_sections;
create policy "workout_sections_insert_owned_workouts"
on public.workout_sections for insert
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "workout_sections_update_owned_workouts" on public.workout_sections;
create policy "workout_sections_update_owned_workouts"
on public.workout_sections for update
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "workout_sections_delete_owned_workouts" on public.workout_sections;
create policy "workout_sections_delete_owned_workouts"
on public.workout_sections for delete
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "exercises_select_owned_workouts" on public.exercises;
create policy "exercises_select_owned_workouts"
on public.exercises for select
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "exercises_insert_owned_workouts" on public.exercises;
create policy "exercises_insert_owned_workouts"
on public.exercises for insert
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "exercises_update_owned_workouts" on public.exercises;
create policy "exercises_update_owned_workouts"
on public.exercises for update
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "exercises_delete_owned_workouts" on public.exercises;
create policy "exercises_delete_owned_workouts"
on public.exercises for delete
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "workout_executions_select_own" on public.workout_executions;
create policy "workout_executions_select_own"
on public.workout_executions for select
using (auth.uid() = user_id);

drop policy if exists "workout_executions_insert_own" on public.workout_executions;
create policy "workout_executions_insert_own"
on public.workout_executions for insert
with check (auth.uid() = user_id);

drop policy if exists "workout_executions_update_own" on public.workout_executions;
create policy "workout_executions_update_own"
on public.workout_executions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "workout_executions_delete_own" on public.workout_executions;
create policy "workout_executions_delete_own"
on public.workout_executions for delete
using (auth.uid() = user_id);

drop policy if exists "exercise_logs_select_owned_executions" on public.exercise_logs;
create policy "exercise_logs_select_owned_executions"
on public.exercise_logs for select
using (
  exists (
    select 1
    from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

drop policy if exists "exercise_logs_insert_owned_executions" on public.exercise_logs;
create policy "exercise_logs_insert_owned_executions"
on public.exercise_logs for insert
with check (
  exists (
    select 1
    from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

drop policy if exists "exercise_logs_update_owned_executions" on public.exercise_logs;
create policy "exercise_logs_update_owned_executions"
on public.exercise_logs for update
using (
  exists (
    select 1
    from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

drop policy if exists "exercise_logs_delete_owned_executions" on public.exercise_logs;
create policy "exercise_logs_delete_owned_executions"
on public.exercise_logs for delete
using (
  exists (
    select 1
    from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

drop policy if exists "gamification_events_select_own" on public.gamification_events;
create policy "gamification_events_select_own"
on public.gamification_events for select
using (auth.uid() = user_id);

drop policy if exists "user_points_select_own" on public.user_points;
create policy "user_points_select_own"
on public.user_points for select
using (auth.uid() = user_id);

drop policy if exists "user_points_insert_own" on public.user_points;
create policy "user_points_insert_own"
on public.user_points for insert
with check (auth.uid() = user_id);

drop policy if exists "user_points_update_own" on public.user_points;
create policy "user_points_update_own"
on public.user_points for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "badges_select_authenticated" on public.badges;
create policy "badges_select_authenticated"
on public.badges for select
using (auth.role() = 'authenticated');

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
on public.user_badges for select
using (auth.uid() = user_id);

drop policy if exists "battles_select_participant" on public.battles;
create policy "battles_select_participant"
on public.battles for select
using (public.user_participates_in_battle(id));

drop policy if exists "battles_insert_creator" on public.battles;
create policy "battles_insert_creator"
on public.battles for insert
with check (auth.uid() = created_by);

drop policy if exists "battle_participants_select_participant" on public.battle_participants;
create policy "battle_participants_select_participant"
on public.battle_participants for select
using (public.user_participates_in_battle(battle_id));

drop policy if exists "battle_participants_insert_creator" on public.battle_participants;
create policy "battle_participants_insert_creator"
on public.battle_participants for insert
with check (
  exists (
    select 1
    from public.battles
    where battles.id = battle_participants.battle_id
      and battles.created_by = auth.uid()
  )
);

drop policy if exists "battle_scores_select_participant" on public.battle_scores;
create policy "battle_scores_select_participant"
on public.battle_scores for select
using (public.user_participates_in_battle(battle_id));

select public.ensure_reference_badges();
