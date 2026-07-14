# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-14
> Anterior: 2026-07-13
---
## 🧭 Estado Atual
- **Branch:** `fix/sale-update-stock-discrepancy`
- **Último commit:** `35483b1` — fix: corrige discrepância de saldo ao editar vendas e entradas (PR #132)
- **Remote:** origin/fix/sale-update-stock-discrepancy
### 📋 PRs Abertos
| PR | Branch | Status |
|----|--------|--------|
| #132 | `fix/sale-update-stock-discrepancy` | 📋 Aberto |
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 108 |
| Docs issues | 0 |
| Branch | fix/sale-update-stock-discrepancy |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🧠 Notas da Sessão Atual
(Adicione notas manuais abaixo desta linha)
### 🎯 Sessão Concluída — 2026-07-14 (Parte 2)

**Missão:** Corrigir dashboard não refletir saldo real do estoque.

### ✅ Resultado

Branch: `fix/sale-update-stock-discrepancy` (ainda sem PR)

### Bugs Corrigidos (2)

| Bug | Severidade | Fix |
|-----|-----------|-----|
| Editar venda não ajusta saldo da conta | **alta** | `useUpdateSaleMutation` reescrita: busca venda antiga, reverte impacto, atualiza, reaplica. Invalida `accounts` no onSuccess. |
| Editar entrada com outras ops entre uso perde saldo | **alta** | `useUpdateEntryMutation` migrada de reverse+reapply para delta approach (evita clamping a 0). |

### Regra de Validação Reforçada
- `rule-19-stock-validation.mjs` agora verifica que **toda mutation exportada** (useAddSale, useUpdateSale, etc.) chama `calcAccountUpdate` se atualizar accounts.
- Inclui check 3b: split por bloco `export function` + verificação individual.

### Pendente
- Fazer PR da branch `fix/sale-update-stock-discrepancy` → main.
- Dados existentes do `andreluiz0787@gmail.com` podem estar corrompidos — rodar `validate-stock.mjs --fix` com service key ou recálculo manual via UI.

### 🔜 Próxima Sessão
Criar PR com as correções, mergear e acompanhar deploy.






