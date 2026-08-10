-- Duas policies no MESMO arquivo: t1 com auth.uid() e t2 com USING (true).
-- A regra NÃO pode cruzar o fim de uma policy: t2 (sem auth.uid) deve falhar.

create table public.t1 (id uuid primary key, user_id uuid);
create table public.t2 (id uuid primary key);

alter table public.t1 enable row level security;
alter table public.t2 enable row level security;

create policy "t1_select_own"
  on public.t1
  for select
  using (auth.uid() = user_id);

create policy "t2_select_all"
  on public.t2
  for select
  using (true);
