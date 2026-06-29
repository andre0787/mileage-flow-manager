# Exclusão com Confirmação e Cascata — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar confirmação AlertDialog para exclusão de entradas e vendas, com cascata: ao excluir entrada que tem vendas na mesma conta, remover a entrada + todas as vendas da conta + restaurar saldos.

**Architecture:** Estender mutations existentes (`useDeleteEntryMutation`, `useDeleteSaleMutation`) para lidar com restauração de contas e deleção em batch de vendas relacionadas. Adicionar funções `deleteEntryWithSales` e `deleteSaleWithRestore` no DataContext. UI reutiliza `AlertDialog` (shadcn/ui) já presente no projeto.

**Tech Stack:** React 18, TypeScript, TanStack React Query, Supabase, shadcn/ui (AlertDialog, Button)

---

### Task 1: Estender useDeleteSaleMutation para restaurar conta

**Files:**
- Modify: `src/hooks/useDatabase.ts` (linhas ~470-495)

- [ ] **Step 1: Atualizar mutation para restaurar balance + totalInvested**

```typescript
export function useDeleteSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar sale antes de deletar para restaurar conta
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;

      // Restaurar conta se tiver accountId
      if (sale.account_id) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", sale.account_id)
          .single();
        if (acc) {
          const milesToRestore = Number(sale.miles_used);
          const proportionalInvested = Number(acc.total_invested ?? 0) > 0 && Number(acc.balance) > 0
            ? (Number(acc.total_invested) / Number(acc.balance)) * milesToRestore
            : 0;
          await supabase.from("accounts").update({
            balance: Number(acc.balance) + milesToRestore,
            total_invested: Math.max(0, Number(acc.total_invested ?? 0) + proportionalInvested),
          }).eq("id", sale.account_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
```

- [ ] **Step 2: Verificar lint**

Run: `npm run lint`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDatabase.ts
git commit -m "feat: restore account balance on sale deletion"
```

---

### Task 2: Adicionar deleteEntryWithSales no DataContext

**Files:**
- Modify: `src/contexts/DataContext.tsx` (linhas ~320-340, ~356)

- [ ] **Step 1: Adicionar função deleteEntryWithSales**

```typescript
const deleteEntryWithSales = (entryId: string) => {
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return;

  const relatedSales = sales.filter((s) => s.accountId === entry.accountId);

  if (relatedSales.length > 0) {
    // Será chamado pelo componente com confirmação prévia
    // Deletar vendas primeiro
    relatedSales.forEach((sale) => deleteSaleM.mutate(sale.id));
    // Depois deletar entry (já reverte conta destino/fonte)
    deleteEntryM.mutate(entry);
  } else {
    deleteEntryM.mutate(entry);
  }
};
```

- [ ] **Step 2: Adicionar no Provider value**

```typescript
addEntry, deleteEntry, deleteEntryWithSales,
```

- [ ] **Step 3: Atualizar type DataContextType**

```typescript
deleteEntryWithSales: (id: string) => void
```

- [ ] **Step 4: Commit**

```bash
git add src/contexts/DataContext.tsx
git commit -m "feat: add deleteEntryWithSales to DataContext"
```

---

### Task 3: Atualizar Entradas.tsx — verificação de vendas + AlertDialog cascata

**Files:**
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Adicionar import sales e useData destructuring**

```typescript
const { entries, accounts, owners, programs, origemTypes, sales, addEntry, deleteEntry, deleteEntryWithSales, addOrigemType } = useData();
```

- [ ] **Step 2: Substituir lógica de exclusão (4 locais: desktop pontos, mobile pontos, desktop milhas, mobile milhas)**

Para cada local, substituir o `onClick={() => setEntryToDelete(entry.id)}` por:

```typescript
onClick={() => {
  const relatedSales = sales.filter((s) => s.accountId === entry.accountId);
  if (relatedSales.length > 0) {
    const account = accounts.find((a) => a.id === entry.accountId);
    setEntryToDelete({ entry, relatedSales, accountName: account?.name ?? "desconhecida" });
  } else {
    setEntryToDelete({ entry, relatedSales: [], accountName: "" });
  }
}}
```

- [ ] **Step 3: Atualizar estado entryToDelete**

```typescript
const [entryToDelete, setEntryToDelete] = useState<{ entry: PointEntry; relatedSales: Sale[]; accountName: string } | null>(null);
```

- [ ] **Step 4: Atualizar AlertDialogs (4 locais) para mostrar mensagem condicional**

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button size="sm" variant="outline" className="px-2 text-destructive min-w-[44px] min-h-[44px]">
      Excluir
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        {entryToDelete?.relatedSales.length > 0 ? "Excluir entrada e vendas relacionadas?" : "Excluir entrada?"}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {entryToDelete?.relatedSales.length > 0
          ? `Esta entrada gerou milhas na conta "${entryToDelete.accountName}" que já foram vendidas (${entryToDelete.relatedSales.length} venda${entryToDelete.relatedSales.length > 1 ? "s" : ""}). Excluir vai remover a entrada E as ${entryToDelete.relatedSales.length} venda${entryToDelete.relatedSales.length > 1 ? "s" : ""} vinculadas a esta conta, restaurando os saldos.`
          : "Esta ação não pode ser desfeita. A entrada será removida permanentemente e o saldo da conta será ajustado."
        }
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => {
        if (entryToDelete) {
          if (entryToDelete.relatedSales.length > 0) {
            deleteEntryWithSales(entryToDelete.entry.id);
          } else {
            deleteEntry(entryToDelete.entry.id);
          }
          setEntryToDelete(null);
        }
      }}>
        {entryToDelete?.relatedSales.length > 0 ? "Excluir tudo" : "Excluir"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 5: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/pages/Entradas.tsx
git commit -m "feat: add cascade deletion confirmation for entries with sales"
```

