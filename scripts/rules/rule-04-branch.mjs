#!/usr/bin/env node

/**
 * rule-04-branch.mjs — Verifica regra #4: branch não é main.
 *
 * Uso: node scripts/rules/rule-04-branch.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, ROOT } from "../lib.mjs";

const branch = git("git rev-parse --abbrev-ref HEAD");
if (!branch || branch === "main" || branch === "master") {
  err(`Branch "${branch}" não permitida (regra #4). Crie uma branch.`);
  process.exit(1);
}
ok(`branch "${branch}" (regra #4)`);
