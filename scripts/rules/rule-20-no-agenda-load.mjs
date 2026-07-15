#!/usr/bin/env node

/**
 * rule-20-no-agenda-load.mjs — Valida que AGENDA.md NÃO é carregado em sessões normais.
 *
 * Regra #20: "AGENDA.md arquivado — não deve ser lido em sessões normais"
 *
 * Verifica:
 * 1. session-start.mjs não referencia docs/AGENDA.md
 * 2. update-handoff.mjs não referencia docs/AGENDA.md
 *
 * ponytail: grep em texto, zero deps
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");

const FILES_TO_CHECK = [
  "scripts/session-start.mjs",
  "scripts/update-handoff.mjs",
];

function main() {
  let violations = 0;

  for (const file of FILES_TO_CHECK) {
    const path = resolve(ROOT, file);
    try {
      const content = readFileSync(path, "utf8");
      if (content.includes("AGENDA.md") || content.includes("AGENDA-2026")) {
        console.error(`❌ rule-20: ${file} referencia AGENDA.md — remova a referência`);
        violations++;
      }
    } catch {
      console.log(`  ⏭️  rule-20: ${file} não encontrado, pulando`);
    }
  }

  if (violations > 0) process.exit(1);
  console.log(`  ✅ rule-20: nenhum script referencia AGENDA.md`);
}

main();
