#!/usr/bin/env node

// @llm-context: skip-unless-requested — gerador grande, usado apenas para refresh de dados.
/**
 * data-refresh.mjs — Refresh dos dados consumidos pelas abas KPI e Workflow.
 *
 * Gera:
 *   public/kpi-data.json      — meses (6) + série diária (14d) + PRs recentes +
 *                               fatos do repo + resumo 30d (Datadog interno)
 *   public/workflow-data.json — telemetria REAL para a aba Workflow
 *
 * Roda rápido (lê o tail do events.jsonl + git) — pensado para rodar no
 * nightly CI e a qualquer momento sem custo relevante de tokens.
 *
 * Uso: npm run data:refresh
 *      node scripts/data-refresh.mjs --days 14 --prs 10
 */

// @ts-check
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { parseEvents, computeMonthlyKPI, isPrePrPass, isPrePrFail } from "./kpi-report.mjs";
import { typeOf, TYPE_BENEFIT, TYPE_IMPACT, numstatLines } from "./generate-report.mjs";

// ─── Constantes ──────────────────────────────────────────────────────

const DEFAULT_BENEFIT = "Mudança validada pelo fluxo de qualidade";
const DEFAULT_IMPACT = "Risco controlado antes da produção";

/**
 * Paleta fixa por tipo de evento — deve espelhar EVENT_TYPES de
 * src/lib/workflowDemoData.ts (client). Mantenha as duas em sincronia.
 */
const EVENT_PALETTE = [
  ["session:start", "#3b82f6"],
  ["pre-pr", "#8b5cf6"],
  ["rule:fail", "#ef4444"],
  ["healed", "#10b981"],
  ["llm.route.resolved", "#14b8a6"],
  ["code-review:done", "#6366f1"],
  ["coding:done", "#22c55e"],
  ["session:end", "#f59e0b"],
  ["llm.route.completed", "#0ea5e9"],
  ["gate", "#f43f5e"],
  ["pr:create", "#f97316"],
  ["pr:merge", "#16a34a"],
  ["gate:blocked", "#b91c1c"],
];

/** Dicas acionáveis das regras que mais falham (mostradas na aba Workflow). */
const RULE_HINTS = {
  "rule-10-clean": "git status ZERO antes de PR — artefatos gerados não commitados",
  "rule-26-session-started": "timestamp de sessão ausente — npm run session:start",
  "rule-scope": "escopo do diff fora da categoria da branch",
  "rule-38-code-review-gate": "faltou evento code-review:done por subagente na branch",
  "rule-39-coding-gate": "faltou evento coding:done por subagente na branch",
  "rule-17-new-docs-valid": "novo doc criado sem validar referências no MAP.md",
  "rule-27-council-veredict": "feature sem veredito do council em docs/council/",
  "rule-33-intent-gate": "INTENT não declarado antes da mudança",
  "rule-34-twins-check": "padrão do bug não buscado no projeto todo",
  "rule-35-auth-gate": "AUTH sem citação literal do usuário",
  "rule-02-category-loading": "docs da categoria não carregados",
  "rule-31-lib-tests": "lib sem teste unitário",
  "rule-41-optimizer": "arquivo acima do limite de 150 linhas",
  "rule-42-coverage-gate": "cobertura de testes abaixo do limite de 75%",
};

// ─── Utilidades ──────────────────────────────────────────────────────

/** Executa comando com falha silenciosa (retorna ""). */
function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function readJsonl(path) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      // linha corrompida — ignora
    }
  }
  return out;
}

/** Janela de N dias atrás em timestamp (ms). */
function sinceMs(days) {
  return Date.now() - days * 864e5;
}

/** Eventos dentro da janela de N dias (comparação numérica, imune a formato). */
export function eventsInWindow(events, days) {
  const since = sinceMs(days);
  return events.filter((e) => {
    const ts = Date.parse(String(e.timestamp ?? ""));
    return Number.isFinite(ts) && ts >= since;
  });
}

// ─── Série diária (Datadog interno) ─────────────────────────────────

/**
 * "2026-08-13" → "13/08" (gerador). Espelho de businessDayLabel em
 * src/lib/businessSeries.ts — mantenha em sincronia.
 */
export function formatDayLabel(day) {
  const [, m, d] = String(day).split("-");
  return d && m ? `${d}/${m}` : day;
}

/**
 * KPIs de processo de UM dia. Função pura.
 * @param {Array<Record<string, any>>} events
 * @param {string} day - "YYYY-MM-DD"
 */
