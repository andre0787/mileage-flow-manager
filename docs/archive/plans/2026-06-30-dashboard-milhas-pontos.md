# Dashboard: Milhas/Pontos Tab Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tab switcher (Milhas/Pontos) to Dashboard with data filtered by account type and correct terminology.

**Architecture:** Add `activeTab` state + filtered data memoization in Dashboard.tsx. Pass `unitLabel` to FlowMap and `hideBarChart`/`titleLabel` to DashboardCharts for dynamic labeling. No new components, no new files.

**Tech Stack:** React, shadcn/ui Tabs, Tailwind

---

### Task 1: DashboardCharts — add optional props for dynamic labeling

**Files:**
- Modify: `src/components/DashboardCharts.tsx`

- [ ] **Step 1: Add props interface changes**

```typescript
interface DashboardChartsProps {
  programData: ProgramData[]
  monthlySales: MonthlyData[]
  unitLabel?: string  // "Milhas" | "Pontos"
  hideBarChart?: boolean
}
```

Default `unitLabel` to `"Milhas"`, `hideBarChart` to `false` in destructuring:

```typescript
export function DashboardCharts({ programData, monthlySales, unitLabel = "Milhas", hideBarChart = false }: DashboardChartsProps) {
```

- [ ] **Step 2: Change pie chart title to use unitLabel**

Replace `"Milhas por Programa"` with:

```tsx
<CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
  <PieChartIcon className="h-4 w-4 text-primary" />
  {unitLabel} por Programa
</CardTitle>
```

- [ ] **Step 3: Conditionally render bar chart**

Wrap the bar chart Card in:

```tsx
{!hideBarChart && (
  <Card className="overflow-hidden">
    ...
  </Card>
)}
```

- [ ] **Step 4: Verify build**

Run: `npm run lint`
Expected: No errors

---

### Task 2: FlowMap — add optional unitLabel prop

**Files:**
- Modify: `src/components/FlowMap.tsx`

- [ ] **Step 1: Add unitLabel to FlowMapProps**

```typescript
interface FlowMapProps {
  totalMiles: number;
  activeAccounts: number;
  totalSoldMiles: number;
  totalRevenue: number;
  ownersCount: number;
  className?: string;
  unitLabel?: string;
}
```

- [ ] **Step 2: Destructure with default and use it**

```typescript
export function FlowMap({
  totalMiles,
  activeAccounts,
  totalSoldMiles,
  totalRevenue,
  ownersCount,
  className,
  unitLabel = "Milhas",
}: FlowMapProps) {
```

Change nodes to use `unitLabel`:

```typescript
const nodes: FlowNode[] = useMemo(() => [
  {
    id: "miles",
    label: `${unitLabel} em Estoque`,
    value: totalMiles.toLocaleString("pt-BR"),
    icon: Coins,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    id: "accounts",
    label: "Contas Ativas",
    value: activeAccounts.toString(),
    icon: Users,
    color: "text-teal",
    bg: "bg-teal/10",
    border: "border-teal/20",
  },
  {
    id: "sold",
    label: `${unitLabel} Vendidas`,
    value: totalSoldMiles.toLocaleString("pt-BR"),
    icon: TrendingUp,
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/20",
  },
  {
    id: "revenue",
    label: "Receita Total",
    value: `R$ ${totalRevenue.toLocaleString("pt-BR")}`,
    icon: DollarSign,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
], [totalMiles, activeAccounts, totalSoldMiles, totalRevenue, unitLabel]);
```

Change the title:

```tsx
<h3 className="text-sm font-semibold text-foreground font-display">Fluxo de {unitLabel}</h3>
```

- [ ] **Step 3: Verify build**

Run: `npm run lint`
Expected: No errors

---

### Task 3: Dashboard — add tab state and filtered data

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add imports**

Add to existing imports:

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
```

- [ ] **Step 2: Add activeTab state**

After `const { owners, accounts, programs, sales, entries } = useData();`:

```typescript
const [activeTab, setActiveTab] = useState<"milhas" | "pontos">("milhas");
```

- [ ] **Step 3: Add filtered data arrays**

After the `useState` line:

```typescript
const milhasAccounts = useMemo(() => accounts.filter(a => a.type === "milhas"), [accounts]);
const pontosAccounts = useMemo(() => accounts.filter(a => a.type === "pontos"), [accounts]);

