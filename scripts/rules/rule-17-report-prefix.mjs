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
const today = new Date().toISOString().slice(0, 10);
const dir = resolve(ROOT, `docs/reports/${today}`);

if (!existsSync(dir)) {
  console.log(`  ✅ nenhum relatório em docs/reports/${today}/`);
  process.exit(0);
}

const files = readdirSync(dir).filter(f => f.endsWith(".html"));
const wrong = files.filter(f => !f.startsWith(prefix));

if (wrong.length > 0) {
  for (const f of wrong) {
    errors.push(`    ❌ ${f} — deveria ser ${f.replace(/^[^-]+/, prefix)}`);
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