export function computeDailyKPI(events, day) {
  const prePrs = events.filter(
    (e) => e.type === "pre-pr" && String(e.timestamp ?? "").startsWith(day),
  );
  const total = prePrs.length;
  const passes = prePrs.filter(isPrePrPass).length;
  const fails = prePrs.filter(isPrePrFail).length;
  const ruleFails = events.filter(
    (e) => e.type === "rule:fail" && String(e.timestamp ?? "").startsWith(day),
  ).length;
  const healed = events.filter(
    (e) => e.type === "healed" && String(e.timestamp ?? "").startsWith(day),
  ).length;
  const sessions = events.filter(
    (e) => e.type === "session:start" && String(e.timestamp ?? "").startsWith(day),
  ).length;
  const merges = new Set(
    prePrs
      .filter((e) => isPrePrPass(e) && (e.branch || e.data?.branch))
      .map((e) => e.branch ?? e.data?.branch),
  ).size;

  return {
    day,
    label: formatDayLabel(day),
    prePrTotal: total,
    prePrPass: passes,
    prePrFail: fails,
    prePrPassRate: total > 0 ? Math.round((passes / total) * 1000) / 10 : null,
    ruleFails,
    healed,
    sessions,
    merges,
    friction: passes > 0 ? Math.round((ruleFails / passes) * 100) / 100 : null,
  };
}

/** Série diária dos últimos N dias (mais antigo → mais recente). */
export function computeDailySeries(events, days = 14) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    out.push(computeDailyKPI(events, day));
  }
  return out;
}

// ─── Resumo 30d ─────────────────────────────────────────────────────

/** Totais da janela de N dias. Função pura. */
export function computeSummary(events, days = 30) {
  const window = eventsInWindow(events, days);
  const prePrs = window.filter((e) => e.type === "pre-pr");
  const passes = prePrs.filter(isPrePrPass).length;
  return {
    merges: new Set(
      prePrs
        .filter((e) => isPrePrPass(e) && (e.branch || e.data?.branch))
        .map((e) => e.branch ?? e.data?.branch),
    ).size,
    prs: window.filter((e) => e.type === "pr:merge").length,
    sessions: window.filter((e) => e.type === "session:start").length,
    violations: window.filter((e) => e.type === "rule:fail").length,
    healed: window.filter((e) => e.type === "healed").length,
    prePrPassRate: prePrs.length > 0 ? Math.round((passes / prePrs.length) * 1000) / 10 : null,
  };
}

// ─── PRs recentes ────────────────────────────────────────────────────

/** "Merge pull request #369 from andre0787/feat/x" → { number, branch } */
export function parseMergeLogLine(line) {
  const m = /^Merge pull request #(\d+) from (\S+)/.exec(String(line));
  if (!m) return null;
  return { number: Number(m[1]), branch: m[2] };
}

/**
 * Linha de PR com benefício/impacto derivados do tipo. Derivação com a
 * MESMA fonte dos relatórios (typeOf/TYPE_BENEFIT/TYPE_IMPACT de
 * generate-report.mjs); shape próprio do JSON do dashboard (número/tipo).
 */
export function prRow(number, title, date, tokens) {
  const rawType = typeOf(title);
  const type = rawType === "auto" ? "other" : rawType;
  return {
    number,
    title,
    type,
    date,
    tokens,
    benefit: TYPE_BENEFIT[type] ?? DEFAULT_BENEFIT,
    impact: TYPE_IMPACT[type] ?? DEFAULT_IMPACT,
  };
}

/** Tokens estimados (linhas do numstat × 0.75) — reusa numstatLines dos reports. */
export function tokensFromNumstat(numstat) {
  return Math.round(numstatLines(numstat) * 0.75);
}

/** Busca os últimos PRs merged via git log --merges + gh (título real). */
export function fetchPrs(limit = 10) {
  const raw = sh(`git log --merges --format='%H%x1f%s%x1f%aI' -40`);
  const rows = [];
  for (const line of raw.split("\n")) {
    const [sha, subject, date] = line.split("\x1f");
    const parsed = parseMergeLogLine(subject || "");
    if (!parsed) continue;
    const title = sh(`gh pr view ${parsed.number} --json title --jq .title`) || subject;
    const numstat = sh(`git diff ${sha}^1 ${sha} --numstat`);
    rows.push(prRow(parsed.number, title, (date || "").slice(0, 10), tokensFromNumstat(numstat)));
    if (rows.length >= limit) break;
  }
  return rows;
}

