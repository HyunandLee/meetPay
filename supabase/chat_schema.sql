-- Chat / offer workflow schema for Supabase
-- Apply with: psql < supabase/chat_schema.sql (service role), or paste into the Supabase SQL editor.
-- Assumes existing tables: company_profiles(id, user_id), student_profiles(id, user_id).

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'thread_status') then
    create type public.thread_status as enum ('offer_sent', 'accepted', 'interview_done', 'paid', 'cancelled', 'expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_type') then
    create type public.message_type as enum ('text', 'offer', 'accept', 'note', 'payment_notice', 'system');
  end if;
  if not exists (select 1 from pg_type where typname = 'sender_role') then
    create type public.sender_role as enum ('company', 'student', 'system');
  end if;
  if not exists (select 1 from pg_type where typname = 'meeting_provider') then
    create type public.meeting_provider as enum ('zoom', 'gmeet', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'payout_status') then
    create type public.payout_status as enum ('pending', 'sent', 'failed');
  end if;
end $$;

-- Tables
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  offer_amount numeric(30, 8),
  currency text default 'JPYC',
  meeting_provider meeting_provider,
  meeting_link text,
  status thread_status not null default 'offer_sent',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_role sender_role not null,
  type message_type not null default 'text',
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  schema_version int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_thread_created on public.messages(thread_id, created_at);

create table if not exists public.interviews (
  thread_id uuid primary key references public.threads(id) on delete cascade,
  happened_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  tx_hash text not null unique,
  amount numeric(38, 0) not null,
  status payout_status not null default 'sent',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Optional: idempotent notification outbox for future email delivery
create table if not exists public.notification_outbox (
  id bigserial primary key,
  event_key text not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_key, kind)
);

-- Helper functions
create or replace function public.fn_assert_thread_transition(old_status public.thread_status, new_status public.thread_status)
returns void
language plpgsql
as $$
begin
  if old_status = new_status then
    return;
  end if;

  if old_status = 'offer_sent' and new_status in ('accepted', 'cancelled', 'expired') then
    return;
  end if;

  if old_status = 'accepted' and new_status in ('interview_done', 'cancelled', 'expired') then
    return;
  end if;

  if old_status = 'interview_done' and new_status in ('paid', 'cancelled', 'expired') then
    return;
  end if;

  if old_status = 'paid' and new_status = 'paid' then
    return;
  end if;

  raise exception 'invalid thread status transition: % -> %', old_status, new_status;
end;
$$;

create or replace function public.trg_threads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.trg_threads_status_guard()
returns trigger
language plpgsql
as $$
begin
  perform public.fn_assert_thread_transition(old.status, new.status);
  return new;
end;
$$;

create or replace function public.trg_messages_touch_thread()
returns trigger
language plpgsql
as $$
begin
  update public.threads
    set last_message_at = new.created_at,
        updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists trg_threads_updated_at on public.threads;
create trigger trg_threads_updated_at
before update on public.threads
for each row
execute procedure public.trg_threads_updated_at();

drop trigger if exists trg_threads_status_guard on public.threads;
create trigger trg_threads_status_guard
before update of status on public.threads
for each row
execute procedure public.trg_threads_status_guard();

drop trigger if exists trg_messages_touch_thread on public.messages;
create trigger trg_messages_touch_thread
after insert on public.messages
for each row
execute procedure public.trg_messages_touch_thread();

