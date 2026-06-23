-- Ensure every "pontos" program has a matching origem_type entry
-- This allows the FK on entries.origem_type_id to be satisfied
-- when a program ID is used as origem_type_id for pontos entries
-- Ensure every "pontos" program has a matching origem_type entry
-- This allows the FK on entries.origem_type_id to be satisfied
-- when a program ID is used as origem_type_id for pontos entries
insert into public.origem_types (id, user_id, name, account_type, color)
  select p.id, p.user_id, p.name, 'pontos', '#3b82f6'
  from public.programs p
  where p.type = 'pontos'
    and not exists (select 1 from public.origem_types ot where ot.id = p.id)
on conflict (id) do nothing;

-- Ensure the built-in TRANSFERENCIA type exists for all existing users
insert into public.origem_types (id, user_id, name, account_type, color)
  select 'builtin-transferencia', up.user_id, 'Transferência', 'milhas', '#8b5cf6'
  from (select distinct p.user_id from public.programs p) up
  where not exists (
    select 1 from public.origem_types ot
    where ot.id = 'builtin-transferencia' and ot.user_id = up.user_id
  )
on conflict (id) do nothing;