const milhasSales = useMemo(
  () => sales.filter(s => {
    if (!s.accountId) return false;
    const acct = accounts.find(a => a.id === s.accountId);
    return acct?.type === "milhas";
  }),
  [sales, accounts]
);

const pontosSales = useMemo(() => [], []);

const milhasEntries = useMemo(
  () => entries.filter(e => {
    const acct = accounts.find(a => a.id === e.accountId);
    return acct?.type === "milhas";
  }),
  [entries, accounts]
);

const pontosEntries = useMemo(
  () => entries.filter(e => {
    const acct = accounts.find(a => a.id === e.accountId);
    return acct?.type === "pontos";
  }),
  [entries, accounts]
);

const currentAccounts = activeTab === "milhas" ? milhasAccounts : pontosAccounts;
const currentSales = activeTab === "milhas" ? milhasSales : pontosSales;
const currentEntries = activeTab === "milhas" ? milhasEntries : pontosEntries;
const unitLabel = activeTab === "milhas" ? "Milhas" : "Pontos";
```

- [ ] **Step 4: Refactor metrics to accept filtered data**

Extract a `computeMetrics` function (place before `const metrics`):

```typescript
const computeMetrics = useCallback((accounts: Account[], sales: Sale[], entries: PointEntry[]) => {
  const activeSales = sales.filter(s => s.status !== "cancelado");
  const totalMiles = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalInvested = accounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
  const activeAccounts = accounts.filter(a => a.status === "ativa").length;
  const pendingSales = activeSales.filter(s => s.status === "pendente").length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlySales = activeSales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.saleValue, 0);
  const monthlyProfit = monthlySales.reduce((sum, s) => sum + s.profit, 0);
  const totalSoldMiles = activeSales.reduce((sum, s) => sum + s.milesUsed, 0);
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.saleValue, 0);
  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);
  const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const avgCostPerMile = totalMiles > 0 ? totalInvested / totalMiles : 0;

  const monthlyEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyMilesIn = monthlyEntries.reduce((sum, e) => sum + e.miles ?? e.amount, 0);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthSales = activeSales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  });
  const prevRevenue = prevMonthSales.reduce((sum, s) => sum + s.saleValue, 0);
  const revenueChange = prevRevenue > 0 ? ((monthlyRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const cpfAlerts = owners.filter(o => {
    const ownerAccountIds = accounts.filter(a => a.ownerId === o.id).map(a => a.id);
    const ownerSales = activeSales.filter(s => ownerAccountIds.includes(s.accountId ?? ""));
    const usedCpfs = new Set(ownerSales.flatMap(s => s.passengers.map(p => p.cpf)));
    return usedCpfs.size >= MAX_CPF_PER_OWNER - 4;
  }).length;

  return {
    totalMiles, totalInvested, monthlyRevenue, monthlyProfit,
    activeAccounts, pendingSales, cpfAlerts,
    totalSoldMiles, totalRevenue, totalProfit,
    avgProfitMargin, avgCostPerMile, monthlyMilesIn, revenueChange,
  };
}, [owners]);
```

Add import for `useCallback` at top:

```typescript
import { useState, useMemo, useCallback } from "react";
```

And import the types:

```typescript
import type { Account, Sale, PointEntry } from "@/types";
```

- [ ] **Step 5: Replace metrics useMemo**

Replace the existing `const metrics = useMemo(...)` with:

```typescript
const currentMetrics = useMemo(
  () => computeMetrics(currentAccounts, currentSales, currentEntries),
  [computeMetrics, currentAccounts, currentSales, currentEntries]
);

