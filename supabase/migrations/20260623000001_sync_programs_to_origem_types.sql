-- Ensure every "pontos" program has a matching origem_type entry
-- This allows the FK on entries.origem_type_id to be satisfied
-- when a program ID is used as origem_type_id for pontos entries
insert into public.origem_types (id, user_id, name, account_type, color)
  select p.id, p.user_id, p.name, 'pontos', '#3b82f6'
  from public.programs p
  where p.type = 'pontos'
    and not exists (select 1 from public.origem_types ot where ot.id = p.id)
on conflict (id) do nothing;

-- Ensure the built-in TRANSFERENCIA type exists for every user
-- Each user gets their own UUID (id is PK so it must be unique per row)
insert into public.origem_types (id, user_id, name, account_type, color)
  select gen_random_uuid(), p.id, 'Transferência', 'milhas', '#8b5cf6'
  from public.profiles p
  where not exists (
    select 1 from public.origem_types ot
    where ot.name = 'Transferência' and ot.account_type = 'milhas' and ot.user_id = p.id
  );
