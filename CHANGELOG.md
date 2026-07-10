# Changelog

Todas as mudanças notáveis neste projeto são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Sprint #6] - Em andamento

### Adicionado
- Modo offline com sincronização (em desenvolvimento)

## [Sprint #5] - 2026-07-09

### Adicionado
- Busca global com dropdown seccionado no header (PR #63)
- Atalho Cmd/Ctrl+K para busca global
- Paginação (20 itens/página) em todas as listas
- CTAs nos empty states de Entradas e Vendas
- Badge de entradas pendentes no sidebar e bottom tab bar
- Mapa de experiências do usuário

### Corrigido
- Selector #editAmount → #amount em entradas.spec.ts (PR #60)
- Fluxo-completo: reload para React Query + selectors corrigidos (PR #59)
- Bugs #56 e #57: isClube setado ao criar tipo + fluxo-completo resiliente (PR #58)

### Melhorado
- Code splitting recharts via lazy loading
- Bundle: 645kB

## [Sprint #4] - 2026-07-06

### Adicionado
- Exportação CSV para vendas
- Playwright retries para testes E2E

## [Sprint #3] - 2026-07-04

### Adicionado
- Configuração Prettier com .prettierignore e script de formatação
- Vitest config, test script e unit tests para metrics.ts
- Testes compartilhados em tests/helpers.ts
- Utilitários: formatCurrency, formatNumber, formatPercent
- strictNullChecks habilitado com type safety completo
- Documentação de vitest na bateria pré-deploy

### Corrigido
- 3 erros de lint
- OrigemTypeSection: alinhamento de tipo description com strictNullChecks

### Refatorado
- Extração de OwnerSection, ProgramSection, OrigemTypeSection de Configuracoes
- Divisão do useDatabase (822 linhas) em módulos por entidade

## [Sprint #2] - 2026-06-30

### Adicionado
- Extração de EntryForm, EntryTable, EntrySummary de Entradas.tsx (1276→333 linhas)
- Extração de SaleForm, SaleTable, SaleMetrics, SaleSimulator de Vendas.tsx
- Sistema de handoff entre sessões (HANDOFF.md + skill + regra)
- Auditoria técnica completa do codebase
- Relatórios HTML retroativos
- 3 camadas de enforce para relatório obrigatório + hook pre-push
- Regra branch-por-sprint + template /sprint + docs growth saudável

### Corrigido
- Bug #1: overflow ao confirmar entrada
- Bateria completa de bugs #1-#5

## [Sprint #1] - 2026-06-22

### Inicial
- Setup do projeto com React 18 + TypeScript + Vite
- Integração com Supabase (Auth + PostgreSQL + RLS)
- Componentes base com shadcn/ui
- Rotas com React Router v6
- Server state com TanStack React Query
- Gráficos com Recharts
- Formulários com react-hook-form + zod
- Confetes com canvas-confetti
- Testes E2E com Playwright
