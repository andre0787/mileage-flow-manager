# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-14 (final)
> Anterior: 2026-07-13

---

## 🧭 Estado Atual

- **Branch:** `main`
- **Último commit:** `0b07ed7` — Merge PR #133 (feat/recalc-account-balance)
- **Remote:** origin/main

### 📋 PRs Abertos

Nenhum — todos mergeados ✅

### 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Testes | 45/45 passando |
| Build | OK |
| Branch | main |

---

## ✅ Sessão Encerrada — 2026-07-14

### O que foi feito

| PR | O quê | Status |
|----|-------|--------|
| #132 | Correção: `useUpdateSaleMutation` + `useUpdateEntryMutation` (delta) + dashboard `totalMiles` de entradas-vendas | ✅ Mergeado + Deploy OK |
| #133 | Botão "Recalcular" por conta + "Recalcular tudo" na página Contas | ✅ Mergeado + Deploy em progresso |

### Bugs Corrigidos (3)

1. **Editar venda não ajusta saldo** — `useUpdateSaleMutation` reescrita (fetch old → revert → apply new)
2. **Editar entrada com ops intermediárias perde saldo** — migrado de reverse+reapply para delta (`deltaMiles = newMiles - oldMiles`)
3. **Dashboard usava `accounts.balance` denormalizado** — `computeDashboardMetrics` calcula de entradas - vendas

### Regras Criadas / Reforçadas

- **Rule 19.3b**: mutation-by-mutation check — toda `useXMutation` deve conter `calcAccountUpdate(`
- **Rule 19**: `invalidateQueries` deve usar `refetchType: 'all'`

### Dados Existentes

- Service key coletada ✅
- `--fix` não necessário — contas individuais OK (discrepância global em dados de teste E2E, não corrupção real)
- App com `--fix` via UI: botão "Recalcular" + "Recalcular tudo" em Contas

### 🔜 Próxima Sessão

Voltar para `feat/recalc-account-balance` ou outra feature. Verificar deploy do PR #133.
