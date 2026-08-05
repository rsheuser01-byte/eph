-- Promo codes + order discount fields (no seed data)

create table if not exists public.promo_codes (
  code text primary key,
  percent_off numeric(5, 2) check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off numeric(12, 2) check (amount_off is null or amount_off > 0),
  active boolean not null default true,
  first_order_only boolean not null default false,
  label text not null,
  created_at timestamptz not null default now(),
  constraint promo_codes_discount_kind check (
    (percent_off is not null and amount_off is null)
    or (percent_off is null and amount_off is not null)
  )
);

alter table public.promo_codes enable row level security;

alter table public.orders
  add column if not exists discount numeric(12, 2) not null default 0
    check (discount >= 0),
  add column if not exists promo_code text;

create index if not exists orders_customer_email_lower_idx
  on public.orders ((lower(customer->>'email')));
