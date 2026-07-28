-- Restrict inventory RPCs to the service role (Next.js server only).
revoke execute on function public.reserve_stock(jsonb, text, text) from public, anon, authenticated;
revoke execute on function public.release_stock(jsonb, text, text) from public, anon, authenticated;
revoke execute on function public.adjust_stock(text, integer, public.stock_movement_reason, text, text) from public, anon, authenticated;

grant execute on function public.reserve_stock(jsonb, text, text) to service_role;
grant execute on function public.release_stock(jsonb, text, text) to service_role;
grant execute on function public.adjust_stock(text, integer, public.stock_movement_reason, text, text) to service_role;
