-- Phase 1: durable orders
create extension if not exists pgcrypto;

create type public.payment_status as enum (
  'pending',
  'approved',
  'declined',
  'refunded',
  'partially_refunded',
  'cancelled'
);

create type public.fulfillment_status as enum (
  'unfulfilled',
  'fulfilled',
  'cancelled'
);

create table public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  provider text not null,
  transaction_id text,
  payment_status public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping numeric(12, 2) not null check (shipping >= 0),
  total numeric(12, 2) not null check (total >= 0),
  currency text not null default 'USD',
  customer jsonb not null,
  refunded_amount numeric(12, 2) not null default 0 check (refunded_amount >= 0)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  sku text not null,
  name text not null,
  size text not null,
  qty integer not null check (qty > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_payment_status_idx on public.orders (payment_status);

-- Service role only from the Next.js server; deny anon/authenticated.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
