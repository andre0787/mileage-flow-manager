# Vendas Milhas Inline Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable inline client creation in sales modal and restrict sales to "milhas" type accounts only

**Architecture:** Replace hardcoded stockInfo with dynamic data from DataContext, add nested dialog for client creation using the same pattern as AccountDialog, filter accounts to only "milhas" type

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, React Router v6, TanStack React Query

---

### Task 1: Replace hardcoded stockInfo with dynamic data from DataContext

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Import accounts, owners, programs from DataContext**

```typescript
// Add to existing DataContext import
const { clients, accounts, owners, programs } = useData();
```

- [ ] **Step 2: Replace stockInfo state with useMemo**

Remove:
```typescript
const [stockInfo] = useState<StockInfo[]>([
  { ownerName: "João Silva", program: "LATAM Pass", availableMiles: 400000, averageCostPerMile: 0.0045 },
  { ownerName: "Maria Santos", program: "Smiles", availableMiles: 64000, averageCostPerMile: 0.005625 },
  { ownerName: "João Silva", program: "Livelo", availableMiles: 80000, averageCostPerMile: 0.005 }
]);
```

Add:
```typescript
const stockInfo = useMemo(() => {
  return accounts
    .filter(a => a.type === "milhas" && a.status === "ativa")
    .map(a => ({
      accountId: a.id,
      ownerId: a.ownerId,
      ownerName: owners.find(o => o.id === a.ownerId)?.name ?? "",
      accountName: a.name,
      program: programs.find(p => p.id === a.programId)?.name ?? "",
      availableMiles: a.balance,
      averageCostPerMile: a.averageCostPerMile ?? 0
    }));
}, [accounts, owners, programs]);
```

- [ ] **Step 3: Update owners derivation**

Replace:
```typescript
const owners = [...new Set(stockInfo.map(s => s.ownerName))];
```

With:
```typescript
const ownersList = [...new Set(stockInfo.map(s => s.ownerName))];
```

Update all references from `owners` to `ownersList` in the component.

- [ ] **Step 4: Update selectedOwnerStock calculation**

Replace:
```typescript
const selectedOwnerStock = stockInfo.filter(s => s.ownerName === newSale.ownerName);
```

With:
```typescript
const selectedOwnerStock = stockInfo.filter(s => s.ownerName === newSale.ownerName);
```

- [ ] **Step 5: Update selectedProgramStock calculation**

Replace:
```typescript
const selectedProgramStock = stockInfo.find(s => 
  s.ownerName === newSale.ownerName && s.program === newSale.program
);
```

With:
```typescript
const selectedProgramStock = stockInfo.find(s => 
  s.ownerName === newSale.ownerName && s.program === newSale.program
);
```

- [ ] **Step 6: Update account selection in handleCreateSale**

Replace:
```typescript
const handleCreateSale = () => {
  if (newSale.ownerName && newSale.program && newSale.clientId && newSale.milesUsed && newSale.saleValue) {
    const milesUsed = parseFloat(newSale.milesUsed);
    const saleValue = parseFloat(newSale.saleValue);
    const costPerMile = selectedProgramStock?.averageCostPerMile || 0;
    const totalCost = milesUsed * costPerMile;
    const profit = saleValue - totalCost;
    const profitMargin = (profit / saleValue) * 100;

    const sale: Sale = {
      id: Date.now(),
      ownerName: newSale.ownerName,
      accountName: newSale.accountName,
      program: newSale.program,
      clientId: newSale.clientId,
      clientName: newSale.clientName,
      milesUsed,
      saleValue,
      costPerMile,
      profit,
      profitMargin,
      status: "pendente",
      ticketLocator: newSale.ticketLocator,
      passengers: newSale.passengers.filter(p => p.name && p.cpf),
      date: new Date().toISOString().split('T')[0]
    };

    setSales([...sales, sale]);
    setNewSale({
      ownerName: "",
      accountName: "",
      program: "",
      clientId: "",
      clientName: "",
      milesUsed: "",
      saleValue: "",
      ticketLocator: "",
      passengers: [{ name: "", cpf: "" }]
    });
    setIsCreateDialogOpen(false);
  }
};
```

