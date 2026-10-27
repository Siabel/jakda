-- Supabase SQL Editor에서 한 번 실행하세요.
create extension if not exists pgcrypto;

create table if not exists public.schedules (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  actual_date date,
  actual_start_time time,
  actual_end_time time,
  completed_at timestamptz,
  place_name text not null default '',
  address text not null default '',
  people text not null default '',
  expected_cost bigint not null default 0 check (expected_cost >= 0),
  status text not null default 'planned' check (status in ('planned','done','partial','cancelled')),
  memo text not null default '',
  is_recurring boolean not null default false,
  repeat_frequency text check (repeat_frequency in ('yearly','monthly','weekly','daily')),
  repeat_end_date date,
  series_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_id_user_unique unique (id, user_id),
  constraint schedules_planned_time_range_check check (end_time > start_time),
  constraint schedules_actual_time_range_check check (
    (actual_start_time is null and actual_end_time is null)
    or (
      actual_start_time is not null
      and actual_end_time is not null
      and actual_end_time > actual_start_time
    )
  )
);

create table if not exists public.transactions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id text,
  type text not null check (type in ('income','expense')),
  amount bigint not null check (amount > 0),
  date date not null,
  category text not null,
  title text not null,
  memo text not null default '',
  source text not null default 'manual' check (source in ('manual','schedule_actual')),
  is_fixed boolean not null default false,
  is_repeat boolean not null default false,
  repeat_frequency text check (repeat_frequency in ('yearly','monthly','weekly','daily')),
  repeat_month smallint check (repeat_month between 1 and 12),
  repeat_day smallint check (repeat_day between 1 and 31),
  repeat_end_date date,
  series_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_schedule_owner_fkey
    foreign key (schedule_id, user_id)
    references public.schedules(id, user_id)
    on delete set null (schedule_id)
);

create table if not exists public.emotion_diaries (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  emotion text not null,
  intensity smallint not null check (intensity between 1 and 5),
  emotions jsonb not null default '[]'::jsonb,
  cause text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.daily_records (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id text,
  date date not null,
  record_time time,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_records_schedule_owner_fkey
    foreign key (schedule_id, user_id)
    references public.schedules(id, user_id)
    on delete set null (schedule_id)
);

create table if not exists public.todos (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id text,
  title text not null check (char_length(trim(title)) between 1 and 120),
  memo text not null default '',
  priority text not null default 'normal' check (priority in ('high','normal','low')),
  status text not null default 'open' check (status in ('open','scheduled','done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint todos_schedule_owner_fkey
    foreign key (schedule_id, user_id)
    references public.schedules(id, user_id)
    on delete set null (schedule_id),
  constraint todos_completion_state_check
    check ((status = 'done') = (completed_at is not null)),
  constraint todos_scheduled_link_check
    check (status <> 'scheduled' or schedule_id is not null)
);

create index if not exists schedules_user_date_idx on public.schedules(user_id, date);
create index if not exists transactions_user_date_idx on public.transactions(user_id, date);
create unique index if not exists transactions_one_schedule_actual_idx on public.transactions(schedule_id) where source = 'schedule_actual' and schedule_id is not null;
create index if not exists emotion_diaries_user_date_idx on public.emotion_diaries(user_id, date);
create index if not exists daily_records_user_date_idx on public.daily_records(user_id, date);
create index if not exists todos_user_status_created_idx on public.todos(user_id, status, created_at desc);
create unique index if not exists todos_one_schedule_idx on public.todos(schedule_id) where schedule_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prepare_schedule_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.todos
  set schedule_id = null,
      status = case when status = 'scheduled' then 'open' else status end,
      updated_at = now()
  where schedule_id = old.id and user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists schedules_prepare_delete on public.schedules;
create trigger schedules_prepare_delete before delete on public.schedules
for each row execute function public.prepare_schedule_delete();
drop trigger if exists schedules_set_updated_at on public.schedules;
create trigger schedules_set_updated_at before update on public.schedules
for each row execute function public.set_updated_at();
drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();
drop trigger if exists emotion_diaries_set_updated_at on public.emotion_diaries;
create trigger emotion_diaries_set_updated_at before update on public.emotion_diaries
for each row execute function public.set_updated_at();
drop trigger if exists daily_records_set_updated_at on public.daily_records;
create trigger daily_records_set_updated_at before update on public.daily_records
for each row execute function public.set_updated_at();
drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at before update on public.todos
for each row execute function public.set_updated_at();

alter table public.schedules enable row level security;
alter table public.transactions enable row level security;
alter table public.emotion_diaries enable row level security;
alter table public.daily_records enable row level security;
alter table public.todos enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['schedules','transactions','emotion_diaries','daily_records','todos'] loop
    execute format('drop policy if exists "owners manage own rows" on public.%I', table_name);
    execute format(
      'create policy "owners manage own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name
    );
  end loop;
end $$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
