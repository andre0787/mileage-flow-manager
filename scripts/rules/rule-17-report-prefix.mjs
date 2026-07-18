#!/usr/bin/env node

/**
 * rule-17-report-prefix.mjs — Verifica se relatórios usam prefixo PR<num> quando há PR aberto.
 *
 * Regra #8: "A nomenclatura DEVE conter o número do PR: PR<num>-YYYY-MM-DD-<nome>.html"
 *
 * Se há PR aberto para a branch atual e existem relatórios de hoje sem prefixo PR<num>,
 * falha e sugere rodar: npm run post-pr
 *
 * ponytail: execSync, stdlib, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getDiffFiles } from "../lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

const errors = [];

// ── Detecta se há PR aberto para a branch ───────────────────────────
let prNum = null;
try {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  const out = execSync(`gh pr list --head "${branch}" --json number 2>/dev/null || true`, { cwd: ROOT, encoding: "utf8", timeout: 5000 }).trim();
  const prs = JSON.parse(out || "[]");
  if (prs.length > 0) prNum = prs[0].number;
} catch {}

if (!prNum) {
  console.log("  ✅ sem PR aberto para esta branch — prefixo livre");
  process.exit(0);
}

const prefix = `PR${prNum}`;
const changedFiles = getDiffFiles();
const reportFiles = changedFiles.filter(f => /^docs\/reports\/.*\.html$/.test(f));

if (reportFiles.length === 0) {
  console.log(`  ✅ nenhum arquivo de relatório no diff da branch`);
  process.exit(0);
}

// Só considera errado se o prefixo atual NÃO é PR<num> (ex: fix-, feat-, docs-, chore-, auto-)
const wrong = reportFiles.filter(f => {
  const filename = f.split("/").pop() || "";
  return !/^PR\d+-/.test(filename);
});

if (wrong.length > 0) {
  for (const f of wrong) {
    const filename = f.split("/").pop() || "";
    errors.push(`    ❌ ${filename} — deveria ser ${filename.replace(/^(.+?)-(\d{4}-\d{2}-\d{2})/, `${prefix}-$2`)}`);
  }
}

if (errors.length > 0) {
  console.log(`  ❌ rule-17: ${errors.length} relatório(s) com prefixo errado (PR #${prNum} aberto):`);
  for (const e of errors) console.log(e);
  console.log(`  → Rode: npm run post-pr`);
  process.exit(1);
} else {
  console.log(`  ✅ todos os relatórios com prefixo ${prefix}`);
}
