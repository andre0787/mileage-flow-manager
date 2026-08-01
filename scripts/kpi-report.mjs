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
import { readFileSync, existsSync, readdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

// ─── Tipos ───────────────────────────────────────────────────────────

/** @typedef {{ type: string, timestamp: string, data: Record<string,any> }} KPIEvent */

/** @typedef {{ month: string, prePrPassRate: number, prePrTotal: number, prePrPass: number, prePrFail: number, testCoverageLibs: number|null, testCoverageComponents: number|null, gateActivations: {intent:number, twins:number, auth:number}, avgOutcomeGrade: number|null, topViolations: Array<{rule:string, count:number}>, avgCycleTimeDays: number|null, branchesMerged: number }} MonthlyKPI */

// ─── Parser ──────────────────────────────────────────────────────────

/**
 * Parseia JSONL bruto em array de eventos.
 * @param {string} raw
 * @returns {KPIEvent[]}
 */
export function parseEvents(raw) {
  return raw
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
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
 * Extrai valor numérico de um relatório HTML via regex.
 * @param {string} content
 * @param {RegExp} pattern
 * @returns {number|null}
 */
function extractFromReport(content, pattern) {
  const match = content.match(pattern);
  return match ? Number(match[1]) : null;
}

/**
 * Parseia relatórios HTML do mês para extrair outcome grade e cobertura.
 * @param {string} monthLabel - "YYYY-MM"
 * @returns {{ avgOutcomeGrade: number|null, testCoverageLibs: number|null, testCoverageComponents: number|null, topViolations: Array<{rule:string, count:number}> }}
 */
export function parseReportsForMonth(monthLabel) {
  const [year] = monthLabel.split("-").map(Number);
  const ROOT = resolve(import.meta.dirname, "..");
  const reportsBase = resolve(ROOT, "docs/reports");
  const outcomes = [];
  const libCovs = [];
  const compCovs = [];

  if (!existsSync(reportsBase)) {
    return {
      avgOutcomeGrade: null,
      testCoverageLibs: null,
      testCoverageComponents: null,
      topViolations: [],
    };
  }

  const dirs = readdirSync(reportsBase).filter((d) =>
    d.startsWith(`${year}-`),
  );

  for (const dir of dirs) {
    const dirPath = resolve(reportsBase, dir);
    if (!existsSync(dirPath)) continue;
    const files = readdirSync(dirPath).filter((f) => f.endsWith(".html"));
    for (const file of files) {
      const content = readFileSync(resolve(dirPath, file), "utf8");

      // Outcome grade
      const grade = extractFromReport(content, /outcome grade[:\s]+(\d+)/i);
      if (grade !== null) outcomes.push(grade);

      // Cobertura de libs (rule-31)
      const libCov = extractFromReport(
        content,
        /cobertura\s*(?:d[ae])\s*libs[:\s]+(\d+)\/+/i,
      );
      if (libCov !== null) libCovs.push(libCov);

      // Cobertura de componentes (rule-32)
      const compCov = extractFromReport(
        content,
        /cobertura\s*(?:d[ae])\s*componentes[:\s]+(\d+)\/+/i,
      );
      if (compCov !== null) compCovs.push(compCov);
    }
  }

  const avgOutcomeGrade =
    outcomes.length > 0
      ? Math.round(
          (outcomes.reduce((a, b) => a + b, 0) / outcomes.length) * 10,
        ) / 10
      : null;
  const testCoverageLibs =
    libCovs.length > 0
      ? Math.round(libCovs.reduce((a, b) => a + b, 0) / libCovs.length)
      : null;
  const testCoverageComponents =
    compCovs.length > 0
      ? Math.round(compCovs.reduce((a, b) => a + b, 0) / compCovs.length)
      : null;

  return {
    avgOutcomeGrade,
    testCoverageLibs,
    testCoverageComponents,
    topViolations: [],
  };
}

/**
 * Computa tempo médio de ciclo (dias) entre session:start e pre-pr PASS.
 * @param {KPIEvent[]} events
 * @returns {number|null}
 */
export function computeCycleTime(events) {
  const sessionEvents = events.filter(
    (e) =>
      (e.type === "session" || e.type === "session:start") &&
      (e.branch || e.data?.branch),
  );
  /** @type {Record<string, {start?: string, end?: string}>} */
  const branchMap = {};

  for (const ev of sessionEvents) {
    const branch = ev.branch ?? ev.data?.branch;
    if (!branchMap[branch]) branchMap[branch] = {};
    branchMap[branch].start = ev.timestamp;
  }

  const prePrPasses = events.filter(
    (e) =>
      e.type === "pre-pr" &&
      isPrePrPass(e) &&
      (e.branch || e.data?.branch),
  );
  for (const ev of prePrPasses) {
    const branch = ev.branch ?? ev.data?.branch;
    if (branchMap[branch]) branchMap[branch].end = ev.timestamp;
  }

  const cycles = Object.values(branchMap).filter(
    (v) => v.start && v.end,
  );
  if (cycles.length === 0) return null;

  const totalDays = cycles.reduce((sum, c) => {
    const diff = new Date(c.end).getTime() - new Date(c.start).getTime();
    return sum + diff / (1000 * 60 * 60 * 24);
  }, 0);
  return Math.round((totalDays / cycles.length) * 10) / 10;
}

// ─── Agregação Mensal ───────────────────────────────────────────────

/**
 * Verdadeiro se evento pre-pr representa PASS.
 * Formato real do event-log (plano): description "pre-pr PASS" + errors 0.
 * Compatível também com formato aninhado legado (data.result).
 * @param {{description?: string, errors?: number, data?: {result?: string}}} e
 */
function isPrePrPass(e) {
  return (
    e.description?.includes("PASS") ||
    e.errors === 0 ||
    e.data?.result === "PASS"
  );
}

/**
 * Verdadeiro se evento pre-pr representa FAIL.
 * @param {{description?: string, errors?: number, data?: {result?: string}}} e
 */
function isPrePrFail(e) {
  return (
    e.description?.includes("FAIL") ||
    (e.errors ?? 0) > 0 ||
    e.data?.result === "FAIL"
  );
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
  const prePrPassRate =
    total > 0 ? Math.round((passes / total) * 1000) / 10 : 0;

  const gates = events.filter((e) => e.type === "gate");
  const gateActivations = {
    intent: gates.filter((e) => e.gate === "intent" || e.data?.gate === "intent").length,
    twins: gates.filter((e) => e.gate === "twins" || e.data?.gate === "twins").length,
    auth: gates.filter((e) => e.gate === "auth" || e.data?.gate === "auth").length,
  };

  const {
    avgOutcomeGrade,
    testCoverageLibs,
    testCoverageComponents,
    topViolations,
  } = parseReportsForMonth(monthLabel);

  const avgCycleTimeDays = computeCycleTime(events);

  // Branches merged: unique branches com pre-pr PASS no mês
  const branchesMerged = new Set(
    prePrs
      .filter((e) => isPrePrPass(e) && (e.branch || e.data?.branch))
      .map((e) => e.branch ?? e.data?.branch),
  ).size;

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
    branchesMerged,
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
    currentMonth:
      months.length > 0 ? months[months.length - 1].month : "",
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
    const monthEvents = filterByMonth(
      allEvents,
      d.getFullYear(),
      d.getMonth() + 1,
    );
    months.push(computeMonthlyKPI(monthEvents, label));
  }

  generateJSON(months, outputPath);
  console.log("✅ KPIs computados com sucesso");
}

if (process.argv[1] === import.meta.filename) {
  main();
}