-- Phase 1: payment event persistence + review_required status

do $$ begin
  alter type public.payment_status add value 'review_required';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text,
  order_id text,
  transaction_id text,
  event_type text not null,
  signature_valid boolean not null default false,
  processing_status text not null default 'received',
  payload jsonb not null,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists payment_events_provider_event_unique
  on public.payment_events (provider, provider_event_id)
  where provider_event_id is not null;

create index if not exists payment_events_order_id_idx
  on public.payment_events (order_id);

create index if not exists payment_events_created_at_idx
  on public.payment_events (created_at desc);

alter table public.payment_events enable row level security;
