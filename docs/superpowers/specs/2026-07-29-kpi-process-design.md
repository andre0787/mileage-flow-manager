# KPIs de Processo — Design Híbrido (Script + App)

> **Data:** 2026-07-29
> **Propósito:** Dashboard mensal de métricas do processo de desenvolvimento
>   (metodologia Fable Method, qualidade, cobertura, produtividade)

---

## 1. Objetivo

Oferecer visibilidade mensal sobre a saúde do processo de desenvolvimento:
taxa de aprovação de PRs, evolução da cobertura de testes, ativação dos gates
(INTENT/TWINS/AUTH), outcome grade, violações de regras e tempo de ciclo.

---

## 2. Arquitetura Híbrida

```
npm run kpi (script Node.js)
  │
  ├─→ public/kpi-data.json   (dados estruturados para o app)
  └─→ docs/reports/YYYY-MM-DD/kpi-YYYY-MM.html  (relatório HTML)

React App
  │
  └─→ Página /kpi
        ├─→ fetch('/kpi-data.json')
        └─→ recharts (BarChart, LineChart, PieChart)
```

### 2.1 Fluxo de Dados

| Etapa | Descrição |
|-------|-----------|
| 1. Coleta | Script lê `docs/tracking/events.jsonl`, reports, git log |
| 2. Agregação | Computa KPIs mensais (mês corrente + 5 anteriores) |
| 3. Saída | Gera `public/kpi-data.json` + relatório HTML |
| 4. Commit | Dados commitados no git (rastreabilidade histórica) |
| 5. Visualização | App lê JSON e exibe com recharts |

### 2.2 Script vs App

| Aspecto | Script (`npm run kpi`) | App (página `/kpi`) |
|---------|----------------------|---------------------|
| Geração | Agrega dados brutos | Lê dados prontos |
| Frequência | Manual (fim do mês) | Sempre disponível |
| Saída principal | `kpi-data.json` | Gráficos recharts |
| Saída secundária | Relatório HTML | — |

---

## 3. Fontes de Dados

### 3.1 `docs/tracking/events.jsonl`

Estrutura esperada do evento:

```json
{"type":"pre-pr","timestamp":"2026-07-29T10:00:00Z","data":{"result":"PASS","errors":0,"warnings":2,"branch":"feat/..."}}
{"type":"pre-pr","timestamp":"2026-07-28T15:00:00Z","data":{"result":"FAIL","errors":3,"branch":"feat/..."}}
{"type":"gate","timestamp":"2026-07-29T11:00:00Z","data":{"gate":"intent","action":"declared","target":"component-x"}}
{"type":"gate","timestamp":"2026-07-29T12:00:00Z","data":{"gate":"twins","action":"searched","pattern":"...","matches":3}}
{"type":"session","timestamp":"2026-07-29T09:00:00Z","data":{"category":"feature","branch":"feat/..."}}
```

### 3.2 `docs/reports/YYYY-MM-DD/`

Relatórios HTML do pre-pr com:
- Outcome grade (rule-30)
- Cobertura de testes (rule-31, rule-32)
- Resultado de cada regra

### 3.3 Git log

Commits, branches, timestamps para tempo de ciclo.

---

## 4. KPIs — Definição e Cálculo

### 4.1 ✅ Taxa de aprovação pre-pr

**Fórmula:** `PASS / (PASS + FAIL) × 100` no mês

**Gráfico:** BarChart 6 meses

### 4.2 📊 Cobertura de testes

**Fórmula:** `libs_com_teste / total_libs × 100` (rule-31) e igual para rule-32

**Gráfico:** LineChart 6 meses (duas séries: libs + componentes)

### 4.3 🔐 Ativação dos gates

**Fórmula:** Contagem de eventos `gate` por tipo (intent, twins, auth) no mês

**Gráfico:** PieChart (distribuição) + BarChart (tendência)

### 4.4 🏆 Outcome grade médio

**Fórmula:** Média das notas `rule-30` nos relatórios do mês

**Gráfico:** LineChart 6 meses

### 4.5 ⚠️ Violações de regras

**Fórmula:** Para cada regra, contagem de falhas nos pre-pr do mês

**Gráfico:** BarChart horizontal (top 5 regras mais violadas)

### 4.6 ⏱️ Tempo de ciclo

**Fórmula:** Dias entre `session:start` (primeiro) e `pre-pr PASS` (último) por branch,
  média do mês

**Gráfico:** Tabela + BarChart médio mensal

---

## 5. Script — Estrutura

