-- Open 25% merchandise discount. Not first-order-only.
-- Re-running keeps the code at 25% and active.

insert into public.promo_codes (
  code,
  percent_off,
  amount_off,
  active,
  first_order_only,
  label
)
values ('ELEVATE25', 25, null, true, false, '25% off')
on conflict (code) do update
set
  percent_off = excluded.percent_off,
  amount_off = excluded.amount_off,
  active = excluded.active,
  first_order_only = excluded.first_order_only,
  label = excluded.label;
