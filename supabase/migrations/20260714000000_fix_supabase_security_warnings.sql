-- Fix Supabase security warnings
-- 1. set_updated_at: add search_path to prevent mutable search_path warning
-- 2. Both functions: revoke EXECUTE from PUBLIC (they're trigger-only, not RPCs)

-- Fix set_updated_at: add set search_path = ''
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke EXECUTE from PUBLIC — both are trigger functions only,
-- never meant to be called directly via REST API
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
