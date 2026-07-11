# Supabase Backend — Design

## Objetivo
Substituir o armazenamento localStorage por um backend real usando Supabase (PostgreSQL + Auth), mantendo a interface `useData()` existente para que os componentes não precisem ser alterados.

## Stack
- **Database:** Supabase PostgreSQL (free tier)
- **Auth:** Supabase Auth (email/senha + OAuth opcional)
- **Client:** `@supabase/supabase-js` (cliente browser direto, sem SSR)
- **Data Fetching:** TanStack React Query (já no projeto)
- **Deploy:** Vercel (free tier)

## Premissas
- Migração total de todas as entidades (owners, programs, origem_types, accounts, entries, clients, sales) de uma vez
- Usuário faz login; cada usuário vê apenas seus próprios dados (RLS)
- Um usuário pode gerenciar múltiplos owners (donos)
- DataContext mantém a mesma interface pública; implementação troca de useState+localStorage para React Query+Supabase
- Seed data opcional via migration SQL

## Database Schema

### profiles
Estende `auth.users` do Supabase. Criada automaticamente via trigger no `on_auth_user_created`.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  created_at timestamptz default now()
);
```

### owners
```sql
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  cpf text not null default '',
  phone text not null default '',
  created_at timestamptz default now()
);
```

### programs
```sql
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('pontos', 'milhas')),
  max_passengers int,
  passenger_cycle_type text check (passenger_cycle_type in ('anual', 'dias')),
  passenger_cycle_days int
);
```

### origem_types
```sql
create table public.origem_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('pontos', 'milhas')),
  color text not null default '#8b5cf6'
);
```

### accounts
```sql
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
```

### entries
```sql
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
```

### clients
```sql
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
```

### sales
```sql
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
```

### builtin TRANSFERENCIA
O tipo de origem "Transferência" (id fixo `builtin-transferencia`) é protegido — não pode ser editado nem excluído. Será inserido automaticamente via migration SQL com o ID fixo, e o DataContext garante que sempre exista (assim como hoje faz com `if (!stored.some(ot => ot.id === TRANSFERENCIA_ID))`).

## Row Level Security (RLS)

Todas as tabelas públicas têm RLS habilitado com a política padrão:

```sql
create policy "Usuários só veem próprios dados"
  on public.<table>
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

Exceção: `profiles` — `select` público (apenas próprio perfil), `insert` apenas `auth.uid()`.

## Autenticação

Fluxo:
1. Usuário acessa o app → não autenticado → redirecionado para `/login`
2. Login/Cadastro via Supabase Auth (email/senha)
3. Após autenticação, trigger SQL cria registro em `profiles`
4. Redireciona para `/dashboard`
5. React Query faz as queries com o token de sessão
6. RLS garante isolamento dos dados

Proteção de rotas: wrapper `<ProtectedRoute>` que verifica sessão e redireciona para `/login` se não autenticado.

## Arquitetura de Dados (React Query)

```
[Componente] → [useData() do DataContext] → [React Query Hook] → [Supabase Client] → [PostgreSQL]
                                                ↕
                                         QueryClient (cache)
```

### DataContext adaptado
- Mantém interface `DataContextType` idêntica
- Internamente: em vez de `useState<T>(loadFromStorage(...))`, usa `useQuery` para leitura e `useMutation` para escrita
- Operações de escrita que afetam saldo (addEntry, addSale) continuam com a mesma lógica de ajuste de `balance`/`totalInvested`, mas persistindo no Supabase via mutation

### React Query Hooks
Cada entidade terá hooks como:
- `useOwners()` → `useQuery({ queryKey: ['owners'], queryFn: () => supabase.from('owners').select('*') })`
- `useAddOwner()` → `useMutation({ mutationFn: ... })` que invalida `['owners']`

### Cache e Sincronização
- React Query gerencia cache automaticamente
- `staleTime: 30s` (dados frescos por 30 segundos)
- Invalidação automática após mutations
- Suporte a `refetchOnWindowFocus` (dados sempre atuais)

## Seed Data
Migration SQL opcional com dados de demonstração (equivalente ao `src/data/seed.ts`), vinculados a um `user_id` fixo de demonstração. Pode ser ignorado em produção.

## Deploy (Vercel)
- Build: `npm run build` (Vite)
- Variáveis de ambiente:
  - `VITE_SUPABASE_URL` — URL do projeto Supabase
  - `VITE_SUPABASE_ANON_KEY` — chave anônima do Supabase
- Client Supabase puro (`@supabase/supabase-js`) com `createClient` no browser
- Roteamento: SPA (client-side), Vercel configurado para fallback `index.html`

## Ordem de Implementação
1. Setup Supabase + migrations SQL
2. Auth (Login/Cadastro + ProtectedRoute)
3. Client Supabase + tipos gerados
4. React Query hooks + DataContext adaptado
5. Seed SQL + teste completo
6. Deploy no Vercel
7. Remover localStorage (opcional)
