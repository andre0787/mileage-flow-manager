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
import { existsSync, readdirSync, renameSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getDiffFiles } from "./lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RULES_DIR = resolve(ROOT, "scripts/rules");

let errors = 0;
const logger = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

function ok(label) { logger.log(`  ✅ ${label}`); }
function fail(label) { logger.log(`  ❌ ${label}`); errors++; }

logger.log("\n🔍 PRE-PR CHECK\n");

// ── Lista ────────────────────────────────────────────────────────────
if (process.argv.includes("--list")) {
  const files = readdirSync(RULES_DIR).filter(f => f.endsWith(".mjs")).sort();
  logger.log("Regras disponíveis:");
  files.forEach(f => logger.log(`  scripts/rules/${f}`));
  process.exit(0);
}

// ── Check de Diff Vazio ──────────────────────────────────────────────
const changedFiles = getDiffFiles();
if (changedFiles.length === 0) {
  logger.log("  ❌ Nenhuma alteração detectada em relação à base ou na working tree.");
  logger.log("  O pre-pr check exige um diff não vazio para ser executado.");
  process.exit(1);
}

// ── Relatório Automático ────────────────────────────────────────────
if (!process.argv.includes("--no-report")) {
  logger.log("── Relatório ──");
  try {
    const today = new Date().toISOString().slice(0, 10);
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();

    // Se apenas docs/reports/ foi alterado, pula relatório (ex: rename de relatórios)
    // MAS se houver PR aberto, renomeia os reports com prefixo correto
    const diffOnlyReports = changedFiles.every(f => f.startsWith("docs/reports/"));

    if (diffOnlyReports) {
      // Tenta detectar PR e renomear relatórios se necessário
      let prNum = null;
      try {
        const prJson = execSync(
          `gh pr list --head "${branch}" --json number 2>/dev/null || true`,
          { cwd: ROOT, encoding: "utf8", timeout: 5000 }
        ).trim();
        const prs = JSON.parse(prJson || '[]');
        if (prs.length > 0) prNum = prs[0].number;
      } catch {}

      if (prNum) {
        const prefix = `PR${prNum}`;
        const reportsDir = resolve(ROOT, `docs/reports/${today}`);
        if (existsSync(reportsDir)) {
          const reportFiles = readdirSync(reportsDir).filter(f => f.endsWith(".html") && !/^PR\d+-/.test(f));
          for (const file of reportFiles) {
            // Substitui o prefixo original (até a data YYYY-MM-DD) pelo prefixo PR<num>
            const newName = file.replace(/^(.+?)-(\d{4}-\d{2}-\d{2})/, `${prefix}-$2`);
            if (newName === file) continue;
            renameSync(resolve(reportsDir, file), resolve(reportsDir, newName));
            logger.log(`  🔄 ${file} → ${newName}`);
          }
          if (reportFiles.length > 0) {
            logger.log(`  ✅ ${reportFiles.length} relatório(s) renomeado(s) para ${prefix}`);
            execSync(`git add docs/reports/${today}/ 2>/dev/null || true`, { cwd: ROOT, timeout: 3000 });
          }
        }
        logger.log("  ⏭️  apenas docs/reports/ alterados");
      } else {
        logger.log("  ⏭️  apenas docs/reports/ alterados, pulando geração (evita ciclo de rename)");
      }
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
    if (out) logger.log(`  ${out}`);

    // Staging o relatório gerado para não quebrar a regra #10
    execSync(`git add docs/reports/${today}/ 2>/dev/null || true`, { cwd: ROOT, timeout: 3000 });
    }
  } catch (e) {
    logger.log(`  ❌ relatório automático FALHOU: ${e.message.slice(0, 100)}`);
    logger.log("     Dica: gere manualmente com: npm run report \"descrição\" --benefits \"...\" --impact \"...\" --write");
    process.exit(1);
  }
}

// ── Regras ───────────────────────────────────────────────────────────
logger.log("── Regras ──");
let ruleFiles = readdirSync(RULES_DIR).filter(f => f.endsWith(".mjs")).sort();

if (process.env.PRE_PR_ONLY_RULE) {
  const allowedRules = process.env.PRE_PR_ONLY_RULE.split(",").map(r => r.trim());
  ruleFiles = ruleFiles.filter(f => allowedRules.some(allowed => f.includes(allowed)));
}

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

// ── logger.log esquecido ───────────────────────────────────────────

// ── Build ────────────────────────────────────────────────────────────
if (!process.env.PRE_PR_ONLY_RULES) {
  logger.log("\n── Build ──");
  try {
    execSync("npm run build 2>&1", { cwd: ROOT, encoding: "utf8", timeout: 60000 });
    ok("build");
  } catch (e) { fail(`build: ${e.stderr?.slice(0, 200) || e.message}`); }
}

// ── Testes ───────────────────────────────────────────────────────────
if (!process.env.PRE_PR_ONLY_RULES) {
  logger.log("\n── Testes ──");
  try {
    execSync("npm test 2>&1", { cwd: ROOT, encoding: "utf8", timeout: 60000 });
    ok("test (unit)");
  } catch (e) { fail(`test: ${e.stderr?.slice(0, 200) || e.message}`); }
}

// ── Docs ─────────────────────────────────────────────────────────────
if (!process.env.PRE_PR_ONLY_RULES) {
  logger.log("\n── Docs ──");
  const verifyScript = resolve(ROOT, "scripts/verify-docs.mjs");
  if (existsSync(verifyScript)) {
    try {
      execSync(`node "${verifyScript}" --strict`, { cwd: ROOT, encoding: "utf8", timeout: 30000 });
      ok("verify-docs:strict");
    } catch (e) { fail(`verify-docs: ${e.stderr?.slice(0, 200) || e.message}`); }
  } else {
    logger.log("  ⚠️  verify-docs.mjs não encontrado, pulando");
  }
}

// ── Resumo ───────────────────────────────────────────────────────────
logger.log("\n═══════════════════════════════════");
logger.log(`  ${errors > 0 ? `❌ ${errors} errors` : "✅ 0 errors"}`);
logger.log("═══════════════════════════════════\n");

if (errors > 0 && process.argv.includes("--strict")) process.exit(1);
