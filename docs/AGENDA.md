# 📋 Agenda — MilesControl

> Sprint board do projeto. Mantenha atualizado: toda tarefa nova vira checkbox,
> toda finalizada é movida pra ✅.

---

## 🎯 Meta da Sprint (COMPLETA ✅)

Todos os bugs #1–#5 resolvidos + docs workflow / sprint template / docs growth.

---

## ✅ Resolvidos nesta sprint

- [x] **#1 — Overflow após confirmar entrada** ✅
- [x] **#2 — Coluna Origem sem nome na aba Pontos** ✅
- [x] **#3 — Testar transferência com bônus manualmente** ✅
- [x] **#4 — Limpeza de arquivos temporários** ✅
- [x] **#5 — Bateria pré-deploy completa** ✅
- [x] **Regra de branch por sprint** adicionada ao `GIT-WORKFLOW.md` ✅
- [x] **Template `/sprint`** criado em `.pi/prompts/sprint.md` ✅
- [x] **Docs growth avaliado** — todos < 4KB, maior tem 103 linhas. Nada precisa ser dividido. ✅

---

## ✅ Finalizados (sprint atual)
- [x] `SPRINT_NEXT.md` deletado (conteúdo migrado pra AGENDA.md)
- [x] `progress.md` movido para `docs/`
- [x] `task_plan.md` movido para `docs/`
- [x] Estrutura `docs/` criada (9 arquivos modulares)
- [x] AGENTS.md enxugado para sumário executivo
- [x] MAP.md — índice entry point
- [x] AGENDA.md — sprint board
- [x] Convenção de branches: inglês + kebab-case + prefixos padronizados
- [x] Workflow council-to-superpowers documentado e instalado
- [x] Deletar `entradas-transferir.png`, `entradas-page.txt`, `bun.lockb`
- [x] Verificar e limpar `.playwright-mcp/`
- [x] Adicionar artifacts de debug ao `.gitignore` (test-results, screenshots, .playwright-mcp)
- [x] Relatório pós-implementação (CONVENTIONS.md + /report template)
- [x] Regra de escopo estrito (não alterar além do pedido)
- [x] Deploy: PR #27 → develop → main
- [x] Regra de branch por sprint (GIT-WORKFLOW.md)
- [x] Template /sprint (.pi/prompts/sprint.md)
- [x] Docs growth avaliado (todos saudáveis)

---

## 📌 Sprint #2

### 🖥️ Código
- [x] **#6 — Entradas.tsx (1276 linhas)**: extrair EntryForm, EntryTable, EntrySummary em componentes separados (333 linhas, -74%)
- [ ] **#7 — Vendas.tsx (1117 linhas)**: extrair SaleForm, SaleTable, SaleSimulator, SaleMetrics + usar calcProfit/calcProfitMargin/calcROI de metrics.ts (DRY)
- [ ] **#8 — useDatabase.ts (822 linhas, 40 funções)**: quebrar em módulos por entidade (useOwners.ts, useAccounts.ts, useEntries.ts, useSales.ts, useClients.ts)
- [ ] **#9 — strictNullChecks**: ativar gradualmente e corrigir erros
- [ ] **#10 — Testes unitários**: adicionar vitest + testes para src/lib/metrics.ts (funções puras)
- [ ] **#11 — Lint errors**: corrigir catch vazio (types/index.ts:116) + let→const (testes)
- [ ] **#12 — Centralizar formatação**: formatCurrency, formatNumber, formatPercent em src/lib/utils.ts
- [ ] **#16 — Configuracoes.tsx (751 linhas)**: extrair seções OwnerSection, ProgramSection, OrigemTypeSection, AccountSection

### 🧪 Testes
- [ ] **#13 — Helpers de teste**: centralizar criação de dados via REST API em tests/helpers.ts
- [ ] **#14 — Incluir vitest na bateria pré-deploy

### 🔧 Infra
- [ ] **#15 — Adicionar Prettier** + .prettierrc + script format

### 🎯 Extra
- [ ] `feat/nova-funcionalidade` com council
