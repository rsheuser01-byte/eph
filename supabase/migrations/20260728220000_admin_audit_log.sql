-- Phase 8: admin audit trail (hashed IPs only)

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_action_idx
  on public.admin_audit_log (action);

alter table public.admin_audit_log enable row level security;