### 5.1 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `scripts/kpi-report.mjs` | Script principal (agregação + geração) |
| `public/kpi-data.json` | Dados estruturados para o app (gerado) |
| `docs/reports/.../kpi-....html` | Relatório HTML (gerado) |

### 5.2 Interface

```bash
npm run kpi               # Gera KPIs do mês corrente
npm run kpi -- --month 6  # Gera KPIs de um mês específico
npm run kpi -- --all      # Gera todos os meses disponíveis
```

### 5.3 Saída JSON (`kpi-data.json`)

```json
{
  "generatedAt": "2026-07-29T10:00:00Z",
  "months": [
    {
      "month": "2026-07",
      "prePrPassRate": 85.7,
      "prePrTotal": 14,
      "prePrPass": 12,
      "prePrFail": 2,
      "testCoverageLibs": 100,
      "testCoverageComponents": 100,
      "gateActivations": { "intent": 8, "twins": 3, "auth": 1 },
      "avgOutcomeGrade": 92.5,
      "topViolations": [
        { "rule": "rule-14", "count": 3 },
        { "rule": "rule-26", "count": 2 }
      ],
      "avgCycleTimeDays": 1.8,
      "branchesMerged": 5
    }
  ],
  "currentMonth": "2026-07"
}
```

---

## 6. App — Página `/kpi`

### 6.1 Rota

- Path: `/kpi`
- Protegida: mesmo guard do dashboard (requer login)
- Nav: link no sidebar/menu principal

### 6.2 Componentes

| Componente | Descrição |
|------------|-----------|
| `KPIDashboard` | Layout grid com cards |
| `KPICard` | Card individual: valor, label, delta mensal |
| `KPIChart` | Wrapper recharts (BarChart | LineChart | PieChart) |
| `KPITable` | Tabela de tempo de ciclo / violações |
| `KPIMonthSelector` | Dropdown para navegar entre meses |

### 6.3 Layout

```
┌─────────────────────────────────────────────────┐
│  📊 KPIs de Processo         [Mês ▼] [⏳ Gerar] │
├──────────┬──────────┬──────────┬────────────────┤
│ Taxa     │ Cobertura│ Outcome  │ Ativação       │
│ Pre-Pr   │ Testes   │ Grade    │ Gates          │
│ 85.7% ↑  │ 100% →   │ 92.5 ↑   │ 🧠8 🔁3 🔐1   │
├──────────┴──────────┴──────────┴────────────────┤
│  📈 Taxa de Aprovação (6 meses)                 │
│  ████████████████████████████████               │
├────────────────────────────────────────────────┤
│  📈 Cobertura de Testes (6 meses)              │
│  ████████████████████████████████               │
├────────────────┬───────────────────────────────┤
│ 🥧 Gates       │ ⚠️ Violações Top 5            │
│ (PieChart)     │ (BarChart horizontal)          │
├────────────────┴───────────────────────────────┤
│ ⏱️ Tempo de Ciclo — Últimas Branches           │
│ [tabela: branch | abertura | merge | dias]     │
└─────────────────────────────────────────────────┘
```

### 6.4 Dados

- `fetch('/kpi-data.json')` no load da página
- Fallback: se arquivo não existe, mostra "Nenhum dado ainda. Execute npm run kpi"
- Cache: sessionStorage (evita re-fetch em navegação)

---

## 7. Não-Escopo

- ❌ Integração com GitHub API (dados só locais)
- ❌ KPIs de negócio (receita, milhas) — é processo, não negócio
- ❌ Notificações ou alertas automáticos
- ❌ Deploy automático do kpi-data.json (commit manual)

---

## 8. Árvore de Arquivos (gerados/modificados)

```
scripts/
  kpi-report.mjs          (novo)
public/
  kpi-data.json           (gerado pelo script)
docs/reports/YYYY-MM-DD/
  kpi-YYYY-MM.html        (gerado pelo script, opcional)
src/
  pages/
    KPI.tsx               (novo)
  components/
    KPIDashboard.tsx       (novo)
    KPICard.tsx            (novo)
    KPIChart.tsx           (novo)
    KPITable.tsx           (novo)
    KPIMonthSelector.tsx   (novo)
```

---

## 9. Testes

| Teste | O que verifica |
|-------|---------------|
| `tests/kpi-report.test.ts` | Agregação de dados mock (events.jsonl fictício) |
| `KPI.test.tsx` | Render dos cards, fetch do JSON, fallback |
| `KPICard.test.tsx` | Render com valor, delta, label |
| `KPIChart.test.tsx` | Render com dados mock |

---

*Spec finalizada.*