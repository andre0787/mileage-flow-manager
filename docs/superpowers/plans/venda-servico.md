# Venda standalone de serviço — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vender serviços sem milhas (consultoria/taxa) como venda standalone com `sale_kind='servico'`, receita pura, fora dos KPIs de milhagem.

**Architecture:** Discriminador `sale_kind` no banco + validação server-side nos endpoints existentes + helper puro `validateSaleKind` + filtro de kind nos agregados de métricas + modo Serviço no `SaleForm`. Nenhum endpoint novo; recebimento/crédito/estorno reaproveitados sem mudança.

**Tech Stack:** React + TS, RTK Query (`vendasApi`), Supabase (migration SQL), Vitest.

## Global Constraints

- NUNCA editar migration existente — só criar nova (rule-43).
- Todo `invalidateQueries` com `refetchType: 'all'` (rule-19).
- Sem `console.log`; sem `as any` injustificado; pt-BR na UI.
- Lucro sempre recalculado server-side (anti-forgery, padrão atual).
- pre-pr 0 errors + review por subagente antes do PR (rules 38/39).

---

### Task 1: Migration `sale_kind` + `service_type` + `observations`

**Files:**
- Create: `supabase/migrations/20260906000000_venda_servico.sql`
- Test: aplicar local / `npx supabase db diff` sem erro (ou CI como gate)

**Interfaces:**
- Consumes: tabela `sales` existente.
- Produces: colunas `sale_kind text NOT NULL DEFAULT 'milhas'`, `service_type text NULL`, `observations text NULL`, constraint `sales_kind_check`.

- [ ] **Step 1: Escrever a migration**

```sql
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_kind text NOT NULL DEFAULT 'milhas';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS service_type text NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS observations text NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_kind_check') THEN
    ALTER TABLE sales ADD CONSTRAINT sales_kind_check
      CHECK (sale_kind IN ('milhas', 'servico'));
  END IF;
END $$;
```

- [ ] **Step 2: Verificar colisão de timestamp**

