#!/usr/bin/env node

/**
 * rule-10-clean.mjs — Verifica regra #10: git status limpo.
 *
 * Uso: node scripts/rules/rule-10-clean.mjs
 * Exit: 0 = ok, 1 = violação
 *
 * Contexto de fricção (2026-08-12): o pre-pr roda na fase de DESENVOLVIMENTO,
 * antes do commit — arquivos não commitados são o estado natural dessa fase.
 * Por isso o pre-pr-check roda esta regra com PRE_PR_CONTEXT=1 (aviso
 * não-bloqueante, exit 0). A garantia dura da regra #3 (git status ZERO antes
 * de push/PR) vive no .githooks/pre-push, que roda esta regra no modo padrão
 * (bloqueante, exit 1).
 */

import { execSync } from "child_process";
import { ok, warn, ROOT } from "../lib.mjs";

const PRE_PR_CONTEXT = process.env.PRE_PR_CONTEXT === "1";

// Garante que hooks (GIT_INDEX_FILE etc.) não afetem a inspeção do repo real.
function gitStatus() {
  const env = { ...process.env };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_COMMON_DIR",
    "GIT_PREFIX",
  ]) {
    delete env[key];
  }
  try {
    return execSync("git status --short", {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
      env,
    }).trim();
  } catch {
    return "";
  }
}

const status = gitStatus();

// No pre-commit hook, arquivos staged são esperados (eles serão commitados).
// Filtra só os que têm mudanças NÃO staged (unstaged + untracked).
const nonStaged = status
  ? status.split("\n").filter((l) => {
      // X?Y — X=staged, Y=unstaged. Só alerta se Y não for espaço ou X for '?'.
      const stagedCol = l[0];
      const unstagedCol = l[1];
      return (unstagedCol && unstagedCol !== " ") || stagedCol === "?";
    })
  : [];

if (nonStaged.length > 0) {
  if (PRE_PR_CONTEXT) {
    warn("Regra #10: git status com arquivos não commitados (aviso em fase de desenvolvimento):");
    nonStaged.forEach((l) => console.log(`     ${l}`));
    console.log(
      "     💡 Commite antes do push — o pre-push hook bloqueia push com arquivos soltos.",
    );
    console.log('        git add <arquivos> && git commit -m "mensagem"');
    process.exit(0);
  }
  warn("Arquivos não commitados (unstaged/untracked) — regra #10:");
  nonStaged.forEach((l) => console.log(`     ${l}`));
  process.exit(1);
}
ok("git status limpo (regra #10)");
