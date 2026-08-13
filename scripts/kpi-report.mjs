#!/usr/bin/env node

/**
 * kpi-report.mjs — Geração de KPIs de processo mensais.
 *
 * Lê docs/tracking/events.jsonl + docs/reports/ + git log,
 * computa 6 KPIs mensais e gera public/kpi-data.json.
 *
 * Uso: node scripts/kpi-report.mjs
 *      node scripts/kpi-report.mjs --month 6  (mês específico)
 *      node scripts/kpi-report.mjs --all       (todos os meses disponíveis)
 */

// @ts-check
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { parseProcessEvents } from "./lib/process-events.mjs";
import { computeRouterKPI } from "./lib/router-kpi.mjs";

// ─── Tipos ───────────────────────────────────────────────────────────

/** @typedef {{ type: string, timestamp: string, data: Record<string,any> }} KPIEvent */

/** @typedef {{ month: string, prePrPassRate: number, prePrTotal: number, prePrPass: number, prePrFail: number, testCoverageLibs: number|null, testCoverageComponents: number|null, gateActivations: {intent:number, twins:number, auth:number}, avgOutcomeGrade: number|null, topViolations: Array<{rule:string, count:number}>, healedByRule: Record<string, number>, gateBlockedByRule: Record<string, number>, avgCycleTimeHours: number|null, branchesMerged: number, violationsCaught: number, healedRate: number|null, frictionPerPass: number|null }} MonthlyKPI */

// ─── Parser ──────────────────────────────────────────────────────────

/**
 * Parseia JSONL bruto em array de eventos.
 * @param {string} raw
 * @returns {KPIEvent[]}
 */
export function parseEvents(raw) {
  return parseProcessEvents(raw);
}

/**
 * Filtra eventos por ano/mês (baseado no timestamp).
 * @param {KPIEvent[]} events
 * @param {number} year
 * @param {number} month (1-12)
 * @returns {KPIEvent[]}
 */
export function filterByMonth(events, year, month) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return events.filter((e) => e.timestamp.startsWith(prefix));
}

/**
 * Média de valores numéricos (1 casa decimal), ou null se vazio.
 * @param {number[]} values
 * @returns {number|null}
 */
function average(values) {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/**
 * Lê métricas de qualidade estruturadas do mês em docs/tracking/quality.jsonl.
 * Fonte gravada pelas rules 30/31/32 a cada execução do pre-pr (quality-log.mjs).
 * @param {string} monthLabel - "YYYY-MM"
 * @returns {{ avgOutcomeGrade: number|null, testCoverageLibs: number|null, testCoverageComponents: number|null }}
 */
export function parseReportsForMonth(monthLabel) {
  const ROOT = resolve(import.meta.dirname, "..");
  const qualityPath = resolve(ROOT, "docs/tracking/quality.jsonl");
  const grades = [];
  const libCovs = [];
  const compCovs = [];

  if (!existsSync(qualityPath)) {
    return {
      avgOutcomeGrade: null,
      testCoverageLibs: null,
      testCoverageComponents: null,
    };
  }

  const lines = readFileSync(qualityPath, "utf8")
    .split("\n")
    .filter((l) => l.trim());
  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue; // linha corrompida — ignora
    }
    if (!entry.timestamp?.startsWith(monthLabel)) continue;

    if (entry.rule === "rule-30" && typeof entry.outcomeGrade === "number") {
      grades.push(entry.outcomeGrade);
    } else if (entry.rule === "rule-31" && typeof entry.pct === "number") {
      libCovs.push(entry.pct);
    } else if (entry.rule === "rule-32" && typeof entry.pct === "number") {
      compCovs.push(entry.pct);
    }
  }

  return {
    avgOutcomeGrade: average(grades),
    testCoverageLibs: average(libCovs),
    testCoverageComponents: average(compCovs),
  };
}

/**
 * Computa tempo médio de ciclo (horas) entre session:start e pre-pr PASS.
 * @param {KPIEvent[]} events
 * @returns {number|null}
 */
export function computeCycleTime(events) {
  const sessionEvents = events.filter(
    (e) => (e.type === "session" || e.type === "session:start") && (e.branch || e.data?.branch),
  );
  /** @type {Record<string, {start?: string, end?: string}>} */
  const branchMap = {};

  for (const ev of sessionEvents) {
    const branch = ev.branch ?? ev.data?.branch;
    if (!branchMap[branch]) branchMap[branch] = {};
    branchMap[branch].start = ev.timestamp;
  }

  const prePrPasses = events.filter(
    (e) => e.type === "pre-pr" && isPrePrPass(e) && (e.branch || e.data?.branch),
  );
  for (const ev of prePrPasses) {
    const branch = ev.branch ?? ev.data?.branch;
    if (branchMap[branch]) branchMap[branch].end = ev.timestamp;
  }

  const cycles = Object.values(branchMap).filter((v) => v.start && v.end);
  if (cycles.length === 0) return null;

  // Filtra durações inválidas (end < start): artefatos de eventos antigos/poluídos
  const validCycles = cycles.filter(
    (c) => new Date(c.end).getTime() >= new Date(c.start).getTime(),
  );
  if (validCycles.length === 0) return null;

  const totalHours = validCycles.reduce((sum, c) => {
    const diff = new Date(c.end).getTime() - new Date(c.start).getTime();
    return sum + diff / (1000 * 60 * 60);
  }, 0);
  return Math.round((totalHours / validCycles.length) * 10) / 10;
}

