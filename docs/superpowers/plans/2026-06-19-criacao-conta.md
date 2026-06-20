# Account Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline account creation dialog in Contas.tsx with a reusable AccountDialog component supporting create/edit, inline creation of owners/programs, auto-derivation of account type from program, and financial fields.

**Architecture:** Single `AccountDialog` component handles both create and edit modes. Sub-dialogs for Owner and Program creation are modals opened from "+" buttons next to each select. Account type is auto-derived when program is selected but manually overridable.

**Tech Stack:** React 18 + TypeScript + shadcn/ui (Dialog, Select, Input, Switch, Badge)

---

### Task 1: Create AccountDialog component

**Files:**
- Create: `src/components/AccountDialog.tsx`

Write the full AccountDialog component with all fields and sub-dialogs integrated.

```tsx
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import type { Account } from "@/types";

interface AccountDialogProps {
  mode: "create" | "edit";
  account?: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountDialog({ mode, account, open, onOpenChange }: AccountDialogProps) {
  const { owners, programs, addOwner, addProgram, addAccount, updateAccount } = useData();

  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [programId, setProgramId] = useState("");
  const [type, setType] = useState<"pontos" | "milhas">("milhas");
  const [balance, setBalance] = useState(0);
  const [averageCostPerMile, setAverageCostPerMile] = useState<number | undefined>(undefined);
  const [totalInvested, setTotalInvested] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<"ativa" | "inativa">("ativa");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Sub-dialogs
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);

  // Sub-dialog fields
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerCpf, setNewOwnerCpf] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramType, setNewProgramType] = useState<"pontos" | "milhas">("milhas");

  // Pre-fill on edit
  useEffect(() => {
    if (mode === "edit" && account) {
      setName(account.name);
      setOwnerId(account.ownerId);
      setProgramId(account.programId);
      setType(account.type);
      setBalance(account.balance);
      setAverageCostPerMile(account.averageCostPerMile);
      setTotalInvested(account.totalInvested);
      setStatus(account.status);
    } else {
      setName("");
      setOwnerId("");
      setProgramId("");
      setType("milhas");
      setBalance(0);
      setAverageCostPerMile(undefined);
      setTotalInvested(undefined);
      setStatus("ativa");
    }
    setErrors({});
  }, [mode, account, open]);

  // Auto-derive type when program changes
  useEffect(() => {
    const program = programs.find(p => p.id === programId);
    if (program) {
      setType(program.type);
    }
  }, [programId, programs]);

  const validate = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!name.trim()) errs.name = "Nome é obrigatório";
    if (!ownerId) errs.ownerId = "Selecione um dono";
    if (!programId) errs.programId = "Selecione um programa";
    if (balance < 0) errs.balance = "Saldo não pode ser negativo";
    if (averageCostPerMile != null && averageCostPerMile < 0) errs.averageCostPerMile = "Custo/milha não pode ser negativo";
    if (totalInvested != null && totalInvested < 0) errs.totalInvested = "Valor investido não pode ser negativo";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name: name.trim(),
      ownerId,
      programId,
      type,
      balance,
      averageCostPerMile,
      totalInvested,
      status,
    };
    if (mode === "create") {
      addAccount(data);
    } else if (account) {
      updateAccount(account.id, data);
    }
    onOpenChange(false);
  };

  const handleCreateOwner = () => {
    if (!newOwnerName.trim()) return;
    addOwner({ name: newOwnerName.trim(), cpf: newOwnerCpf, phone: newOwnerPhone });
    setNewOwnerName("");
    setNewOwnerCpf("");
    setNewOwnerPhone("");
    setOwnerDialogOpen(false);
    // User selects the new owner from the refreshed dropdown
  };

  const handleCreateProgram = () => {
    if (!newProgramName.trim()) return;
    addProgram({ name: newProgramName.trim(), type: newProgramType });
    setNewProgramName("");
    setNewProgramType("milhas");
    setProgramDialogOpen(false);
    // User selects the new program from the refreshed dropdown
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Criar Nova Conta" : "Editar Conta"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="acc-name">Nome da Conta</Label>
              <Input id="acc-name" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({...p, name: ""})); }} placeholder="Ex: Conta Principal LATAM" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Programa + botão + */}
            <div className="space-y-2">
              <Label>Programa</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={programId} onValueChange={v => { setProgramId(v); setErrors(p => ({...p, programId: ""})); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.type === "pontos" ? "Pontos" : "Milhas"})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={() => setProgramDialogOpen(true)} title="Novo programa">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.programId && <p className="text-xs text-destructive">{errors.programId}</p>}
            </div>

            {/* Tipo de Conta */}
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select value={type} onValueChange={v => setType(v as "pontos" | "milhas")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontos">Pontos</SelectItem>
                  <SelectItem value="milhas">Milhas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Preenchido automaticamente pelo programa. Pode ser alterado manualmente.</p>
            </div>

            {/* Dono + botão + */}
            <div className="space-y-2">
              <Label>Dono</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={ownerId} onValueChange={v => { setOwnerId(v); setErrors(p => ({...p, ownerId: ""})); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dono" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={() => setOwnerDialogOpen(true)} title="Novo dono">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.ownerId && <p className="text-xs text-destructive">{errors.ownerId}</p>}
            </div>

            {/* Saldo Inicial */}
            <div className="space-y-2">
              <Label htmlFor="acc-balance">Saldo Inicial</Label>
              <Input id="acc-balance" type="number" min="0" value={balance} onChange={e => setBalance(Number(e.target.value))} />
              {errors.balance && <p className="text-xs text-destructive">{errors.balance}</p>}
            </div>

            {/* Custo/Milha */}
            <div className="space-y-2">
              <Label htmlFor="acc-cost">Custo/Milha (opcional)</Label>
              <Input id="acc-cost" type="number" min="0" step="0.0001" value={averageCostPerMile ?? ""} onChange={e => setAverageCostPerMile(e.target.value ? Number(e.target.value) : undefined)} />
              {errors.averageCostPerMile && <p className="text-xs text-destructive">{errors.averageCostPerMile}</p>}
            </div>

            {/* Valor Investido */}
            <div className="space-y-2">
              <Label htmlFor="acc-invested">Valor Investido (opcional)</Label>
              <Input id="acc-invested" type="number" min="0" value={totalInvested ?? ""} onChange={e => setTotalInvested(e.target.value ? Number(e.target.value) : undefined)} />
              {errors.totalInvested && <p className="text-xs text-destructive">{errors.totalInvested}</p>}
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch id="acc-status" checked={status === "ativa"} onCheckedChange={c => setStatus(c ? "ativa" : "inativa")} />
              <Label htmlFor="acc-status">Conta Ativa</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{mode === "create" ? "Criar Conta" : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialog: Criar Dono */}
      <Dialog open={ownerDialogOpen} onOpenChange={setOwnerDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Novo Dono</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)} placeholder="Nome do dono" />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={newOwnerCpf} onChange={e => setNewOwnerCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={newOwnerPhone} onChange={e => setNewOwnerPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOwnerDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOwner}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialog: Criar Programa */}
      <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Novo Programa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={newProgramName} onChange={e => setNewProgramName(e.target.value)} placeholder="Nome do programa" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newProgramType} onValueChange={v => setNewProgramType(v as "pontos" | "milhas")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontos">Pontos</SelectItem>
                  <SelectItem value="milhas">Milhas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProgramDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProgram}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 1: Create AccountDialog.tsx** with the full component above

```bash
cat > src/components/AccountDialog.tsx << 'ACCOUNTDIALOG_EOF'
[full content above]
ACCOUNTDIALOG_EOF
```

---

### Task 2: Refactor Contas.tsx — use AccountDialog

**Files:**
- Modify: `src/pages/Contas.tsx`

Replace the inline dialog logic with `AccountDialog`. Remove `newAccount` state, `accountErrors`, `validateAccount`, `handleCreateAccount`. Connect the edit button.

- [ ] **Step 1: Remove obsolete state and handlers**

Delete these lines from `Contas.tsx`:
```tsx
const [newAccount, setNewAccount] = useState({...});
const [accountErrors, setAccountErrors] = useState({...});
const validateAccount = () => {...};
const handleCreateAccount = () => {...};
```

- [ ] **Step 2: Add AccountDialog state**

After the existing state declarations, add:
```tsx
const [editAccount, setEditAccount] = useState<Account | null>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
```

- [ ] **Step 3: Replace inline dialog with AccountDialog component**

Remove the entire `<Dialog>` block (lines 74-148) and replace with:
```tsx
<AccountDialog
  mode="create"
  open={isCreateDialogOpen}
  onOpenChange={(open) => { setIsCreateDialogOpen(open); }}
