-- Phase 7: persist sales tax quoted at checkout

alter table public.orders
  add column if not exists tax numeric(12, 2) not null default 0
    check (tax >= 0),
  add column if not exists tax_provider text,
  add column if not exists tax_quote_id text,
  add column if not exists tax_jurisdiction text;
