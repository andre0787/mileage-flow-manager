#!/usr/bin/env node

/**
 * rule-02-grid.mjs — Verifica regra #2: grid max 2 colunas.
 *
 * Uso: node scripts/rules/rule-02-grid.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, ROOT } from "../lib.mjs";
import { resolve } from "path";

const diff = git(`git diff HEAD -- '*.tsx'`);
const violations = diff.match(/\bgrid-cols-[3-9]\b|\bsm:grid-cols-[3-9]\b/g);

if (violations && violations.length > 0) {
  warn(`grid-cols-[3-9] encontrado: ${violations.slice(0, 5).join(", ")}`);
  process.exit(1);
}
ok("grid max 2 colunas (regra #2)");
