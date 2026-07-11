#!/usr/bin/env node

/**
 * rule-07-ptbr.mjs — Verifica regra #7: interface em pt-BR.
 *
 * Uso: node scripts/rules/rule-07-ptbr.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, ROOT } from "../lib.mjs";

const diff = git(`git diff HEAD -- '*.tsx'`);
// Só linhas adicionadas (não removidas)
const enLines = diff.split("\n").filter(l => l.startsWith("+") && !l.startsWith("+++"));
const enMatch = enLines.join("\n")
  .match(/"(Save|Cancel|Delete|Edit|Add|Remove|Loading|Error|Success|Search|Filter|Submit|Close|Back|Next|Done)"/g);

if (enMatch && enMatch.length > 0) {
  warn(`Strings em inglês (regra #7): ${enMatch.slice(0, 5).join(", ")}`);
  process.exit(1);
}
ok("strings em português (regra #7)");
