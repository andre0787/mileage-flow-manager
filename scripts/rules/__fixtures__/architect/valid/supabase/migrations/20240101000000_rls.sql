-- Migração de exemplo: políticas RLS para perfis_usuario
create table public.perfis_usuario (id uuid primary key, user_id uuid, nome text);

alter table public.perfis_usuario enable row level security;

create policy "perfis_usuario_select_own"
  on public.perfis_usuario
  for select
  using (auth.uid() = user_id);

create policy "perfis_usuario_insert_own"
  on public.perfis_usuario
  for insert
  with check (auth.uid() = user_id);
