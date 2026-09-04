-- Remediação dos alertas do linter de segurança (observados em 2026-09-04).
-- Contexto: functions recriadas fora do versionamento perderam search_path/grants;
-- public.exec_sql(text) não existe no repo — nasceu de DDL avulso em prod.
-- Tudo abaixo é idempotente (reaplicável sem efeito colateral).

-- 1. Trigger helpers: definição canônica (idêntica ao initial_schema) + sem EXECUTE público.
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 2. public.exec_sql(text): EXECUTE arbitrário como SECURITY DEFINER, executável
--    por anon (provado em sonda) — sem nenhuma referência no repo. DROP definitivo.
DROP FUNCTION IF EXISTS public.exec_sql(text);
