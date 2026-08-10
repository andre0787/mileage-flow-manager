#!/usr/bin/env node
// metrics-collect.mjs — Entry point fino das métricas do programa (P2-21).
// Atalho npm: `npm run metrics:collect` (inalterado).
// Coleta GitHub API → agrega com events.jsonl → relatório MD/JSON em docs/metrics/.

import { collectGhData } from "./metrics/collect.mjs";
import { loadLocalEvents, aggregate } from "./metrics/aggregate.mjs";
import { writeReport } from "./metrics/report.mjs";

const since =
  process.argv.find((a) => a.startsWith("--since="))?.split("=")[1] ?? "";
const limitArg =
  process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0";

const gh = await collectGhData({ since, limit: Number(limitArg) });
const { events, coverageSince } = loadLocalEvents();
const result = aggregate(gh, events, { since, coverageSince });
const dateLabel = new Date().toISOString().slice(0, 10);
const { mdPath, jsonPath } = writeReport(result, dateLabel);

console.log("📊 Métricas do Programa:");
console.log(`- PRs na janela: ${result.totals.prs} (${result.totals.merged} mergeados, ${result.totals.covered} cobertos)`);
console.log(`- Verde-na-1ª (coberto): ${result.greenFirst.green}/${result.greenFirst.total}`);
console.log(`- Tempo até verificação: ${result.cycleHours ?? "n/d"}h`);
console.log(`- Retrabalho: ${result.rework.prsWithFails} PRs com rule:fail`);
console.log(`- Skips E2E: ${result.e2eSkips.total} (${result.e2eSkips.byDesign} por design)`);
console.log(`- Bypass proxy (coberto): ${result.bypassProxy.length}`);
console.log(`→ ${mdPath}`);
console.log(`→ ${jsonPath}`);
