#!/usr/bin/env node
// metrics/report.mjs — Gera relatório markdown + JSON em docs/metrics/.

import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

function fmtHours(h) {
  if (h === null || h === undefined || Number.isNaN(h)) return "n/d";
  return Number(h).toFixed(1);
}

/**
 * Escreve relatório MD + JSON em docs/metrics/<dateLabel>-metrics.{md,json}.
 * @param {object} result - saída de aggregate()
 * @param {string} dateLabel - "YYYY-MM-DD"
 * @returns {{mdPath: string, jsonPath: string}}
 */
export function writeReport(result, dateLabel) {
  const dir = resolve(import.meta.dirname, "../../docs/metrics");
  mkdirSync(dir, { recursive: true });

  const greenPct =
    result.greenFirst.total > 0
      ? Math.round((result.greenFirst.green / result.greenFirst.total) * 100)
      : 0;
  const bypassList =
    result.bypassProxy.length > 0 ? result.bypassProxy.join(", ") : "nenhum";

  const md = [
    `# 📊 Métricas do Programa — ${dateLabel}`,
    "",
    `> Fonte: GitHub API (PRs + check-runs) + \`docs/tracking/events.jsonl\`.`,
    `> Janela: ${result.since || "tudo"} | Gerado: ${result.generatedAt}`,
    "",
    "## Visão geral",
    "",
    `- **PRs na janela:** ${result.totals.prs} (${result.totals.merged} mergeados)`,
    `- **PRs por categoria:** ${Object.entries(result.byCategory)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ")}`,
    "",
    "## Verde-na-1ª (local: 1º pre-pr PASS sem rule:fail)",
    "",
    `- **${result.greenFirst.green}/${result.greenFirst.total} (${greenPct}%)** dos PRs mergeados passaram o pre-pr na 1ª tentativa.`,
    "",
    "## Tempo até verificação (session:start → pre-pr PASS)",
    "",
    `- **${fmtHours(result.cycleHours)}h** (médio, reusa computeCycleTime)`,
    "",
    "## Retrabalho",
    "",
    `- **${result.rework.prsWithFails}** PRs com ≥1 rule:fail antes do 1º PASS`,
    `- **${result.rework.totalRuleFails}** rule:fails totais na janela`,
    "",
    "## Skips E2E (check-runs)",
    "",
    `- **${result.e2eSkips.total}** skips (${result.e2eSkips.byDesign} por design: e2e-smoke/prod/full; ${
      result.e2eSkips.total - result.e2eSkips.byDesign
    } fora de design)`,
    "",
    "## Bypasses do gate local (proxy: PR mergeado sem evento pre-pr)",
    "",
    `> **Limitação:** o GitHub não expõe a flag \`--no-verify\`; o proxy mede PRs`,
    `> mergeados sem NENHUM pre-pr registrado na branch.`,
    "",
    `- **${result.bypassProxy.length}** PRs candidatos: ${bypassList}`,
    "",
    "## Por modelo (quando disponível)",
    "",
    result.byModel.length > 0
      ? result.byModel.map((g) => `- \`${g.model}\`: ${g.count} eventos`).join("\n")
      : "- sem dados de modelo nos eventos",
    "",
  ].join("\n");

  const mdPath = resolve(dir, `${dateLabel}-metrics.md`);
  const jsonPath = resolve(dir, `${dateLabel}-metrics.json`);
  writeFileSync(mdPath, md, "utf8");
  writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");
  return { mdPath, jsonPath };
}
