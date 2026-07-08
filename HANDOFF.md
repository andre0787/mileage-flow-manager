# 📋 Handoff — MilesControl

> Arquivo de passagem entre sessões. Mantém contexto crítico quando a janela
> fica pesada e precisamos começar uma sessão nova sem perder precisão.
>
> **Lido obrigatoriamente no início de cada sessão.**
> **Atualizado antes de `/new` ou quando a sessão atinge ~12+ turns significativos.**

---

## Goal

Extrair 4 componentes de `src/pages/Vendas.tsx` (1117 → 203 linhas, -82%) seguindo padrão do #6 (Entradas). Substituir cálculos inline por `calcProfit`/`calcProfitMargin`/`calcROI` de `src/lib/metrics.ts`.

## Progress

### Done
- [x] **#7 — Vendas.tsx extração completa**: 1.117 → 203 linhas
- [x] **SaleMetrics.tsx** (27 linhas) — 4 MetricCards com calcProfitMargin
- [x] **SaleSimulator.tsx** (107 linhas) — FormDrawer com calcProfit/calcProfitMargin/calcROI
- [x] **SaleTable.tsx** (152 linhas) — tabela desktop + cards mobile + AlertDialog cancelamento
- [x] **SaleForm.tsx** (332 linhas) — formulário completo + criação de cliente + preview lucro + passageiros + validação de ciclo
- [x] **DRY implementado**: `calcProfit`/`calcProfitMargin` substituem cálculos inline no preview do form, no submit, e no simulador
- [x] **Relatório HTML**: `docs/reports/2026-07-08-vendas-extract-components.html`
- [x] **Build 0 erros** (`npx tsc --noEmit`)
- [x] **PR #42** criado: `refactor/vendas-extract-components` → `develop`

### In Progress
- [ ] **#6 — Entradas.tsx**: JÁ CONCLUÍDO (sessão anterior) — 1276 → 333 linhas, EntryForm/EntryTable/EntrySummary
- [ ] **#8 — useDatabase.ts (822 linhas, 40 funções)**: quebrar em módulos por entidade
- [ ] **#9 — strictNullChecks**: ativar gradualmente e corrigir erros
- [ ] **#10 — Testes unitários**: vitest para src/lib/metrics.ts
- [ ] **#11 — Lint errors**: corrigir catch vazio + let→const
- [ ] **#12 — Centralizar formatação**: formatCurrency, formatNumber, formatPercent

### Blocked
- Nada bloqueado

## Key Decisions

- **Padrão #6 seguido à risca**: componentes em `src/components/` com props tipadas, página como orquestrador puro
- **SaleForm gerencia `costPerMile` internamente**: preenche no submit a partir do `averageCostPerMile` da conta selecionada, evitando duplicação de lógica de derivação de estoque
- **`calcProfit`/`calcProfitMargin` reusados em 3 lugares**: preview do form, submit handler, simulador — mesmo import, mesmo cálculo
- **Simulador autocontido**: estado `inputs` interno ao componente, reseta no fechamento via `onOpenChange`
- **Estado de cancelamento no SaleTable**: `cancelConfirmId` gerenciado localmente, evita prop drilling de estado de diálogo
- **Ponytail ativo**: sem abstrações desnecessárias, componentes diretos, sem interface com uma implementação

## Next Steps

1. Merge PR #42 → develop
2. Iniciar **#8 — useDatabase.ts**: quebrar em módulos por entidade (useOwners, useAccounts, etc.)
3. Depois: #9 strictNullChecks → #10 testes → #11 lint → #12 formatação
4. Cada item em branch separada, PR para develop, merge, report HTML
5. Usar `/skill:handoff --save` antes de qualquer `/new`

## Critical Context

- **Branch atual:** `refactor/vendas-extract-components` (não mergeada ainda)
- **PR #42** (aberto): `refactor/vendas-extract-components` → `develop`
- **Último commit:** `refactor: extract SaleForm, SaleTable, SaleMetrics, SaleSimulator from Vendas.tsx`
- **Arquivos criados:** SaleForm.tsx, SaleTable.tsx, SaleMetrics.tsx, SaleSimulator.tsx, docs/reports/2026-07-08-vendas-extract-components.html, docs/superpowers/plans/2026-07-08-vendas-extract-components.md
- **Arquivos modificados:** Vendas.tsx (1117→203 linhas)
- **Funções de metrics.ts disponíveis**: `calcProfit(saleValue, milesUsed, costPerMile, additionalCost=0)`, `calcProfitMargin(profit, saleValue)`, `calcROI(profit, totalInvested)`
- **Tipo Sale de @/types**: `{id, accountId?, accountName, ownerName, program, clientId, clientName, milesUsed, saleValue, pricePerMile?, costPerMile, additionalCost?, additionalCostDesc?, profit, profitMargin, status, ticketLocator, passengers[], date}`
- **Componentes extraídos seguem props padrão EntryForm/EntryTable**: dados + callbacks (`onSubmit`, `onOpenChange`, `onCreateClient`)
