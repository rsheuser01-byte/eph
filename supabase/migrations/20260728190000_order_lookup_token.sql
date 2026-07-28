-- Phase 5: opaque customer lookup token for order status polling

alter table public.orders
  add column if not exists lookup_token text;

create unique index if not exists orders_lookup_token_uidx
  on public.orders (lookup_token)
  where lookup_token is not null;