// Financial metrics always from milhas (revenue only comes from miles)
const financialMetrics = useMemo(
  () => computeMetrics(milhasAccounts, milhasSales, milhasEntries),
  [computeMetrics, milhasAccounts, milhasSales, milhasEntries]
);
```

- [ ] **Step 6: Update ownerData to filter by type**

Change to:

```typescript
const ownerData = useMemo(() => {
  return owners.map(owner => {
    const ownerAccounts = currentAccounts.filter(a => a.ownerId === owner.id);
    const ownerAccountIds = ownerAccounts.map(a => a.id);
    const totalMiles = ownerAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalInvested = ownerAccounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
    const programIds = [...new Set(ownerAccounts.map(a => a.programId))];
    const programNames = programIds.map(id => programs.find(p => p.id === id)?.name ?? id);
    const ownerSales = currentSales.filter(s => s.status !== "cancelado" && ownerAccountIds.includes(s.accountId ?? ""));
    const usedCpfs = new Set(ownerSales.flatMap(s => s.passengers.map(p => p.cpf)));
    return { owner: owner.name, programs: programNames, totalMiles, totalInvested, cpfCount: usedCpfs.size, maxCpf: MAX_CPF_PER_OWNER };
  });
}, [owners, currentAccounts, programs, currentSales]);
```

- [ ] **Step 7: Update recentSales to filter by type**

Change to:

```typescript
const recentSales = useMemo(() => {
  return [...currentSales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map(s => ({
      ...
    }));
}, [currentSales]);
```

- [ ] **Step 8: Update programData to filter by type**

Change to:

```typescript
const programData = useMemo(() => {
  const programMap = new Map<string, number>();
  currentAccounts.forEach(a => {
    const progName = programs.find(p => p.id === a.programId)?.name ?? "Desconhecido";
    programMap.set(progName, (programMap.get(progName) ?? 0) + a.balance);
  });
  return Array.from(programMap.entries()).map(([name, value]) => ({ name, value, color: "hsl(230 65% 50%)" }));
}, [currentAccounts, programs]);
```

- [ ] **Step 9: Update monthlySales to filter by type**

Change to:

```typescript
const monthlySales = useMemo(() => {
  const monthMap = new Map<string, { vendas: number; lucro: number }>();
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  currentSales.filter(s => s.status !== "cancelado").forEach(s => {
    ...
  });
  ...
}, [currentSales]);
```

- [ ] **Step 10: Add recentEntries for Pontos tab**

```typescript
const recentEntries = useMemo(() => {
  return [...currentEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map(e => ({
      id: e.id,
      amount: e.amount,
      accountName: accounts.find(a => a.id === e.accountId)?.name ?? "",
    }));
}, [currentEntries, accounts]);
```

- [ ] **Step 11: Wrap layout in Tabs**

Around the entire JSX return, add:

```tsx
<div className="space-y-6">
  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "milhas" | "pontos")}>
    <TabsList>
      <TabsTrigger value="milhas" className="gap-2">
        <TrendingDown className="h-4 w-4" />
        Milhas
      </TabsTrigger>
      <TabsTrigger value="pontos" className="gap-2">
        <TrendingUp className="h-4 w-4" />
        Pontos
      </TabsTrigger>
    </TabsList>

    <TabsContent value="milhas" className="space-y-6 mt-6">
      {/* existing dashboard content */}
    </TabsContent>

    <TabsContent value="pontos" className="space-y-6 mt-6">
      {/* pontos-optimized content */}
    </TabsContent>
  </Tabs>
</div>
```

- [ ] **Step 12: Verify build**

Run: `npm run lint`
Expected: No errors

---

### Task 4: Dashboard — Milhas tab content adaptations

- [ ] **Step 1: Replace `metrics` references with `currentMetrics` and `financialMetrics`**

In the Milhas tab:
- Hero: use `currentMetrics` for volume, `financialMetrics` for financial stats
- FlowMap: pass `unitLabel="Milhas"`, use `currentMetrics` values
- Charts: pass `unitLabel="Milhas"`, `hideBarChart={false}`
- Metric cards: use `financialMetrics` for financial cards, `currentMetrics` for volume cards
- Secondary metrics: use `currentMetrics`
- Owner table + Sales table: use existing memoized data

Update hero label (line 187 currently `milhas`):

```tsx
<span className="text-sm font-medium text-muted-foreground tracking-wider uppercase font-display hidden sm:inline">
  milhas
