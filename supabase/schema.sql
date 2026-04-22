-- Treino App - Supabase/PostgreSQL schema
-- Run this file in the Supabase SQL Editor before using the application.

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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  default_workouts_seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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
  workout_name text not null,
  executed_at timestamptz not null default now(),
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_executions_name_not_blank check (length(trim(workout_name)) > 0)
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.workout_executions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  section_title text,
  prescription text,
  load_used numeric(8, 2),
  reps_done text,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_logs_name_not_blank check (length(trim(exercise_name)) > 0),
  constraint exercise_logs_load_positive check (load_used is null or load_used >= 0),
  constraint exercise_logs_execution_exercise_unique unique (execution_id, exercise_id)
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
before update on public.workouts
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

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists workouts_user_updated_idx on public.workouts(user_id, updated_at desc);
create index if not exists workouts_scheduled_days_idx on public.workouts using gin(scheduled_days);
create index if not exists workout_sections_workout_order_idx on public.workout_sections(workout_id, order_index);
create index if not exists exercises_workout_order_idx on public.exercises(workout_id, order_index);
create index if not exists exercises_section_order_idx on public.exercises(section_id, order_index);
create index if not exists workout_executions_user_date_idx on public.workout_executions(user_id, executed_at desc);
create index if not exists workout_executions_workout_date_idx on public.workout_executions(workout_id, executed_at desc);
create index if not exists exercise_logs_execution_idx on public.exercise_logs(execution_id);
create index if not exists exercise_logs_exercise_idx on public.exercise_logs(exercise_id) where exercise_id is not null;

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sections enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_executions enable row level security;
alter table public.exercise_logs enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Profiles can be inserted by owner" on public.profiles;
create policy "Profiles can be inserted by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Profiles can be updated by owner" on public.profiles;
create policy "Profiles can be updated by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Workouts are readable by owner" on public.workouts;
create policy "Workouts are readable by owner"
on public.workouts for select
using (auth.uid() = user_id);

drop policy if exists "Workouts can be inserted by owner" on public.workouts;
create policy "Workouts can be inserted by owner"
on public.workouts for insert
with check (auth.uid() = user_id);

drop policy if exists "Workouts can be updated by owner" on public.workouts;
create policy "Workouts can be updated by owner"
on public.workouts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Workouts can be deleted by owner" on public.workouts;
create policy "Workouts can be deleted by owner"
on public.workouts for delete
using (auth.uid() = user_id);

