# Exclusão com Confirmação e Cascata — Design Spec

**Data:** 2026-06-28
**Branch:** feature/deletion-confirmation-cascade

---

## Objetivo

Garantir que exclusões de entradas e vendas tenham confirmação explícita (AlertDialog) e amarração de dados: ao excluir entrada que gerou milhas já vendidas, reverter as vendas relacionadas e restaurar saldos das contas.

---

## Regras de Negócio

### Entrada (PointEntry)
- Uma entrada cria/atualiza saldo em uma conta (`accountId`)
- Vendas consomem saldo da conta (`sale.accountId`)
- **Verificação**: `sales.some(s => s.accountId === entry.accountId)`
- **Se houver vendas na conta**: Excluir entrada + TODAS as vendas da conta + restaurar saldos
- **Se não houver vendas**: Excluir apenas a entrada (reverter conta destino/fonte)

### Venda (Sale)
- Consome milhas da conta (`accountId`)
- **Exclusão**: Restaurar `account.balance` + `totalInvested` proporcional
- **Confirmação**: Sempre AlertDialog antes

---

## UI/UX

### Entradas (Entradas.tsx)
| Cenário | Ação |
|---------|------|
| Sem vendas na conta | AlertDialog padrão: "Excluir entrada? Não pode ser desfeita." |
| Com vendas na conta | AlertDialog detalhado: "Esta entrada gerou milhas na conta **{accountName}** que já foram vendidas ({X} venda(s)). Excluir vai remover a entrada **E** as {X} venda(s) vinculadas a esta conta, restaurando os saldos." |

### Vendas (Vendas.tsx)
| Cenário | Ação |
|---------|------|
| Desktop | Nova coluna "Ações" com botão Excluir (ícone Trash2) |
| Mobile | Botão Excluir no card (ao lado do status select) |
| Ambos | AlertDialog: "Excluir venda de **{milesUsed} milhas** para **{clientName}**? O estoque da conta será restaurado (+{milesUsed} milhas)." |

---

## Arquitetura

### DataContext (novas funções)
```typescript
// Exclui entrada + vendas da conta se houver
deleteEntryWithSales: (entryId: string) => void

// Exclui venda + restaura conta
deleteSaleWithRestore: (saleId: string) => void
```

### Mutations (useDatabase.ts)
- `useDeleteEntryMutation`: Estender para aceitar `salesToDelete?: Sale[]` e deletar em batch
- `useDeleteSaleMutation`: Adicionar lógica de restauração de `balance` + `totalInvested`

---

## Fluxo de Dados

```
deleteEntryWithSales(entryId)
  → busca entry
  → busca sales com accountId === entry.accountId
  → se sales.length > 0:
      → AlertDialog "Excluir entrada + {sales.length} vendas?"
      → se confirmar:
          → deleteEntryM.mutate(entry)  // já reverte conta destino/fonte
          → deleteSalesM.mutate(sales.map(s => s.id))  // batch delete
          → para cada sale: restoreAccount(sale)
  → se sales.length === 0:
      → AlertDialog padrão
      → deleteEntryM.mutate(entry)

deleteSaleWithRestore(saleId)
  → busca sale
  → AlertDialog confirmação
  → deleteSaleM.mutate(saleId)
  → restoreAccount(sale)  // balance + totalInvested
```

---

## Tratamento de Erros
- Se falhar ao deletar vendas: rollback não automático (Supabase não tem transação multi-tabela no client)
- Mostrar toast de erro e manter UI consistente (invalidar queries)
- Log no console para debug

---

## Testes Manuais (Checklist)

### Entradas
- [ ] Excluir entrada sem vendas → sucesso, saldo conta revertido
- [ ] Excluir entrada com vendas → confirmação detalhada, exclui tudo, saldos restaurados
- [ ] Cancelar exclusão → nada alterado
- [ ] Mobile card + Desktop table → mesmo comportamento

### Vendas
- [ ] Botão Excluir aparece na tabela (desktop)
- [ ] Botão Excluir aparece no card (mobile)
- [ ] AlertDialog mostra milesUsed + clientName
- [ ] Confirmar → venda removida, saldo conta restaurado
- [ ] Cancelar → nada alterado

---

## Fora de Escopo
- Rastreamento FIFO/LIFO entrada→venda (requer coluna `entry_id` em sales + migração)
- Transações atômicas multi-tabela (limitação Supabase client)
- Soft delete / lixeira