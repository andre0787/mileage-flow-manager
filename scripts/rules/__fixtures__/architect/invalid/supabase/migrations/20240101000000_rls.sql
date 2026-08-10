-- Migração de exemplo: política RLS só para OUTRA tabela (não tabela_sem_policy)
create table public.outra_tabela (id uuid primary key, user_id uuid);

alter table public.outra_tabela enable row level security;

create policy "outra_tabela_select_own"
  on public.outra_tabela
  for select
  using (auth.uid() = user_id);
