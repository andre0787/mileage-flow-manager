# Transferências, Estoque e Ciclo de Passageiros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reforçar regras de transferência pontos→milhas, debitar milhas do estoque ao vender, remover cards de Entradas, e adicionar controle de ciclo de passageiros por programa.

**Architecture:** Mudanças em types, DataContext, Configuracoes, Entradas e Vendas. Novos campos opcionais em Program. Sem novas dependências.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS + shadcn/ui

---

### Task 1: Adicionar campos de ciclo de passageiros em Program

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Atualizar interface Program**

```typescript
export interface Program {
  id: string
  name: string
  type: 'pontos' | 'milhas'
  maxPassengers?: number
  passengerCycleType?: 'anual' | 'dias'
  passengerCycleDays?: number
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add passenger cycle fields to Program interface"
```

---

### Task 2: Remover cards de saldo por dono de Entradas

**Files:**
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Remover seção de cards por dono**

Remover o bloco entre a div `flex items-center justify-between` (linha ~135) e o Dialog de Nova Entrada (linha ~177). O bloco a remover é:

```tsx
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {owners.map(owner => {
            const ownerPoints = accounts
              .filter(a => a.ownerId === owner.id && a.type === "pontos")
              .reduce((sum, acc) => sum + acc.balance, 0);
            const ownerMiles = accounts
              .filter(a => a.ownerId === owner.id && a.type === "milhas")
              .reduce((sum, acc) => sum + acc.balance, 0);
            
            if (ownerPoints === 0 && ownerMiles === 0) return null;

            return (
              <Card key={owner.id} className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="p-3 bg-muted/30">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {owner.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pontos</span>
                    <span className="text-sm font-bold">{ownerPoints.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Milhas</span>
                    <span className="text-sm font-bold text-success">{ownerMiles.toLocaleString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
```

Após remover, ajustar a estrutura para manter o header e o Dialog de Nova Entrada lado a lado.

- [ ] **Step 2: Remover `Users` do import do lucide-react** (se não for usado em outro lugar)

- [ ] **Step 3: Commit**

```bash
git add src/pages/Entradas.tsx
git commit -m "refactor: remove owner balance cards from Entradas page"
```

---

### Task 3: Reforçar regras de transferência pontos → milhas

**Files:**
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Tornar `amountPaid` readOnly durante transferência**

No JSX, quando `isTransfer` for true, o campo `amountPaid` deve ser `disabled` e seu valor preenchido automaticamente:

```tsx
<div className="space-y-2">
  <Label htmlFor="amountPaid">
    {isTransfer ? "Custo (calculado)" : "Valor Pago (R$)"}
  </Label>
  <Input
    id="amountPaid"
    type="number"
    step="0.01"
    value={newEntry.amountPaid}
    disabled={isTransfer}
    onChange={(e) => {
      setNewEntry({...newEntry, amountPaid: e.target.value});
      setEntryErrors(prev => ({...prev, amountPaid: ""}));
    }}
    placeholder="Ex: 450.00"
  />
  {entryErrors.amountPaid && <p className="text-xs text-destructive">{entryErrors.amountPaid}</p>}
  {isTransfer && selectedSourceAccount && newEntry.amount && sourceAvgCostPerPoint > 0 && (
    <p className="text-xs text-muted-foreground">
      Custo de aquisição: {parseFloat(newEntry.amount).toLocaleString('pt-BR')} pts × R$ {sourceAvgCostPerPoint.toFixed(4)} = R$ {(parseFloat(newEntry.amount) * sourceAvgCostPerPoint).toFixed(2)}
    </p>
  )}
</div>
```

- [ ] **Step 2: Adicionar validação explícita de mesmo dono**

No `validateEntry()`, adicionar após a validação de `sourceAccountId`:

```typescript
if (isTransfer && newEntry.sourceAccountId) {
  const srcAccount = accounts.find(a => a.id === newEntry.sourceAccountId);
  const dstAccount = accounts.find(a => a.id === newEntry.accountId);
  if (srcAccount && dstAccount && srcAccount.ownerId !== dstAccount.ownerId) {
    errors.sourceAccountId = "Conta de origem deve pertencer ao mesmo dono";
  }
}
```

- [ ] **Step 3: Ajustar auto-preenchimento do amountPaid**