</span>
```

- [ ] **Step 2: Verify build**

Run: `npm run lint`
Expected: No errors

---

### Task 5: Dashboard — Pontos tab content

- [ ] **Step 1: Create Pontos-specific hero**

```tsx
<section className="relative overflow-hidden rounded-2xl border border-primary/15 shadow-elegant animate-appear">
  {/* same gradient, glow, particles as existing hero */}
  <div className="relative p-6 md:p-8">
    <div className="flex items-center gap-2.5 mb-5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
        <span className="relative rounded-full bg-success h-2 w-2" />
      </span>
      <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium">
        Investimento em Pontos
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="text-[10px] font-mono text-muted-foreground">
        {new Date().toLocaleDateString("pt-BR")}
      </span>
    </div>

    <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
      <div className="flex-1">
        <div className="flex items-baseline gap-3">
          <h1 className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-none">
            <AnimatedNumber value={currentMetrics.totalMiles} />
          </h1>
          <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase font-display hidden sm:inline">
            pontos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6">
          <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
              <ArrowUpRight className="w-3 h-3 text-success" />
              Entradas no mês
            </div>
            <p className="font-mono text-sm font-bold text-success">
              +<AnimatedNumber value={currentMetrics.monthlyMilesIn} />
            </p>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
              <Wallet className="w-3 h-3 text-teal" />
              Total Investido
            </div>
            <p className="font-mono text-sm font-bold text-teal">
              R$ <AnimatedNumber value={currentMetrics.totalInvested} />
            </p>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
              <DollarSign className="w-3 h-3 text-teal" />
              Custo médio/ponto
            </div>
            <p className="font-mono text-sm font-bold text-teal">
              R$ {currentMetrics.avgCostPerMile.toFixed(3)}
            </p>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
              <TrendingUp className="w-3 h-3 text-primary" />
              Contas ativas
            </div>
            <p className="font-mono text-sm font-bold text-primary">
              {currentMetrics.activeAccounts}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="relative h-1 bg-gradient-to-r from-primary/30 via-gold/30 to-teal/30" />
</section>
```

- [ ] **Step 2: Pontos tab — no FlowMap**

Skip FlowMap rendering (rendered conditionally only in Milhas tab).

- [ ] **Step 3: Pontos tab — charts**

Only show the pie chart with pontos data:

```tsx
<DashboardCharts programData={programData} monthlySales={monthlySales} unitLabel="Pontos" hideBarChart />
```

- [ ] **Step 4: Pontos tab — secondary metrics**

Only "Contas Ativas" card:

```tsx
<div className="grid gap-4 md:grid-cols-1 animate-appear animate-delay-800">
  <MetricCard title="Contas Ativas (Pontos)" value={currentMetrics.activeAccounts} subtitle="Contas de pontos operacionais" icon={CreditCard} variant="teal" />
</div>
```

- [ ] **Step 5: Pontos tab — owner table + recent entries**

```tsx
<div className="grid gap-4 md:grid-cols-2 animate-appear animate-delay-1000">
  <Card className="overflow-hidden">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
        <Users className="h-4 w-4 text-primary" />
        Estoque por Dono (Pontos)
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-1">
        {ownerData.map((owner) => (
          <div key={owner.owner} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm text-foreground font-display">{owner.owner}</h3>
              <p className="text-xs text-muted-foreground font-body">{owner.programs.join(", ")} • <span className="font-mono">{owner.totalMiles.toLocaleString("pt-BR")} pontos</span></p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-mono text-sm font-semibold text-foreground">R$ {owner.totalInvested.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>

  <Card className="overflow-hidden">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
        <TrendingUp className="h-4 w-4 text-primary" />
        Entradas Recentes (Pontos)
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-1">
        {recentEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma entrada registrada</p>
        ) : (
          recentEntries.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50">
              <div className="space-y-0.5">
                <h4 className="font-semibold text-sm text-foreground font-display truncate">{e.accountName}</h4>
              </div>
              <div className="text-right space-y-0.5 shrink-0 ml-3">
                <p className="font-mono text-sm font-semibold text-foreground">{e.amount.toLocaleString("pt-BR")} pts</p>
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
</div>
```

- [ ] **Step 6: Verify build**

Run: `npm run lint`
Expected: No errors
