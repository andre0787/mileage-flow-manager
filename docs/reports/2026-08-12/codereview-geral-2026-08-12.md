# Code Review Geral — MilesControl

**Data:** 2026-08-12
**Escopo:** Revisão completa do código (libs de negócio, features RTK Query, páginas, componentes, hooks)
**Resultado:** 10 bugs encontrados e corrigidos — 3 críticos (corrompiam saldos), 4 altos, 3 médios.
**Validação:** ✅ 695 testes passando (80 arquivos) · typecheck OK · lint 0 erros · format OK · build OK

---

## 🔴 Críticos (corrompem saldos)

### 1. `src/features/entradas/updateEntry.ts` — Troca de conta destino aplica delta na conta errada

- **Sintoma:** Ao editar uma entrada confirmada trocando a conta de destino, o saldo da conta **antiga** era ajustado pelo delta (novo − antigo) em vez de reverter tudo, e a conta **nova** nunca recebia o crédito. Resultado: saldo errado nas duas contas.
- **Causa raiz:** O bloco de delta só considerava `newIsAguardando`, sem detectar mudança de destino. Com destino alterado, "reverter delta" não faz sentido — precisa ser reversão total + crédito completo na nova conta.
- **Solução:** Adicionado `destChanged = oldEntry.accountId !== merged.accountId`. Quando `destChanged`, o delta vira reversão completa da conta antiga (`-oldMilesAdded`) e o bloco "New dest" credita o valor **completo** na conta nova (antes só era executado quando a entrada antiga era `aguardando`).
- **Script de validação:** teste de regressão `troca de conta destino` em `tests/unit/features-entradas-api.test.ts`.

### 2. `src/features/contas/recalcAccount.ts` + `src/pages/Contas.tsx` + `src/pages/Entradas.tsx` — Saldos ignoram transferências de saída

- **Sintoma:** O recalcular conta (e o `computedBalances` da página Contas e o banner de reconciliação) não debitava as transferências em que a conta era a **origem**. Transferências debitam via `source_account_id` sem criar entrada com `account_id` próprio — o saldo da conta origem inflava em todo recalc.
- **Causa raiz:** As três fontes de verdade usavam apenas `entries(account_id) − sales`. O débito da conta origem (`source_account_id`) nunca era contabilizado.
- **Solução:** Nova query `source_account_id = accountId` (filtrando `aguardando`) somando `amount`, subtraída do saldo: `balance = entries − transfersOut − sales`. Aplicado em `recalcAccount.ts`, `computedBalances` (Contas.tsx) e no banner de reconciliação de Entradas.tsx.
- **Script de validação:** teste atualizado em `tests/unit/features-contas-api.test.ts` (as duas queries de entries agora são diferenciadas pelo argumento do `.eq`).

### 3. `src/features/entradas/confirmEntry.ts` — Confirmar transferência pendente nunca debitava a conta origem

- **Sintoma:** Ao confirmar uma transferência `aguardando`, só o destino era creditado — a origem nunca era debitada (o `addEntry` pula contas para `aguardando`).
- **Causa raiz:** O `confirmEntry` creditava o destino mas não tratava `sourceAccountId`.
- **Solução:** Se `entry.sourceAccountId` existir, debita a origem com `calcProportionalCost` (mesma lógica do `addEntry`/`updateEntry`).
- **Script de validação:** teste de regressão em `tests/unit/features-entradas-hooks.test.ts` / `features-entradas-api.test.ts`.

---

## 🟠 Altos

### 4. `src/pages/Entradas.tsx` — Split de recorrência não dividia `milesGenerated`

- **Sintoma:** Com recorrência em modo "split" (N×), `amount` e `amountPaid` eram divididos por N, mas `milesGenerated` não — o saldo da conta inflava N vezes.
- **Causa raiz:** `milesGenerated: c.milesGenerated` sem o divisor.
- **Solução:** `milesGenerated: c.milesGenerated / divisor` (mesmo divisor de amount/amountPaid). Teste de regressão adicionado.

### 5. `src/pages/Vendas.tsx` — CSV exportava margem ×100

- **Sintoma:** O export CSV multiplicava a margem por 100, mas `profitMargin` **já é percentual** (0–100). Valores ficavam 100× maiores (ex: 50% virava 5000).
- **Causa raiz:** Dupla conversão — o campo já sai em percentual dos cálculos de `metrics.ts`.
- **Solução:** Removida a multiplicação no CSV. Além disso, `Vendas.tsx` agora passa `editingSaleId` ao `SaleForm`.

