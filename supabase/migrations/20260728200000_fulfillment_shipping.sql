-- Phase 6: fulfillment shipping fields + shipped/processing statuses

alter type public.fulfillment_status add value if not exists 'processing';
alter type public.fulfillment_status add value if not exists 'shipped';

alter table public.orders
  add column if not exists carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipped_at timestamptz,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists fulfillment_notes text;

-- One shipped / cancelled notification job per order (refunds use distinct aggregate ids).
create unique index if not exists outbox_events_order_shipped_unique
  on public.outbox_events (event_type, aggregate_id)
  where event_type = 'order.shipped';

create unique index if not exists outbox_events_order_cancelled_unique
  on public.outbox_events (event_type, aggregate_id)
  where event_type = 'order.cancelled';