// ─── Fatos do repo ──────────────────────────────────────────────────

function countFiles(pattern) {
  return sh(`git ls-files '${pattern}'`).split("\n").filter(Boolean).length;
}

/** Visão geral do projeto: contagens estruturais + telemetria bruta. */
export function computeRepoFacts(events, quality) {
  return {
    components: countFiles("src/components/*.tsx"),
    pages: countFiles("src/pages/*.tsx"),
    libs: countFiles("src/lib/*.ts"),
    scripts: countFiles("scripts/*.mjs"),
    testFiles: countFiles("tests/*.ts") + countFiles("tests/unit/*.ts"),
    skills: countFiles(".pi/skills/*/SKILL.md"),
    rules: countFiles("scripts/rules/rule-*.mjs"),
    events: events.length,
    qualityNotes: quality.length,
  };
}

// ─── Aba Workflow (dados reais) ─────────────────────────────────────

/** Contagem por tipo de evento (ordem fixa da paleta, só tipos presentes). */
export function countByType(events) {
  const counts = {};
  for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;
  return EVENT_PALETTE.filter(([name]) => (counts[name] ?? 0) > 0).map(([name, color]) => ({
    name,
    n: counts[name],
    color,
  }));
}

/** Buckets de outcome grade a partir das notas de qualidade. */
export function gradeBuckets(quality) {
  const graded = quality.filter((q) => typeof q.outcomeGrade === "number");
  return [
    {
      name: "100% — excelente",
      n: graded.filter((q) => q.outcomeGrade >= 100).length,
      color: "#10b981",
    },
    {
      name: "80% — aprovado",
      n: graded.filter((q) => q.outcomeGrade >= 80 && q.outcomeGrade < 100).length,
      color: "#84cc16",
    },
    {
      name: "abaixo de 80%",
      n: graded.filter((q) => q.outcomeGrade < 80).length,
      color: "#ef4444",
    },
  ];
}

