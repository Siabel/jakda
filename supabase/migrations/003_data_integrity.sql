begin;

-- Preserve records but detach any legacy cross-user schedule links before
-- replacing the single-column foreign keys with tenant-safe relationships.
update public.transactions as tx
set schedule_id = null
where tx.schedule_id is not null
  and not exists (
    select 1
    from public.schedules as schedule
    where schedule.id = tx.schedule_id
      and schedule.user_id = tx.user_id
  );

update public.daily_records as daily_record
set schedule_id = null
where daily_record.schedule_id is not null
  and not exists (
    select 1
    from public.schedules as schedule
    where schedule.id = daily_record.schedule_id
      and schedule.user_id = daily_record.user_id
  );

update public.todos as todo
set schedule_id = null,
    status = case when todo.status = 'scheduled' then 'open' else todo.status end,
    updated_at = now()
where todo.schedule_id is not null
  and not exists (
    select 1
    from public.schedules as schedule
    where schedule.id = todo.schedule_id
      and schedule.user_id = todo.user_id
  );

-- Repair status timestamps created before the database enforced the invariant.
update public.todos
set completed_at = coalesce(completed_at, updated_at, created_at, now())
where status = 'done' and completed_at is null;

update public.todos
set completed_at = null
where status <> 'done' and completed_at is not null;

update public.todos
set status = 'open', updated_at = now()
where status = 'scheduled' and schedule_id is null;

create unique index if not exists schedules_id_user_unique_idx
  on public.schedules(id, user_id);

alter table public.transactions
  drop constraint if exists transactions_schedule_id_fkey,
  drop constraint if exists transactions_schedule_owner_fkey;
alter table public.transactions
  add constraint transactions_schedule_owner_fkey
  foreign key (schedule_id, user_id)
  references public.schedules(id, user_id)
  on delete set null (schedule_id);

alter table public.daily_records
  drop constraint if exists daily_records_schedule_id_fkey,
  drop constraint if exists daily_records_schedule_owner_fkey;
alter table public.daily_records
  add constraint daily_records_schedule_owner_fkey
  foreign key (schedule_id, user_id)
  references public.schedules(id, user_id)
  on delete set null (schedule_id);

alter table public.todos
  drop constraint if exists todos_schedule_id_fkey,
  drop constraint if exists todos_schedule_owner_fkey;
alter table public.todos
  add constraint todos_schedule_owner_fkey
  foreign key (schedule_id, user_id)
  references public.schedules(id, user_id)
  on delete set null (schedule_id);

alter table public.schedules
  drop constraint if exists schedules_planned_time_range_check,
  drop constraint if exists schedules_actual_time_range_check;
alter table public.schedules
  add constraint schedules_planned_time_range_check
    check (end_time > start_time) not valid,
  add constraint schedules_actual_time_range_check
    check (
      (actual_start_time is null and actual_end_time is null)
      or (
        actual_start_time is not null
        and actual_end_time is not null
        and actual_end_time > actual_start_time
      )
    ) not valid;

alter table public.todos
  drop constraint if exists todos_completion_state_check,
  drop constraint if exists todos_scheduled_link_check;
alter table public.todos
  add constraint todos_completion_state_check
    check ((status = 'done') = (completed_at is not null)),
  add constraint todos_scheduled_link_check
    check (status <> 'scheduled' or schedule_id is not null);

alter table public.transactions
  add column if not exists updated_at timestamptz not null default now();

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
create trigger schedules_prepare_delete
before delete on public.schedules
for each row execute function public.prepare_schedule_delete();

drop trigger if exists schedules_set_updated_at on public.schedules;
create trigger schedules_set_updated_at
before update on public.schedules
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists emotion_diaries_set_updated_at on public.emotion_diaries;
create trigger emotion_diaries_set_updated_at
before update on public.emotion_diaries
for each row execute function public.set_updated_at();

drop trigger if exists daily_records_set_updated_at on public.daily_records;
create trigger daily_records_set_updated_at
before update on public.daily_records
for each row execute function public.set_updated_at();

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
before update on public.todos
for each row execute function public.set_updated_at();

commit;