// ─── Agregação Mensal ───────────────────────────────────────────────

/**
 * Verdadeiro se evento pre-pr representa PASS.
 * Formato real do event-log (plano): description "pre-pr PASS" + errors 0.
 * Compatível também com formato aninhado legado (data.result).
 * @param {{description?: string, errors?: number, data?: {result?: string}}} e
 */
export function isPrePrPass(e) {
  return e.description?.includes("PASS") || e.errors === 0 || e.data?.result === "PASS";
}

/**
 * Verdadeiro se evento pre-pr representa FAIL.
 * @param {{description?: string, errors?: number, data?: {result?: string}}} e
 */
export function isPrePrFail(e) {
  return e.description?.includes("FAIL") || (e.errors ?? 0) > 0 || e.data?.result === "FAIL";
}

/**
 * Computa todos os KPIs para um mês.
 * @param {KPIEvent[]} events - Eventos filtrados do mês
 * @param {string} monthLabel - "YYYY-MM"
 * @returns {MonthlyKPI}
 */
export function computeMonthlyKPI(events, monthLabel) {
  const prePrs = events.filter((e) => e.type === "pre-pr");
  const total = prePrs.length;
  const passes = prePrs.filter(isPrePrPass).length;
  const fails = prePrs.filter(isPrePrFail).length;
  const prePrPassRate = total > 0 ? Math.round((passes / total) * 1000) / 10 : 0;

  const gates = events.filter((e) => e.type === "gate");
  const gateActivations = {
    intent: gates.filter((e) => e.gate === "intent" || e.data?.gate === "intent").length,
    twins: gates.filter((e) => e.gate === "twins" || e.data?.gate === "twins").length,
    auth: gates.filter((e) => e.gate === "auth" || e.data?.gate === "auth").length,
  };

  const { avgOutcomeGrade, testCoverageLibs, testCoverageComponents } =
    parseReportsForMonth(monthLabel);

  const avgCycleTimeHours = computeCycleTime(events);

  // Top violações: eventos rule:fail registrados pelo pre-pr (regra + contagem)
  const violationsByRule = {};
  for (const v of events.filter((e) => e.type === "rule:fail")) {
    const rule = v.rule ?? v.data?.rule ?? v.description ?? "desconhecida";
    violationsByRule[rule] = (violationsByRule[rule] ?? 0) + 1;
  }
  const topViolations = Object.entries(violationsByRule)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Auto-heals: eventos healed registrados pelo pre-pr (fricção removida por regra)
  const healedByRule = {};
  for (const h of events.filter((e) => e.type === "healed")) {
    const rule = h.rule ?? h.data?.rule ?? h.description ?? "desconhecida";
    healedByRule[rule] = (healedByRule[rule] ?? 0) + 1;
  }

  // Gates bloqueados: eventos gate:blocked (julgamento humano exigido —
  // separado de violação para o KPI não penalizar ativação correta do gate)
  const gateBlockedByRule = {};
  for (const g of events.filter((e) => e.type === "gate:blocked")) {
    const rule = g.rule ?? g.data?.rule ?? g.description ?? "desconhecida";
    gateBlockedByRule[rule] = (gateBlockedByRule[rule] ?? 0) + 1;
  }

  // Branches merged: unique branches com pre-pr PASS no mês
  const branchesMerged = new Set(
    prePrs
      .filter((e) => isPrePrPass(e) && (e.branch || e.data?.branch))
      .map((e) => e.branch ?? e.data?.branch),
  ).size;

  // Eficiência de gates: violações pegas antes do PR, taxa de auto-correção
  // e fricção média por entrega (quantas violações para cada pre-pr aprovado).
  const violationsCaught = events.filter((e) => e.type === "rule:fail").length;
  const healedTotal = events.filter((e) => e.type === "healed").length;
  const healedRate =
    violationsCaught > 0 ? Math.round((healedTotal / violationsCaught) * 1000) / 10 : null;
  const frictionPerPass = passes > 0 ? Math.round((violationsCaught / passes) * 100) / 100 : null;

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
    healedByRule,
    gateBlockedByRule,
    avgCycleTimeHours,
    branchesMerged,
    violationsCaught,
    healedRate,
    frictionPerPass,
    llmRouter: computeRouterKPI(events),
  };
}

// ─── Geração JSON ───────────────────────────────────────────────────

/**
 * Gera arquivo kpi-data.json com os KPIs agregados.
 * @param {MonthlyKPI[]} months
 * @param {string} outputPath
 */
export function generateJSON(months, outputPath) {
  const data = {
    generatedAt: new Date().toISOString(),
    months,
    currentMonth: months.length > 0 ? months[months.length - 1].month : "",
  };
  writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ kpi-data.json gerado: ${outputPath}`);
}

// ─── Main ────────────────────────────────────────────────────────────

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
  console.log("✅ KPIs computados com sucesso");
}

if (process.argv[1] === import.meta.filename) {
  main();
}
