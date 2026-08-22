/**
 * report-metrics.mjs — Leitura de telemetria (JSONL) e computação de métricas.
 *
 * readTodayEvents, readTodayQuality, computeSessionMetrics, sessionHealth.
 * Leitura tail otimizada para arquivos JSONL grandes (events.jsonl > 60K tokens).
 *
 * deps: fs, path, report-cli (ROOT, REPORT_DATE)
 */

import {
  readFileSync,
  statSync,
  openSync,
  readSync,
  closeSync,
  existsSync,
} from "fs";
import { resolve } from "path";
import { ROOT, REPORT_DATE } from "./report-cli.mjs";

const EVENTS_FILE = resolve(ROOT, "docs/tracking/events.jsonl");
const QUALITY_FILE = resolve(ROOT, "docs/tracking/quality.jsonl");

// ── JSONL tail-reading (otimizado para arquivos grandes) ────────────
/**
 * Lê apenas as últimas ~maxLines do final de um arquivo JSONL (tail).
 * Um read de ~300KB no fim cobre milhares de linhas recentes.
 */
function readTailLines(filePath, maxLines = 6000) {
  try {
    const size = statSync(filePath).size;
    const chunkBytes = Math.min(size, 300 * 1024);
    const fd = openSync(filePath, "r");
    const buf = Buffer.alloc(chunkBytes);
    readSync(fd, buf, 0, chunkBytes, size - chunkBytes);
    closeSync(fd);
    const lines = buf.toString("utf8").split("\n").filter(Boolean);
    const start = lines.length > maxLines ? lines.length - maxLines : 0;
    return lines.slice(start);
  } catch {
    return [];
  }
}

/** Lê o arquivo inteiro (fallback para backfill com --date fora do tail). */
function readFullLines(filePath) {
  try {
    return readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/** Parseia linhas JSONL em objetos (null-safe). */
function parseJsonLines(lines) {
  return lines
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);
}

/**
 * Lê linhas de um JSONL filtrando por data: tail otimizado por padrão;
 * leitura completa quando a data-alvo não aparece no tail (backfill histórico).
 */
export function readJsonLinesByDate(filePath, today, withGrade = false) {
  if (!existsSync(filePath)) return [];
  try {
    const useTail = !REPORT_DATE;
    const lines = useTail ? readTailLines(filePath) : readFullLines(filePath);
    let parsed = parseJsonLines(lines);
    if (withGrade) parsed = parsed.filter((e) => typeof e.outcomeGrade === "number");
    const filtered = parsed.filter((e) => (e.timestamp || "").startsWith(today));
    if (filtered.length === 0 && useTail) {
      const full = parseJsonLines(readFullLines(filePath));
      return withGrade
        ? full.filter(
            (e) => typeof e.outcomeGrade === "number" && (e.timestamp || "").startsWith(today),
          )
        : full.filter((e) => (e.timestamp || "").startsWith(today));
    }
    return filtered;
  } catch {
    return [];
  }
}

// ── Auto-métricas da sessão ────────────────────────────────────────
export function readTodayEvents(now = new Date()) {
  const today = REPORT_DATE || now.toISOString().slice(0, 10);
  return readJsonLinesByDate(EVENTS_FILE, today);
}

export function readTodayQuality(now = new Date()) {
  const today = REPORT_DATE || now.toISOString().slice(0, 10);
  return readJsonLinesByDate(QUALITY_FILE, today, true);
}

/**
 * Computa métricas de impacto da sessão a partir dos eventos do dia.
 */
export function computeSessionMetrics(events, quality = [], tests = null) {
  const prePr = events.filter((e) => e.type === "pre-pr");
  const prePrPass = prePr.filter(
    (e) => (e.description || "").includes("PASS") || e.errors === 0,
  ).length;
  const prePrFail = prePr.length - prePrPass;
  const ruleFails = events.filter((e) => e.type === "rule:fail").length;
  const healed = events.filter((e) => e.type === "healed").length;
  const codings = events.filter((e) => e.type === "coding:done").length;
  const reviews = events.filter((e) => e.type === "code-review:done").length;

  const prMerges = events
    .filter((e) => e.type === "pr:merge")
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const prMergeAt = prMerges.length > 0 ? prMerges[prMerges.length - 1].timestamp : null;
  const firstStart = events.find((e) => e.type === "session:start")?.timestamp || null;
  const leadTimeMin =
    firstStart && prMergeAt
      ? Math.max(1, Math.round((new Date(prMergeAt) - new Date(firstStart)) / 60000))
      : null;

  const avgGrade =
    quality.length > 0
      ? Math.round(quality.reduce((s, q) => s + q.outcomeGrade, 0) / quality.length)
      : null;

  const picks = [
    { type: "session:start", label: "Início da sessão" },
    { type: "coding:done", label: "Implementação concluída" },
    { type: "code-review:done", label: "Code review aprovado" },
    { type: "pre-pr", label: "Validação pré-PR", match: (d) => d.includes("PASS") },
    { type: "pr:create", label: "PR aberto" },
    { type: "pr:merge", label: "Merge em produção" },
  ];
  const timeline = [];
  for (const pick of picks) {
    const found = events.find(
      (e) => e.type === pick.type && (!pick.match || pick.match(e.description || "")),
    );
    if (found) {
      timeline.push({
        label: pick.label,
        ts: found.timestamp,
        time: (found.timestamp || "").slice(11, 16),
        type: pick.type,
      });
    }
  }

  return {
    leadTimeMin,
    prePrTotal: prePr.length,
    prePrPass,
    prePrFail,
    ruleFails,
    healed,
    codings,
    reviews,
    prMerges: prMerges.length,
    outcomeGrade: avgGrade,
    tests,
    timeline,
  };
}

/** Ponto de saúde do período (verde/âmbar/vermelho). */
export function sessionHealth(m) {
  const net = (m.ruleFails || 0) - (m.healed || 0);
  if (m.prMerges === 0 && net > 10)
    return { label: "Precisa atenção", color: "#f87171", tone: "red" };
  if (m.prePrFail > 3 || net > 8) return { label: "Sob atenção", color: "#fbbf24", tone: "amber" };
  return { label: "Saudável", color: "#34d399", tone: "green" };
}

// ── Estima tokens ───────────────────────────────────────────────────
export function estimateTokens(diff) {
  const lines = diff.split("\n").length;
  const additions = (diff.match(/^\+/gm) || []).length;
  const deletions = (diff.match(/^-/gm) || []).length;
  const totalTokens = Math.round(lines * 0.75);
  const addTokens = Math.round(additions * 0.75);
  const delTokens = Math.round(deletions * 0.75);
  const overheadTokens = totalTokens - addTokens - delTokens;
  return { lines, additions, deletions, tokens: totalTokens, addTokens, delTokens, overheadTokens };
}
