# Spec: Extração de Entradas.tsx

> Refatoração: extrair 3 componentes de `src/pages/Entradas.tsx` (1276 linhas).
> Branch: `refactor/entradas-extract-components`

---

## Objetivo

Reduzir `Entradas.tsx` de ~1276 → ~400 linhas extraindo EntryForm, EntryTable e
EntrySummary para componentes reutilizáveis. Eliminar duplicação de código entre
formulários criar/editar (~90% idênticos) e entre as visualizações Pontos/Milhas.

## Componentes

### 1. EntryForm (`src/components/EntryForm.tsx`)

Formulário único usado tanto para criar quanto editar entradas.

```tsx
interface EntryFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<{
    accountId: string
    origemTypeId: string
    amount: string
    amountPaid: string
    conversionRate: string
    sourceAccountId: string
    bonusPercent: string
    cartAmount: string
    cartCost: string
    isClube: boolean
    clubeMeses: string
  }>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  // Dados de contexto (read-only)
  accounts: Account[]
  origemTypes: OrigemType[]
  programs: Program[]
  owners: Owner[]
  activeTab: 'pontos' | 'milhas'
  // Callbacks opcionais (só no mode=create)
  onAddOrigemType?: () => void
}
```

**Estado interno:** `formData` + `errors` (useState). Componente controlado
internamente — recebe `initialData` para edição, gerencia mudanças sozinho.

**Seções:**
- Select Conta + badge do programa
- Select Tipo de Origem (+ botão "+" se mode=create)
- Campos Quantidade + Valor Pago (grid 2 colunas)
- Seção Transferência (condicional: `isTransfer`) — conta origem, bônus, carrinho
- Seção Clube (condicional: `isClube`) — meses de recorrência
- Campo Taxa de Conversão (só se `activeTab === 'pontos'`)
- Bloco Cálculos Automáticos (condicional: amount + amountPaid preenchidos)

### 2. EntrySummary (`src/components/EntrySummary.tsx`)

Cards de resumo no topo de cada tab.

```tsx
interface EntrySummaryProps {
  type: 'pontos' | 'milhas'
  totalAmount: number
  totalAmountPaid: number
  totalMilesGenerated: number
  averageCostPerMile: number
}
```

Renderiza:
- Pontos (4 cards): Total, Valor Investido, Milhas Geradas, Custo Médio/Milha
- Milhas (3 cards): Total, Valor Investido, Custo Médio/Milha

Usa `MetricCard` existente em `src/components/MetricCard.tsx`.

### 3. EntryTable (`src/components/EntryTable.tsx`)

Tabela desktop + lista mobile, compartilhada entre Pontos e Milhas.

```tsx
interface EntryTableProps {
  type: 'pontos' | 'milhas'
  entries: PointEntry[]
  accounts: Account[]
  origemTypes: OrigemType[]
  programs: Program[]
  owners: Owner[]
  onEdit: (entry: PointEntry) => void
  onConfirm: (entry: PointEntry) => void
}
```

**Colunas desktop:**
- Pontos: Data, Conta, Origem, Pontos, Valor Pago, Taxa Conv., Milhas, Custo/Milha, Ações
- Milhas: Data, Conta, Origem, Milhas Geradas, Valor Pago, Custo/Milha, Ações

**Mobile:** cards 2-col com mesmos dados + badges de status.

## Entradas.tsx (refatorado)

Após extração, o arquivo mantém apenas:

```tsx
export default function Entradas() {
  // Data context
  // State: dialogs (isCreateDialogOpen, isEditDialogOpen, editingEntry)
  // Handler: handleCreateEntry → validate → addEntryM.mutate
  // Handler: handleUpdateEntry → validate → updateEntryM.mutate
  // Handler: handleOpenTransfer → preenche form + abre dialog
  // Derived: entriesByTab, entriesFiltered, totals
  // Render: header + EntrySummary + EntryTable + FormDrawer(EntryForm)
}
```

## Antes/Depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| Entradas.tsx | 1276 linhas | ~400 linhas |
| EntryForm.tsx | — | ~300 linhas |
| EntryTable.tsx | — | ~200 linhas |
| EntrySummary.tsx | — | ~60 linhas |
| Código duplicado (criar/editar) | ~300 linhas duplicadas | 0 |
| Código duplicado (tabs) | ~400 linhas duplicadas | 0 |

## Fora de escopo

- Não alterar lógica de negócio
- Não extrair `DeleteEntryDialog` (já existe)
- Não adicionar testes (tarefa #10 separada)
- Não mudar estilos ou layout
- Não tocar em `calcCostPerThousand`/`calcCostPerMile` (já vêm de metrics.ts)

## Checklist de implementação

1. [ ] Criar `EntrySummary.tsx` (mais simples, sem dependências cíclicas)
2. [ ] Criar `EntryTable.tsx` (segundo mais simples, imports claros)
3. [ ] Criar `EntryForm.tsx` (mais complexo, estado interno + condicionais)
4. [ ] Refatorar `Entradas.tsx` (importar componentes, remover código extraído)
5. [ ] Build + verificar funcionamento
6. [ ] Relatório HTML
7. [ ] PR para develop