No `onChange` do campo `amount`, a lógica de auto-preenchimento já existe para transferência:
```typescript
if (isTransfer && val && sourceAvgCostPerPoint > 0) {
  setNewEntry({...newEntry, amount: val, amountPaid: (parseFloat(val) * sourceAvgCostPerPoint).toFixed(2)});
}
```
Verificar se está funcionando corretamente. Se sim, manter.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Entradas.tsx
git commit -m "feat: reinforce transfer rules - same owner validation and auto-calculated cost"
```

---

### Task 4: Debitar milhas do estoque ao registrar venda

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Extrair accountId do selectedProgramStock**

Já existe `selectedProgramStock` que tem `accountId` (adicionado no stockInfo dinâmico). Usar esse ID para debitar.

- [ ] **Step 2: Deduzir milhas do saldo após addSale**

No `handleCreateSale`, após `addSale(...)`, adicionar:

```typescript
// Deduzir milhas do estoque
if (selectedProgramStock) {
  updateAccount(selectedProgramStock.accountId, {
    balance: selectedProgramStock.availableMiles - milesUsed
  });
}
```

OBS: `updateAccount` já está disponível no `useData()` — verificar se está no destructure. Se não, adicionar.

- [ ] **Step 3: Adicionar `updateAccount` ao destructure**

Se `updateAccount` não estiver no destructure do `useData()`, adicionar:

```typescript
const { clients, accounts, owners, programs, sales, addSale, updateSale, addClient, updateAccount } = useData();
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Vendas.tsx
git commit -m "feat: deduct miles from account balance on sale creation"
```

---

### Task 5: Adicionar campos de ciclo de passageiros no dialog de Programas

**Files:**
- Modify: `src/pages/Configuracoes.tsx`

- [ ] **Step 1: Atualizar estado `newProgram` e `editingProgram`**

```typescript
const [newProgram, setNewProgram] = useState({ name: "", type: "milhas" as Program["type"], maxPassengers: "", passengerCycleType: "none" as "none" | "anual" | "dias", passengerCycleDays: "" });
const [editingProgram, setEditingProgram] = useState<Program | null>(null);
```

- [ ] **Step 2: Adicionar campos de ciclo no dialog de Programas**

No dialog de Programas, após o seletor de Tipo, adicionar:

```tsx
<div className="space-y-2">
  <Label htmlFor="programCycle">Controle de Passageiros</Label>
  <Select
    value={newProgram.passengerCycleType}
    onValueChange={(value) => setNewProgram({ ...newProgram, passengerCycleType: value as "none" | "anual" | "dias" })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecione o controle" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Não Controlar</SelectItem>
      <SelectItem value="anual">Ciclo Anual</SelectItem>
      <SelectItem value="dias">Ciclo por Dias</SelectItem>
    </SelectContent>
  </Select>
</div>

{newProgram.passengerCycleType !== "none" && (
  <div className="space-y-2">
    <Label htmlFor="programMaxPassengers">Máx. Passageiros por Ciclo</Label>
    <Input
      id="programMaxPassengers"
      type="number"
      min="1"
      value={newProgram.maxPassengers}
      onChange={(e) => setNewProgram({ ...newProgram, maxPassengers: e.target.value })}
      placeholder="Ex: 5"
    />
  </div>
)}

{newProgram.passengerCycleType === "dias" && (
  <div className="space-y-2">
    <Label htmlFor="programCycleDays">Janela (dias)</Label>
    <Input
      id="programCycleDays"
      type="number"
      min="1"
      value={newProgram.passengerCycleDays}
      onChange={(e) => setNewProgram({ ...newProgram, passengerCycleDays: e.target.value })}
      placeholder="Ex: 365"
    />
  </div>
)}
```

- [ ] **Step 3: Atualizar `resetProgramDialog`**

```typescript
const resetProgramDialog = () => {
  setNewProgram({ name: "", type: "milhas", maxPassengers: "", passengerCycleType: "none", passengerCycleDays: "" });
  setEditingProgram(null);
  setProgramError("");
  setIsProgramDialogOpen(false);
};
```

- [ ] **Step 4: Atualizar `handleSaveProgram` para converter strings**

```typescript
const handleSaveProgram = () => {
  if (!newProgram.name) {
    setProgramError("Nome é obrigatório");
    return;
  }
  const programData = {
    name: newProgram.name,
    type: newProgram.type,
    maxPassengers: newProgram.passengerCycleType !== "none" && newProgram.maxPassengers ? parseInt(newProgram.maxPassengers) : undefined,
    passengerCycleType: newProgram.passengerCycleType !== "none" ? newProgram.passengerCycleType : undefined,
    passengerCycleDays: newProgram.passengerCycleType === "dias" && newProgram.passengerCycleDays ? parseInt(newProgram.passengerCycleDays) : undefined,
  };
  if (editingProgram) {
    updateProgram(editingProgram.id, programData);
  } else {
    addProgram(programData);
  }
  resetProgramDialog();
};
```

- [ ] **Step 5: Atualizar `handleEditProgram`**

```typescript
const handleEditProgram = (program: Program) => {
  setEditingProgram(program);
  setNewProgram({
    name: program.name,
    type: program.type,
    maxPassengers: program.maxPassengers?.toString() ?? "",
    passengerCycleType: program.passengerCycleType ?? "none",
    passengerCycleDays: program.passengerCycleDays?.toString() ?? "",
  });
  setIsProgramDialogOpen(true);
};
```

- [ ] **Step 6: Adicionar coluna "Controle" na tabela de Programas**

Adicionar `<TableHead>Controle</TableHead>` entre Tipo e Ações.

No corpo, adicionar célula:

```tsx
<TableCell>
  {program.passengerCycleType ? (
    <Badge variant="outline">
      {program.passengerCycleType === "anual"
        ? `Anual — ${program.maxPassengers} pax/ano`
        : `${program.maxPassengers} pax/${program.passengerCycleDays}d`}
    </Badge>
  ) : (
    <span className="text-muted-foreground text-sm">—</span>
  )}
</TableCell>
```

- [ ] **Step 7: Atualizar type hints e imports se necessário**

O `newProgram` agora contém strings para campos numéricos. Tipar corretamente ou usar `any` no estado (prática atual do código). O estado pode ser tipado como:

```typescript
const [newProgram, setNewProgram] = useState({
  name: "",
  type: "milhas" as Program["type"],
  maxPassengers: "",
  passengerCycleType: "none" as "none" | "anual" | "dias",
  passengerCycleDays: "",
});
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/Configuracoes.tsx
git commit -m "feat: add passenger cycle fields to program dialog"
```

---

### Task 6: Validação de limite de passageiros na venda

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Calcular passageiros usados no ciclo atual**

Adicionar no corpo do componente, após `selectedProgramStock`:

```typescript
const programConfig = programs.find(p => p.name === newSale.program);

const usedPassengersInCycle = useMemo(() => {
  if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0;
  
  let relevantSales = sales.filter(s => s.program === newSale.program);
  
  if (programConfig.passengerCycleType === "anual") {
    const currentYear = new Date().getFullYear();
    relevantSales = relevantSales.filter(s => new Date(s.date).getFullYear() === currentYear);
  } else if (programConfig.passengerCycleType === "dias" && programConfig.passengerCycleDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - programConfig.passengerCycleDays);
    relevantSales = relevantSales.filter(s => new Date(s.date) >= cutoff);
  }
  
  return relevantSales.reduce((sum, s) => sum + s.passengers.length, 0);
}, [sales, newSale.program, programConfig]);
```

Novo import necessário: adicionar `useMemo` ao import do React.

- [ ] **Step 2: Verificar se essa linha de import já existe**

```typescript
import { useState, useMemo } from "react";
```
Já existe na linha 1. Confirmar.

- [ ] **Step 3: Adicionar validação no botão "Registrar Venda"**

No `disabled` do botão, adicionar condição para ciclo de passageiros:

```typescript
disabled={
  !newSale.ownerName || !newSale.program || !newSale.clientId ||
  !newSale.milesUsed || !newSale.saleValue || !selectedProgramStock ||
  parseFloat(newSale.milesUsed) > selectedProgramStock.availableMiles ||
  (programConfig?.maxPassengers &&
   usedPassengersInCycle + newSale.passengers.filter(p => p.name || p.passengerId).length >
   programConfig.maxPassengers)
}
```

- [ ] **Step 4: Exibir mensagem quando limite for excedido**

Após a seção de passageiros, adicionar:

```tsx
{programConfig?.maxPassengers && (
  (() => {
    const newCount = newSale.passengers.filter(p => p.name || p.passengerId).length;
    const totalAfter = usedPassengersInCycle + newCount;
    if (totalAfter > programConfig.maxPassengers) {
      return (
        <p className="text-xs text-destructive">
          Limite de {programConfig.maxPassengers} passageiros excedido para este ciclo.
          Usados: {usedPassengersInCycle} + {newCount} novo(s) = {totalAfter}
        </p>
      );
    }
    return null;
  })()
)}
```

- [ ] **Step 5: Garantir que `programs` está no destructure**

Verificar que `programs` está no destructure do `useData()` em Vendas.tsx:

```typescript
const { clients, accounts, owners, programs, sales, addSale, updateSale, addClient, updateAccount } = useData();
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/Vendas.tsx
git commit -m "feat: validate passenger cycle limit on sale creation"
```

---

### Task 7: Verificar build + lint

**Files:** N/A

- [ ] **Step 1: Rodar lint**

Run: `npm run lint`
Expected: 0 new errors (apenas warnings preexistentes do shadcn/ui)

- [ ] **Step 2: Rodar build**

Run: `npm run build`
Expected: Build bem-sucedido, 0 erros

- [ ] **Step 3: Commit final se houver ajustes**

```bash
git add -A
git commit -m "chore: fix lint and build after passenger cycle and transfer features"
```
