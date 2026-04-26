alter table public.profiles add column if not exists height_cm numeric(5, 2);
alter table public.profiles add column if not exists target_weight_kg numeric(6, 2);

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

create index if not exists assistant_conversations_user_updated_idx on public.assistant_conversations(user_id, updated_at desc);
create index if not exists assistant_messages_conversation_created_idx on public.assistant_messages(conversation_id, created_at desc);
create index if not exists assistant_messages_user_created_idx on public.assistant_messages(user_id, created_at desc);
create index if not exists body_measurements_user_recorded_idx on public.body_measurements(user_id, recorded_on desc);

alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.body_measurements enable row level security;

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
