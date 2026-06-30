# MilesControl - Instruções para Agentes

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router v6
- TanStack React Query
- Recharts
- react-hook-form + zod
- Supabase (PostgreSQL + Auth + RLS)
- @supabase/supabase-js

## Padrões
- Componentes em `src/components/`
- Páginas em `src/pages/`
- Utilitários em `src/lib/`
- Hooks em `src/hooks/`
- Componentes UI (shadcn) em `src/components/ui/`
- Import paths: `@/` aponta para `src/`
- Nomes de arquivos: PascalCase para componentes, camelCase para utils
- Interface em português (pt-BR)

## Estado Atual
- Backend Supabase com PostgreSQL (tabelas: profiles, owners, programs, origem_types, accounts, entries, clients, sales)
- Autenticação via Supabase Auth (email/senha), sem confirmação de email
- Dados carregados via React Query (staleTime: 30s) com RLS por usuário
- **DataContext simplificado**: contém apenas dados + clearCache/clearAccountData. Mutations removidas — componentes importam hooks diretamente de `useDatabase.ts`
- Login/Cadastro em /login, logout na sidebar
- Design system definido em CSS vars HSL no index.css
- Feature "cancelado" implementada para vendas: restaura saldo e totalInvested, excluída de métricas financeiras
- Feature de transferências entre contas de pontos (com bonificação)
- Exclusão em cascata de entradas com vendas vinculadas (implementada via `useDeleteSaleMutation` + `useDeleteEntryMutation` em Entradas)
- Controle de CPF com ciclo de passageiros por programa
- `formatCPF` centralizado em `src/lib/utils.ts`

## Git Workflow
- `main` → produção (https://mileage-flow-manager.vercel.app)
- `develop` → desenvolvimento
- Fixes: `fix/nome` → PR para `develop` → merge `develop` → `main`

## Comandos
- `npm run dev` - servidor dev (localhost:8080)
- `npm run build` - build produção
- `npm run lint` - ESLint

## Deploy (Vercel)
- URL: https://mileage-flow-manager.vercel.app
- Framework: Vite
- Variáveis de ambiente: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- CLI: `vercel --prod`

## Estrutura do Projeto
```
src/
├── components/       # Componentes reutilizáveis
│   └── ui/           # Componentes shadcn/ui
├── contexts/         # DataContext e AuthContext
├── hooks/            # React Query hooks + mutations
├── lib/              # Utilitários (supabase client, tipos)
├── pages/            # Páginas/rotas
│   ├── Dashboard.tsx
│   ├── Entradas.tsx  # Entrada de milhas/pontos + transferências
│   ├── Vendas.tsx    # Vendas com status cancelado
│   ├── Contas.tsx
│   ├── Clientes.tsx
│   ├── ControleCPF.tsx
│   ├── Relatorios.tsx
│   ├── Configuracoes.tsx
│   └── Login.tsx
└── types/            # Definições de tipos TypeScript
```

## Observações
- Não adicionar dependências sem necessidade
- Seguir padrão do shadcn/ui para novos componentes
- Manter consistência do design system (cores, sombras, animações)
- Todas as queries e mutations usam React Query com `invalidateQueries`
- Supabase RLS policies por `user_id` (auth.uid())
- Tokens armazenados em `~/.config/opencode/tokens.json` (gitignored)
