# 📋 Handoff — MilesControl

> Arquivo de passagem entre sessões. Mantém contexto crítico quando a janela
> fica pesada e precisamos começar uma sessão nova sem perder precisão.
>
> **Lido obrigatoriamente no início de cada sessão.**
> **Atualizado antes de `/new`, quando a sessão atinge ~12+ turns, ou
> sempre que criar/merger um PR.**

---

## Goal (Sprint #3)

Iniciar strictNullChecks, testes unitários, lint, centralização de formatação e refatoração de Configuracoes.tsx.

## Progress

### Done (Sprint #2 — COMPLETA ✅)
- [x] **#6 — Entradas.tsx**: 1276 → 333 linhas ✅
- [x] **#7 — Vendas.tsx**: 1117 → 203 linhas ✅
- [x] **#8 — useDatabase.ts**: 822 → 10 módulos por entidade ✅
- [x] **PR #41/#42/#44** mergeados em develop e main
- [x] **PR #43/#45** releases em produção
- [x] Docs atualizados (AGENTS.md, CONVENTIONS.md, WORKFLOW.md) ✅

### In Progress
- Nada — sprint #2 limpa

### Pending (Sprint #3)
- [ ] **#9 — strictNullChecks**: ativar gradualmente e corrigir erros
- [ ] **#10 — Testes unitários**: vitest para src/lib/metrics.ts
- [ ] **#11 — Lint errors**: corrigir catch vazio (types/index.ts:116) + let→const
- [ ] **#12 — Centralizar formatação**: formatCurrency, formatNumber, formatPercent em src/lib/utils.ts
- [ ] **#13 — Helpers de teste**: centralizar criação de dados via REST API em tests/helpers.ts
- [ ] **#14 — Incluir vitest na bateria pré-deploy**
- [ ] **#15 — Adicionar Prettier** + .prettierrc + script format
- [ ] **#16 — Configuracoes.tsx (751 linhas)**: extrair OwnerSection, ProgramSection, OrigemTypeSection, AccountSection

### Blocked
- Nada bloqueado

## Key Decisions

- **Padrão de extração**: página vira orquestrador puro, componentes em `src/components/` com props tipadas
- **Módulos useDatabase/**: cada entidade em arquivo próprio, barrel em index.ts, useDatabase.ts como barrel compatível
- **DRY com metrics.ts**: cálculos financeiros centralizados em `src/lib/metrics.ts`
- **Ponytail ativo**: sem abstrações desnecessárias, sem código especulativo

## Next Steps (próxima sessão)

1. Verificar se há algo pendente de merge, depois começar **#9 — strictNullChecks**
2. Cada item em branch separada: `chore/strict-null-checks`, `chore/vitest-metrics`, etc.
3. PR para develop → merge → main → relatório HTML + handoff

## Critical Context

- **Branch atual:** `main`
- **PRs abertos:** nenhum
- **Última release**: PR #45 (useDatabase split → produção)
- **Config pi**: `~/.pi/agent/models.json` (zen-free, nara), default: zen-free/deepseek-v4-flash-free