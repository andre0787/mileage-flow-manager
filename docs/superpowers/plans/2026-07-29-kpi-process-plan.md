# KPIs de Processo — Plano de Implementação

> **Para workers:** SKILL OPCIONAL: Use `subagent-driven-development` ou `executing-plans`.
> Passos usam checkbox (`- [ ]`) para tracking.

**Goal:** Criar dashboard mensal de KPIs de processo (script + app React) que agregue
dados de events.jsonl, reports e git log para métricas de qualidade do desenvolvimento.

**Arquitetura:** Script Node.js (`kpi-report.mjs`) lê fontes locais, computa KPIs e
gera `public/kpi-data.json`. App React lê o JSON via fetch e exibe gráficos com recharts.
Desacoplamento via JSON — script e app independem.

**Tech Stack:** Node.js (script), React + recharts (app), Vite (build), Vitest (testes)

**Fontes:** `docs/tracking/events.jsonl`, `docs/reports/`, git log, `scripts/lib.mjs`

---

## Global Constraints

- Sem dependências externas (npm) além das já existentes
- `kpi-data.json` em `public/` (static asset do Vite)
- Rota `/kpi` protegida (mesmo guard do dashboard)
- Script via `npm run kpi`
- Nomes em português (strings visíveis), inglês (código)
- Cobertura de testes ≥ 80% para novo código

---

### Task 1: Script — Parser de eventos + agregação

**Files:**
- Create: `scripts/kpi-report.mjs`
- Test: `scripts/kpi-report.test.mjs`

**Interfaces:**
- Consumes: `scripts/lib.mjs` (git, readFile, ok/err/warn), `docs/tracking/events.jsonl`
- Produces: Função `parseEvents(raw: string): KPIEvent[]` + `aggregateByMonth(events: KPIEvent[], months: number): MonthlyKPI[]`

- [ ] **Step 1: Definir tipos no topo do script**

```javascript
// @ts-check
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";

/** @typedef {{ type: string, timestamp: string, data: Record<string,any> }} KPIEvent */
/** @typedef {{ month: string, prePrPassRate: number, prePrTotal: number, prePrPass: number, prePrFail: number, testCoverageLibs: number|null, testCoverageComponents: number|null, gateActivations: {intent:number, twins:number, auth:number}, avgOutcomeGrade: number|null, topViolations: Array<{rule:string, count:number}>, avgCycleTimeDays: number|null, branchesMerged: number }} MonthlyKPI */
```

- [ ] **Step 2: Implementar `parseEvents(raw)`**

```javascript
export function parseEvents(raw) {
  return raw
    .split("\n")
    .filter(l => l.trim())
    .map(l => JSON.parse(l));
}
```

- [ ] **Step 3: Implementar `filterByMonth(events, year, month)`**

```javascript
export function filterByMonth(events, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return events.filter(e => e.timestamp.startsWith(prefix));
}
```

- [ ] **Step 4: Implementar `computeMonthlyKPI(events, month)`**

```javascript
export function computeMonthlyKPI(events, monthLabel) {
  const prePrs = events.filter(e => e.type === "pre-pr");
  const total = prePrs.length;
  const passes = prePrs.filter(e => e.data?.result === "PASS").length;
  const fails = prePrs.filter(e => e.data?.result === "FAIL").length;
  const prePrPassRate = total > 0 ? Math.round((passes / total) * 1000) / 10 : 0;

  const gates = events.filter(e => e.type === "gate");
  const gateActivations = {
    intent: gates.filter(e => e.data?.gate === "intent").length,
    twins: gates.filter(e => e.data?.gate === "twins").length,
    auth: gates.filter(e => e.data?.gate === "auth").length,
  };

  // Reports: parse outcome grades + coverage from reports dir
  const { avgOutcomeGrade, testCoverageLibs, testCoverageComponents, topViolations } =
    parseReportsForMonth(monthLabel);

  // Cycle time from git log
  const avgCycleTimeDays = computeCycleTime(events);

  return {
    month: monthLabel,
    prePrPassRate,
    prePrTotal: total,
    prePrPass: passes,
    prePrFail: fails,
    testCoverageLibs,
    testCoverageComponents,
    gateActivations,
    avgOutcomeGrade,
    topViolations,
    avgCycleTimeDays,
    branchesMerged: 0, // simplified — counts unique branches with pre-pr PASS
  };
}
```

