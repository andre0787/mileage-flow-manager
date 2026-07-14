# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-14 (final)
> Anterior: 2026-07-13

---

## 🧭 Estado Atual

- **Branch:** `main`
- **Último commit:** `cdde92d` — Merge PR #135 (fix/contas-computed-balance)
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

### O que foi feito (4 PRs)

| PR | O quê | Status |
|----|-------|--------|
| #132 | Correção mutações (sale/entry update) + dashboard `totalMiles` de entradas-vendas | ✅ Deploy OK |
| #133 | Botão "Recalcular" por conta + "Recalcular tudo" na página Contas | ✅ Deploy OK |
| #134 | Handoff atualizado | ✅ Deploy OK |
| #135 | Contas mostra saldo calculado de entradas-vendas (fonte da verdade) | ✅ Deploy OK |

### Bugs Corrigidos (3)

1. **Editar venda não ajusta saldo** — `useUpdateSaleMutation` reescrita (fetch old → revert → apply new)
2. **Editar entrada com ops intermediárias perde saldo** — migrado de reverse+reapply para delta (`deltaMiles = newMiles - oldMiles`)
3. **Dashboard usava `accounts.balance` denormalizado** — `computeDashboardMetrics` calcula de entradas - vendas

### Bug Prevenido (Contas)

4. **Contas exibia `account.balance` denormalizado** — mesma correção do dashboard: saldo agora é calculado de `entries - sales` com warning de divergência

### Regras Criadas / Reforçadas

- **Rule 19.3b**: mutation-by-mutation check — toda `useXMutation` deve conter `calcAccountUpdate(`
- **Rule 19**: `invalidateQueries` deve usar `refetchType: 'all'`

### Dados Existentes

- Service key coletada ✅
- `--fix` rodado — contas individuais OK
- App com correção via UI: botão "Recalcular" + "Recalcular tudo" em Contas
- Saldo exibido sempre calculado de entradas-vendas

### 🔜 Próxima Sessão

Nova feature ou melhoria. Sugestões: continuar com vendas, melhorar relatórios, novas origens.