-- RPC functions (security definer with explicit checks)
create or replace function public.start_offer_thread(
  p_company_profile_id uuid,
  p_student_profile_id uuid,
  p_amount numeric default null,
  p_currency text default 'JPYC',
  p_meeting_provider meeting_provider default null,
  p_meeting_link text default null,
  p_body text default ''
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread_id uuid;
begin
  -- caller must own the company_profile
  if not exists (
    select 1 from public.company_profiles cp
    where cp.id = p_company_profile_id and cp.user_id = auth.uid()
  ) then
    raise exception 'not authorized to start thread for this company';
  end if;

  insert into public.threads (company_id, student_id, offer_amount, currency, meeting_provider, meeting_link, status)
  values (p_company_profile_id, p_student_profile_id, p_amount, p_currency, p_meeting_provider, p_meeting_link, 'offer_sent')
  returning id into v_thread_id;

  insert into public.messages (thread_id, sender_role, type, body, payload)
  values (
    v_thread_id,
    'company',
    'offer',
    coalesce(p_body, ''),
    jsonb_build_object(
      'amount', p_amount,
      'currency', p_currency,
      'meeting_provider', p_meeting_provider,
      'meeting_link', p_meeting_link
    )
  );

  return v_thread_id;
end;
$$;

create or replace function public.post_message(
  p_thread_id uuid,
  p_sender sender_role,
  p_type message_type,
  p_body text default '',
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread record;
  v_message_id uuid;
begin
  if p_sender = 'system' then
    raise exception 'system sender not allowed via client';
  end if;

  select t.company_id, t.student_id into v_thread from public.threads t where t.id = p_thread_id;
  if not found then
    raise exception 'thread not found';
  end if;

  if p_sender = 'company' and not exists (
    select 1 from public.company_profiles cp where cp.id = v_thread.company_id and cp.user_id = auth.uid()
  ) then
    raise exception 'not authorized as company';
  end if;

  if p_sender = 'student' and not exists (
    select 1 from public.student_profiles sp where sp.id = v_thread.student_id and sp.user_id = auth.uid()
  ) then
    raise exception 'not authorized as student';
  end if;

  insert into public.messages (thread_id, sender_role, type, body, payload)
  values (p_thread_id, p_sender, p_type, coalesce(p_body, ''), coalesce(p_payload, '{}'::jsonb))
  returning id into v_message_id;

  return v_message_id;
end;
$$;

create or replace function public.accept_thread(
  p_thread_id uuid,
  p_body text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status public.thread_status;
  v_student_id uuid;
begin
  select status, student_id into v_old_status, v_student_id from public.threads where id = p_thread_id for update;
  if not found then
    raise exception 'thread not found';
  end if;

  if not exists (
    select 1 from public.student_profiles sp where sp.id = v_student_id and sp.user_id = auth.uid()
  ) then
    raise exception 'not authorized to accept';
  end if;

  perform public.fn_assert_thread_transition(v_old_status, 'accepted');

  update public.threads set status = 'accepted' where id = p_thread_id;

  insert into public.messages (thread_id, sender_role, type, body, payload)
  values (p_thread_id, 'student', 'accept', coalesce(p_body, ''), '{}'::jsonb);
end;
$$;

create or replace function public.complete_interview(
  p_thread_id uuid,
  p_happened_at timestamptz default now(),
  p_notes text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status public.thread_status;
  v_company_id uuid;
begin
  select status, company_id into v_old_status, v_company_id from public.threads where id = p_thread_id for update;
  if not found then
    raise exception 'thread not found';
  end if;

  if not exists (
    select 1 from public.company_profiles cp where cp.id = v_company_id and cp.user_id = auth.uid()
  ) then
    raise exception 'not authorized to complete interview';
  end if;

  perform public.fn_assert_thread_transition(v_old_status, 'interview_done');

  update public.threads set status = 'interview_done' where id = p_thread_id;

  insert into public.interviews (thread_id, happened_at, notes)
  values (p_thread_id, coalesce(p_happened_at, now()), p_notes)
  on conflict (thread_id) do update
    set happened_at = excluded.happened_at,
        notes = excluded.notes;

  insert into public.messages (thread_id, sender_role, type, body, payload)
  values (
    p_thread_id,
    'company',
    'note',
    coalesce(p_notes, ''),
    jsonb_build_object('kind', 'interview_done', 'happened_at', p_happened_at)
  );
end;
$$;

create or replace function public.record_payout_notice(
  p_thread_id uuid,
  p_tx_hash text,
  p_amount numeric,
  p_body text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status public.thread_status;
  v_company_id uuid;
begin
  select status, company_id into v_old_status, v_company_id from public.threads where id = p_thread_id for update;
  if not found then
    raise exception 'thread not found';
  end if;

  if not exists (
    select 1 from public.company_profiles cp where cp.id = v_company_id and cp.user_id = auth.uid()
  ) then
    raise exception 'not authorized to record payout';
  end if;

  perform public.fn_assert_thread_transition(v_old_status, 'paid');

  insert into public.payouts (thread_id, tx_hash, amount, status)
  values (p_thread_id, p_tx_hash, p_amount, 'sent')
  on conflict (tx_hash) do nothing;

  update public.threads set status = 'paid' where id = p_thread_id;

  insert into public.messages (thread_id, sender_role, type, body, payload)
  values (
    p_thread_id,
    'company',
    'payment_notice',
    coalesce(p_body, ''),
    jsonb_build_object('tx_hash', p_tx_hash, 'amount', p_amount)
  );
end;
$$;

-- View: recent interviews per company (for offer-send suggestions)
create or replace view public.students_recent_interviews as
select
  t.company_id,
  t.id as thread_id,
  t.student_id,
  sp.name as student_name,
  sp.wallet_address as student_wallet,
  i.happened_at
from public.interviews i
join public.threads t on t.id = i.thread_id
join public.student_profiles sp on sp.id = t.student_id
where t.status in ('interview_done', 'paid');

-- Secure function to fetch recent interviews for a company (respects auth.uid())
create or replace function public.recent_interviews_for_company(p_company_id uuid)
returns table (
  company_id uuid,
  thread_id uuid,
  student_id uuid,
  student_name text,
  student_wallet text,
  happened_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    t.company_id,
    t.id as thread_id,
    t.student_id,
    sp.name as student_name,
    sp.wallet_address as student_wallet,
    i.happened_at
  from public.interviews i
  join public.threads t on t.id = i.thread_id
  join public.student_profiles sp on sp.id = t.student_id
  where t.status in ('interview_done', 'paid')
    and t.company_id = p_company_id
    and exists (
      select 1 from public.company_profiles cp
      where cp.id = p_company_id and cp.user_id = auth.uid()
    )
  order by i.happened_at desc
  limit 20;
$$;

-- RLS policies
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.interviews enable row level security;
alter table public.payouts enable row level security;

-- Threads: participants can select/update; companies can insert for themselves
drop policy if exists threads_select on public.threads;
create policy threads_select on public.threads
  for select using (
    exists (select 1 from public.company_profiles cp where cp.id = threads.company_id and cp.user_id = auth.uid())
    or exists (select 1 from public.student_profiles sp where sp.id = threads.student_id and sp.user_id = auth.uid())
  );

drop policy if exists threads_insert on public.threads;
create policy threads_insert on public.threads
  for insert with check (
    exists (select 1 from public.company_profiles cp where cp.id = threads.company_id and cp.user_id = auth.uid())
  );

drop policy if exists threads_update on public.threads;
create policy threads_update on public.threads
  for update using (
    exists (select 1 from public.company_profiles cp where cp.id = threads.company_id and cp.user_id = auth.uid())
    or exists (select 1 from public.student_profiles sp where sp.id = threads.student_id and sp.user_id = auth.uid())
  );

-- Messages: participants can read/write (system insert still via service role or definer functions)
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.threads t
      where t.id = messages.thread_id
        and (
          exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid())
          or exists (select 1 from public.student_profiles sp where sp.id = t.student_id and sp.user_id = auth.uid())
        )
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    messages.sender_role <> 'system'
    and exists (
      select 1 from public.threads t
      where t.id = messages.thread_id
        and (
          (messages.sender_role = 'company' and exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid()))
          or (messages.sender_role = 'student' and exists (select 1 from public.student_profiles sp where sp.id = t.student_id and sp.user_id = auth.uid()))
        )
    )
  );

-- Interviews: company only
drop policy if exists interviews_select on public.interviews;
create policy interviews_select on public.interviews
  for select using (
    exists (
      select 1 from public.threads t
      where t.id = interviews.thread_id
        and exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid())
    )
  );

drop policy if exists interviews_insert on public.interviews;
create policy interviews_insert on public.interviews
  for insert with check (
    exists (
      select 1 from public.threads t
      where t.id = interviews.thread_id
        and exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid())
    )
  );

drop policy if exists interviews_update on public.interviews;
create policy interviews_update on public.interviews
  for update using (
    exists (
      select 1 from public.threads t
      where t.id = interviews.thread_id
        and exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid())
    )
  );

-- Payouts: company only
drop policy if exists payouts_select on public.payouts;
create policy payouts_select on public.payouts
  for select using (
    exists (
      select 1 from public.threads t
      where t.id = payouts.thread_id
        and exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid())
    )
  );

drop policy if exists payouts_insert on public.payouts;
create policy payouts_insert on public.payouts
  for insert with check (
    exists (
      select 1 from public.threads t
      where t.id = payouts.thread_id
        and exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid())
    )
  );

drop policy if exists payouts_update on public.payouts;
create policy payouts_update on public.payouts
  for update using (
    exists (
      select 1 from public.threads t
      where t.id = payouts.thread_id
        and exists (select 1 from public.company_profiles cp where cp.id = t.company_id and cp.user_id = auth.uid())
    )
  );

-- View RLS cannot be enabled on views. Access will be governed by underlying table RLS.
-- If tighter control is needed, expose a SECURITY DEFINER function instead of direct view access.