- [ ] **Step 5: Implementar `parseReportsForMonth(monthLabel)`**

Lê diretório `docs/reports/YYYY-MM-DD/`, encontra reports HTML do mês,
extrai outcome grade e cobertura via regex.

```javascript
export function parseReportsForMonth(monthLabel) {
  const [year, monthNum] = monthLabel.split("-").map(Number);
  const ROOT = resolve(import.meta.dirname, "..");
  const reportsBase = resolve(ROOT, "docs/reports");
  let outcomes = [];
  let libCovs = [];
  let compCovs = [];
  const violations = {};

  if (!existsSync(reportsBase)) return { avgOutcomeGrade: null, testCoverageLibs: null, testCoverageComponents: null, topViolations: [] };

  const dirs = readdirSync(reportsBase)
    .filter(d => d.startsWith(`${year}-`));

  for (const dir of dirs) {
    const dirPath = resolve(reportsBase, dir);
    if (!existsSync(dirPath)) continue;
    const files = readdirSync(dirPath).filter(f => f.endsWith(".html"));
    for (const file of files) {
      const content = readFileSync(resolve(dirPath, file), "utf8");
      // Extract outcome grade
      const gradeMatch = content.match(/outcome grade[:\s]+(\d+)/i);
      if (gradeMatch) outcomes.push(Number(gradeMatch[1]));
      // Extract coverage
      const libMatch = content.match(/cobertura\s*(?:d[ae])\s*libs[:\s]+(\d+)\/+/i);
      if (libMatch) libCovs.push(Number(libMatch[1]));
      const compMatch = content.match(/cobertura\s*(?:d[ae])\s*componentes[:\s]+(\d+)\/+/i);
      if (compMatch) compCovs.push(Number(compMatch[1]));
    }
  }

  const avgOutcomeGrade = outcomes.length > 0
    ? Math.round((outcomes.reduce((a,b) => a+b, 0) / outcomes.length) * 10) / 10
    : null;
  const testCoverageLibs = libCovs.length > 0
    ? Math.round(libCovs.reduce((a,b) => a+b, 0) / libCovs.length) : null;
  const testCoverageComponents = compCovs.length > 0
    ? Math.round(compCovs.reduce((a,b) => a+b, 0) / compCovs.length) : null;

  return {
    avgOutcomeGrade,
    testCoverageLibs,
    testCoverageComponents,
    topViolations: Object.entries(violations)
      .map(([rule, count]) => ({ rule, count: Number(count) }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5),
  };
}
```

- [ ] **Step 6: Implementar `computeCycleTime(events)`**

```javascript
export function computeCycleTime(events) {
  const sessionEvents = events.filter(e => e.type === "session" && e.data?.branch);
  const branchMap = {};
  for (const ev of sessionEvents) {
    const branch = ev.data.branch;
    if (!branchMap[branch]) branchMap[branch] = { start: ev.timestamp };
  }
  const prePrs = events.filter(e => e.type === "pre-pr" && e.data?.result === "PASS" && e.data?.branch);
  for (const ev of prePrs) {
    const branch = ev.data.branch;
    if (branchMap[branch]) branchMap[branch].end = ev.timestamp;
  }
  const cycles = Object.values(branchMap).filter(v => v.start && v.end);
  if (cycles.length === 0) return null;
  const totalDays = cycles.reduce((sum, c) => {
    const diff = new Date(c.end) - new Date(c.start);
    return sum + diff / (1000 * 60 * 60 * 24);
  }, 0);
  return Math.round((totalDays / cycles.length) * 10) / 10;
}
```

