# Criar Dono + Programa Inline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow creating owner and program inline via FormDrawer inside the account creation drawer in EntryForm, following the same pattern established in PR #203 (create account inline).

**Architecture:** Extend EntryForm with 2 new props (`onCreateOwner`, `onCreateProgram`) following the exact pattern of existing `onCreateAccount`/`onCreateOrigemType`. Each opens a FormDrawer with minimal fields, creates via existing mutations (`useAddOwnerMutation`, `useAddProgramMutation`), and auto-selects the created item. The parent (Entradas.tsx) wires the handlers.

**Tech Stack:** React, TypeScript, shadcn/ui (FormDrawer, Button, Input, Select), TanStack Query, Supabase

## Global Constraints

- Follow the exact UX pattern of `onCreateAccount` (button "+" → FormDrawer → create → auto-select)
- Owner creation fields: name (required), cpf (optional), phone (optional)
- Program creation fields: name (required), type (required, default "pontos")
- All new strings in pt-BR
- No new npm dependencies
- Use existing `useAddOwnerMutation` and `useAddProgramMutation` from `@/hooks/useDatabase`
- Existing E2E tests must continue passing

---
### Task 1: Add Owner + Program inline creation to EntryForm

**Files:**
- Modify: `src/components/EntryForm.tsx`

**Interfaces:**
- Consumes: `EntryFormProps.onCreateOwner?: (data: { name: string; cpf?: string; phone?: string }) => Promise<string | undefined>`, `EntryFormProps.onCreateProgram?: (data: { name: string; type: "pontos" | "milhas" }) => Promise<string | undefined>`
- Produces: Owner and Program creation drawers inside Account Drawer, auto-select after creation

- [ ] **Step 1: Add props and state**

Add to `EntryFormProps` interface:
```ts
onCreateOwner?: (data: {
  name: string;
  cpf?: string;
  phone?: string;
}) => Promise<string | undefined>;
onCreateProgram?: (data: {
  name: string;
  type: "pontos" | "milhas";
}) => Promise<string | undefined>;
```