With:
```typescript
const handleCreateSale = () => {
  if (newSale.ownerName && newSale.program && newSale.clientId && newSale.milesUsed && newSale.saleValue) {
    const milesUsed = parseFloat(newSale.milesUsed);
    const saleValue = parseFloat(newSale.saleValue);
    const costPerMile = selectedProgramStock?.averageCostPerMile || 0;
    const totalCost = milesUsed * costPerMile;
    const profit = saleValue - totalCost;
    const profitMargin = (profit / saleValue) * 100;

    const sale: Sale = {
      id: Date.now(),
      ownerName: newSale.ownerName,
      accountName: newSale.accountName,
      program: newSale.program,
      clientId: newSale.clientId,
      clientName: newSale.clientName,
      milesUsed,
      saleValue,
      costPerMile,
      profit,
      profitMargin,
      status: "pendente",
      ticketLocator: newSale.ticketLocator,
      passengers: newSale.passengers.filter(p => p.name && p.cpf),
      date: new Date().toISOString().split('T')[0]
    };

    setSales([...sales, sale]);
    setNewSale({
      ownerName: "",
      accountName: "",
      program: "",
      clientId: "",
      clientName: "",
      milesUsed: "",
      saleValue: "",
      ticketLocator: "",
      passengers: [{ name: "", cpf: "" }]
    });
    setIsCreateDialogOpen(false);
  }
};
```

- [ ] **Step 7: Commit changes**

```bash
git add src/pages/Vendas.tsx
git commit -m "refactor: replace hardcoded stockInfo with dynamic data from DataContext"
```

### Task 2: Add inline client creation dialog

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Add state for client dialog**

Add to existing state declarations:
```typescript
const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
const [newClient, setNewClient] = useState({
  name: "",
  cpf: "",
  email: "",
  phone: ""
});
```

- [ ] **Step 2: Add CPF formatting function**

Add this function near the top of the component:
```typescript
const formatCPF = (cpf: string) => {
  const numbers = cpf.replace(/\D/g, "").slice(0, 11);
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};
```

- [ ] **Step 3: Add handleCreateClient function**

```typescript
const handleCreateClient = () => {
  if (newClient.name && newClient.cpf && newClient.email) {
    const clientId = crypto.randomUUID();
    addClient({
      id: clientId,
      name: newClient.name,
      cpf: newClient.cpf,
      email: newClient.email,
      phone: newClient.phone,
      totalPurchases: 0,
      usageHistory: []
    });
    
    // Auto-select the new client
    setNewSale({
      ...newSale,
      clientId: clientId,
      clientName: newClient.name
    });
    
    // Reset form and close dialog
    setNewClient({
      name: "",
      cpf: "",
      email: "",
      phone: ""
    });
    setIsClientDialogOpen(false);
  }
};
```

- [ ] **Step 4: Add client dialog JSX**

Add this dialog component after the existing Dialog in the return statement:
```jsx
<Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
  <DialogContent className="sm:max-w-[350px]">
    <DialogHeader>
      <DialogTitle>Novo Cliente</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Nome Completo</Label>
        <Input
          value={newClient.name}
          onChange={(e) => setNewClient({...newClient, name: e.target.value})}
          placeholder="Digite o nome completo"
        />
      </div>
      
      <div className="space-y-2">
        <Label>CPF</Label>
        <Input
          value={newClient.cpf}
          onChange={(e) => {
            const numbers = e.target.value.replace(/\D/g, "").slice(0, 11);
            const formatted = formatCPF(numbers);
            setNewClient({...newClient, cpf: formatted});
          }}
          placeholder="000.000.000-00"
          maxLength={14}
        />
      </div>
      
      <div className="space-y-2">
        <Label>E-mail</Label>
        <Input
          type="email"
          value={newClient.email}
          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
          placeholder="cliente@email.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          value={newClient.phone}
          onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
          placeholder="(11) 99999-9999"
        />
      </div>
    </div>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">
        Cadastrar
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

- [ ] **Step 5: Add "+" button to client select**

Replace the client select section:
```jsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="client">Cliente</Label>
    <div className="flex gap-2">
      <div className="flex-1">
        <Select
          value={newSale.clientId}
          onValueChange={(value) => {
            const client = clients.find(c => c.id === value);
            setNewSale({
              ...newSale,
              clientId: value,
              clientName: client?.name || ""
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setIsClientDialogOpen(true)} 
        title="Novo cliente"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>

  <div className="space-y-2">
    <Label htmlFor="locator">Localizador do Bilhete</Label>
    <Input
      id="locator"
      value={newSale.ticketLocator}
      onChange={(e) => setNewSale({...newSale, ticketLocator: e.target.value})}
      placeholder="Ex: ABC123"
    />
  </div>
</div>
```

- [ ] **Step 6: Commit changes**

```bash
git add src/pages/Vendas.tsx
git commit -m "feat: add inline client creation dialog with nested form"
```

### Task 3: Update imports and clean up

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Add required imports**

Update the import statement at the top:
```typescript
import { useState, useMemo } from "react";
import { Plus, TrendingDown, DollarSign, Users } from "lucide-react";
```

- [ ] **Step 2: Remove unused imports**

Remove any imports that are no longer used after the refactoring.

- [ ] **Step 3: Commit changes**

```bash
git add src/pages/Vendas.tsx
git commit -m "refactor: update imports and clean up unused code"
```