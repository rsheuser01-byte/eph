-- Phase 2: simple per-SKU inventory
create type public.stock_movement_reason as enum (
  'sale',
  'refund_restock',
  'manual_adjust',
  'receive',
  'release'
);

create table public.inventory (
  sku text primary key,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  updated_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  sku text not null references public.inventory (sku),
  delta integer not null,
  reason public.stock_movement_reason not null,
  order_id text references public.orders (id) on delete set null,
  actor text,
  created_at timestamptz not null default now()
);

create index stock_movements_sku_idx on public.stock_movements (sku, created_at desc);
create index stock_movements_order_id_idx on public.stock_movements (order_id);

alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;

-- Atomically decrement stock for multiple SKUs. Rolls back if any SKU is short.
create or replace function public.reserve_stock(
  items jsonb,
  p_order_id text default null,
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
  updated integer;
begin
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'reserve_stock requires a non-empty items array';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    v_sku := item->>'sku';
    v_qty := (item->>'qty')::integer;

    if v_sku is null or v_qty is null or v_qty <= 0 then
      raise exception 'invalid stock reservation item: %', item;
    end if;

    update public.inventory
    set quantity_on_hand = quantity_on_hand - v_qty,
        updated_at = now()
    where sku = v_sku
      and quantity_on_hand >= v_qty;

    get diagnostics updated = row_count;
    if updated = 0 then
      raise exception 'insufficient stock for sku %', v_sku;
    end if;

    insert into public.stock_movements (sku, delta, reason, order_id, actor)
    values (v_sku, -v_qty, 'sale', p_order_id, p_actor);
  end loop;

  return true;
end;
$$;

-- Release previously reserved stock (payment failed / cancelled).
create or replace function public.release_stock(
  items jsonb,
  p_order_id text default null,
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
begin
  if items is null or jsonb_typeof(items) <> 'array' then
    return true;
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    v_sku := item->>'sku';
    v_qty := (item->>'qty')::integer;
    if v_sku is null or v_qty is null or v_qty <= 0 then
      continue;
    end if;

    update public.inventory
    set quantity_on_hand = quantity_on_hand + v_qty,
        updated_at = now()
    where sku = v_sku;

    insert into public.stock_movements (sku, delta, reason, order_id, actor)
    values (v_sku, v_qty, 'release', p_order_id, p_actor);
  end loop;

  return true;
end;
$$;

-- Manual adjust / receive / refund restock.
create or replace function public.adjust_stock(
  p_sku text,
  p_delta integer,
  p_reason public.stock_movement_reason,
  p_order_id text default null,
  p_actor text default 'admin'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_qty integer;
begin
  insert into public.inventory (sku, quantity_on_hand)
  values (p_sku, greatest(p_delta, 0))
  on conflict (sku) do update
  set quantity_on_hand = public.inventory.quantity_on_hand + p_delta,
      updated_at = now()
  where public.inventory.quantity_on_hand + p_delta >= 0
  returning quantity_on_hand into new_qty;

  if new_qty is null then
    raise exception 'stock adjustment would go negative for sku %', p_sku;
  end if;

  insert into public.stock_movements (sku, delta, reason, order_id, actor)
  values (p_sku, p_delta, p_reason, p_order_id, p_actor);

  return new_qty;
end;
$$;
