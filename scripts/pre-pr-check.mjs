#!/usr/bin/env node

/**
 * pre-pr-check.mjs — Orquestrador de validação pré-PR.
 *
 * Chama cada rule-*.mjs em scripts/rules/ + build + testes + docs.
 *
 * Uso:
 *   node scripts/pre-pr-check.mjs          # roda tudo
 *   node scripts/pre-pr-check.mjs --strict # exit 1 se falhar
 *   node scripts/pre-pr-check.mjs --list   # lista regras
 *
 * ponytail: execSync em loop, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RULES_DIR = resolve(ROOT, "scripts/rules");

let errors = 0;

function ok(label) { console.log(`  ✅ ${label}`); }
function fail(label) { console.log(`  ❌ ${label}`); errors++; }

console.log("\n🔍 PRE-PR CHECK\n");

// ── Relatório Automático ────────────────────────────────────────────
if (!process.argv.includes("--no-report")) {
  console.log("── Relatório ──");
  try {
    const today = new Date().toISOString().slice(0, 10);
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();

    // Se apenas docs/reports/ foi alterado, pula relatório (ex: rename de relatórios)
    const diffOnlyReports = execSync(
      `git diff --name-only HEAD 2>/dev/null || true`,
      { cwd: ROOT, encoding: "utf8", timeout: 3000 }
    ).trim().split("\n").filter(Boolean).every(f => f.startsWith("docs/reports/"));
    if (diffOnlyReports) {
      console.log("  ⏭️  apenas docs/reports/ alterados, pulando geração (evita ciclo de rename)");
    } else {

    // Verifica PR aberto pra branch (para nomear relatório corretamente)
    let prNum = null;
    try {
      const prJson = execSync(
        `gh pr list --head "${branch}" --json number 2>/dev/null || true`,
        { cwd: ROOT, encoding: "utf8", timeout: 5000 }
      ).trim();
      const prs = JSON.parse(prJson || '[]');
      if (prs.length > 0) prNum = prs[0].number;
    } catch {}

    const prefix = prNum ? `PR${prNum}` : branch.replace(/^[a-z]+\//, "");
    const taskName = branch.replace(/^(feat\/|fix\/|chore\/|docs\/)/, "").replace(/[-_/]/g, " ");
    const cmd = `node scripts/generate-report.mjs "${taskName}"`
      + ` --prefix "${prefix}"`
      + ` --benefits "Auto-gerado pelo pre-pr-check"`
      + ` --impact "Relatório gerado automaticamente como parte do workflow de validação pré-PR"`
      + ` --write 2>&1`;

    const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 15000 }).trim();
    if (out) console.log(`  ${out}`);

    // Staging o relatório gerado para não quebrar a regra #10
    execSync(`git add docs/reports/${today}/ 2>/dev/null || true`, { cwd: ROOT, timeout: 3000 });
    }
  } catch (e) {
    console.log(`  ❌ relatório automático FALHOU: ${e.message.slice(0, 100)}`);
    console.log("     Dica: gere manualmente com: npm run report \"descrição\" --benefits \"...\" --impact \"...\" --write");
    process.exit(1);
  }
}

// ── Lista ────────────────────────────────────────────────────────────
if (process.argv.includes("--list")) {
  const files = readdirSync(RULES_DIR).filter(f => f.endsWith(".mjs")).sort();
  console.log("Regras disponíveis:");
  files.forEach(f => console.log(`  scripts/rules/${f}`));
  process.exit(0);
}

// ── Regras ───────────────────────────────────────────────────────────
console.log("── Regras ──");
const ruleFiles = readdirSync(RULES_DIR).filter(f => f.endsWith(".mjs")).sort();

for (const file of ruleFiles) {
  const rulePath = resolve(RULES_DIR, file);
  try {
    const out = execSync(`node "${rulePath}"`, { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    if (out) process.stdout.write(out + "\n");
  } catch (e) {
    errors++;
    if (e.stdout) process.stdout.write(e.stdout + "\n");
    if (e.stderr) process.stderr.write(e.stderr + "\n");
  }
}

// ── console.log esquecido ───────────────────────────────────────────
console.log("\n── Sanity ──");
try {
  const logCheck = execSync(
    `git diff HEAD -- ":(exclude)src/lib/logger.ts" | grep "console\\." || true`,
    { cwd: ROOT, encoding: "utf8", timeout: 5000 }
  ).trim();
  if (logCheck) {
    console.log("  ⚠️  console.log encontrado no diff (exceto logger.ts)");
  } else {
    ok("sem console.log no diff");
  }
} catch { console.log("  ⚠️  verificação de console.log falhou"); }

// ── Build ────────────────────────────────────────────────────────────
console.log("\n── Build ──");
try {
  execSync("npm run build 2>&1", { cwd: ROOT, encoding: "utf8", timeout: 60000 });
  ok("build");
} catch (e) { fail(`build: ${e.stderr?.slice(0, 200) || e.message}`); }

// ── Testes ───────────────────────────────────────────────────────────
console.log("\n── Testes ──");
try {
  execSync("npm test 2>&1", { cwd: ROOT, encoding: "utf8", timeout: 60000 });
  ok("test (unit)");
} catch (e) { fail(`test: ${e.stderr?.slice(0, 200) || e.message}`); }

// ── Docs ─────────────────────────────────────────────────────────────
console.log("\n── Docs ──");
const verifyScript = resolve(ROOT, "scripts/verify-docs.mjs");
if (existsSync(verifyScript)) {
  try {
    execSync(`node "${verifyScript}"`, { cwd: ROOT, encoding: "utf8", timeout: 30000 });
    ok("verify-docs");
  } catch (e) { fail(`verify-docs: ${e.stderr?.slice(0, 200) || e.message}`); }
} else {
  console.log("  ⚠️  verify-docs.mjs não encontrado, pulando");
}

// ── Resumo ───────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════");
console.log(`  ${errors > 0 ? `❌ ${errors} errors` : "✅ 0 errors"}`);
console.log("═══════════════════════════════════\n");

if (errors > 0 && process.argv.includes("--strict")) process.exit(1);