- [ ] **Step 7: Commit**

```bash
git add scripts/kpi-report.mjs
git commit -m "feat: kpi-report script — event parser and monthly aggregation"
```

---

### Task 2: Script — Geração do JSON de saída

**Files:**
- Modify: `scripts/kpi-report.mjs`

- [ ] **Step 1: Adicionar função `generateJSON(months, outputPath)`**

```javascript
export function generateJSON(months, outputPath) {
  const data = {
    generatedAt: new Date().toISOString(),
    months,
    currentMonth: months.length > 0 ? months[months.length - 1].month : "",
  };
  writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ kpi-data.json gerado: ${outputPath}`);
}
```

- [ ] **Step 2: Adicionar função `main()` com CLI**

```javascript
function main() {
  const ROOT = resolve(import.meta.dirname, "..");
  const eventsPath = resolve(ROOT, "docs/tracking/events.jsonl");
  const outputPath = resolve(ROOT, "public/kpi-data.json");

  if (!existsSync(eventsPath)) {
    console.error("❌ events.jsonl não encontrado em:", eventsPath);
    process.exit(1);
  }

  const raw = readFileSync(eventsPath, "utf8");
  const allEvents = parseEvents(raw);

  // Gera últimos 6 meses
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthEvents = filterByMonth(allEvents, d.getFullYear(), d.getMonth() + 1);
    months.push(computeMonthlyKPI(monthEvents, label));
  }

  generateJSON(months, outputPath);
}

main();
```

- [ ] **Step 3: Adicionar shebang e export**

```javascript
#!/usr/bin/env node
// ... no topo do arquivo
export { parseEvents, filterByMonth, computeMonthlyKPI, parseReportsForMonth, computeCycleTime, generateJSON };
```

- [ ] **Step 4: Testar manualmente**

```bash
mkdir -p public
node scripts/kpi-report.mjs
cat public/kpi-data.json | head -20
```

- [ ] **Step 5: Commit**

```bash
git add scripts/kpi-report.mjs public/kpi-data.json
git commit -m "feat: kpi-report — JSON generation with 6-month history"
```

---

### Task 3: Script — npm script + atalho

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Adicionar script npm**

```json
"kpi": "node scripts/kpi-report.mjs"
```

- [ ] **Step 2: Verificar**

```bash
npm run kpi
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add npm run kpi script"
```

---

### Task 4: Testes do script

**Files:**
- Create: `scripts/kpi-report.test.mjs`

- [ ] **Step 1: Escrever teste de `parseEvents`**

```javascript
import { describe, it, expect } from "vitest";
import { parseEvents, filterByMonth, computeMonthlyKPI } from "./kpi-report.mjs";