Run: `ls supabase/migrations/ | tail -3`
Expected: nenhum arquivo `20260906000000_*` além do criado (último conhecido: `20260905000000_fix_security_linter_warnings.sql`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260906000000_venda_servico.sql
git commit -m "feat(vendas): migration sale_kind/service_type/observations"
```

---

### Task 2: Tipos + mapper

**Files:**
- Modify: `src/types/index.ts` (interface `Sale`, após `ticketLocator`)
- Modify: `src/features/vendas/shared.ts` (tipos `Sale`/`VendaUpdate` espelhados, se existirem lá)
- Modify: `src/hooks/useDatabase/mappers.ts` (mapeamento da venda)
- Test: `tests/unit/mappers-servico.test.ts` (novo — não há testes de mapper hoje)

**Interfaces:**
- Consumes: colunas `sale_kind`, `service_type`, `observations`.
- Produces: `SaleKind = "milhas" | "servico"`, `ServiceType = "consultoria" | "taxa" | "outro"`, campos `Sale.kind` (default `'milhas'` quando NULL), `Sale.serviceType?`, `Sale.observations?`.

- [ ] **Step 1: Adicionar tipos**

```ts
export type SaleKind = "milhas" | "servico";
export type ServiceType = "consultoria" | "taxa" | "outro";
// em Sale:
kind: SaleKind;
serviceType?: ServiceType;
observations?: string;
```

- [ ] **Step 2: Mapear no mapper (default 'milhas' p/ linhas antigas)**

```ts
kind: (row.sale_kind ?? "milhas") as SaleKind,
serviceType: row.service_type ?? undefined,
observations: row.observations ?? undefined,
```

(função exata: `mapSale` em `src/hooks/useDatabase/mappers.ts:115`; campos snake_case `sale_kind`, `service_type`, `observations`.)

- [ ] **Step 3: Teste do mapper**

```ts
it("default kind=milhas quando sale_kind é NULL", () => {
  expect(mapSale({ ...baseRow, sale_kind: null }).kind).toBe("milhas");
});
```

- [ ] **Step 4: Rodar e commitar**

Run: `npx vitest run tests/unit/mappers-servico.test.ts`
Expected: PASS.
```bash
git add src/types/index.ts src/features/vendas/shared.ts src/hooks/useDatabase/mappers.ts tests/unit/mappers-servico.test.ts
git commit -m "feat(vendas): tipos kind/serviceType/observations + mapper"
```

---

### Task 3: Helper puro `validateSaleKind` + testes

**Files:**
- Create: `src/lib/saleKind.ts`
- Test: `tests/unit/saleKind.test.ts`

**Interfaces:**
- Consumes: nada (puro).
- Produces: `validateSaleKind(input: { kind, milesUsed, accountId, saleValue, clientId, serviceType, pricePerMile, additionalCosts? }): string[]` — retorna lista de mensagens de erro (vazia = válido). Mensagens em pt-BR.

- [ ] **Step 1: Escrever testes RED**

```ts
import { describe, it, expect } from "vitest";
import { validateSaleKind } from "@/lib/saleKind";

describe("validateSaleKind", () => {
  it("servico válido passa", () => {
    expect(validateSaleKind({
      kind: "servico", milesUsed: 0, accountId: null,
      saleValue: 500, clientId: "c1", serviceType: "consultoria",
      pricePerMile: null,
    })).toEqual([]);
  });
  it("servico com milhas falha", () => {
    const errs = validateSaleKind({
      kind: "servico", milesUsed: 100, accountId: null,
      saleValue: 500, clientId: "c1", serviceType: "taxa",
      pricePerMile: null,
    });
    expect(errs.length).toBeGreaterThan(0);
  });
  it("servico com conta falha", () => {
    const errs = validateSaleKind({
      kind: "servico", milesUsed: 0, accountId: "a1",
      saleValue: 500, clientId: "c1", serviceType: "outro",
      pricePerMile: null,
    });
    expect(errs.length).toBeGreaterThan(0);
  });
  it("milhas sem miles falha", () => {
    const errs = validateSaleKind({
      kind: "milhas", milesUsed: 0, accountId: "a1",
      saleValue: 100, clientId: "c1", serviceType: null,
      pricePerMile: 16,
    });
    expect(errs.length).toBeGreaterThan(0);
  });
  it("milhas com observations falha", () => {
    const errs = validateSaleKind({
      kind: "milhas", milesUsed: 100, accountId: "a1",
      saleValue: 100, clientId: "c1", serviceType: null,
      pricePerMile: 16, observations: "x",
    });
    expect(errs.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/saleKind.test.ts`
Expected: FAIL ("Cannot find module '@/lib/saleKind'").

- [ ] **Step 3: Implementação mínima**

```ts
import type { SaleKind, ServiceType } from "@/types";

export interface SaleKindInput {
  kind: SaleKind;
  milesUsed: number;
  accountId?: string | null;
  saleValue: number;
  clientId?: string | null;
  serviceType?: ServiceType | null;
  pricePerMile?: number | null;
  observations?: string | null;
}

export function validateSaleKind(input: SaleKindInput): string[] {
  const errs: string[] = [];
  if (input.kind === "servico") {
    if (Number(input.milesUsed) !== 0) errs.push("Venda de serviço não usa milhas.");
    if (input.accountId) errs.push("Venda de serviço não vincula conta.");
    if (!(Number(input.saleValue) > 0)) errs.push("Informe o valor do serviço.");
    if (!input.clientId) errs.push("Informe o cliente.");
    if (!input.serviceType) errs.push("Informe o tipo de serviço.");
    if (input.pricePerMile != null) errs.push("Venda de serviço não tem valor por milha.");
  } else {
    if (!(Number(input.milesUsed) > 0)) errs.push("Informe as milhas utilizadas.");
    if (input.serviceType) errs.push("Tipo de serviço é só para venda-serviço.");
    if (input.observations?.trim()) errs.push("Observações são só para venda-serviço.");
  }
  return errs;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/saleKind.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/saleKind.ts tests/unit/saleKind.test.ts
git commit -m "feat(vendas): validateSaleKind puro + testes"
```

---

### Task 4: Validação no `addVenda`

**Files:**
- Modify: `src/features/vendas/addVenda.ts` (após `if (!user)`, antes de custos)
- Test: estender `tests/unit/features-vendas-api.test.ts` (seguir o padrão de mock existente — ler o arquivo antes)

**Interfaces:**
- Consumes: `validateSaleKind` (Task 3), campos `kind/serviceType/observations` do input.
- Produces: insert com `sale_kind`, `service_type`, `observations`, `price_per_mile: NULL` quando servico; lucro = `calcProfit(saleValue, 0, 0, 0)` (= saleValue).

- [ ] **Step 1: Teste RED (rejeita servico com miles>0)**

Seguir o padrão de mock de `tests/unit/features-vendas-api.test.ts` (ler o arquivo; o mock de `supabase.from` já existe lá). Caso: input servico com `milesUsed: 100` → espera erro contendo "não usa milhas" e `insert` nunca chamado.

- [ ] **Step 2: Implementar no endpoint**

```ts
const kindErrors = validateSaleKind({
  kind: sale.kind ?? "milhas",
  milesUsed: Number(sale.milesUsed ?? 0),
  accountId: sale.accountId ?? null,
  saleValue: Number(sale.saleValue),
  clientId: sale.clientId,
  serviceType: sale.serviceType ?? null,
  pricePerMile: sale.pricePerMile ?? null,
  observations: sale.observations ?? null,
});
if (kindErrors.length > 0) return { error: toQueryError({ message: kindErrors[0] }) };
```

No insert, acrescentar: `sale_kind: sale.kind ?? "milhas"`, `service_type: sale.serviceType ?? null`, `observations: (sale.observations ?? "").trim() || null`, e `price_per_mile: kind === "servico" ? null : sale.pricePerMile`. O `calcProfit` existente com miles=0/custo=0 já retorna `saleValue` — não duplicar fórmula.

- [ ] **Step 3: Rodar testes**

Run: `npx vitest run tests/unit/features-vendas-api.test.ts tests/unit/saleKind.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/vendas/addVenda.ts tests/unit/features-vendas-api.test.ts
git commit -m "feat(vendas): validacao kind no addVenda + insert servico"
```

---

### Task 5: `updateVenda` com kind imutável

**Files:**
- Modify: `src/features/vendas/updateVenda.ts`
- Test: `tests/unit/features-vendas-api.test.ts` (casos: troca de kind rejeitada; edição de observations permitida)

**Interfaces:**
- Consumes: `validateSaleKind`, `oldSale.sale_kind`.
- Produces: erro `"Tipo da venda não pode ser alterado."` se `data.kind` presente e diferente do banco; `service_type`/`observations` editáveis; resto do fluxo (restore/aplica conta) inalterado — com `account_id` NULL os blocos de conta já são pulados (`if (oldAccountId && ...)`, `if (newAccountId && ...)`).

- [ ] **Step 1: Teste RED** — update com `kind: 'servico'` numa venda `milhas` → erro; update só de `observations` numa servico → ok.
- [ ] **Step 2: Implementar** — após o fetch do `oldSale`, comparar e rejeitar; mapear `serviceType → service_type`, `observations → observations` (trim, NULL se vazio) no `updateData`.
- [ ] **Step 3: Rodar** — `npx vitest run tests/unit/features-vendas-api.test.ts` → PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(vendas): kind imutavel no updateVenda"`.

---

### Task 6: Isolamento dos KPIs + `totalServiceRevenue`

**Files:**
- Modify: `src/lib/metrics.ts` (`computeDashboardMetrics`, `computeMetricHistory`)
- Test: `tests/unit/metrics.test.ts` (ou arquivo dedicado `tests/unit/metrics-servico.test.ts` se o existente for grande — verificar antes)

**Interfaces:**
- Consumes: `Sale.kind` (default `'milhas'` quando ausente — linhas antigas/mocks sem kind continuam funcionando).
- Produces: agregados de milhagem calculados só sobre `kind === 'milhas'`; `totalServiceRevenue(sales: {kind?, status?, saleValue?}[]): number` (soma `saleValue` das servico não-canceladas).

- [ ] **Step 1: Teste RED**

```ts
it("exclui servico dos KPIs de milhagem", () => {
  const sales = [
    { kind: "milhas", status: "concluido", milesUsed: 1000, saleValue: 500, profit: 100, ... },
    { kind: "servico", status: "concluido", milesUsed: 0, saleValue: 300, profit: 300, ... },
  ];
  // totalSoldMiles deve ser 1000 (não 1000+0 irrelevante) e totalRevenue 500 (não 800)
});
it("totalServiceRevenue soma só servico não-cancelada", () => {
  expect(totalServiceRevenue([...])).toBe(300);
});
```

(Completar os campos exigidos pelos tipos `MetricSale`; ver `metrics.ts:120-150`.)

- [ ] **Step 2: Implementar** — no topo dos agregados: `const milesSales = sls.filter(s => (s.kind ?? "milhas") === "milhas")` e usar `milesSales` em `totalSoldMiles/totalRevenue/totalProfit/avg*` e nas séries mensais; exportar `totalServiceRevenue`.
- [ ] **Step 3: Rodar suite de métricas completa** — `npx vitest run tests/unit/metrics.test.ts tests/unit/metrics-p2-21.test.ts` (nomes da suite atual; ajustar se divergir) → PASS sem regressão.
- [ ] **Step 4: Commit** — `git commit -m "feat(vendas): KPIs de milhagem excluem servico"`.

---

### Task 7: Modo Serviço no `SaleForm`

**Files:**
- Modify: `src/components/SaleForm.tsx` (toggle + campos condicionais + submit)
- Modify: `src/types/index.ts` — NÃO (já feito na Task 2); estender `SaleFormData` aqui: `kind: "milhas" | "servico"; serviceType?: string; observations?: string`.

**Interfaces:**
- Consumes: `SaleFormData` estendido.
- Produces: submit com `{ kind: 'servico', milesUsed: 0, accountId: "", accountName: "", ownerName: "", program: "", pricePerMile: undefined, costPerMile: 0, additionalCosts: [], ticketLocator: "", passengers: [] }` + cliente + serviceType + saleValue + observations + date.

- [ ] **Step 1: Toggle Milhas|Serviço** no topo do drawer; ao trocar para Serviço, limpar campos de milhas (evita payload misto).
- [ ] **Step 2: Campos condicionais** — Serviço esconde dono/conta/programa/milhas/preço/custos/passageiros/localizador; mostra tipo de serviço (Select: Consultoria, Taxa de embarque, Outro), valor, observações (textarea, max 500), data. Preview: `Lucro R$ X (100%)`.
- [ ] **Step 3: Submit** — montar payload conforme Produces; validação client-side mínima (cliente, tipo, valor>0) com mensagens pt-BR; erros do servidor via toast existente.
- [ ] **Step 4: Teste manual guiado** (sem E2E novo): `npm run dev`, criar venda-serviço, conferir badge/lucro/extrato; registrar evidência no commit? Não — apenas relatar ao revisor.
- [ ] **Step 5: Commit** — `git commit -m "feat(vendas): modo Servico no SaleForm"`.

---

### Task 8: Listagem (badge + CSV)

**Files:**
- Modify: `src/components/sales/SaleTableRow.tsx` (badge `Serviço`, coluna programa → serviceType label)
- Modify: `src/components/sales/SaleMobileCard.tsx` (mesmo tratamento — verificar arquivo)
- Modify: `src/pages/Vendas.tsx` (export CSV: colunas Tipo e Observações)

**Interfaces:**
- Consumes: `sale.kind`, `sale.serviceType`, `sale.observations`.
- Produces: UI sem "1 pax"/programa vazio para servico.

- [ ] **Step 1-3: Badge, coluna, CSV** (seguir padrão do badge `Crédito` existente).
- [ ] **Step 4: Commit** — `git commit -m "feat(vendas): badge Servico + CSV com tipo/observacoes"`.

---

### Task 9: Gates finais

- [ ] **Step 1: Rodar suite relevante**

Run: `npx tsc --noEmit && npx vitest run tests/unit/saleKind.test.ts tests/unit/features-vendas-api.test.ts tests/unit/metrics.test.ts`
Expected: tsc EXIT 0, todos PASS.

- [ ] **Step 2: Registrar evidência de codificação por subagente**

Run: `node scripts/event-log.mjs coding:done "Codificação venda-servico por subagente" --meta '{"subagent":true,"skill":"subagent-driven-development"}'`

- [ ] **Step 3: Pedir review** (requesting-code-review por subagente — fase do workflow principal, não desta task).
