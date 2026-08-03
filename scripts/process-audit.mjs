#!/usr/bin/env node

/**
 * process-audit.mjs — Auditoria read-only da evidência de processo.
 *
 * Lê docs/tracking/events.jsonl (ou PROCESS_EVENTS_PATH), valida cada evento
 * com o mesmo contrato do pre-pr e resume os KPIs de evidência sem gravar nada.
 *
 * Uso:
 *   node scripts/process-audit.mjs            # relatório humano
 *   node scripts/process-audit.mjs --json     # objeto único para CI
 *   node scripts/process-audit.mjs --check    # exit 1 em contrato inválido
 *   node scripts/process-audit.mjs --strict   # alias de --check
 *
 * Exit: 0 = evidência válida (unobserved não falha até o contrato do router)
 *       1 = JSON malformado ou evento inválido (inclui campos sensíveis)
 *
 * ponytail: fs + child_process nativos, zero deps.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  parseProcessEvents,
  validateProcessEvents,
  summarizeProcessEvidence,
} from "./lib/process-events.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_PATH = resolve(ROOT, "docs/tracking/events.jsonl");
const MAX_ISSUES_PRINTED = 5;

function loadEvents() {
  const eventsPath = process.env.PROCESS_EVENTS_PATH || DEFAULT_PATH;
  if (!existsSync(eventsPath)) {
    console.error(`❌ events.jsonl não encontrado: ${eventsPath}`);
    process.exit(1);
  }
  const raw = readFileSync(eventsPath, "utf8");
  return { eventsPath, events: parseProcessEvents(raw) };
}

function printHumanSummary(summary, eventsPath) {
  const { total, invalid, byType, unobserved } = summary;
  console.log(`🔎 Auditoria de evidência de processo`);
  console.log(`  Fonte: ${eventsPath}`);
  console.log(`  Eventos: ${total}`);
  console.log(`  Inválidos: ${invalid}`);
  console.log(`  Resoluções sem conclusão (unobserved): ${unobserved}`);
  console.log(`  Tipos:`);
  for (const [type, count] of Object.entries(byType)) {
    console.log(`    ${type}: ${count}`);
  }
}

function printIssues(summary) {
  if (summary.invalid === 0) return;
  console.log(`\n  Problemas (${summary.invalid}):`);
  for (const item of summary.issues.slice(0, MAX_ISSUES_PRINTED)) {
    // Sanitização: nunca imprime o valor do campo, apenas índice/tipo/motivo.
    console.log(`    #${item.index + 1} [${item.type || "?"}] ${item.issue}`);
  }
  if (summary.invalid > MAX_ISSUES_PRINTED) {
    console.log(`    ... e mais ${summary.invalid - MAX_ISSUES_PRINTED} problema(s)`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const checkMode = args.includes("--check") || args.includes("--strict");

  let summary;
  try {
    const { eventsPath, events } = loadEvents();
    summary = summarizeProcessEvidence(events);
    summary.eventsPath = eventsPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${message}`);
    process.exit(1);
  }

  if (jsonMode) {
    console.log(JSON.stringify({
      total: summary.total,
      invalid: summary.invalid,
      byType: summary.byType,
      unobserved: summary.unobserved,
      issues: summary.issues.slice(0, MAX_ISSUES_PRINTED),
    }));
  } else {
    printHumanSummary(summary, summary.eventsPath);
    printIssues(summary);
  }

  if (checkMode && summary.invalid > 0) process.exit(1);
}

main();
