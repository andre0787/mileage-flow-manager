# Último registro no card + Alertas por conta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir último registro de entrada/venda no card das contas e permitir alertas personalizados por conta (data + observação + lido/não lido).

**Architecture:** Item 1 é derivação client-side pura (novo helper em `src/lib/accountActivity.ts`, sem query nova — `entries`/`sales` já estão no `useData()`). Item 2 é uma nova entidade: migration SQL + RLS por `auth.uid()`, types, hooks React Query em `src/hooks/useDatabase/alerts.ts`, dialog `AccountAlertsDialog.tsx` e entrada no card via ícone Bell + badge de não lidos.

**Tech Stack:** React 19, TanStack Query v5, Supabase (RLS), shadcn/ui (Dialog, Badge, Button, Input, Textarea, Switch), lucide-react (Bell), Vitest + Testing Library, Playwright.

## Global Constraints

- pt-BR na interface (todos os textos)
- `refetchType: 'all'` em TODA chamada `invalidateQueries` (regra #19)
- Filtro de "registro válido" idêntico ao `computedBalances` de `Contas.tsx`: entradas excluem `entryStatus === "aguardando"`; vendas excluem `status === "cancelado"`
- Formato de data pt-BR: `new Date(date).toLocaleDateString("pt-BR")`
- Imports com alias `@/` → `src/`
- Hook de userId: `useUserId()` de `@/hooks/useDatabase/shared`
- Supabase client: `supabase` de `@/lib/supabase`
- Toasts: `toast` de `sonner` (app não usa Toast shadcn)
- Log de erros: `logError` de `@/lib/logger`
- Sem console.log (CRLF — regra #30)
- NUNCA commitar na main (hook bloqueia)

---

### Task 1: Helper de atividade da conta (TDD)

**Files:**
- Create: `src/lib/accountActivity.ts`
- Test: `tests/unit/accountActivity.test.ts`

**Interfaces:**
- Produces: `getLastAccountActivity(entries: PointEntry[], sales: Sale[], accountId: string): { lastEntry?: PointEntry; lastSale?: Sale }` — função pura, sem React/Supabase. Importa `PointEntry`, `Sale` de `@/types`.

- [ ] **Step 1: Write the failing test**

`tests/unit/accountActivity.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getLastAccountActivity } from "@/lib/accountActivity";
import type { PointEntry, Sale } from "@/types";

const baseEntry = (over: Partial<PointEntry>): PointEntry => ({
  id: "e1",
  accountId: "acc-1",
  origemTypeId: "ot-1",
  amount: 1000,
  amountPaid: 50,
  costPerThousand: 50,
  date: "2026-07-01",
  ...over,
});

const baseSale = (over: Partial<Sale>): Sale => ({
  id: "s1",
  accountId: "acc-1",
  accountName: "Conta",
  ownerName: "Dono",
  program: "Programa",
  clientId: "c1",
  clientName: "Cliente",
  milesUsed: 1000,
  saleValue: 100,
  costPerMile: 0.05,
  profit: 50,
  profitMargin: 0.5,
  status: "pago",
  date: "2026-07-01",
  ...over,
});

describe("getLastAccountActivity", () => {
  it("retorna a entrada mais recente da conta", () => {
    const entries = [
      baseEntry({ id: "old", date: "2026-06-01" }),
      baseEntry({ id: "new", date: "2026-08-01" }),
    ];
    expect(getLastAccountActivity(entries, [], "acc-1").lastEntry?.id).toBe("new");
  });

  it("ignora entradas com entryStatus aguardando", () => {
    const entries = [
      baseEntry({ id: "confirmed", date: "2026-07-01" }),
      baseEntry({ id: "pending", date: "2026-09-01", entryStatus: "aguardando" }),
    ];
    expect(getLastAccountActivity(entries, [], "acc-1").lastEntry?.id).toBe("confirmed");
  });

  it("ignora vendas canceladas", () => {
    const sales = [
      baseSale({ id: "paid", date: "2026-07-01" }),
      baseSale({ id: "cancelled", date: "2026-09-01", status: "cancelado" }),
    ];
    expect(getLastAccountActivity([], sales, "acc-1").lastSale?.id).toBe("paid");
  });

  it("retorna undefined quando a conta não tem registros", () => {
    const result = getLastAccountActivity([], [], "acc-1");
    expect(result.lastEntry).toBeUndefined();
    expect(result.lastSale).toBeUndefined();
  });

  it("não mistura registros de outras contas", () => {
    const entries = [baseEntry({ id: "other", accountId: "acc-2", date: "2026-09-01" })];
    expect(getLastAccountActivity(entries, [], "acc-1").lastEntry).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/accountActivity.test.ts`
Expected: FAIL — `Cannot find module "@/lib/accountActivity"`

- [ ] **Step 3: Write minimal implementation**

`src/lib/accountActivity.ts`:

```ts
import type { PointEntry, Sale } from "@/types";

export interface AccountActivity {
  lastEntry?: PointEntry;
  lastSale?: Sale;
}

/**
 * Última entrada e última venda válidas de uma conta.
 * Filtro consistente com computedBalances de Contas.tsx:
 * entradas "aguardando" (recorrência futura) e vendas "cancelado" são ignoradas.
 */
export function getLastAccountActivity(
  entries: PointEntry[],
  sales: Sale[],
  accountId: string,
): AccountActivity {
  const validEntries = entries.filter(
    (e) => e.accountId === accountId && e.entryStatus !== "aguardando",
  );
  const validSales = sales.filter((s) => s.accountId === accountId && s.status !== "cancelado");

  let lastEntry: PointEntry | undefined;
  for (const e of validEntries) {
    if (!lastEntry || e.date > lastEntry.date) lastEntry = e;
  }

  let lastSale: Sale | undefined;
  for (const s of validSales) {
    if (!lastSale || s.date > lastSale.date) lastSale = s;
  }

  return { lastEntry, lastSale };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/accountActivity.test.ts`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/accountActivity.ts tests/unit/accountActivity.test.ts
git commit -m "feat: helper de último registro de atividade por conta"
```

---

### Task 2: Último registro no card (Contas.tsx)

**Files:**
- Modify: `src/pages/Contas.tsx`
- Test: `tests/unit/accountActivity.test.ts` (já cobre a lógica — card é consumo)

**Interfaces:**
- Consumes: `getLastAccountActivity` de `@/lib/accountActivity` (Task 1)

- [ ] **Step 1: Adicionar import**

Em `src/pages/Contas.tsx`, junto aos outros imports de `@/lib`:
```ts
import { getLastAccountActivity } from "@/lib/accountActivity";
```

- [ ] **Step 2: Derivar atividade por conta (useMemo)**

Junto ao `computedBalances` (dentro do `useMemo` que já itera `accounts`/`entries`/`sales`), adicionar:
```ts
const lastActivityByAccount = new Map<string, ReturnType<typeof getLastAccountActivity>>();
for (const a of accounts) {
  lastActivityByAccount.set(a.accountId ?? a.id, getLastAccountActivity(entries, sales, a.id));
}
```
> Ajuste: o loop existente usa `a.id` (accounts). Use exatamente:
```ts
const lastActivityByAccount = new Map<string, { lastEntry?: PointEntry; lastSale?: Sale }>();
for (const a of accounts) {
  lastActivityByAccount.set(a.id, getLastAccountActivity(entries, sales, a.id));
}
```
Adicionar `lastActivityByAccount` ao retorno do `useMemo` (deps: `[accounts, entries, sales]`) e desestruturar onde `computedBalances` é desestruturado.

- [ ] **Step 3: Renderizar linhas no card**

Em `Contas.tsx`, no `CardContent`, **após** o bloco da linha "Dono:" e **antes** do `</div>` que fecha o `space-y-2`:

```tsx
<div className="flex items-center justify-between">
  <span className="text-sm text-muted-foreground">Última entrada:</span>
  <span className="text-sm font-medium">
    {lastActivityByAccount.get(account.id)?.lastEntry
      ? new Date(lastActivityByAccount.get(account.id)!.lastEntry!.date).toLocaleDateString("pt-BR")
      : "—"}
  </span>
</div>
<div className="flex items-center justify-between">
  <span className="text-sm text-muted-foreground">Última venda:</span>
  <span className="text-sm font-medium">
    {lastActivityByAccount.get(account.id)?.lastSale
      ? new Date(lastActivityByAccount.get(account.id)!.lastSale!.date).toLocaleDateString("pt-BR")
      : "—"}
  </span>
</div>
```

- [ ] **Step 4: Validar**

Run: `npm run check`
Expected: PASS (typecheck + lint + format)

- [ ] **Step 5: Commit**

```bash
git add src/pages/Contas.tsx
git commit -m "feat: última entrada e última venda no card da conta"
```

---

### Task 3: Migration + types + hooks de alertas

**Files:**
- Create: `supabase/migrations/20260807000000_add_account_alerts.sql`
- Modify: `src/types/index.ts` (adicionar interface `AccountAlert`)
- Create: `src/hooks/useDatabase/alerts.ts`
- Modify: `src/hooks/useDatabase/index.ts` (barrel)

**Interfaces:**
- Produces: `AccountAlert { id, accountId, userId, date, observation, read, createdAt }`; hooks `useAccountAlerts()`, `useAddAccountAlertMutation()`, `useToggleAccountAlertMutation()`

- [ ] **Step 1: Migration**

`supabase/migrations/20260807000000_add_account_alerts.sql`:

```sql
-- Alertas personalizados por conta (data + observação + lido/não lido)
CREATE TABLE IF NOT EXISTS account_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  observation TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE account_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem inserir seus próprios alertas"
  ON account_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios alertas"
  ON account_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios alertas"
  ON account_alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Types**

Em `src/types/index.ts`, após a interface `Account` (ou onde `PointEntry` está), adicionar:

```ts
export interface AccountAlert {
  id: string;
  accountId: string;
  userId: string;
  /** Data do alerta (YYYY-MM-DD — DATE do Postgres) */
  date: string;
  observation: string;
  read: boolean;
  createdAt: string;
}
```

- [ ] **Step 3: Hooks**

`src/hooks/useDatabase/alerts.ts` (padrão de entries.ts — useUserId, supabase, queryClient, toast, logError):

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUserId } from "./shared";
import { logError } from "@/lib/logger";
import type { AccountAlert } from "@/types";

interface AlertRow {
  id: string;
  account_id: string;
  user_id: string;
  date: string;
  observation: string;
  read: boolean;
  created_at: string;
}

function mapAlert(row: AlertRow): AccountAlert {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    date: row.date,
    observation: row.observation,
    read: row.read,
    createdAt: row.created_at,
  };
}

