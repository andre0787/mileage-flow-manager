#!/usr/bin/env node

/**
 * generate-report.mjs — Briefing executivo de sessão (HTML).
 *
 * Orchestrador fino: importa os 4 módulos extraídos e monta o relatório.
 * Módulos:
 *   scripts/lib/report/report-cli.mjs     — parsing de args + help
 *   scripts/lib/report/report-git.mjs     — funções git puras
 *   scripts/lib/report/report-metrics.mjs — leitura JSONL + métricas
 *   scripts/lib/report/report-html.mjs    — geração do template HTML
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parseArgs, HELP, showHelp, ROOT } from "./lib/report/report-cli.mjs";
import { getDiff, getChangedFiles, getBranch, getCommit, getPR, derivePrRows } from "./lib/report/report-git.mjs";
import { readTodayEvents, readTodayQuality, computeSessionMetrics, estimateTokens } from "./lib/report/report-metrics.mjs";
import { generateHTML } from "./lib/report/report-html.mjs";
import { auditContext } from "./context-audit.mjs";

// ── Re-exports (mantêm compatibilidade com testes que importam daqui) ──
export {
  fallbackTableRow, parseCommitRecord, buildPrRow,
  numstatLines, typeOf, TYPE_BENEFIT, TYPE_IMPACT, deriveTableRows,
} from "./lib/report/report-git.mjs";
export { escapeHTML } from "./lib/report/report-html.mjs";
export {
  computeSessionMetrics, sessionHealth, readTodayEvents,
  readTodayQuality, readJsonLinesByDate, estimateTokens,
} from "./lib/report/report-metrics.mjs";
export { generateHTML } from "./lib/report/report-html.mjs";

// ── Rename mode (.helper p/ manter main fino) ──────────────────────
function handleRename(args) {
  const date = args.reportDate || new Date().toISOString().slice(0, 10);
  const prefix = args.renameTarget.startsWith("PR") ? args.renameTarget : `PR${args.renameTarget}`;
  const dir = resolve(ROOT, `docs/reports/${date}`);
  if (!existsSync(dir)) { console.log(`⚠️  Nenhum relatório encontrado em docs/reports/${date}/`); process.exit(1); }
  const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
  let renamed = 0;
  for (const file of files) {
    if (file.startsWith(prefix)) continue;
    const newName = file.replace(/^[^-]+/, prefix);
    if (newName === file) continue;
    renameSync(resolve(dir, file), resolve(dir, newName));
    console.log(`  🔄 ${file} → ${newName}`); renamed++;
  }
  console.log(renamed === 0 ? `  ✅ Todos os relatórios já com prefixo ${prefix}` : `  ✅ ${renamed} relatório(s) renomeado(s)`);
}

// ── IS_MAIN: verifica se este arquivo foi chamado diretamente ────────
const IS_MAIN =
  process.argv[1] &&
  fileURLToPath(pathToFileURL(resolve(process.argv[1])).href) ===
    fileURLToPath(import.meta.url);

// ── Entry point ─────────────────────────────────────────────────────
if (IS_MAIN) {
  if (HELP) showHelp();
  const args = parseArgs();
  if (args.renameTarget) { handleRename(args); process.exit(0); }

  const diff = getDiff();
  const changedFiles = getChangedFiles();
  const branch = getBranch();
  const commit = getCommit();
  const pr = getPR();
  const metrics = estimateTokens(diff);
  const events = readTodayEvents();
  const quality = readTodayQuality();
  const session = computeSessionMetrics(events, quality, args.testsFlag);
  const tableRows = args.tableRows.length > 0 ? args.tableRows : derivePrRows();

  const html = generateHTML({
    task: args.task, diff, changedFiles, branch, commit, pr, metrics,
    tableRows, evidenceUrl: args.evidenceUrl,
    beforeText: args.beforeText, afterText: args.afterText,
    summary: args.summary, contextAudit: auditContext(),
    impactProduto: args.impactProduto, impactNegocio: args.impactNegocio,
    impactoProcesso: args.impactProcesso, session,
  });

  if (args.write) {
    const date = args.reportDate || new Date().toISOString().slice(0, 10);
    const safeName = args.task.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const prefix = pr ? `PR${pr.number}` : args.prefix;
    const dir = resolve(ROOT, `docs/reports/${date}`);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${prefix}-${date}-${safeName}.html`), html);
    console.log(`✅ Relatório salvo: docs/reports/${date}/${prefix}-${date}-${safeName}.html`);
  } else { console.log(html); }
}
