# HANDOFF — Milage Flow Manager

> ⏰ Última atualização: 2026-07-11 — Pós-Sessão #86 / Preparação #88

---

## 🧭 Estado Atual

### 🔴 Branch atual
- `main` (PR #87 mergeado via `feat/edit-sales-86`)

### ✅ O que foi feito nesta sessão

| O quê | Status |
|-------|--------|
| #86 — Editar Vendas (implementação) | ✅ mergeado (PR #87) |
| #86 — SaleForm: mode="edit" + initialData | ✅ |
| #86 — SaleTable: botão Editar por linha | ✅ |
| #86 — Vendas.tsx: editingSale + handleUpdateSale | ✅ |
| #88 — Issue criada (Formulários Dedicados) | ✅ aberta |
| Relatório HTML | `docs/reports/PR86-2026-07-11-feat-edit-sales.html` |
| AGENDA.md — Sprint #11 adicionada | ✅ |

### 📋 Próxima Sessão — Sprint #11: Formulários Dedicados

**Issue:** #88

**Objetivo:** Separar `EntryForm` monolítico em 3 formulários dedicados.

#### TransferForm (novo)
- Conta origem (pontos) → Conta destino (milhas) + data + pontos transferidos + custo calculado
- Bonificação (%) + Compra no carrinho (pontos extras + valor total)
- ❌ Sem tipo de origem (sempre "Transferência")
- ❌ Sem recorrência
- ❌ Sem clube

#### EntryFormPontos (refatorado de EntryForm)
- Tipo de origem, recorrência/clube
- ❌ Sem campos de transferência

#### EntryFormMilhas (refatorado de EntryForm)
- Tipo de origem, recorrência/clube
- ❌ Sem campos de transferência

#### Entradas.tsx
- Botão "Transferir" → abre `TransferForm` diretamente (sem presets)
- Aba Pontos → `EntryFormPontos`
- Aba Milhas → `EntryFormMilhas`
- Remover `transferInitialData` e `handleOpenTransfer`

#### DRY — Compartilhado
- `lib/metrics.ts` — cálculos (já existem)
- `lib/recurrence.ts` — calculateRecurrence()
- `hooks/useDatabase/entries.ts` — mutations
- `FormDrawer` — container
- Tipos (`types/index.ts`)

#### Sprint B 🟡
- [ ] Arquivar 29 docs órfãos em `docs/archive/`
- [ ] Config cross-harness (`.opencode/`, `.claude/`)
- [ ] Script `scripts/verify-docs.mjs`
- [ ] Atualizar docs núcleo (AGENTS.md, CONVENTIONS.md, WORKFLOW.md)

### 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Testes unitários | 45/45 ✅ |
| Testes E2E | 54/54 ✅ |
| CI/CD | ✅ |
| Deploy | ✅ Automático Vercel |
| Último PR | #87 (#86 — Editar Vendas) |

---

## 🧠 Contexto Técnico

### Editar Vendas (#86) — IMPLEMENTADO
- `SaleForm` aceita `mode="create" | "edit"` e `initialData` opcional
- `key={editingSale?.id}` força remount correto entre edições
- `handleUpdateSale` recalcula profit/margin via `calcProfit`/`calcProfitMargin`
- Botão Editar aparece apenas em vendas não-canceladas
- **ponytail:** ajuste de saldo de conta na edição não implementado (cancel + recreate se finances)

### #88 — Formulários Dedicados (PLANEJADO)
- `EntryForm` atual tem 650+ linhas com lógica condicional de transferência
- `TransferForm` será componente novo (~150 linhas)
- `EntryFormPontos` + `EntryFormMilhas` extraídos do `EntryForm` atual (~300 linhas cada)
- Lógica de domínio permanece em `lib/` (ponto único)
- Mutations intactas em `hooks/useDatabase/entries.ts`
- Ver `docs/AGENDA.md` → Sprint #11

### Como iniciar a Sprint #11
1. Ler este HANDOFF.md
2. Ler `docs/AGENDA.md` → Sprint #11
3. Ler `docs/ARCHITECTURE.md` + `docs/CONVENTIONS.md`
4. Issue #88: https://github.com/andre0787/mileage-flow-manager/issues/88
5. Criar branch: `git checkout -b feat/dedicated-forms-88`