drop policy if exists "Sections are readable through owned workouts" on public.workout_sections;
create policy "Sections are readable through owned workouts"
on public.workout_sections for select
using (
  exists (
    select 1 from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Sections can be inserted through owned workouts" on public.workout_sections;
create policy "Sections can be inserted through owned workouts"
on public.workout_sections for insert
with check (
  exists (
    select 1 from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Sections can be updated through owned workouts" on public.workout_sections;
create policy "Sections can be updated through owned workouts"
on public.workout_sections for update
using (
  exists (
    select 1 from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Sections can be deleted through owned workouts" on public.workout_sections;
create policy "Sections can be deleted through owned workouts"
on public.workout_sections for delete
using (
  exists (
    select 1 from public.workouts
    where workouts.id = workout_sections.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Exercises are readable through owned workouts" on public.exercises;
create policy "Exercises are readable through owned workouts"
on public.exercises for select
using (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Exercises can be inserted through owned workouts" on public.exercises;
create policy "Exercises can be inserted through owned workouts"
on public.exercises for insert
with check (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Exercises can be updated through owned workouts" on public.exercises;
create policy "Exercises can be updated through owned workouts"
on public.exercises for update
using (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Exercises can be deleted through owned workouts" on public.exercises;
create policy "Exercises can be deleted through owned workouts"
on public.exercises for delete
using (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "Executions are readable by owner" on public.workout_executions;
create policy "Executions are readable by owner"
on public.workout_executions for select
using (auth.uid() = user_id);

drop policy if exists "Executions can be inserted by owner" on public.workout_executions;
create policy "Executions can be inserted by owner"
on public.workout_executions for insert
with check (auth.uid() = user_id);

drop policy if exists "Executions can be updated by owner" on public.workout_executions;
create policy "Executions can be updated by owner"
on public.workout_executions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Executions can be deleted by owner" on public.workout_executions;
create policy "Executions can be deleted by owner"
on public.workout_executions for delete
using (auth.uid() = user_id);

drop policy if exists "Exercise logs are readable through owned executions" on public.exercise_logs;
create policy "Exercise logs are readable through owned executions"
on public.exercise_logs for select
using (
  exists (
    select 1 from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

drop policy if exists "Exercise logs can be inserted through owned executions" on public.exercise_logs;
create policy "Exercise logs can be inserted through owned executions"
on public.exercise_logs for insert
with check (
  exists (
    select 1 from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

drop policy if exists "Exercise logs can be updated through owned executions" on public.exercise_logs;
create policy "Exercise logs can be updated through owned executions"
on public.exercise_logs for update
using (
  exists (
    select 1 from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

drop policy if exists "Exercise logs can be deleted through owned executions" on public.exercise_logs;
create policy "Exercise logs can be deleted through owned executions"
on public.exercise_logs for delete
using (
  exists (
    select 1 from public.workout_executions
    where workout_executions.id = exercise_logs.execution_id
      and workout_executions.user_id = auth.uid()
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

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
  v_workout_id uuid;
  v_section_id uuid;
  v_seeded_at timestamptz;
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if session_user <> 'postgres'
    and coalesce(auth.role(), '') <> 'service_role'
    and auth.uid() is distinct from target_user_id then
    raise exception 'not allowed to seed workouts for this user';
  end if;

  select default_workouts_seeded_at
  into v_seeded_at
  from public.profiles
  where id = target_user_id;

  if v_seeded_at is not null then
    return;
  end if;

  if exists (select 1 from public.workouts where user_id = target_user_id) then
    update public.profiles
    set default_workouts_seeded_at = now()
    where id = target_user_id;
    return;
  end if;

  insert into public.workouts (user_id, name, day_of_week, scheduled_days, category, objective, notes)
  values (
    target_user_id,
    'Segunda — Quadríceps + Posterior',
    'monday',
    array['monday'],
    'fortalecimento para corrida',
    'PROTOCOLO COMPLETO — FORTALECIMENTO PARA CORRIDA (ATUALIZADO)',
    'Foco em quadríceps, posterior, panturrilha e tibial para suporte à corrida.'
  )
  returning id into v_workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'ATIVAÇÃO', 0)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Monster Walk', 0, 2, '15', null, null, 'https://www.youtube.com/watch?v=QY0xgW9w0bY', 'glúteos', false),
    (v_workout_id, v_section_id, 'Tibialis Raise', 1, 2, '20', null, null, 'https://www.youtube.com/watch?v=gNS_QjGAs_k', 'tibial', false),
    (v_workout_id, v_section_id, 'Goblet Squat leve', 2, 2, '15', null, null, 'https://www.youtube.com/watch?v=MeIiIdhvXT4', 'quadríceps', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'FORÇA', 1)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Bulgarian Split Squat', 0, 4, '8', null, null, null, 'quadríceps', true),
    (v_workout_id, v_section_id, 'Romanian Deadlift', 1, 4, '8', null, null, 'https://www.youtube.com/watch?v=2SHsk9AzdjA', 'posterior', true),
    (v_workout_id, v_section_id, 'Step Down', 2, 4, '10', null, null, 'https://www.youtube.com/watch?v=9L9lZkZ1l7M', 'quadríceps', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'COMPLEMENTAR', 2)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Leg Press unilateral', 0, 3, '10', null, null, null, 'quadríceps', false),
    (v_workout_id, v_section_id, 'Mesa flexora', 1, 3, '12', null, null, null, 'posterior', false),
    (v_workout_id, v_section_id, 'Nordic Curl assistido', 2, 3, '5', null, null, 'https://www.youtube.com/watch?v=5_ejbGfdAQE', 'posterior', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'PANTURRILHA', 3)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Standing Calf Raise', 0, 4, '12–15', null, null, 'https://www.youtube.com/watch?v=gwLzBJYoWlI', 'panturrilha', true),
    (v_workout_id, v_section_id, 'Soleus Raise', 1, 4, '15–20', null, null, 'https://www.youtube.com/watch?v=3V6h4n9K0Gk', 'panturrilha', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'TIBIAL', 4)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values (v_workout_id, v_section_id, 'Tibialis Raise pesado', 0, 3, '20', null, null, 'https://www.youtube.com/watch?v=gNS_QjGAs_k', 'tibial', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'FINAL', 5)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values (v_workout_id, v_section_id, 'Wall Sit', 0, 3, null, '60–75s', null, null, 'quadríceps', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'ALONGAMENTO', 6)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Quadríceps', 0, null, null, null, null, 'https://www.youtube.com/watch?v=4vTJHUDB5ak', 'mobilidade', false),
    (v_workout_id, v_section_id, 'Posterior', 1, null, null, null, null, 'https://www.youtube.com/watch?v=v8lM9iEJG5w', 'mobilidade', false),
    (v_workout_id, v_section_id, 'Glúteo', 2, null, null, null, null, 'https://www.youtube.com/watch?v=2pLT-olgUJs', 'mobilidade', false),
    (v_workout_id, v_section_id, 'Panturrilha', 3, null, null, null, null, 'https://www.youtube.com/watch?v=YMmgqO8Jo-k', 'mobilidade', false);

  insert into public.workouts (user_id, name, day_of_week, scheduled_days, category, objective, notes)
  values (
    target_user_id,
    'Quarta — Glúteo Médio + Core Completo',
    'wednesday',
    array['wednesday'],
    'fortalecimento para corrida',
    'Glúteo médio, estabilidade pélvica e core completo para corrida.',
    'PROTOCOLO COMPLETO — FORTALECIMENTO PARA CORRIDA (ATUALIZADO)'
  )
  returning id into v_workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'ATIVAÇÃO', 0)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Clamshell', 0, 2, '20', null, null, 'https://www.youtube.com/watch?v=EG5_gXcfozw', 'glúteos', false),
    (v_workout_id, v_section_id, 'Single Leg Bridge', 1, 2, '15', null, null, 'https://www.youtube.com/watch?v=m2Zx-57cSok', 'glúteos', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'FORÇA', 1)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Hip Thrust', 0, 4, '10', null, null, 'https://www.youtube.com/watch?v=LM8XHLYJoYs', 'glúteos', true),
    (v_workout_id, v_section_id, 'Hip Hike', 1, 4, '12', null, null, 'https://www.youtube.com/watch?v=LF_YbQOTRJI', 'glúteos', true),
    (v_workout_id, v_section_id, 'Cable Abduction', 2, 4, '15', null, null, 'https://www.youtube.com/watch?v=5xFZ6PzE5E0', 'glúteos', true),
    (v_workout_id, v_section_id, 'Copenhagen regressivo', 3, 3, '10', null, null, 'https://www.youtube.com/watch?v=2pJ9dR7pXkA', 'estabilidade', true),
    (v_workout_id, v_section_id, 'Single Leg RDL', 4, 3, '10', null, null, 'https://www.youtube.com/watch?v=2SHsk9AzdjA', 'posterior', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'CORE COMPLETO', 2)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Dead Bug', 0, 3, '10', null, null, 'https://www.youtube.com/watch?v=g_BYB0R-4Ws', 'core', false),
    (v_workout_id, v_section_id, 'Prancha lateral', 1, 3, null, '30–40s', null, 'https://www.youtube.com/watch?v=K2VljzCC16g', 'core', false),
    (v_workout_id, v_section_id, 'Pallof Press', 2, 3, '15', null, null, 'https://www.youtube.com/watch?v=6Yg3D9JcQ0E', 'core', false),
    (v_workout_id, v_section_id, 'Bird Dog', 3, 3, '12', null, null, 'https://www.youtube.com/watch?v=wiFNA3sqjCA', 'core', false),
    (v_workout_id, v_section_id, 'Hollow Hold', 4, 3, null, '30s', null, 'https://www.youtube.com/watch?v=LlDNef_Ztsc', 'core', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'FINAL', 3)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values (v_workout_id, v_section_id, 'Wall Sit', 0, 3, null, '45s', null, null, 'quadríceps', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'ALONGAMENTO', 4)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Flexor quadril', 0, null, null, null, null, 'https://www.youtube.com/watch?v=YQmpO9VT2X4', 'mobilidade', false),
    (v_workout_id, v_section_id, 'Glúteo', 1, null, null, null, null, 'https://www.youtube.com/watch?v=2pLT-olgUJs', 'mobilidade', false),
    (v_workout_id, v_section_id, 'Posterior', 2, null, null, null, null, 'https://www.youtube.com/watch?v=v8lM9iEJG5w', 'mobilidade', false),
    (v_workout_id, v_section_id, 'Panturrilha', 3, null, null, null, null, 'https://www.youtube.com/watch?v=YMmgqO8Jo-k', 'mobilidade', false);

  insert into public.workouts (user_id, name, day_of_week, scheduled_days, category, objective, notes)
  values (
    target_user_id,
    'Sexta — Pliometria + Estabilidade + Ombros',
    'friday',
    array['friday'],
    'pliometria',
    'Pliometria para corrida, estabilidade, panturrilha, tibial e ombros.',
    'PROTOCOLO COMPLETO — FORTALECIMENTO PARA CORRIDA (ATUALIZADO)'
  )
  returning id into v_workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'ATIVAÇÃO', 0)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Serratus Wall Slide', 0, 2, '12', null, null, 'https://www.youtube.com/watch?v=4BosA9Z9pIA', 'ombros', false),
    (v_workout_id, v_section_id, 'Lateral Walk', 1, 2, '15', null, null, 'https://www.youtube.com/watch?v=QY0xgW9w0bY', 'glúteos', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'PLIOMETRIA (CORRIDA)', 1)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Box Jump', 0, 3, '5', null, null, 'https://www.youtube.com/watch?v=52rU5r0C1kM', 'pliometria', true),
    (v_workout_id, v_section_id, 'Step Up Explosivo', 1, 3, '8', null, null, 'https://www.youtube.com/watch?v=dQqApCGd5Ss', 'pliometria', true),
    (v_workout_id, v_section_id, 'Skipping', 2, 3, null, '25s', null, 'https://www.youtube.com/watch?v=Z6g9y4V4Tqk', 'pliometria', true),
    (v_workout_id, v_section_id, 'Bounding', 3, 3, null, null, '20m', 'https://www.youtube.com/watch?v=rRk0J7w3zFQ', 'pliometria', true),
    (v_workout_id, v_section_id, 'Single Leg Hop', 4, 3, '6 cada perna', null, null, 'https://www.youtube.com/watch?v=E9cQqHcGqkM', 'pliometria', true);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'ESTABILIDADE', 2)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Afundo lateral', 0, 3, '10', null, null, 'https://www.youtube.com/watch?v=rvqLVxYqEvo', 'estabilidade', false),
    (v_workout_id, v_section_id, 'Step Down', 1, 3, '10', null, null, 'https://www.youtube.com/watch?v=9L9lZkZ1l7M', 'quadríceps', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'PANTURRILHA', 3)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Calf Raise unilateral', 0, 3, '12', null, null, null, 'panturrilha', false),
    (v_workout_id, v_section_id, 'Soleus excêntrico', 1, 3, '15', null, null, null, 'panturrilha', false),
    (v_workout_id, v_section_id, 'Soleus Hold isométrico', 2, 3, null, '30–40s', null, null, 'panturrilha', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'TIBIAL', 4)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values (v_workout_id, v_section_id, 'Tibialis Raise', 0, 3, '25', null, null, 'https://www.youtube.com/watch?v=gNS_QjGAs_k', 'tibial', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'OMBROS', 5)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Shoulder Press', 0, 4, '8', null, null, 'https://www.youtube.com/watch?v=B-aVuyhvLHU', 'ombros', true),
    (v_workout_id, v_section_id, 'Elevação lateral', 1, 3, '12', null, null, 'https://www.youtube.com/watch?v=3VcKaXpzqRo', 'ombros', false),
    (v_workout_id, v_section_id, 'Face Pull', 2, 4, '12', null, null, 'https://www.youtube.com/watch?v=rep-qVOkqgk', 'ombros', true),
    (v_workout_id, v_section_id, 'Reverse Fly', 3, 3, '12', null, null, 'https://www.youtube.com/watch?v=eaI2f9NfN3g', 'ombros', false);

  insert into public.workouts (user_id, name, day_of_week, scheduled_days, category, objective, notes)
  values (
    target_user_id,
    'Treino A — Peito + Tríceps',
    'monday',
    array['monday', 'thursday'],
    'musculação',
    'Peito, tríceps e ombro. Programado para segunda e quinta.',
    'TREINO A — PEITO + TRÍCEPS (segunda e quinta)'
  )
  returning id into v_workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'PEITO', 0)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Supino com halteres', 0, 4, '8–10', null, null, null, 'peito', true),
    (v_workout_id, v_section_id, 'Supino inclinado', 1, 3, '10', null, null, null, 'peito', true),
    (v_workout_id, v_section_id, 'Crucifixo', 2, 3, '12', null, null, null, 'peito', false),
    (v_workout_id, v_section_id, 'Crossover baixo', 3, 3, '12', null, null, null, 'peito', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'TRÍCEPS', 1)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Tríceps corda', 0, 3, '12', null, null, null, 'tríceps', false),
    (v_workout_id, v_section_id, 'Tríceps francês', 1, 3, '12', null, null, null, 'tríceps', false),
    (v_workout_id, v_section_id, 'Mergulho em banco', 2, 3, '10–12', null, null, null, 'tríceps', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'OMBRO', 2)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values (v_workout_id, v_section_id, 'Elevação lateral', 0, 3, '12', null, null, null, 'ombros', false);

  insert into public.workouts (user_id, name, day_of_week, scheduled_days, category, objective, notes)
  values (
    target_user_id,
    'Treino B — Costas + Bíceps',
    'tuesday',
    array['tuesday', 'friday'],
    'musculação',
    'Costas, bíceps e estabilidade escapular. Programado para terça e sexta.',
    'TREINO B — COSTAS + BÍCEPS (terça e sexta)'
  )
  returning id into v_workout_id;

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'COSTAS', 0)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Barra fixa pronada', 0, 4, '3–4', null, null, null, 'costas', true),
    (v_workout_id, v_section_id, 'Puxada aberta', 1, 4, '10', null, null, null, 'costas', true),
    (v_workout_id, v_section_id, 'Remada baixa', 2, 3, '10', null, null, null, 'costas', true),
    (v_workout_id, v_section_id, 'Reverse Fly', 3, 3, '12', null, null, null, 'ombros', false),
    (v_workout_id, v_section_id, 'Face Pull', 4, 3, '15', null, null, null, 'ombros', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'BÍCEPS', 1)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values
    (v_workout_id, v_section_id, 'Rosca direta', 0, 3, '10', null, null, null, 'bíceps', false),
    (v_workout_id, v_section_id, 'Rosca martelo', 1, 3, '12', null, null, null, 'bíceps', false),
    (v_workout_id, v_section_id, 'Rosca alternada', 2, 3, '12', null, null, null, 'bíceps', false);

  insert into public.workout_sections (workout_id, title, order_index)
  values (v_workout_id, 'ESTABILIDADE', 2)
  returning id into v_section_id;

  insert into public.exercises (workout_id, section_id, name, order_index, sets, reps, duration, distance, video_url, muscle_group, is_priority)
  values (v_workout_id, v_section_id, 'Serratus Punch', 0, 3, '15', null, null, null, 'estabilidade', false);

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
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authenticated user required';
  end if;

  perform public.seed_default_workouts_for_user(v_user_id);
end;
$$;

revoke all on function public.seed_my_default_workouts() from public;
grant execute on function public.seed_my_default_workouts() to authenticated;
