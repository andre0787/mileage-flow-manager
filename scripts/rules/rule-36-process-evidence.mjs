#!/usr/bin/env node

/**
 * rule-36-process-evidence.mjs — Verifica regra #36: evidência de processo válida.
 *
 * Reutiliza o MESMO validador do CLI process:audit (scripts/lib/process-events.mjs);
 * não há parsing JSONL independente aqui. Falha quando existem eventos inválidos.
 *
 * Uso: node scripts/rules/rule-36-process-evidence.mjs
 * Exit: 0 = evidência válida, 1 = violação
 *
 * ponytail: import do validador compartilhado, zero deps.
 */

import { ok, err, ROOT } from "../lib.mjs";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  parseProcessEvents,
  validateProcessEvents,
  summarizeProcessEvidence,
} from "../lib/process-events.mjs";

const DEFAULT_PATH = resolve(ROOT, "docs/tracking/events.jsonl");
const MAX_ISSUES_PRINTED = 5;

function main() {
  const eventsPath = process.env.PROCESS_EVENTS_PATH || DEFAULT_PATH;

  if (!existsSync(eventsPath)) {
    err(`rule-36: events.jsonl não encontrado em ${eventsPath}`);
    process.exit(1);
  }

  let events;
  try {
    events = parseProcessEvents(readFileSync(eventsPath, "utf8"));
  } catch (error) {
    err(`rule-36: JSONL inválido — ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const issues = validateProcessEvents(events);
  const summary = summarizeProcessEvidence(events);

  if (issues.length > 0) {
    for (const item of issues.slice(0, MAX_ISSUES_PRINTED)) {
      console.log(`      ⚠️  #${item.index + 1} [${item.type || "?"}] ${item.issue}`);
    }
    if (issues.length > MAX_ISSUES_PRINTED) {
      console.log(`      ⚠️  ... e mais ${issues.length - MAX_ISSUES_PRINTED} evento(s) inválido(s)`);
    }
    err(`rule-36: ${issues.length} evento(s) inválido(s) no log de processo`);
    process.exit(1);
  }

  if (summary.unobserved > 0) {
    console.log(
      `      ℹ️  ${summary.unobserved} resolução(ões) do router sem conclusão (unobserved, não falha)`,
    );
  }
  ok(`rule-36: evidência de processo válida (${summary.total} eventos, ${summary.unobserved} unobserved)`);
}

main();