### 6. `src/lib/metrics.ts` — `computeMetricHistory` incluía transferências em `milesIn`

- **Sintoma:** O sparkline de "milhas entradas" contava transferências como milhas novas, inconsistente com `monthlyMilesIn` do dashboard (que já exclui transferências via `!e.sourceAccountId`).
- **Causa raiz:** Filtro mensal não excluía `sourceAccountId`.
- **Solução:** Excluir `e.sourceAccountId` no filtro de `monthEntries`. Teste de regressão adicionado em `tests/unit/metrics.test.ts`.

### 7. `src/components/SaleForm.tsx` — Limite de passageiros contava a própria venda em edição (dupla contagem)

- **Sintoma:** Na edição de uma venda, os passageiros dela contavam 2× no ciclo (uma vez em `sales`, outra em `form.passengers`) — o limite de CPFs por ciclo podia bloquear salvar sem alteração.
- **Causa raiz:** `sales.filter()` não excluía a venda em edição.
- **Solução:** Nova prop `editingSaleId`; o filtro usa `s.id !== editingSaleId`. `Vendas.tsx` passa o id da venda em edição.

---

## 🟡 Médios

### 8. `src/hooks/useClientCycleAvailability.ts` — Bug de fuso horário (família #308)

- **Sintoma:** `new Date("YYYY-MM-DD")` em America/Sao_Paulo cai às 21h do dia **anterior** — vendas de 01/01 eram contadas no ano errado do ciclo anual e o diff de dias do ciclo "dias" saía errado.
- **Causa raiz:** Mesma família do bug #308 (já corrigido em outras libs via `parseDateOnly`), faltava neste hook.
- **Solução:** `parseDateOnly(saleDate)` (mesma função usada em `metrics.ts`, `SaleForm`, etc.).

### 9. `src/contexts/DataContext.tsx` — `Promise.finally` inexistente no retorno do supabase

- **Sintoma:** `supabase.from(...)` retorna `PromiseLike` sem `.finally` — em runtime o callback de "saving" nunca resetava (e podia lançar TypeError em builds estritos).
- **Causa raiz:** Assumir API completa de `Promise` para retorno do supabase.
- **Solução:** `then(onOk, onErr)` no lugar de `finally(...)`.

### 10. `src/components/EntryForm.tsx` — Preview exibia `Infinity` em divisão por zero

- **Sintoma:** Com `milesGenerated` zerado, o preview de custo exibia `Infinity` na UI.
- **Causa raiz:** Divisão sem guarda de zero.
- **Solução:** Guarda `|| 1` na divisão do preview.

---

## 🧪 Scripts de validação

```bash
# 1) Validação estática completa
npm run typecheck && npm run lint && npm run format:check && npm run build

# 2) Testes unitários de regressão (bugs 1, 2, 4, 6)
npx vitest run tests/unit/features-entradas-api.test.ts \
  tests/unit/features-contas-api.test.ts \
  tests/unit/metrics.test.ts

# 3) Suíte completa (695 testes, 80 arquivos)
npm test
```

Para o pre-PR (convenção do projeto): `npm run pre-pr` antes do merge.

---

## 📋 Arquivos alterados

| Arquivo | Bugs |
|---|---|
| `src/features/entradas/updateEntry.ts` | 1 |
| `src/features/entradas/confirmEntry.ts` | 3 |
| `src/features/contas/recalcAccount.ts` | 2 |
| `src/pages/Contas.tsx` | 2 |
| `src/pages/Entradas.tsx` | 2, 4 |
| `src/pages/Vendas.tsx` | 5, 7 |
| `src/lib/metrics.ts` | 6 |
| `src/components/SaleForm.tsx` | 7 |
| `src/hooks/useClientCycleAvailability.ts` | 8 |
| `src/contexts/DataContext.tsx` | 9 |
| `src/components/EntryForm.tsx` | 10 |
| `tests/unit/features-entradas-api.test.ts` | regressões 1, 3, 4 |
| `tests/unit/features-contas-api.test.ts` | regressão 2 |
| `tests/unit/metrics.test.ts` | regressão 6 |

**Nota TWINS:** padrões de transferência (debitar origem) e de fuso (`parseDateOnly`) foram varridos no projeto todo e unificados nas 3+ ocorrências de cada família.
