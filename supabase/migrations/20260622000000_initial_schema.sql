-- MilesControl - Initial Schema
-- Run this in your Supabase SQL Editor

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Owners
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  cpf text not null default '',
  phone text not null default '',
  created_at timestamptz default now()
);

-- 3. Programs
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('pontos', 'milhas')),
  max_passengers int,
  passenger_cycle_type text check (passenger_cycle_type in ('anual', 'dias')),
  passenger_cycle_days int
);

-- 4. Origem Types
create table public.origem_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('pontos', 'milhas')),
  color text not null default '#8b5cf6'
);

-- 5. Accounts
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete restrict,
  name text not null,
  type text not null check (type in ('pontos', 'milhas')),
  balance numeric not null default 0,
  average_cost_per_mile numeric,
  total_invested numeric default 0,
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  created_at timestamptz default now()
);

-- 6. Entries
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  origem_type_id uuid not null references public.origem_types(id) on delete restrict,
  amount numeric not null,
  amount_paid numeric not null default 0,
  cost_per_thousand numeric not null default 0,
  conversion_rate numeric,
  miles_generated numeric,
  cost_per_mile numeric,
  source_account_id uuid references public.accounts(id) on delete set null,
  bonus_percent numeric,
  date date not null default current_date,
  description text
);

-- 7. Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  cpf text,
  email text,
  phone text not null default '',
  telegram text,
  total_purchases int not null default 0,
  usage_history jsonb not null default '[]'::jsonb
);

-- 8. Sales
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  account_name text not null,
  owner_name text not null,
  program text not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  client_name text not null,
  miles_used numeric not null,
  sale_value numeric not null,
  price_per_mile numeric,
  cost_per_mile numeric not null,
  additional_cost numeric,
  additional_cost_desc text,
  profit numeric not null,
  profit_margin numeric not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'concluido')),
  ticket_locator text not null default '',
  passengers jsonb not null default '[]'::jsonb,
  date date not null default current_date
);

-- 9. RLS - Enable on all tables
alter table public.profiles enable row level security;
alter table public.owners enable row level security;
alter table public.programs enable row level security;
alter table public.origem_types enable row level security;
alter table public.accounts enable row level security;
alter table public.entries enable row level security;
alter table public.clients enable row level security;
alter table public.sales enable row level security;

-- 10. RLS Policies

-- Profiles: user can only see/edit own profile
create policy "Profiles select own"
  on public.profiles for select
  using (id = auth.uid());

create policy "Profiles insert own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Profiles update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Generic policy for user-scoped tables
-- Owners
create policy "Owners user isolation"
  on public.owners for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Programs
create policy "Programs user isolation"
  on public.programs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Origem Types
create policy "Origem types user isolation"
  on public.origem_types for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Accounts
create policy "Accounts user isolation"
  on public.accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Entries
create policy "Entries user isolation"
  on public.entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Clients
create policy "Clients user isolation"
  on public.clients for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sales
create policy "Sales user isolation"
  on public.sales for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