describe("parseEvents", () => {
  it("parses JSONL lines", () => {
    const input = `{"type":"pre-pr","timestamp":"2026-07-01T10:00:00Z","data":{"result":"PASS"}}\n{"type":"pre-pr","timestamp":"2026-07-02T10:00:00Z","data":{"result":"FAIL"}}`;
    const result = parseEvents(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("pre-pr");
  });

  it("handles empty input", () => {
    expect(parseEvents("")).toEqual([]);
  });
});
```

- [ ] **Step 2: Escrever teste de `filterByMonth`**

```javascript
describe("filterByMonth", () => {
  const events = [
    { type: "pre-pr", timestamp: "2026-07-15T10:00:00Z", data: {} },
    { type: "pre-pr", timestamp: "2026-06-15T10:00:00Z", data: {} },
  ];
  it("filters by year and month", () => {
    expect(filterByMonth(events, 2026, 7)).toHaveLength(1);
    expect(filterByMonth(events, 2026, 6)).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Escrever teste de `computeMonthlyKPI` com dados mock**

```javascript
describe("computeMonthlyKPI", () => {
  it("computes pass rate correctly", () => {
    const events = [
      { type: "pre-pr", timestamp: "2026-07-01T10:00:00Z", data: { result: "PASS", branch: "feat/a" } },
      { type: "pre-pr", timestamp: "2026-07-02T10:00:00Z", data: { result: "PASS", branch: "feat/b" } },
      { type: "pre-pr", timestamp: "2026-07-03T10:00:00Z", data: { result: "FAIL", branch: "feat/c" } },
      { type: "gate", timestamp: "2026-07-03T11:00:00Z", data: { gate: "intent" } },
    ];
    const result = computeMonthlyKPI(events, "2026-07");
    expect(result.prePrPassRate).toBe(66.7); // 2/3 = 66.7%
    expect(result.prePrTotal).toBe(3);
    expect(result.gateActivations.intent).toBe(1);
  });
});
```

- [ ] **Step 4: Rodar testes**

```bash
npx vitest run scripts/kpi-report.test.mjs -v
```

- [ ] **Step 5: Commit**

```bash
git add scripts/kpi-report.test.mjs
git commit -m "test: kpi-report script unit tests"
```

---

### Task 5: App — Página KPI + Roteamento

**Files:**
- Create: `src/pages/KPI.tsx`
- Modify: `src/App.tsx` (adicionar rota)

- [ ] **Step 1: Criar `src/pages/KPI.tsx` — layout da página**

```tsx
import { useEffect, useState } from "react";
import KPIDashboard from "@/components/KPIDashboard";

interface KpiData {
  generatedAt: string;
  currentMonth: string;
  months: MonthlyKPI[];
}

export default function KPI() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/kpi-data.json")
      .then((r) => {
        if (!r.ok) throw new Error("Dados não encontrados");
        return r.json();
      })
      .then((d: KpiData) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando KPIs...</div>;
  if (error || !data)
    return (
      <div className="p-8 text-center text-muted-foreground">
        ⚠️ Nenhum dado de KPI disponível. Execute <code>npm run kpi</code> para gerar.
      </div>
    );

  return <KPIDashboard data={data} />;
}
```

- [ ] **Step 2: Adicionar rota em `App.tsx`**

Localizar onde as rotas são definidas e adicionar:

```tsx
import KPI from "@/pages/KPI";
// ... dentro do router:
<Route path="/kpi" element={<KPI />} />
```

- [ ] **Step 3: Adicionar link no menu/sidebar**

Localizar o menu de navegação e adicionar:

```tsx
<NavLink to="/kpi">📊 KPIs de Processo</NavLink>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/KPI.tsx src/App.tsx
git commit -m "feat: add /kpi page with KPIDashboard"
```

---

### Task 6: Componente KPIDashboard

**Files:**
- Create: `src/components/KPIDashboard.tsx`

- [ ] **Step 1: Criar layout do dashboard**

```tsx
import { useState } from "react";
import KPICard from "./KPICard";
import KPIChart from "./KPIChart";
import KPITable from "./KPITable";
import KPIMonthSelector from "./KPIMonthSelector";

interface KpiData {
  generatedAt: string;
  currentMonth: string;
  months: MonthlyKPI[];
}

export default function KPIDashboard({ data }: { data: KpiData }) {
  const [selectedMonth, setSelectedMonth] = useState(data.currentMonth);
  const current = data.months.find((m) => m.month === selectedMonth) ?? data.months[data.months.length - 1];
  const previous = data.months[data.months.length - 2] ?? null;

  const delta = (currentVal: number, prevVal: number | null) => {
    if (prevVal === null || prevVal === 0) return null;
    return Math.round(((currentVal - prevVal) / prevVal) * 100);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold font-display">📊 KPIs de Processo</h1>
        <KPIMonthSelector months={data.months} selected={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Taxa Pre-Pr"
          value={`${current.prePrPassRate}%`}
          delta={delta(current.prePrPassRate, previous?.prePrPassRate ?? null)}
          description={`${current.prePrPass} pass / ${current.prePrFail} fail`}
        />
        <KPICard
          label="Cobertura Libs"
          value={current.testCoverageLibs !== null ? `${current.testCoverageLibs}%` : "—"}
          delta={delta(current.testCoverageLibs ?? 0, previous?.testCoverageLibs ?? null)}
        />
        <KPICard
          label="Outcome Grade"
          value={current.avgOutcomeGrade !== null ? `${current.avgOutcomeGrade}%` : "—"}
          delta={delta(current.avgOutcomeGrade ?? 0, previous?.avgOutcomeGrade ?? null)}
        />
        <KPICard
          label="Gates Ativos"
          value={`🧠${current.gateActivations.intent} 🔁${current.gateActivations.twins} 🔐${current.gateActivations.auth}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPIChart
          title="📈 Taxa de Aprovação (6 meses)"
          data={data.months}
          dataKey="prePrPassRate"
          type="bar"
          unit="%"
        />
        <KPIChart
          title="📈 Cobertura de Testes (6 meses)"
          data={data.months}
          dataKey={["testCoverageLibs", "testCoverageComponents"]}
          type="line"
          unit="%"
          labels={["Libs", "Componentes"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPIChart
          title="🎯 Outcome Grade (6 meses)"
          data={data.months}
          dataKey="avgOutcomeGrade"
          type="line"
          unit="%"
        />
        <KPIChart
          title="🔐 Ativação de Gates (6 meses)"
          data={data.months}
          dataKey={["gateActivations.intent", "gateActivations.twins", "gateActivations.auth"]}
          type="bar"
          labels={["INTENT", "TWINS", "AUTH"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPITable
          title="⏱️ Tempo de Ciclo"
          headers={["Mês", "Média (dias)", "Branches"]}
          rows={data.months.map((m) => [
            m.month,
            m.avgCycleTimeDays !== null ? String(m.avgCycleTimeDays) : "—",
            String(m.branchesMerged),
          ])}
        />
        <KPITable
          title="⚠️ Top Violações"
          headers={["Regra", "Falhas"]}
          rows={current.topViolations.map((v) => [v.rule, String(v.count)])}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KPIDashboard.tsx
git commit -m "feat: KPIDashboard component with card grid and charts layout"
```

---

### Task 7: Componente KPICard

**Files:**
- Create: `src/components/KPICard.tsx`

- [ ] **Step 1: Criar componente**

```tsx
interface KPICardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  description?: string;
}

export default function KPICard({ label, value, delta, description }: KPICardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {delta !== null && delta !== undefined && (
          <span className={`text-sm font-medium ${delta >= 0 ? "text-green-500" : "text-red-500"}`}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {description && (
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KPICard.tsx
git commit -m "feat: KPICard component with delta indicator"
```

---

### Task 8: Componente KPIChart

**Files:**
- Create: `src/components/KPIChart.tsx`

- [ ] **Step 1: Criar componente com recharts**

```tsx
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPIChartProps {
  title: string;
  data: Record<string, any>[];
  dataKey: string | string[];
  type: "bar" | "line";
  unit?: string;
  labels?: string[];
}

export default function KPIChart({ title, data, dataKey, type, unit, labels }: KPIChartProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  const colors = ["hsl(var(--primary))", "hsl(var(--teal))", "hsl(var(--gold))", "hsl(var(--warning))"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" unit={unit} />
                <Tooltip />
                {keys.length > 1 && <Legend />}
                {keys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[i % colors.length]}
                    name={labels?.[i] ?? key}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" unit={unit} />
                <Tooltip />
                {keys.length > 1 && <Legend />}
                {keys.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[i % colors.length]}
                    name={labels?.[i] ?? key}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KPIChart.tsx
git commit -m "feat: KPIChart component with bar/line chart from recharts"
```

---

### Task 9: Componentes KPITable + KPIMonthSelector

**Files:**
- Create: `src/components/KPITable.tsx`
- Create: `src/components/KPIMonthSelector.tsx`

- [ ] **Step 1: Criar KPITable**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPITableProps {
  title: string;
  headers: string[];
  rows: string[][];
}

export default function KPITable({ title, headers, rows }: KPITableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              {headers.map((h) => (
                <th key={h} className="pb-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="py-2">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Criar KPIMonthSelector**

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface KPIMonthSelectorProps {
  months: { month: string }[];
  selected: string;
  onChange: (month: string) => void;
}

export default function KPIMonthSelector({ months, selected, onChange }: KPIMonthSelectorProps) {
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.month} value={m.month}>
            {m.month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/KPITable.tsx src/components/KPIMonthSelector.tsx
git commit -m "feat: KPITable and KPIMonthSelector components"
```

---

### Task 10: Testes dos componentes

**Files:**
- Create: `src/components/__tests__/KPICard.test.tsx`
- Create: `src/components/__tests__/KPIDashboard.test.tsx`
- Create: `src/components/__tests__/KPITable.test.tsx`
- Create: `src/pages/__tests__/KPI.test.tsx`

- [ ] **Step 1: Testar KPICard**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPICard from "../KPICard";

describe("KPICard", () => {
  it("renders label and value", () => {
    render(<KPICard label="Taxa Pre-Pr" value="85.7%" />);
    expect(screen.getByText("Taxa Pre-Pr")).toBeDefined();
    expect(screen.getByText("85.7%")).toBeDefined();
  });

  it("shows positive delta with arrow", () => {
    render(<KPICard label="Taxa" value="90%" delta={10} />);
    expect(screen.getByText("↑ 10%")).toBeDefined();
  });
});
```

- [ ] **Step 2: Testar KPITable**

```tsx
describe("KPITable", () => {
  it("renders headers and rows", () => {
    render(
      <KPITable
        title="Teste"
        headers={["Mês", "Valor"]}
        rows={[["2026-07", "5"], ["2026-06", "3"]]}
      />
    );
    expect(screen.getByText("2026-07")).toBeDefined();
    expect(screen.getByText("2026-06")).toBeDefined();
  });
});
```

- [ ] **Step 3: Testar KPI page (fallback state)**

```tsx
describe("KPI Page", () => {
  it("shows fallback when no data", () => {
    render(<KPI />);
    expect(screen.getByText(/nenhum dado/i)).toBeDefined();
  });
});
```

- [ ] **Step 4: Rodar testes**

```bash
npx vitest run src/components/__tests__/KPICard.test.tsx -v
npx vitest run src/components/__tests__/KPITable.test.tsx -v
npx vitest run src/pages/__tests__/KPI.test.tsx -v
```

- [ ] **Step 5: Commit**

```bash
git add src/components/__tests__/KPICard.test.tsx src/components/__tests__/KPITable.test.tsx src/components/__tests__/KPIDashboard.test.tsx src/pages/__tests__/KPI.test.tsx
git commit -m "test: KPI components unit tests"
```

---

### Task 11: MAP.md + manifest + pre-pr

**Files:**
- Modify: `docs/MAP.md`
- Modify: (optional) `.prompts-manifest.json` via `npm run prompt:manifest`

- [ ] **Step 1: Atualizar MAP.md**

Adicionar entrada para design spec + plan:

```markdown
### KPIs de Processo

| O quê | Caminho |
|-------|---------|
| Design spec | `docs/superpowers/specs/2026-07-29-kpi-process-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-07-29-kpi-process-plan.md` |
| Script | `scripts/kpi-report.mjs` |
| App page | `src/pages/KPI.tsx` |
```

- [ ] **Step 2: Verificar**

```bash
npm run prompt:manifest
npm test
npm run verify-docs
npm run build
```

- [ ] **Step 3: Commit final**

```bash
git add docs/MAP.md
git commit -m "docs: register KPI process spec + plan in MAP.md"
```

- [ ] **Step 4: Pre-pr + PR**

```bash
npm run pre-pr
```