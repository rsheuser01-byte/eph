-- Additive: persist BOGO free units on order lines (paid qty stays in qty).
alter table public.order_items
  add column if not exists free_qty integer not null default 0;

alter table public.order_items
  drop constraint if exists order_items_free_qty_nonnegative;

alter table public.order_items
  add constraint order_items_free_qty_nonnegative check (free_qty >= 0);
