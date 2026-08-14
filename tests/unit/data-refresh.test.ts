/**
 * data-refresh.test.ts — Testes das funções puras do gerador de dados das
 * abas KPI (Datadog interno) e Workflow (scripts/data-refresh.mjs).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  computeDailyKPI,
  computeDailySeries,
  computeSummary,
  computeGateEfficiency,
  parseMergeLogLine,
  prRow,
  tokensFromNumstat,
  countByType,
  gradeBuckets,
  formatDayLabel,
  eventsInWindow,
  buildWorkflowData,
  fetchTelemetryCost,
} from "../../scripts/data-refresh.mjs";

describe("formatDayLabel", () => {
  it("converte YYYY-MM-DD em dd/mm", () => {
    expect(formatDayLabel("2026-08-13")).toBe("13/08");
  });
});

describe("computeDailyKPI", () => {
  const events = [
    {
      type: "pre-pr",
      timestamp: "2026-08-13T10:00:00Z",
      description: "pre-pr PASS",
      errors: 0,
      branch: "feat/a",
    },
    {
      type: "pre-pr",
      timestamp: "2026-08-13T11:00:00Z",
      description: "pre-pr PASS",
      errors: 0,
      branch: "feat/b",
    },
    {
      type: "pre-pr",
      timestamp: "2026-08-13T12:00:00Z",
      description: "pre-pr FAIL",
      errors: 3,
      branch: "feat/c",
    },
    { type: "rule:fail", timestamp: "2026-08-13T12:01:00Z", rule: "rule-10-clean" },
    { type: "rule:fail", timestamp: "2026-08-13T12:02:00Z", rule: "rule-26-session-started" },
    { type: "healed", timestamp: "2026-08-13T12:03:00Z", rule: "rule-26" },
    { type: "session:start", timestamp: "2026-08-13T09:00:00Z", branch: "feat/a" },
    {
      type: "pre-pr",
      timestamp: "2026-08-12T10:00:00Z",
      description: "pre-pr PASS",
      errors: 0,
      branch: "feat/outro",
    },
  ];

  it("agrega KPIs do dia (pass rate, fricção, merges, sessions)", () => {
    const kpi = computeDailyKPI(events, "2026-08-13");
    expect(kpi.prePrTotal).toBe(3);
    expect(kpi.prePrPass).toBe(2);
    expect(kpi.prePrFail).toBe(1);
    expect(kpi.prePrPassRate).toBe(66.7);
    expect(kpi.ruleFails).toBe(2);
    expect(kpi.healed).toBe(1);
    expect(kpi.sessions).toBe(1);
    expect(kpi.merges).toBe(2);
    expect(kpi.friction).toBe(1);
    expect(kpi.day).toBe("2026-08-13");
    expect(kpi.label).toBe("13/08");
  });

  it("ignora eventos de outros dias", () => {
    const kpi = computeDailyKPI(events, "2026-08-12");
    expect(kpi.prePrTotal).toBe(1);
    expect(kpi.ruleFails).toBe(0);
  });

  it("retorna null para pass rate/friction sem pre-pr no dia", () => {
    const kpi = computeDailyKPI(
      [{ type: "session:start", timestamp: "2026-08-13T09:00:00Z" }],
      "2026-08-13",
    );
    expect(kpi.prePrPassRate).toBeNull();
    expect(kpi.friction).toBeNull();
  });
});

describe("computeDailySeries", () => {
  it("gera N dias terminando hoje, mais antigo primeiro", () => {
    const series = computeDailySeries([], 5);
    expect(series).toHaveLength(5);
    const days = series.map((d) => d.day);
    const sorted = [...days].sort();
    expect(days).toEqual(sorted);
    const today = new Date();
    const todayLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(days[days.length - 1]).toBe(todayLabel);
  });
});

describe("computeSummary", () => {
  it("agrega totais da janela de dias", () => {
    const events = [
      {
        type: "pre-pr",
        timestamp: new Date().toISOString(),
        description: "pre-pr PASS",
        errors: 0,
        branch: "feat/a",
      },
      {
        type: "pre-pr",
        timestamp: new Date().toISOString(),
        description: "pre-pr FAIL",
        errors: 2,
        branch: "feat/b",
      },
      { type: "pr:merge", timestamp: new Date().toISOString() },
      { type: "rule:fail", timestamp: new Date().toISOString(), rule: "rule-10-clean" },
      { type: "healed", timestamp: new Date().toISOString(), rule: "rule-26" },
      { type: "session:start", timestamp: new Date().toISOString(), branch: "feat/a" },
      {
        type: "pre-pr",
        timestamp: "2020-01-01T00:00:00Z",
        description: "pre-pr PASS",
        errors: 0,
        branch: "feat/velho",
      },
    ];
    const summary = computeSummary(events, 30);
    expect(summary.prePrPassRate).toBe(50);
    expect(summary.prs).toBe(1);
    expect(summary.violations).toBe(1);
    expect(summary.healed).toBe(1);
    expect(summary.sessions).toBe(1);
    expect(summary.merges).toBe(1); // só feat/a (pass) na janela
  });
});

describe("parseMergeLogLine / prRow / numstatTokens", () => {
  it("extrai número e branch do subject do merge", () => {
    const parsed = parseMergeLogLine(
      "Merge pull request #370 from andre0787/feat/workflow-otimizacao",
    );
    expect(parsed).toEqual({ number: 370, branch: "andre0787/feat/workflow-otimizacao" });
    expect(parseMergeLogLine("qualquer coisa")).toBeNull();
  });

  it("deriva tipo + benefício/impacto do título (fonte única dos reports)", () => {
    const row = prRow(370, "feat(process): otimização do workflow", "2026-08-13", 767);
    expect(row.type).toBe("feat");
    expect(row.benefit).toContain("Nova capacidade");
    expect(row.impact).toContain("alavanca");

    const fix = prRow(369, "fix(lint): import fs", "2026-08-13", 10);
    expect(fix.type).toBe("fix");
    expect(fix.benefit).toContain("corrigido");

    const other = prRow(1, "chore: merge de testes", "2026-08-13", 5);
    expect(other.type).toBe("chore");
  });

  it("calcula tokens do numstat (linhas × 0.75)", () => {
    expect(tokensFromNumstat("10\t2\tfile.ts\n5\t0\tother.ts")).toBe(13); // (12+5)*0.75 = 12.75 → 13
    expect(tokensFromNumstat("-")).toBe(0); // binário: sem contagem
    expect(tokensFromNumstat("")).toBe(0);
  });
});

describe("computeGateEfficiency / countByType / gradeBuckets", () => {
  const windowEvents = [
    { type: "pre-pr", timestamp: "2026-08-13T10:00:00Z", description: "pre-pr PASS", errors: 0 },
    { type: "pre-pr", timestamp: "2026-08-13T11:00:00Z", description: "pre-pr FAIL", errors: 4 },
    { type: "rule:fail", timestamp: "2026-08-13T11:01:00Z", rule: "rule-10-clean" },
    { type: "rule:fail", timestamp: "2026-08-13T11:02:00Z", rule: "rule-10-clean" },
    { type: "healed", timestamp: "2026-08-13T11:03:00Z", rule: "rule-26" },
    { type: "gate:blocked", timestamp: "2026-08-13T11:04:00Z", rule: "rule-27-council-veredict" },
  ];

  it("computa eficiência com top violações + hints", () => {
    const eff = computeGateEfficiency(windowEvents);
    expect(eff.prePrPassRate).toBe(50);
    expect(eff.ruleFails).toBe(2);
    expect(eff.healedRate).toBe(50);
    expect(eff.gateBlocked).toBe(1);
    expect(eff.topViolations[0]).toEqual({
      rule: "rule-10-clean",
      count: 2,
      hint: "git status ZERO antes de PR — artefatos gerados não commitados",
    });
  });

  it("conta por tipo na ordem fixa da paleta", () => {
    const types = countByType(windowEvents);
    expect(types.map((t) => t.name)).toEqual(["pre-pr", "rule:fail", "healed", "gate:blocked"]);
    expect(types[1].n).toBe(2);
    expect(types[1].color).toBeTruthy();
  });

  it("agrupa notas por bucket de outcome grade", () => {
    const quality = [
      { timestamp: "2026-08-13T10:00:00Z", outcomeGrade: 100 },
      { timestamp: "2026-08-13T11:00:00Z", outcomeGrade: 85 },
      { timestamp: "2026-08-13T12:00:00Z", outcomeGrade: 60 },
      { timestamp: "2026-08-13T13:00:00Z", outcomeGrade: 90 },
      { timestamp: "2026-08-13T14:00:00Z", rule: "rule-31" }, // sem grade — ignora
    ];
    const buckets = gradeBuckets(quality);
    expect(buckets[0].n).toBe(1); // 100
    expect(buckets[1].n).toBe(2); // 80-99
    expect(buckets[2].n).toBe(1); // <80
  });
});

describe("eventsInWindow / buildWorkflowData", () => {
  it("filtra eventos por janela numérica (imune a formato de timestamp)", () => {
    const events = [
      { type: "session:start", timestamp: new Date().toISOString() },
      { type: "session:start", timestamp: "2020-01-01T00:00:00Z" },
      { type: "session:start", timestamp: "sem timestamp válido" },
    ];
    const inWindow = eventsInWindow(events, 30);
    expect(inWindow).toHaveLength(1);
  });

  it("monta o corpo do workflow-data.json com dados reais", () => {
    const repo = {
      components: 82,
      pages: 16,
      libs: 17,
      scripts: 103,
      testFiles: 179,
      skills: 26,
      rules: 41,
      events: 2,
      qualityNotes: 1,
    };
    const data = buildWorkflowData({
      events: [
        { type: "session:start", timestamp: new Date().toISOString(), branch: "feat/a" },
        {
          type: "pre-pr",
          timestamp: new Date().toISOString(),
          description: "pre-pr PASS",
          errors: 0,
        },
        { type: "coding:done", timestamp: new Date().toISOString(), branch: "feat/a" },
      ],
      quality: [{ timestamp: new Date().toISOString(), outcomeGrade: 100 }],
      prs: [
        {
          number: 370,
          title: "feat: x",
          type: "feat",
          date: "2026-08-13",
          tokens: 1,
          benefit: "b",
          impact: "i",
        },
      ],
      repo,
    });

    expect(data.dataDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.overview.rules).toBe(41);
    expect(data.lastPrs).toHaveLength(1);
    expect(data.gateEfficiency.prePrPass).toBe(1);
    expect(data.kpiStats[0].label).toContain("eventos");
    expect(data.eventTypes.some((t) => t.name === "pre-pr")).toBe(true);
    expect(data.recentTimeline.length).toBeGreaterThan(0);
  });
});

describe("fetchTelemetryCost (Custo por Funcionalidade — rule-48)", () => {
  const realFetch = globalThis.fetch;
  const realEnv = { ...process.env };

  afterEach(() => {
    globalThis.fetch = realFetch;
    process.env = { ...realEnv };
  });

  function setEnv(key: string | null) {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    if (key) process.env.SUPABASE_SERVICE_KEY = key;
  }

  it("agrega custo por área a partir dos registros da ai_telemetry", async () => {
    setEnv("service-key");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { area: "vendas", cost_estimate: 0.006, total_execution_time_ms: 2000 },
        { area: "contas", cost_estimate: 0.003, total_execution_time_ms: 10000 },
        { area: "vendas", cost_estimate: 0.006, total_execution_time_ms: 4000 },
      ],
    }) as unknown as typeof fetch;

    const result = await fetchTelemetryCost();
    expect(result).toEqual([
      { area: "vendas", cost: 0.012, executions: 2, avgExecutionMs: 3000 },
      { area: "contas", cost: 0.003, executions: 1, avgExecutionMs: 10000 },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("retorna [] quando a resposta não é ok (fail-open)", async () => {
    setEnv("service-key");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }) as unknown as typeof fetch;
    await expect(fetchTelemetryCost()).resolves.toEqual([]);
  });

  it("retorna [] quando a resposta não é um array", async () => {
    setEnv("service-key");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: "x" }),
    }) as unknown as typeof fetch;
    await expect(fetchTelemetryCost()).resolves.toEqual([]);
  });

  it("retorna [] sem credenciais (fail-open)", async () => {
    setEnv(null);
    const spy = vi.fn();
    globalThis.fetch = spy as unknown as typeof fetch;
    await expect(fetchTelemetryCost()).resolves.toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});
