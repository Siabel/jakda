create table if not exists public.todos (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id text references public.schedules(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  memo text not null default '',
  priority text not null default 'normal' check (priority in ('high','normal','low')),
  status text not null default 'open' check (status in ('open','scheduled','done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists todos_user_status_created_idx
  on public.todos(user_id, status, created_at desc);

create unique index if not exists todos_one_schedule_idx
  on public.todos(schedule_id) where schedule_id is not null;

alter table public.todos enable row level security;

drop policy if exists "owners manage own rows" on public.todos;
create policy "owners manage own rows"
  on public.todos
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
