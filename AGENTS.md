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
- DataContext adaptado para usar React Query + Supabase (mesma interface pública)
- Migração automática de dados do localStorage para Supabase no primeiro login
- Login/Cadastro em /login, logout na sidebar
- Design system definido em CSS vars HSL no index.css

## Git Workflow
- `main` → produção (https://mileage-flow-manager.vercel.app)
- `develop` → desenvolvimento
- Features: `feature/nome` → PR para `develop` → merge `develop` → `main`

## Comandos
- `npm run dev` - servidor dev (localhost:8080)
- `npm run build` - build produção
- `npm run lint` - ESLint

## Deploy (Vercel)
- URL: https://mileage-flow-manager.vercel.app
- Framework: Vite
- Variáveis de ambiente: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

## Observações
- Não adicionar dependências sem necessidade
- Seguir padrão do shadcn/ui para novos componentes
- Manter consistência do design system (cores, sombras, animações)
