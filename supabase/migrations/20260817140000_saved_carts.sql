-- Abandoned / saved carts for recovery emails (Activepieces).
create type public.saved_cart_status as enum (
  'active',
  'converted',
  'expired'
);

create table public.saved_carts (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  session_id_hash text not null,
  restore_token text not null unique,
  email text,
  first_name text,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  currency text not null default 'USD',
  status public.saved_cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  identified_at timestamptz,
  checkout_started_at timestamptz,
  converted_at timestamptz,
  order_id text references public.orders (id),
  last_recovery_event_at timestamptz,
  identified_event_sent_at timestamptz,
  converted_event_sent_at timestamptz,
  expires_at timestamptz not null,
  cart_recovery_consent boolean not null default true
);

create table public.saved_cart_items (
  id uuid primary key default gen_random_uuid(),
  saved_cart_id uuid not null references public.saved_carts (id) on delete cascade,
  slug text not null,
  size text not null,
  sku text not null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  image_url text
);

create index saved_carts_session_id_hash_idx on public.saved_carts (session_id_hash);
create index saved_carts_email_lower_idx on public.saved_carts ((lower(email)));
create index saved_carts_status_updated_idx on public.saved_carts (status, updated_at desc);
create index saved_carts_order_id_idx on public.saved_carts (order_id);
create index saved_carts_expires_at_idx on public.saved_carts (expires_at);
create index saved_cart_items_saved_cart_id_idx on public.saved_cart_items (saved_cart_id);

-- Service role only from the Next.js server; deny anon/authenticated.
alter table public.saved_carts enable row level security;
alter table public.saved_cart_items enable row level security;