---

### Task 4: Adicionar botão Excluir em Vendas.tsx

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Adicionar Trash2 import e deleteSale destructuring**

```typescript
import { Plus, TrendingDown, Users, Trash2 } from "lucide-react";
const { clients, accounts, owners, programs, sales, addSale, updateSale, addClient, updateAccount, deleteSale } = useData();
```

- [ ] **Step 2: Adicionar estado saleToDelete**

```typescript
const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
```

- [ ] **Step 3: Adicionar coluna "Ações" na tabela desktop (após Status)**

No `TableHeader`, adicionar:
```tsx
<TableHead className="hidden md:table-cell">Ações</TableHead>
```

No `TableBody`, adicionar célula:
```tsx
<TableCell className="hidden md:table-cell text-right">
  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 min-w-[44px] min-h-[44px]" onClick={() => setSaleToDelete(sale)}>
    <Trash2 className="h-4 w-4" />
  </Button>
</TableCell>
```

- [ ] **Step 4: Adicionar botão Excluir no card mobile (após status select)**

No card mobile (`md:hidden`), após o Select de status:
```tsx
<Button size="sm" variant="ghost" className="text-destructive min-h-[44px] min-w-[44px]" onClick={() => setSaleToDelete(sale)}>
  <Trash2 className="h-4 w-4" />
</Button>
```

- [ ] **Step 5: Adicionar AlertDialog de confirmação para venda**

```tsx
{saleToDelete && (
  <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
    <AlertDialogTrigger asChild>
      <span /> {/* hidden trigger */}
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
        <AlertDialogDescription>
          Excluir venda de <strong>{saleToDelete.milesUsed.toLocaleString("pt-BR")} milhas</strong> para <strong>{saleToDelete.clientName}</strong>?
          O estoque da conta será restaurado (+{saleToDelete.milesUsed.toLocaleString("pt-BR")} milhas).
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Cancelar</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => {
          if (saleToDelete) {
            deleteSale(saleToDelete.id);
            setSaleToDelete(null);
          }
        }}>
          Excluir venda
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

- [ ] **Step 6: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/pages/Vendas.tsx
git commit -m "feat: add delete button with confirmation for sales"
```

---

### Task 5: Testes manuais + verificação final

**Files:** N/A

- [ ] **Step 1: Testar exclusão entrada sem vendas**
  - Abrir /entradas
  - Criar entrada teste
  - Clicar Excluir → AlertDialog padrão → Confirmar → Entrada removida, saldo conta revertido

- [ ] **Step 2: Testar exclusão entrada com vendas**
  - Criar entrada → criar venda usando mesma conta
  - Clicar Excluir na entrada → AlertDialog mostra "1 venda relacionada"
  - Confirmar "Excluir tudo" → Entrada + venda removidas, saldos restaurados

- [ ] **Step 3: Testar exclusão venda (desktop + mobile)**
  - Abrir /vendas
  - Desktop: clicar ícone lixeira na tabela → AlertDialog → Confirmar
  - Mobile: clicar ícone lixeira no card → AlertDialog → Confirmar
  - Verificar: venda removida, saldo conta restaurado

- [ ] **Step 4: Testar cancelamento**
  - Em todos AlertDialogs, clicar Cancelar → nada alterado

- [ ] **Step 5: Build final**

Run: `npm run lint && npm run build`
Expected: All pass

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "test: manual verification of deletion confirmation and cascade"
```

---

### Task 6: Push branch + criar PR

**Files:** N/A

- [ ] **Step 1: Push**

Run: `git push origin feature/deletion-confirmation-cascade`

- [ ] **Step 2: Criar PR para develop**

```bash
gh pr create --base develop --head feature/deletion-confirmation-cascade --title "feat: exclusão com confirmação e cascata (entradas+vendas)" --body "Ver spec em docs/superpowers/specs/2026-06-28-deletion-with-confirmation-design.md"
```

- [ ] **Step 3: Merge após review**