/>

<AccountDialog
  mode="edit"
  account={editAccount ?? undefined}
  open={isEditDialogOpen}
  onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditAccount(null); }}
/>
```

- [ ] **Step 4: Connect edit button**

Replace the line with `Edit` button (around line 214):
```tsx
<Button size="sm" variant="outline" className="px-3" onClick={() => { setEditAccount(account); setIsEditDialogOpen(true); }}>
  <Edit className="h-4 w-4" />
</Button>
```

- [ ] **Step 5: Update imports**

Remove unused imports. Keep: `useState`, `Plus`, `CreditCard`, `Eye`, `EyeOff`, `Edit`, `Trash2`, `Filter`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Badge`, `Input`, `Label`, `Select`, etc.

Add:
```tsx
import AccountDialog from "@/components/AccountDialog";
import type { Account } from "@/types";
```

Remove (no longer needed):
```tsx
// Remove Dialog and Switch from imports if they're only used in the old inline dialog
// Actually keep them if used elsewhere - check the component
```

Check what's still used in the remaining code:
- `Dialog` — only in the old inline dialog, so remove
- `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` — remove
- `Switch` — only in old dialog, so remove
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` — only in old dialog, so remove

The remaining code after refactoring uses: `Badge`, `Button`, `Card`, `CreditCard`, `Edit`, `Eye`, `EyeOff`, `Filter`, `Input` (for the filter... wait, no Input in the remaining code. Actually check the remaining code for Switch, Input... the remaining code doesn't use Input or Switch.

Let me verify: the remaining Contas code has:
1. Filter buttons (no Switch/Input)
2. Accounts grid with Cards (Button, Badge, Edit, Trash2, Eye, EyeOff)
3. Summary Card (CreditCard, Card components)

So we can remove: `Switch`, `Input`, `Label`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`.

