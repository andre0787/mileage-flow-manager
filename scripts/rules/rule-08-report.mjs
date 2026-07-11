#!/usr/bin/env node

/**
 * rule-08-report.mjs — Verifica regra #8: relatório HTML existe antes do PR.
 *
 * Uso: node scripts/rules/rule-08-report.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, repoInfo, ROOT } from "../lib.mjs";

const { branch, prNum, today } = repoInfo();

if (!prNum) {
  warn("branch sem PR — não é possível verificar relatório (regra #8)");
  process.exit(0);
}

const report = git(`ls docs/reports/${today}/PR${prNum}-*.html 2>/dev/null`);
if (report) {
  ok(`relatório HTML em docs/reports/${today}/ (regra #8)`);
} else {
  err(`relatório docs/reports/${today}/PR${prNum}-*.html não encontrado (regra #8)`);
  process.exit(1);
}
