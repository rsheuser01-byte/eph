-- Optional start/end window for admin-managed promo codes.
-- A null bound means "no limit" on that side.

alter table public.promo_codes
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

alter table public.promo_codes
  drop constraint if exists promo_codes_window;

alter table public.promo_codes
  add constraint promo_codes_window
  check (starts_at is null or ends_at is null or ends_at > starts_at);