Add state near the existing `newAccount`/`accountErrors` state block:
```ts
const [isOwnerOpen, setIsOwnerOpen] = useState(false);
const [newOwner, setNewOwner] = useState({ name: "", cpf: "", phone: "" });
const [isCreatingOwner, setIsCreatingOwner] = useState(false);
const [ownerErrors, setOwnerErrors] = useState<Record<string, string>>({});

const [isProgramOpen, setIsProgramOpen] = useState(false);
const [newProgram, setNewProgram] = useState({ name: "", type: "pontos" as const });
const [isCreatingProgram, setIsCreatingProgram] = useState(false);
const [programErrors, setProgramErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 2: Add create owner handler**

Add before the `handleCreateAccount` function:
```ts
const handleCreateOwner = async () => {
  const errs: Record<string, string> = {};
  if (!newOwner.name.trim()) errs.name = "Nome é obrigatório";
  setOwnerErrors(errs);
  if (Object.keys(errs).length > 0) return;

  setIsCreatingOwner(true);
  try {
    const id = await onCreateOwner?.({
      name: newOwner.name.trim(),
      cpf: newOwner.cpf.trim() || undefined,
      phone: newOwner.phone.trim() || undefined,
    });
    if (id) setNewAccount((p) => ({ ...p, ownerId: id }));
    setNewOwner({ name: "", cpf: "", phone: "" });
    setOwnerErrors({});
    setIsOwnerOpen(false);
  } finally {
    setIsCreatingOwner(false);
  }
};
```

- [ ] **Step 3: Add create program handler**

Add after `handleCreateOwner`:
```ts
const handleCreateProgram = async () => {
  const errs: Record<string, string> = {};
  if (!newProgram.name.trim()) errs.name = "Nome é obrigatório";
  setProgramErrors(errs);
  if (Object.keys(errs).length > 0) return;

  setIsCreatingProgram(true);
  try {
    const id = await onCreateProgram?.({
      name: newProgram.name.trim(),
      type: newProgram.type,
    });
    if (id) setNewAccount((p) => ({ ...p, programId: id }));
    setNewProgram({ name: "", type: "pontos" });
    setProgramErrors({});
    setIsProgramOpen(false);
  } finally {
    setIsCreatingProgram(false);
  }
};
```

- [ ] **Step 4: Add "+" buttons next to Dono and Programa selects in Account Drawer**

Inside the Account Drawer (`isAccountOpen` FormDrawer), find the Dono `<Label>` section and wrap the Select in a flex container with a "+" button:

Change from:
```tsx
<div className="space-y-2">
  <Label>Dono</Label>
  <Select
    value={newAccount.ownerId}
    onValueChange={(v) => {
      setNewAccount((p) => ({ ...p, ownerId: v }));
      setAccountErrors((p) => ({ ...p, ownerId: "" }));
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecione o dono" />
    </SelectTrigger>
    <SelectContent>
      {owners.map((o) => (
        <SelectItem key={o.id} value={o.id}>
          {o.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {accountErrors.ownerId && (
    <p className="text-xs text-destructive">{accountErrors.ownerId}</p>
  )}
</div>
```

To:
```tsx
<div className="space-y-2">
  <Label>Dono</Label>
  <div className="flex gap-2">
    <div className="flex-1">
      <Select
        value={newAccount.ownerId}
        onValueChange={(v) => {
          setNewAccount((p) => ({ ...p, ownerId: v }));
          setAccountErrors((p) => ({ ...p, ownerId: "" }));
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o dono" />
        </SelectTrigger>
        <SelectContent>
          {owners.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {onCreateOwner && (
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={() => setIsOwnerOpen(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    )}
  </div>
  {accountErrors.ownerId && (
    <p className="text-xs text-destructive">{accountErrors.ownerId}</p>
  )}
</div>
```

Then find the Programa `<Label>` section and make the same change — wrap in flex, add "+" button with `onClick={() => setIsProgramOpen(true)}`, conditionally rendered only when `onCreateProgram` exists.

- [ ] **Step 5: Add Owner FormDrawer**

Add inside the Account Drawer, after the Dono section (but before `</FormDrawer>` closing the Account drawer) — or rather, at the same level as the Account Drawer (inside the EntryForm return, after the Account Drawer closing tag):

```tsx
{/* Owner creation drawer */}
<FormDrawer
  open={isOwnerOpen}
  onOpenChange={(open) => {
    setIsOwnerOpen(open);
    if (!open) setOwnerErrors({});
  }}
  title="Novo Dono"
>
  <div className="grid gap-4 py-4">
    <div className="space-y-2">
      <Label>Nome</Label>
      <Input
        value={newOwner.name}
        onChange={(e) => {
          setNewOwner((p) => ({ ...p, name: e.target.value }));
          setOwnerErrors((p) => ({ ...p, name: "" }));
        }}
        placeholder="Ex: João Silva"
      />
      {ownerErrors.name && <p className="text-xs text-destructive">{ownerErrors.name}</p>}
    </div>
    <div className="space-y-2">
      <Label>CPF (opcional)</Label>
      <Input
        value={newOwner.cpf}
        onChange={(e) => setNewOwner((p) => ({ ...p, cpf: e.target.value }))}
        placeholder="000.000.000-00"
      />
    </div>
    <div className="space-y-2">
      <Label>Telefone (opcional)</Label>
      <Input
        value={newOwner.phone}
        onChange={(e) => setNewOwner((p) => ({ ...p, phone: e.target.value }))}
        placeholder="(11) 99999-8888"
      />
    </div>
  </div>
  <div className="flex justify-end gap-2 mt-4">
    <Button
      variant="outline"
      onClick={() => {
        setIsOwnerOpen(false);
        setOwnerErrors({});
      }}
    >
      Cancelar
    </Button>
    <Button
      onClick={handleCreateOwner}
      disabled={isCreatingOwner}
      className="bg-gradient-primary hover:opacity-90"
    >
      {isCreatingOwner ? "Salvando..." : "Cadastrar"}
    </Button>
  </div>
</FormDrawer>
```

- [ ] **Step 6: Add Program FormDrawer**

Add after the Owner drawer:
```tsx
{/* Program creation drawer */}
<FormDrawer
  open={isProgramOpen}
  onOpenChange={(open) => {
    setIsProgramOpen(open);
    if (!open) setProgramErrors({});
  }}
  title="Novo Programa"
>
  <div className="grid gap-4 py-4">
    <div className="space-y-2">
      <Label>Nome</Label>
      <Input
        value={newProgram.name}
        onChange={(e) => {
          setNewProgram((p) => ({ ...p, name: e.target.value }));
          setProgramErrors((p) => ({ ...p, name: "" }));
        }}
        placeholder="Ex: LATAM Pass"
      />
      {programErrors.name && <p className="text-xs text-destructive">{programErrors.name}</p>}
    </div>
    <div className="space-y-2">
      <Label>Tipo</Label>
      <Select
        value={newProgram.type}
        onValueChange={(v) =>
          setNewProgram((p) => ({ ...p, type: v as "pontos" | "milhas" }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pontos">Pontos</SelectItem>
          <SelectItem value="milhas">Milhas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
  <div className="flex justify-end gap-2 mt-4">
    <Button
      variant="outline"
      onClick={() => {
        setIsProgramOpen(false);
        setProgramErrors({});
      }}
    >
      Cancelar
    </Button>
    <Button
      onClick={handleCreateProgram}
      disabled={isCreatingProgram}
      className="bg-gradient-primary hover:opacity-90"
    >
      {isCreatingProgram ? "Salvando..." : "Cadastrar"}
    </Button>
  </div>
</FormDrawer>
```

- [ ] **Step 7: Run typecheck to verify no errors**

```bash
npm run check:fast
```

Expected: typecheck passes, lint passes, tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/EntryForm.tsx
git commit -m "feat: add owner and program inline creation to EntryForm"
```

---
### Task 2: Wire up Entradas.tsx with handlers

**Files:**
- Modify: `src/pages/Entradas.tsx`

**Interfaces:**
- Consumes: `EntryFormProps.onCreateOwner`, `EntryFormProps.onCreateProgram` (from Task 1)
- Produces: Handlers that call `useAddOwnerMutation` and `useAddProgramMutation`

- [ ] **Step 1: Add imports**

Add to the imports from `@/hooks/useDatabase`:
```ts
useAddOwnerMutation,
useAddProgramMutation,
```

- [ ] **Step 2: Add mutation hooks**

Add before the existing mutation hooks:
```ts
const addOwnerM = useAddOwnerMutation();
const addProgramM = useAddProgramMutation();
```

- [ ] **Step 3: Add handler functions**

Add before `handleCreateAccount`:
```ts
const handleCreateOwner = async (data: {
  name: string;
  cpf?: string;
  phone?: string;
}) => {
  const id = crypto.randomUUID();
  await addOwnerM.mutateAsync({
    id,
    name: data.name,
    cpf: data.cpf ?? "",
    phone: data.phone ?? "",
  });
  return id;
};

const handleCreateProgram = async (data: {
  name: string;
  type: "pontos" | "milhas";
}) => {
  const id = crypto.randomUUID();
  await addProgramM.mutateAsync({ id, name: data.name, type: data.type });
  return id;
};
```

- [ ] **Step 4: Pass new props to EntryForm**

Find the EntryForm usage in the create dialog section and add the new props:
```tsx
<EntryForm
  type={activeTab === "pontos" ? "pontos" : "milhas"}
  mode="create"
  accounts={accounts}
  origemTypes={origemTypes}
  programs={programs}
  owners={owners}
  onCreateOrigemType={handleCreateOrigemType}
  onCreateAccount={handleCreateAccount}
  onCreateOwner={handleCreateOwner}
  onCreateProgram={handleCreateProgram}
  onSubmit={handleCreateEntry}
  onCancel={() => setIsCreateDialogOpen(false)}
/>
```

- [ ] **Step 5: Run typecheck**

```bash
npm run check:fast
```

Expected: typecheck passes, lint passes, tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Entradas.tsx
git commit -m "feat: wire up owner and program inline creation handlers in Entradas"
```

---
### Task 3: Update E2E tests

**Files:**
- Create: `tests/create-owner-program-inline.spec.ts`

- [ ] **Step 1: Write E2E test for creating owner + program inline**

Create `tests/create-owner-program-inline.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";

test("Criação inline de dono e programa ao registrar entrada", async ({ page }) => {
  const email = `test_owner_program_${Date.now()}@teste.com`;

  // 1. Registrar novo usuário
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });

  await page.fill("#name", "Usuário Teste E2E");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");

  // Aguarda dashboard
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  // 2. Criar dados de teste mínimos via API (só origem_type, sem owner/program)
  const supabaseUrl = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
  const supabaseAnonKey = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';

  const { otId } = await page.evaluate(async ({ url, anonKey }) => {
    const sessionStr = localStorage.getItem('sb-ohyplfpcwxzakujjfwdf-auth-token');
    if (!sessionStr) throw new Error('Sessão não encontrada');
    const session = JSON.parse(sessionStr);
    const accessToken = session.access_token;
    const userId = session.user.id;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`,
    };

    const otId = crypto.randomUUID();

    // Só cria origem_type — owner e program serão criados inline
    const otRes = await fetch(`${url}/rest/v1/origem_types`, {
      method: 'POST', headers,
      body: JSON.stringify({
        id: otId,
        user_id: userId,
        name: 'Compra Direta',
        account_type: 'milhas',
        color: '#10b981',
        description: '{"hasRecurrence":false}',
      }),
    });
    if (!otRes.ok) throw new Error('Falha ao criar origem_type: ' + await otRes.text());

    return { otId };
  }, { url: supabaseUrl, anonKey: supabaseAnonKey });

  // 3. Navegar para Entradas
  await page.goto("/entradas");
  await page.waitForSelector("text=Entradas", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  // Alterna para aba Milhas
  await page.locator("button[role='tab']:has-text('Milhas')").click();
  await expect(page.locator("button[role='tab'][aria-selected='true']:has-text('Milhas')")).toBeVisible({ timeout: 5_000 });

  // 4. Clicar em "Nova Entrada"
  await page.getByRole('button', { name: 'Nova Entrada' }).first().click();

  const entryDrawer = page.getByRole('dialog').first();
  await expect(entryDrawer).toBeVisible({ timeout: 5_000 });

  // 5. Clicar no botão "+" de Conta (primeiro botão + dentro do drawer)
  await entryDrawer.locator('button:has(svg.lucide-plus)').first().click();

  // 6. Criar DONO inline
  await expect(page.getByText('Nome da Conta')).toBeVisible({ timeout: 3_000 });

  // Clica no "+" ao lado de Dono (segundo botão com lucide-plus dentro do drawer de conta)
  const accountDrawer = page.getByRole('dialog').nth(1);
  const plusButtons = accountDrawer.locator('button:has(svg.lucide-plus)');
  // Primeiro + abre dono (está antes do programa no DOM)
  await plusButtons.first().click();

  // Preenche formulário do novo dono
  await expect(page.getByText('Novo Dono')).toBeVisible({ timeout: 3_000 });
  const ownerDrawer = page.getByRole('dialog').last();
  await ownerDrawer.getByPlaceholder('Ex: João Silva').fill('Dono Criado Inline');

  // Clica em Cadastrar
  await ownerDrawer.getByRole('button', { name: 'Cadastrar' }).click();

  // Verifica que o dono foi auto-selecionado
  await expect(accountDrawer.getByText('Dono Criado Inline')).toBeVisible({ timeout: 5_000 });

  // 7. Criar PROGRAMA inline
  const programPlusButtons = accountDrawer.locator('button:has(svg.lucide-plus)');
  // Último + abre programa
  await programPlusButtons.last().click();

  await expect(page.getByText('Novo Programa')).toBeVisible({ timeout: 3_000 });
  const programDrawer = page.getByRole('dialog').last();
  await programDrawer.getByPlaceholder('Ex: LATAM Pass').fill('Programa Criado Inline');

  // Seleciona tipo Milhas
  await programDrawer.getByText('Selecione o tipo').click();
  await page.getByRole('option', { name: 'Milhas' }).click();

  // Clica em Cadastrar
  await programDrawer.getByRole('button', { name: 'Cadastrar' }).click();

  // Verifica que o programa foi auto-selecionado e tipo deduzido
  await expect(accountDrawer.getByText('Programa Criado Inline')).toBeVisible({ timeout: 5_000 });
  await expect(accountDrawer.getByText('Tipo da conta: Milhas')).toBeVisible({ timeout: 3_000 });

  // 8. Preencher nome da conta e cadastrar
  await accountDrawer.getByPlaceholder('Ex: Conta Principal LATAM').fill('Conta Completa Inline');
  await accountDrawer.getByRole('button', { name: 'Cadastrar' }).click();

  // 9. Verificar que a conta foi auto-selecionada
  await expect(entryDrawer.getByText('Conta Completa Inline')).toBeVisible({ timeout: 5_000 });

  // 10. Preencher restante da entrada
  await page.fill("#entryDate", new Date().toISOString().split("T")[0]);

  await page.getByText('Selecione o tipo').click();
  await page.getByRole('option', { name: 'Compra Direta' }).click();

  await page.fill("#amount", "50000");
  await page.fill("#amountPaid", "3000.00");

  // 11. Salvar entrada
  await entryDrawer.getByRole('button', { name: 'Registrar Entrada' }).click({ force: true });

  // 12. Verificar entrada na tabela
  await expect(page.getByText('50.000').first()).toBeVisible({ timeout: 5_000 });

  // 13. Verificar dono criado na página de configurações
  await page.goto("/configuracoes");
  await page.waitForSelector("text=Configurações", { timeout: 15_000 });
  await expect(page.getByText('Dono Criado Inline')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Programa Criado Inline')).toBeVisible({ timeout: 5_000 });
});
```

- [ ] **Step 2: Run existing tests to verify no regressions**

```bash
npm run check:fast
```

Expected: typecheck passes, lint passes, all 124+ unit tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/create-owner-program-inline.spec.ts
git commit -m "test: add E2E test for owner and program inline creation"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ `onCreateOwner` prop added to EntryForm
- ✅ `onCreateProgram` prop added to EntryForm
- ✅ Owner drawer with name (required), cpf (optional), phone (optional)
- ✅ Program drawer with name (required), type (required, default "pontos")
- ✅ Auto-select after creation
- ✅ Handlers in Entradas.tsx using existing mutations
- ✅ E2E test covering full flow

**2. Placeholder scan:** No TBD, TODO, or vague requirements. All code is concrete.

**3. Type consistency:** All signatures match: `onCreateOwner` return type `Promise<string | undefined>`, `handleCreateOwner` returns `id`, `setNewAccount` uses `ownerId` / `programId`. Consistent with existing `onCreateAccount` pattern.