But `Input` is used in the old inline dialog. Let me check if there's any other Input usage... No. So remove them all.

Old imports to remove:
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expect: No errors

- [ ] **Step 7: Commit**

```bash
git add src/components/AccountDialog.tsx src/pages/Contas.tsx
git commit -m "feat: refatora criação de contas com AccountDialog reutilizável"
```

---

### Task 3: Self-review and verify

- [ ] **Step 1: Run lint**

```bash
npm run lint
```
Expect: No errors (warnings from shadcn/ui components are pre-existing)

- [ ] **Step 2: Run build again**

```bash
npm run build
```
Expect: 0 errors

- [ ] **Step 3: Verify the feature works**

Start dev server and test:
1. Create a new account — all fields present, type auto-derived from program
2. Manual override of type after program selection
3. Create new owner inline via "+" button
4. Create new program inline via "+" button
5. Edit an existing account via pencil button
6. Verify data persists in other pages (dashboard, entries)

---

## Spec Coverage Check
- ✅ AccountDialog component with create/edit modes (Task 1)
- ✅ Fields: name, program, type (auto-derived), owner, balance, cost/mile, invested, status (Task 1)
- ✅ Inline create of owner via sub-dialog (Task 1)
- ✅ Inline create of program via sub-dialog (Task 1)
- ✅ Type auto-derived from program, overrideable (Task 1)
- ✅ Edit dialog connected via pencil button (Task 2)
- ✅ Financial fields (balance, cost/mile, invested) (Task 1)
- ✅ Validation (Task 1)
- ✅ Build/lint verification (Task 3)
