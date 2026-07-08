# Spec: Extração de Vendas.tsx

> Refatoração: extrair 4 componentes de `src/pages/Vendas.tsx` (1117 linhas).
> Branch: `refactor/vendas-extract-components`

---

## Objetivo

Reduzir `Vendas.tsx` de ~1117 → ~300 linhas extraindo SaleMetrics, SaleForm,
SaleTable e SaleSimulator para componentes reutilizáveis. Eliminar duplicação
de cálculos financeiros inline usando `calcProfit`, `calcProfitMargin`, `calcROI`
de `src/lib/metrics.ts`.

## Componentes

### 1. SaleMetrics (`src/components/SaleMetrics.tsx`)

Cards de métricas no topo da página.

```tsx
interface SaleMetricsProps {
  sales: Sale[]
  className?: string
}
```

**Cards:** Faturamento Total, Lucro Total, Milhas Vendidas, Margem Média.

Usa `calcProfitMargin(profit, saleValue)` para margem média (itera vendas,
soma profit e saleValue, calcula margem global).

### 2. SaleForm (`src/components/SaleForm.tsx`)

FormDrawer de criação de venda.

```tsx
interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  onSubmit: (data: SaleFormData) => void
  onCreateClient: (data: { name: string; document?: string; phone?: string; email?: string }) => void
}
```

**Estado interno:** `useState` com formData completo (ownerId, accountId,
clientId, milesQuantity, saleValue, costPerMile, additionalCost,
passengers...).

**Seções:**
- Select Owner → Account (filtradas por owner)
- Select Cliente (+ dialog criação)
- Input Milhas + Preço Venda (grid 2 colunas)
- Input Custo/Milha + Custo Adicional (grid 2 colunas)
- Passageiros (se houver no form original)
- **Preview de Lucro:** usa `calcProfit(saleValue, milesQuantity, costPerMile, additionalCost)` e `calcProfitMargin(profit, saleValue)` — substitui cálculos inline

### 3. SaleTable (`src/components/SaleTable.tsx`)

Tabela desktop + lista mobile de vendas.

```tsx
interface SaleTableProps {
  sales: Sale[]
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  onCancel?: (sale: Sale) => void
  onStatusChange?: (sale: Sale, status: string) => void
}
```

**Colunas desktop:**
Data, Cliente, Conta, Milhas, Valor, Lucro, Status, Ações

**Mobile:** cards 2-col.

**Status:** venda pode ter status como "confirmada", "cancelada", "pendente".
Botão de cancelar para vendas não-canceladas.

### 4. SaleSimulator (`src/components/SaleSimulator.tsx`)

FormDrawer de simulação de venda (lucro potencial).

```tsx
interface SaleSimulatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Estado interno:** `useState` com inputs (milhas, preço venda, custo/milha,
custo adicional).

**Inputs:** grid 2 colunas com inputs numéricos.

**Resultados (só aparece se todos preenchidos):**
- Lucro Estimado: `calcProfit(milhas, precoVenda, custoMilha, custoAdicional)`
- Margem: `calcProfitMargin(lucro, precoVenda)`
- ROI: `calcROI(lucro, custoTotal)`

### Vendas.tsx (refatorado)

Após extração, ~300 linhas:

```tsx
export default function Vendas() {
  // Hooks de dados (useAccounts, useOwners, useSales, usePrograms, useClients)
  // State: filtros, dialogs
  // Mutations: createSale, cancelSale
  // Derived: filteredSales, metrics
  // Render: header + SaleMetrics + filtros + SaleTable + SaleForm + SaleSimulator
}
```

## DRY — metrics.ts

Cálculos inline atuais no Vendas.tsx que viram chamadas a metrics.ts:

| Local | Código inline | Substituir por |
|-------|---------------|----------------|
| Preview SaleForm | `saleValue - (milesUsed * costPerMile) - additionalCost` | `calcProfit()` |
| Preview SaleForm | `(profit / saleValue) * 100` | `calcProfitMargin()` |
| Simulador | `saleValue - (milesQuantity * costPerMile) - additionalCost` | `calcProfit()` |
| Simulador | `(profit / saleValue) * 100` | `calcProfitMargin()` |
| Simulador | `profit / (milesQuantity * costPerMile + additionalCost) * 100` | `calcROI()` |

## Antes/Depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| Vendas.tsx | 1117 linhas | ~300 linhas |
| SaleMetrics.tsx | — | ~40 linhas |
| SaleForm.tsx | — | ~250 linhas |
| SaleTable.tsx | — | ~180 linhas |
| SaleSimulator.tsx | — | ~80 linhas |
| Cálculos inline duplicados | ~5 ocorrências | 0 (metrics.ts) |

## Fora de escopo

- Não alterar lógica de negócio ou comportamento
- Não adicionar testes (tarefa #10 separada)
- Não mudar estilos ou layout visível
- Não extrair `StockInfo` ou tipos locais sem necessidade
- Não refatorar `useDatabase.ts` (tarefa #8 separada)

## Checklist de implementação

1. [ ] Criar `SaleMetrics.tsx` (mais simples, sem estado)
2. [ ] Criar `SaleSimulator.tsx` (segundo mais simples, estado interno)
3. [ ] Criar `SaleTable.tsx` (renderização condicional desktop/mobile)
4. [ ] Criar `SaleForm.tsx` (mais complexo, client dialog + preview)
5. [ ] Refatorar `Vendas.tsx` (importar componentes, remover código extraído)
6. [ ] Build + type-check
7. [ ] Relatório HTML (`docs/reports/2026-07-08-vendas-extract-components.html`)
8. [ ] PR para develop

## Referências

- Spec #6: `docs/superpowers/specs/2026-07-08-entradas-refactor-design.md`
- Componentes extraídos #6: `EntryForm.tsx`, `EntryTable.tsx`, `EntrySummary.tsx`
- `src/lib/metrics.ts`: `calcProfit`, `calcProfitMargin`, `calcROI`
- `src/components/MetricCard.tsx`: componente de card reutilizável
