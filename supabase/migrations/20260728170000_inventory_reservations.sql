-- Phase 2: inventory reservations (available = on_hand - active reserved)

do $$ begin
  alter type public.payment_status add value 'expired';
exception
  when duplicate_object then null;
end $$;

alter table public.orders
  add column if not exists reservation_expires_at timestamptz;

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  sku text not null references public.inventory (sku),
  quantity integer not null check (quantity > 0),
  status text not null check (
    status in ('active', 'committed', 'released', 'expired')
  ),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, sku)
);

create index if not exists inventory_reservations_active_expiry
  on public.inventory_reservations (status, expires_at);

create index if not exists inventory_reservations_sku_active
  on public.inventory_reservations (sku)
  where status = 'active';

alter table public.inventory_reservations enable row level security;

-- Available qty helper: on_hand minus active reservations.
create or replace function public.inventory_available_qty(p_sku text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select i.quantity_on_hand
        - coalesce((
            select sum(r.quantity)::integer
            from public.inventory_reservations r
            where r.sku = i.sku
              and r.status = 'active'
          ), 0)
      from public.inventory i
      where i.sku = p_sku
    ),
    0
  );
$$;

-- Create active reservations without decrementing on_hand.
create or replace function public.create_inventory_reservations(
  items jsonb,
  p_order_id text,
  p_expires_at timestamptz,
  p_actor text default 'checkout'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_sku text;
  v_qty integer;
  v_available integer;
  existing_status text;
begin
  if p_order_id is null or length(trim(p_order_id)) = 0 then
    raise exception 'create_inventory_reservations requires order id';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'create_inventory_reservations requires a non-empty items array';
  end if;

  if p_expires_at is null then
    raise exception 'create_inventory_reservations requires expires_at';
  end if;

  -- Idempotent: existing active/committed reservation for this order is OK.
  select status into existing_status
  from public.inventory_reservations
  where order_id = p_order_id
  limit 1;

  if existing_status in ('active', 'committed') then
    return true;
  end if;

  if existing_status in ('released', 'expired') then
    raise exception 'cannot re-reserve order % in status %', p_order_id, existing_status;
  end if;

  -- Lock inventory rows in SKU order to prevent oversell races.
  perform 1
  from public.inventory i
  where i.sku in (
    select distinct elem->>'sku'
    from jsonb_array_elements(items) elem
  )
  order by i.sku
  for update;

  for item in select * from jsonb_array_elements(items)
  loop
    v_sku := item->>'sku';
    v_qty := (item->>'qty')::integer;

    if v_sku is null or v_qty is null or v_qty <= 0 then
      raise exception 'invalid reservation item: %', item;
    end if;

    if not exists (select 1 from public.inventory where sku = v_sku) then
      insert into public.inventory (sku, quantity_on_hand)
      values (v_sku, 0);
    end if;

    v_available := public.inventory_available_qty(v_sku);
    if v_available < v_qty then
      raise exception 'insufficient stock for sku %', v_sku;
    end if;

    insert into public.inventory_reservations (
      order_id, sku, quantity, status, expires_at
    ) values (
      p_order_id, v_sku, v_qty, 'active', p_expires_at
    );
  end loop;

  update public.orders
  set reservation_expires_at = p_expires_at
  where id = p_order_id;

  return true;
end;
$$;

-- Commit: decrement on_hand and mark reservations committed (once).
create or replace function public.commit_inventory_reservations(
  p_order_id text,
  p_actor text default 'checkout'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  updated integer;
  any_active boolean := false;
begin
  if p_order_id is null then
    raise exception 'commit_inventory_reservations requires order id';
  end if;

  -- Already fully committed → idempotent success.
  if exists (
    select 1 from public.inventory_reservations
    where order_id = p_order_id and status = 'committed'
  ) and not exists (
    select 1 from public.inventory_reservations
    where order_id = p_order_id and status = 'active'
  ) then
    return true;
  end if;

  if exists (
    select 1 from public.inventory_reservations
    where order_id = p_order_id and status in ('released', 'expired')
  ) and not exists (
    select 1 from public.inventory_reservations
    where order_id = p_order_id and status = 'active'
  ) then
    raise exception 'cannot commit reservations for order %', p_order_id;
  end if;

  for rec in
    select id, sku, quantity
    from public.inventory_reservations
    where order_id = p_order_id
      and status = 'active'
    order by sku
    for update
  loop
    any_active := true;

    update public.inventory
    set quantity_on_hand = quantity_on_hand - rec.quantity,
        updated_at = now()
    where sku = rec.sku
      and quantity_on_hand >= rec.quantity;

    get diagnostics updated = row_count;
    if updated = 0 then
      raise exception 'insufficient stock for sku %', rec.sku;
    end if;

    update public.inventory_reservations
    set status = 'committed',
        updated_at = now()
    where id = rec.id;

    insert into public.stock_movements (sku, delta, reason, order_id, actor)
    values (rec.sku, -rec.quantity, 'sale', p_order_id, p_actor);
  end loop;

  if not any_active then
    -- No reservation rows (inventory disabled path / legacy): no-op success.
    return true;
  end if;

  return true;
end;
$$;

-- Release active reservations (decline/cancel). Idempotent.
create or replace function public.release_inventory_reservations(
  p_order_id text,
  p_actor text default 'checkout'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_order_id is null then
    return true;
  end if;

  update public.inventory_reservations
  set status = 'released',
      updated_at = now()
  where order_id = p_order_id
    and status = 'active';

  return true;
end;
$$;

-- Expire active reservations past expires_at for one order. Idempotent.
create or replace function public.expire_inventory_reservations(
  p_order_id text,
  p_actor text default 'cron'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_order_id is null then
    return true;
  end if;

  update public.inventory_reservations
  set status = 'expired',
      updated_at = now()
  where order_id = p_order_id
    and status = 'active';

  return true;
end;
$$;

-- List distinct order ids with expired active reservations (batch).
create or replace function public.list_expired_reservation_orders(
  p_limit integer default 50
)
returns table (order_id text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct r.order_id
  from public.inventory_reservations r
  where r.status = 'active'
    and r.expires_at <= now()
  order by r.order_id
  limit greatest(coalesce(p_limit, 50), 1);
$$;

revoke execute on function public.inventory_available_qty(text) from public, anon, authenticated;
revoke execute on function public.create_inventory_reservations(jsonb, text, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.commit_inventory_reservations(text, text) from public, anon, authenticated;
revoke execute on function public.release_inventory_reservations(text, text) from public, anon, authenticated;
revoke execute on function public.expire_inventory_reservations(text, text) from public, anon, authenticated;
revoke execute on function public.list_expired_reservation_orders(integer) from public, anon, authenticated;

grant execute on function public.inventory_available_qty(text) to service_role;
grant execute on function public.create_inventory_reservations(jsonb, text, timestamptz, text) to service_role;
grant execute on function public.commit_inventory_reservations(text, text) to service_role;
grant execute on function public.release_inventory_reservations(text, text) to service_role;
grant execute on function public.expire_inventory_reservations(text, text) to service_role;
grant execute on function public.list_expired_reservation_orders(integer) to service_role;
