-- Adiciona coluna description (JSON) para configurar recorrência no tipo de origem
alter table public.origem_types add column if not exists description text;

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger if not exists set_origem_types_updated_at
  before update on public.origem_types
  for each row execute function public.set_updated_at();