export function useAccountAlerts() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["account_alerts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_alerts")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapAlert);
    },
    enabled: !!userId,
  });
}

export function useAddAccountAlertMutation() {
  const queryClient = useQueryClient();
  const { data: userId } = useUserId(); // useUserId retorna string | undefined
  return useMutation({
    mutationFn: async (alert: { accountId: string; date: string; observation: string }) => {
      const uid = useUserId() as unknown as string;
      const { error } = await supabase.from("account_alerts").insert({
        account_id: alert.accountId,
        user_id: uid,
        date: alert.date,
        observation: alert.observation,
        read: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account_alerts"], refetchType: "all" });
      toast.success("Alerta adicionado");
    },
    onError: (err) => {
      logError("addAccountAlert", err);
      toast.error("Erro ao adicionar alerta");
    },
  });
}

export function useToggleAccountAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase.from("account_alerts").update({ read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account_alerts"], refetchType: "all" });
    },
    onError: (err) => {
      logError("toggleAccountAlert", err);
      toast.error("Erro ao atualizar alerta");
    },
  });
}
```

> ⚠️ **Nota de implementação:** verifique a assinatura real de `useUserId` em `src/hooks/useDatabase/shared.ts` ANTES de escrever as mutations. Se retornar `string | undefined` direto, use:
> ```ts
> const userId = useUserId();
> // dentro do mutationFn:
> if (!userId) throw new Error("Usuário não autenticado");
> ```
> Não chame `useUserId()` dentro do `mutationFn` (hook em loop). Prefira capturar fora.

- [ ] **Step 4: Barrel**

Em `src/hooks/useDatabase/index.ts`, adicionar:

```ts
export {
  useAccountAlerts,
  useAddAccountAlertMutation,
  useToggleAccountAlertMutation,
} from "./alerts";
```

- [ ] **Step 5: Validar**

Run: `npm run check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260807000000_add_account_alerts.sql src/types/index.ts src/hooks/useDatabase/alerts.ts src/hooks/useDatabase/index.ts
git commit -m "feat: migration, types e hooks de alertas por conta"
```

---

### Task 4: AccountAlertsDialog + teste unitário

**Files:**
- Create: `src/components/AccountAlertsDialog.tsx`
- Test: `src/components/tests/AccountAlertsDialog.test.tsx`

**Interfaces:**
- Consumes: `useAccountAlerts`, `useAddAccountAlertMutation`, `useToggleAccountAlertMutation` (Task 3)
- Produces: `AccountAlertsDialog({ account: Account; open: boolean; onOpenChange: (open: boolean) => void })`

- [ ] **Step 1: Write the failing test**

`src/components/tests/AccountAlertsDialog.test.tsx` (padrão do `GlobalSearch.test.tsx` — mock de hooks):

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccountAlertsDialog } from "@/components/AccountAlertsDialog";
import type { Account } from "@/types";

const account: Account = {
  id: "acc-1",
  name: "Conta Teste",
  ownerId: "own-1",
  programId: "prog-1",
  type: "milhas",
  balance: 1000,
  status: "ativa",
  createdAt: "2026-01-01",
};

const alertas = [
  { id: "al-1", accountId: "acc-1", userId: "u-1", date: "2026-08-10", observation: "Renovar clube", read: false, createdAt: "2026-08-07" },
];

vi.mock("@/hooks/useDatabase", () => ({
  useAccountAlerts: () => ({ data: alertas, isLoading: false }),
  useAddAccountAlertMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleAccountAlertMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("AccountAlertsDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista alertas da conta com data e observação", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={() => {}} />);
    expect(screen.getByText("Renovar clube")).toBeDefined();
    expect(screen.getByText(/10\/08\/2026/)).toBeDefined();
  });

  it("mostra badge de não lido", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={() => {}} />);
    expect(screen.getByText("Não lido")).toBeDefined();
  });

  it("renderiza form com data e observação", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={() => {}} />);
    expect(screen.getByLabelText(/Data/)).toBeDefined();
    expect(screen.getByLabelText(/Observação/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/tests/AccountAlertsDialog.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implementar componente**

`src/components/AccountAlertsDialog.tsx` (padrão de dialog do projeto — ver `AccountDialog.tsx` para a API do Dialog; usar `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` de `@/components/ui/dialog`; `Badge` de `@/components/ui/badge`; `Button`, `Input`, `Textarea`; `Switch` de `@/components/ui/switch`; `Bell` de lucide-react):

```tsx
import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAccountAlerts, useAddAccountAlertMutation, useToggleAccountAlertMutation } from "@/hooks/useDatabase";
import type { Account } from "@/types";