/** Eficiência dos gates na janela fornecida (eventos já filtrados). */
export function computeGateEfficiency(windowEvents) {
  const prePrs = windowEvents.filter((e) => e.type === "pre-pr");
  const total = prePrs.length;
  const passes = prePrs.filter(isPrePrPass).length;
  const ruleFails = windowEvents.filter((e) => e.type === "rule:fail").length;
  const healed = windowEvents.filter((e) => e.type === "healed").length;

  const byRule = {};
  for (const v of windowEvents.filter((e) => e.type === "rule:fail")) {
    const rule = v.rule ?? v.data?.rule ?? v.description ?? "desconhecida";
    byRule[rule] = (byRule[rule] ?? 0) + 1;
  }
  const topViolations = Object.entries(byRule)
    .map(([rule, count]) => ({ rule, count, hint: RULE_HINTS[rule] ?? "" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    ruleFails,
    healed,
    healedRate: ruleFails > 0 ? Math.round((healed / ruleFails) * 1000) / 10 : null,
    prePrTotal: total,
    prePrPass: passes,
    prePrPassRate: total > 0 ? Math.round((passes / total) * 1000) / 10 : null,
    gateBlocked: windowEvents.filter((e) => e.type === "gate:blocked").length,
    topViolations,
  };
}

/**
 * Monta o corpo do workflow-data.json. Função pura (sem filesystem).
 * @param {{ events: Array<any>, quality: Array<any>, prs: Array<any>, repo: object }} input
 */
export function buildWorkflowData({ events, quality, prs, repo }) {
  const now = new Date();
  const dataDate = now.toISOString().slice(0, 10);
  const recentEvents = eventsInWindow(events, 30);
  const recentQuality = quality.filter((q) => {
    const ts = Date.parse(String(q.timestamp ?? ""));
    return Number.isFinite(ts) && ts >= sinceMs(30);
  });

  const evidenceBranches = new Set(
    events
      .filter((e) => e.type === "coding:done" || e.type === "code-review:done")
      .map((e) => e.branch ?? e.data?.branch ?? ""),
  ).size;

  const kpiStats = [
    { value: events.length, label: "eventos registrados", sub: "docs/tracking/events.jsonl" },
    { value: quality.length, label: "notas de qualidade", sub: "docs/tracking/quality.jsonl" },
    { value: repo.rules, label: "regras de validação", sub: "auto-executadas no pre-pr" },
    { value: repo.testFiles, label: "arquivos de teste", sub: "tests/ + tests/unit/" },
    {
      value: events.filter((e) => e.type === "healed").length,
      label: "auto-correções (healed)",
      sub: "desde o início",
    },
    {
      value: evidenceBranches,
      label: "branches com gates de evidência",
      sub: "coding + code-review por subagente",
    },
  ];

  const recentTimeline = [...recentEvents]
    .sort((a, b) => String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")))
    .slice(0, 8)
    .map((e) => ({
      t: String(e.timestamp ?? "")
        .replace("T", " ")
        .slice(0, 19),
      d: e.type,
      desc: e.description ?? e.taskId ?? "",
    }));

  return {
    generatedAt: now.toISOString(),
    dataDate,
    kpiStats,
    eventTypes: countByType(recentEvents),
    grades: gradeBuckets(recentQuality),
    recentTimeline,
    gateEfficiency: computeGateEfficiency(recentEvents),
    lastPrs: prs.slice(0, 5),
    overview: repo,
  };
}

// ─── Telemetria da IA (Custo por Funcionalidade) ─────────────────────

/**
 * Busca a tabela ai_telemetry via Supabase REST e agrega por área
 * (espelha src/lib/aiTelemetry.ts costPerArea). Fail-open: sem credenciais
 * ou em falha, retorna array vazio — o KPI mostra empty state.
 *
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY (opcional).
 */
export async function fetchTelemetryCost() {
  const url = process.env.SUPABASE_URL || "https://ohyplfpcwxzakujjfwdf.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/ai_telemetry?select=area,cost_estimate,total_execution_time_ms&limit=500`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      },
    );
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    const byArea = new Map();
    for (const r of rows) {
      const area = String(r.area ?? "").trim() || "geral";
      const prev = byArea.get(area) ?? { cost: 0, executions: 0, totalMs: 0 };
      prev.cost += Number(r.cost_estimate ?? 0);
      prev.executions += 1;
      prev.totalMs += Number(r.total_execution_time_ms ?? 0);
      byArea.set(area, prev);
    }
    return Array.from(byArea.entries())
      .map(([area, v]) => ({
        area,
        cost: Math.round(v.cost * 100000) / 100000,
        executions: v.executions,
        avgExecutionMs: v.executions > 0 ? Math.round(v.totalMs / v.executions) : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  } catch {
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

async function main() {
  const ROOT = resolve(import.meta.dirname, "..");
  const eventsPath = resolve(ROOT, "docs/tracking/events.jsonl");
  if (!existsSync(eventsPath)) {
    console.error("❌ events.jsonl não encontrado em:", eventsPath);
    process.exit(1);
  }
  const events = parseEvents(readFileSync(eventsPath, "utf8"));
  const quality = readJsonl(resolve(ROOT, "docs/tracking/quality.jsonl"));
  const days = Number(arg("days") ?? 30);
  const prsLimit = Number(arg("prs") ?? 10);

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthEvents = events.filter((e) => String(e.timestamp ?? "").startsWith(label));
    months.push(computeMonthlyKPI(monthEvents, label));
  }

  const daily = computeDailySeries(events, days);
  const summary = computeSummary(events, days >= 30 ? 30 : days);
  const prs = fetchPrs(prsLimit);
  const repo = computeRepoFacts(events, quality);

  // Custo por funcionalidade (rule-48) — fail-open (sem credenciais → []).
  const telemetry = await fetchTelemetryCost();

  writeFileSync(
    resolve(ROOT, "public/kpi-data.json"),
    JSON.stringify(
      {
        generatedAt: now.toISOString(),
        currentMonth: months[months.length - 1]?.month ?? "",
        months,
        daily,
        prs,
        repo,
        summary,
        telemetry,
      },
      null,
      2,
    ),
  );
  console.log(`✅ public/kpi-data.json gerado (telemetria: ${telemetry.length} área(s))`);

  writeFileSync(
    resolve(ROOT, "public/workflow-data.json"),
    JSON.stringify(buildWorkflowData({ events, quality, prs, repo }), null, 2),
  );
  console.log("✅ public/workflow-data.json gerado");
  console.log(
    `📊 ${events.length} eventos · ${quality.length} notas · ${prs.length} PRs recentes · ${daily.length} dias`,
  );
}

if (process.argv[1] === import.meta.filename) {
  main().catch((err) => {
    console.error("❌ data-refresh falhou:", err?.message ?? err);
    process.exit(1);
  });
}
