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
- `formatCPF` e `isTransferencia` centralizados em `src/lib/utils.ts`
- **Dashboard com abas Milhas/Pontos**: abas separam contas por tipo. Aba Milhas: dashboard completo (hero, FlowMap, charts, vendas). Aba Pontos: foco em investimento (estoque, custo médio, transferências). Filtro por dono via botões segmentados — todas as métricas refletem o dono selecionado.
- **Componentes shadcn/ui mantidos**: alert-dialog, badge, button, card, dialog, drawer, input, label, progress, select, separator, sheet, skeleton, sidebar, sonner, switch, table, tabs, tooltip (~31 componentes não utilizados foram removidos)
- Toast system removido (app usa Sonner). `animate` prop removida do MetricCard (sempre true)
- Período "custom" removido do Relatorios (não tinha implementação)
- Aba "Preferências Gerais" removida do Configuracoes (UI especulativa)
- **Export CSV em Relatorios**: botões "Exportar Donos" e "Exportar Programas" baixam CSV com BOM UTF-8 (compatível Excel)
- **Busca em Entradas**: campo de busca no header filtra por nome da conta, origem ou data
- **Busca + Filtro em Vendas**: campo de busca (cliente/dono/programa/localizador) + dropdown de status (todos/pendente/pago/concluído/cancelado)
- **Página de Perfil (`/perfil`)**: atualizar nome (user_metadata), email (com confirmação), senha (com verificação da atual)
- **Simulador de Venda**: modal na página de Vendas com inputs (milhas, preço, custo, custo adicional) e resultado ao vivo (valor, lucro, margem, ROI)

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
│   ├── ui/           # Componentes shadcn/ui (19 mantidos)
│   ├── AccountDialog.tsx
│   ├── AnimatedNumber.tsx
│   ├── AppSidebar.tsx
│   ├── BottomTabBar.tsx
│   ├── FlowMap.tsx
│   ├── FormDrawer.tsx
│   ├── MetricCard.tsx
│   └── ProtectedRoute.tsx
├── contexts/         # DataContext e AuthContext
├── hooks/            # React Query hooks + mutations (useDatabase.ts)
├── lib/              # Utilitários (supabase, utils com formatCPF + isTransferencia)
├── pages/            # Páginas/rotas
│   ├── Dashboard.tsx
│   ├── Entradas.tsx  # Entrada de milhas/pontos + transferências
│   ├── Vendas.tsx    # Vendas com status cancelado + simulador
│   ├── Perfil.tsx     # Editar nome/email/senha
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
- Seguir padrão do shadcn/ui para novos componentes (só adicionar se realmente for usar)
- Manter consistência do design system (cores, sombras, animações)
- Todas as queries e mutations usam React Query com `invalidateQueries`
- Supabase RLS policies por `user_id` (auth.uid())
- Tokens armazenados em `~/.config/opencode/tokens.json` (gitignored)
- **Ponytail mode**: não criar abstrações antes de precisar, preferir stdlib/nativo, remover código morto

## Testes (Playwright)
- Testes E2E em `tests/` com Playwright
- Comando: `npx playwright test --reporter=list --workers=1`
- Configuração em `playwright.config.ts` (viewport 1280x900, webServer com `npm run dev`)
- **Usar `{ force: true }` em cliques de botões dentro de Dialog/Drawer** (podem estar fora do viewport)
- **Usar `.first()` em `text=`** quando o valor aparece em múltiplos lugares (summary card + tabela + mobile)
- **Estratégia**: registrar usuário via UI, criar dados de teste via fetch direto ao Supabase REST API (com token da sessão), testar UI
- IDs dos campos do formulário de entrada: `#amount`, `#amountPaid`, `#conversion` (criar), `#editAmount`, `#editAmountPaid` (editar)
- Para criar dados de teste via API, usar `localStorage.getItem('sb-{project-ref}-auth-token')` para obter o token de acesso
- Viewport padrão: 1280x900 (suficiente para evitar overflow em diálogos)
- **Teste atual**: `tests/entradas.spec.ts` — fluxo completo criar → editar → excluir entrada
- **Helpers**: `tests/helpers.ts` — funções para criar dados de teste via REST API com retry

## Princípios de Código (DRY & Modularidade)
- **Nunca duplicar regra de negócio**: cálculos de lucro, margem, saldo, custo médio — cada um em ponto único em `src/lib/`
- **Regras de negócio isoladas do framework**: funções puras em `src/lib/*.ts`, sem React, sem Supabase, sem hooks
- **Ponto único de alteração**: qualquer mudança em lógica de domínio reflete em 1 arquivo apenas
- **Business logic em `lib/`, queries/mutations em `hooks/`, UI em `pages/` e `components/`**
- **Todo mapper snake_case → camelCase** centralizado em `lib/utils.ts` ou no próprio módulo de domínio
- **Preferir criar módulo novo** a duplicar lógica existente
