-- Phase 4: durable outbox for paid-order side effects + email idempotency

create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists outbox_events_pending
  on public.outbox_events (status, next_attempt_at);

-- Prevent duplicate order.paid rows for the same order.
create unique index if not exists outbox_events_order_paid_unique
  on public.outbox_events (event_type, aggregate_id)
  where event_type = 'order.paid';

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  order_id text not null,
  recipient text not null,
  created_at timestamptz not null default now(),
  unique (event_type, order_id, recipient)
);

alter table public.outbox_events enable row level security;
alter table public.email_deliveries enable row level security;

-- Claim a batch of due pending events for processing.
create or replace function public.claim_outbox_events(
  p_limit integer default 20
)
returns setof public.outbox_events
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select e.id
    from public.outbox_events e
    where e.status = 'pending'
      and e.next_attempt_at <= now()
    order by e.next_attempt_at asc
    limit greatest(coalesce(p_limit, 20), 1)
    for update skip locked
  )
  update public.outbox_events e
  set status = 'processing',
      attempts = e.attempts + 1
  from due
  where e.id = due.id
  returning e.*;
end;
$$;

revoke execute on function public.claim_outbox_events(integer) from public, anon, authenticated;
grant execute on function public.claim_outbox_events(integer) to service_role;
