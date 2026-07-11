#!/usr/bin/env node

/**
 * rule-10-clean.mjs — Verifica regra #10: git status limpo.
 *
 * Uso: node scripts/rules/rule-10-clean.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, ROOT } from "../lib.mjs";

const status = git("git status --short");
if (status) {
  warn("Arquivos não commitados:");
  status.split("\n").forEach(l => console.log(`     ${l}`));
  process.exit(1);
}
ok("git status limpo (regra #10)");