interface AccountAlertsDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountAlertsDialog({ account, open, onOpenChange }: AccountAlertsDialogProps) {
  const { data: alertas = [] } = useAccountAlerts();
  const addAlertM = useAddAccountAlertMutation();
  const toggleAlertM = useToggleAccountAlertMutation();

  const [date, setDate] = useState("");
  const [observation, setObservation] = useState("");

  const accountAlerts = alertas.filter((a) => a.accountId === account.id);

  const handleAdd = () => {
    if (!date || !observation.trim()) return;
    addAlertM.mutate(
      { accountId: account.id, date, observation: observation.trim() },
      { onSuccess: () => { setDate(""); setObservation(""); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Alertas — {account.name}
          </DialogTitle>
          <DialogDescription>
            Registre lembretes personalizados para esta conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            <label htmlFor="alert-date" className="text-sm font-medium">Data</label>
            <Input id="alert-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="alert-observation" className="text-sm font-medium">Observação</label>
            <Textarea
              id="alert-observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Renovar clube no dia 15"
              rows={3}
            />
          </div>
          <Button onClick={handleAdd} disabled={!date || !observation.trim() || addAlertM.isPending} className="w-full">
            Adicionar alerta
          </Button>
        </div>

        <div className="space-y-2 pt-2 border-t">
          {accountAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum alerta para esta conta.
            </p>
          ) : (
            accountAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {new Date(alert.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-muted-foreground">{alert.observation}</p>
                  <Badge variant={alert.read ? "secondary" : "default"}>
                    {alert.read ? "Lida" : "Não lido"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Lida</span>
                  <Switch
                    checked={alert.read}
                    onCheckedChange={(checked) => toggleAlertM.mutate({ id: alert.id, read: checked })}
                    aria-label={`Marcar alerta como ${alert.read ? "não lida" : "lida"}`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

> ⚠️ **Nota:** confira os exports reais de `@/components/ui/dialog`, `@/components/ui/textarea` e `@/components/ui/switch` (padrão shadcn). Ajuste nomes se necessário.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/tests/AccountAlertsDialog.test.tsx`
Expected: 3 passed

- [ ] **Step 5: Validar + commit**

```bash
npm run check
git add src/components/AccountAlertsDialog.tsx src/components/tests/AccountAlertsDialog.test.tsx
git commit -m "feat: dialog de alertas por conta"
```

---

### Task 5: Bell + badge de não lidos no card

**Files:**
- Modify: `src/pages/Contas.tsx`

**Interfaces:**
- Consumes: `AccountAlertsDialog` (Task 4), `useAccountAlerts` (Task 3)

- [ ] **Step 1: Imports**

Em `src/pages/Contas.tsx`:
```ts
import { Bell } from "lucide-react";
import { AccountAlertsDialog } from "@/components/AccountAlertsDialog";
import { useAccountAlerts } from "@/hooks/useDatabase";
```

- [ ] **Step 2: Estado + dados**

Junto aos outros `useState`:
```ts
const [alertsAccount, setAlertsAccount] = useState<Account | null>(null);
```
E no corpo da página:
```ts
const { data: allAlerts = [] } = useAccountAlerts();
```
Contagem de não lidos por conta (pode ser calculada inline no map):
```ts
const unreadCount = (accountId: string) =>
  allAlerts.filter((a) => a.accountId === accountId && !a.read).length;
```

- [ ] **Step 3: Bell no header do card**

No `CardHeader` de `Contas.tsx`, dentro do `div.flex.items-center.gap-2` (junto aos badges de tipo/status), adicionar ANTES dos badges:

```tsx
<button
  type="button"
  className="relative inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted transition-colors"
  onClick={() => setAlertsAccount(account)}
  aria-label={`Alertas de ${account.name}`}
  title="Alertas da conta"
>
  <Bell className="h-4 w-4" />
  {unreadCount(account.id) > 0 && (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white px-1">
      {unreadCount(account.id)}
    </span>
  )}
</button>
```

- [ ] **Step 4: Dialog no JSX**

Após o segundo `AccountDialog` (perto do final do componente, antes do fechamento):

```tsx
<AccountAlertsDialog
  account={alertsAccount!}
  open={alertsAccount !== null}
  onOpenChange={(open) => { if (!open) setAlertsAccount(null); }}
/>
```
> ⚠️ Renderizar condicionalmente para não passar `null`:
```tsx
{alertsAccount && (
  <AccountAlertsDialog
    account={alertsAccount}
    open
    onOpenChange={(open) => { if (!open) setAlertsAccount(null); }}
  />
)}
```

- [ ] **Step 5: Validar + commit**

```bash
npm run check
git add src/pages/Contas.tsx
git commit -m "feat: bell com badge de alertas não lidos no card da conta"
```

---

### Task 6: E2E de alertas + teste manual local (exigência do usuário)

**Files:**
- Create: `tests/alerts.spec.ts`

**Interfaces:**
- Consumes: fluxo real — criar conta e2e, abrir card, Bell, dialog, badge, toggle, reload

- [ ] **Step 1: Escrever teste e2e**

`tests/alerts.spec.ts` (seguir helpers existentes de `tests/entradas.spec.ts` — usuário efêmero, login, criação de conta; verificar nomes/locators reais da página Contas antes):

```ts
import { test, expect } from "@playwright/test";
// importar helpers de auth/conta do padrão dos specs existentes (ex: loginAsNewUser, createAccount)

test.describe("Alertas por conta", () => {
  test("cria alerta, badge de não lido, marca lido e persiste", async ({ page }) => {
    // 1. login com usuário efêmero
    // 2. navegar para /contas
    // 3. criar conta e2e (ou reusar fluxo de entradas.spec)
    // 4. clicar no Bell do card da conta (aria-label `Alertas de ${nome}`)
    // 5. preencher data + observação, clicar "Adicionar alerta"
    // 6. fechar dialog → badge "1" visível no card
    // 7. reabrir → marcar Switch como lida → badge "Não lido" vira "Lida"
    // 8. fechar → badge some
    // 9. reload → reabrir → alerta persiste com "Lida"
  });
});
```

> ⚠️ **Antes de escrever:** copie o padrão exato de login + criação de conta dos specs existentes (`tests/entradas.spec.ts` / `tests/origem-tipo.spec.ts`) — usuário efêmero `test_${Date.now()}@teste.com`, credenciais do Supabase, navegação com `page.goto`).

- [ ] **Step 2: Rodar teste dirigido no servidor local**

Run: `npm run dev` (outro terminal) + `npx playwright test tests/alerts.spec.ts`
Expected: PASS (criação real no Supabase de staging/prod — regra #24/#25)

- [ ] **Step 3: Rodar suíte e2e completa local**

Run: `npx playwright test`
Expected: 62+ testes passando (retries absorvem flaky conhecido de entradas)

- [ ] **Step 4: Commit**

```bash
git add tests/alerts.spec.ts
git commit -m "test: e2e de alertas por conta"
```

---

### Task 7: PRD — pre-pr, PR, merge, deploy

- [ ] **Step 1: Atualizar handoff**

`docs/handoff.md` — marcar progresso dos 2 itens (Done/In Progress), branch atual.

- [ ] **Step 2: pre-pr**

```bash
git add -A
npm run pre-pr
```
Expected: relatório HTML gerado + todas as regras passando (rule-14, 15, 16, 17, 19, 22, 23, 26, 27, 28, 29, 30, 31, 32, 36). Corrigir falhas se houver.

- [ ] **Step 3: PR**

```bash
git push -u origin <branch>
gh pr create --title "feat contas — último registro no card + alertas por conta" --body "..."
```
→ CI green → auto-merge → deploy (monitorar `gh run list --workflow=deploy.yml`)

- [ ] **Step 4: Registrar evento + encerrar**

`npm run event-log "session:end"` (meta: prs, itens concluídos) + atualizar handoff final.
