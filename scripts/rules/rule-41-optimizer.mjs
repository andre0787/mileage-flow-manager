#!/usr/bin/env node

/**
 * rule-41-optimizer.mjs — Regra #41 (Optimizer): hard limit de 150 linhas.
 *
 * Validações (diff-scoped vs baseline legado):
 * - Arquivos NOVOS (criados na branch) em src/ com > 150 linhas → fail.
 * - Arquivos MODIFICADOS na branch: se passarem de 150 linhas E a versão em main
 *   tinha <= 150 → fail.
 * - Arquivos legados que JÁ excediam 150 em main (ex: Dashboard.tsx 1126,
 *   EntryForm.tsx 933) → warning (grandfathered) — não bloqueia.
 * - Base do diff: git merge-base main HEAD → git diff --name-only <base> HEAD
 *   filtrando src/*.{ts,tsx} (glob).
 *
 * Regra #41: "Hard limit de 150 linhas; extração de lógica para custom hooks
 * antes de fragmentar UI"
 *
 * ponytail: fs + child_process nativos, zero deps.
 * Modo fixture: MOCK_ROOT (padrão das rules do repo).
 */

import { readFileSync, existsSync, statSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const HARD_LIMIT = 150;
const SRC_RE = /^src\/.*\.(ts|tsx)$/;

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 15000 }).trim();
  } catch {
    return "";
  }
}

function countLines(filePath) {
  const content = readFileSync(filePath, "utf8");
  return content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
}

function countLinesFromText(text) {
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function main() {
  const branch = git("git rev-parse --abbrev-ref HEAD") || "?";
  const mergeBase = git("git merge-base main HEAD");
  if (!mergeBase) {
    console.log("  ⏭️  rule-41: sem merge-base com main — regra não se aplica");
    return;
  }

  const changed = git(`git diff --name-only ${mergeBase} HEAD`)
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => SRC_RE.test(f));

  if (changed.length === 0) {
    console.log("  ✅ rule-41: nenhum arquivo src/ alterado na branch (diff-scoped)");
    return;
  }

  let hasError = false;
  for (const file of changed.sort()) {
    const abs = join(ROOT, file);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue; // deletado

    const currentLines = countLines(abs);
    // Versão do arquivo em main (no merge-base). 2>/dev/null: arquivos novos
    // não existem no merge-base e o git show imprime fatal no stderr — ruído.
    const mainContent = git(`git show ${mergeBase}:${file} 2>/dev/null`);
    const mainLines = mainContent ? countLinesFromText(mainContent) : 0;
    // Arquivo é NOVO se o blob não existe no merge-base (git cat-file -e exit != 0).
    // Evita confundir arquivo vazio pré-existente em main com arquivo novo.
    const isNew =
      git(`git cat-file -e ${mergeBase}:${file} && echo exists`) === "exists" ? false : true;

    if (isNew && currentLines > HARD_LIMIT) {
      console.error(
        `❌ rule-41: arquivo NOVO ${file} tem ${currentLines} linhas (> ${HARD_LIMIT}) — extraia hooks`,
      );
      hasError = true;
    } else if (!isNew && mainLines <= HARD_LIMIT && currentLines > HARD_LIMIT) {
      console.error(
        `❌ rule-41: ${file} passou de ${mainLines} → ${currentLines} linhas (> ${HARD_LIMIT}) — extraia hooks`,
      );
      hasError = true;
    } else if (mainLines > HARD_LIMIT) {
      console.log(
        `  ⚠️  rule-41: ${file} legado com ${currentLines} linhas (grandfathered — não bloqueia; considere extrair hooks)`,
      );
    } else {
      console.log(`  ✅ rule-41: ${file} com ${currentLines} linhas (≤ ${HARD_LIMIT})`);
    }
  }

  if (hasError) process.exit(1);
  console.log("  ✅ rule-41: optimizer ok");
}

main();
