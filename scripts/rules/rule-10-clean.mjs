#!/usr/bin/env node

/**
 * rule-10-clean.mjs — Verifica regra #10: git status limpo.
 *
 * Uso: node scripts/rules/rule-10-clean.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, ROOT } from "../lib.mjs";

const status = git("git status --short");

// No pre-commit hook, arquivos staged são esperados (eles serão commitados).
// Filtra só os que têm mudanças NÃO staged (unstaged + untracked).
const nonStaged = status
  ? status.split("\n").filter(l => {
      const first = l.trim()[0];
      // Segunda coluna: se tem letra, é staged; primeira coluna indica unstaged/untracked
      // X?Y — X=staged, Y=unstaged. Só alerta se Y não for espaço.
      const stagedCol = l[0];
      const unstagedCol = l[1];
      return (unstagedCol && unstagedCol !== " ") || stagedCol === "?";
    })
  : [];

if (nonStaged.length > 0) {
  warn("Arquivos não commitados (unstaged/untracked):");
  nonStaged.forEach(l => console.log(`     ${l}`));
  process.exit(1);
}
ok("git status limpo (regra #10)");
