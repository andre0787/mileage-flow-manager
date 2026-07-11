#!/usr/bin/env node

/**
 * pre-pr-check.mjs — Valida tudo antes do PR.
 *
 * Uso:
 *   node scripts/pre-pr-check.mjs          # roda todas as verificações
 *   node scripts/pre-pr-check.mjs --strict # exit code 1 se falhar
 *
 * Verifica:
 *   Regra #2  — grid-cols max 2 (grep no diff)
 *   Regra #4  — branch não é main (proteção extra)
 *   Regra #7  — strings em pt-BR (grep no diff)
 *   Regra #8  — relatório HTML existe
 *   Regra #10 — git status limpo
 *   Regra #13 — scripts de validação existem para regras documentadas
 *   + console.log esquecido, build, testes, verify-docs
 *
 * ponytail: execSync + grep, zero deps
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const STRICT = process.argv.includes("--strict");

let errors = [];
let warnings = [];
let passed = 0;

function ok(msg) {
  console.log(`  ✅ ${msg}`);
  passed++;
}
function err(msg) {
  console.log(`  ❌ ${msg}`);
  errors.push(msg);
}
function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
  warnings.push(msg);
}

function run(cmd, label) {
  try {
    execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
    ok(label);
  } catch (e) {
    err(`${label}: ${e.stderr?.slice(0, 200) || e.message}`);
  }
}

function git(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 5000 }).trim(); }
  catch { return ""; }
}

console.log("\n🔍 PRE-PR CHECK\n");

// ── Regra #4 — Branch proibida ───────────────────────────────────────
console.log("── Regra #4: branch ──");
const branch = git("git rev-parse --abbrev-ref HEAD");
if (branch === "main" || branch === "master") {
  err(`Branch "${branch}" não permitida (regra #4). Crie uma branch.`);
} else {
  ok(`branch "${branch}" (regra #4)`);
}
if (branch === "HEAD") warn("HEAD detached — opere em uma branch nomeada");

// ── Regra #10 — Git status ──────────────────────────────────────────
console.log("\n── Regra #10: git status ──");
const status = git("git status --short");
if (status) {
  warn("Arquivos não commitados:");
  const lines = status.split("\n");
  lines.forEach(l => console.log(`     ${l}`));
} else {
  ok("git status limpo (regra #10)");
}

// ── Regra #2 — Grid max 2 colunas ───────────────────────────────────
console.log("\n── Regra #2: grid ──");
try {
  const diff = git(`git diff HEAD -- '*.tsx'`);
  const gridBad = diff.match(/\bgrid-cols-[3-9]\b|\bsm:grid-cols-[3-9]\b/g);
  if (gridBad && gridBad.length > 0) {
    warn(`grid-cols-[3-9] (regra #2): ${gridBad.slice(0, 5).join(", ")}`);
  } else {
    ok("grid respeita max 2 colunas (regra #2)");
  }
} catch { warn("verificação de grid falhou"); }

// ── Regra #7 — pt-BR ────────────────────────────────────────────────
console.log("\n── Regra #7: pt-BR ──");
try {
  const diff = git(`git diff HEAD -- '*.tsx'`);
  // Procura strings JSX em inglês comum (só adicionadas, não removidas)
  const enLines = diff.split("\n").filter(l => l.startsWith("+") && !l.startsWith("+++"));
  const enMatch = enLines.join("\n").match(/"(Save|Cancel|Delete|Edit|Add|Remove|Loading|Error|Success|Search|Filter|Submit|Close|Back|Next|Done)"/g);
  if (enMatch && enMatch.length > 0) {
    warn(`Strings em inglês (regra #7): ${enMatch.slice(0, 5).join(", ")}`);
  } else {
    ok("strings em português (regra #7)");
  }
} catch { warn("verificação de pt-BR falhou"); }

// ── Regra #8 — Relatório HTML ───────────────────────────────────────
console.log("\n── Regra #8: relatório ──");
try {
  const prOut = git(`gh pr list --head "${branch}" --json number 2>/dev/null`);
  const prList = JSON.parse(prOut || "[]");
  if (prList.length > 0) {
    const prNum = prList[0].number;
    const today = new Date().toISOString().slice(0, 10);
    const report = git(`ls docs/reports/${today}/PR${prNum}-*.html 2>/dev/null`);
    if (report) {
      ok(`relatório HTML em docs/reports/${today}/ (regra #8)`);
    } else {
      err(`relatório HTML docs/reports/${today}/PR${prNum}-*.html não encontrado (regra #8)`);
    }
  } else {
    warn("branch sem PR — não é possível verificar relatório (regra #8)");
  }
} catch { warn("verificação de relatório falhou"); }

// ── console.log esquecido ───────────────────────────────────────────
console.log("\n── Sanity ──");
try {
  const logCheck = git(`git diff HEAD -- ":(exclude)src/lib/logger.ts" | grep "console\\." || true`);
  if (logCheck) {
    warn("console.log encontrado no diff (exceto logger.ts)");
  } else {
    ok("sem console.log no diff");
  }
} catch { warn("verificação de console.log falhou"); }

// ── Build ────────────────────────────────────────────────────────────
console.log("\n── Build ──");
run("npm run build 2>&1", "build");

// ── Testes ───────────────────────────────────────────────────────────
console.log("\n── Testes ──");
run("npm test 2>&1", "test (unit)");

// ── Docs ─────────────────────────────────────────────────────────────
console.log("\n── Docs ──");
if (existsSync(resolve(ROOT, "scripts/verify-docs.mjs"))) {
  run("node scripts/verify-docs.mjs", "verify-docs");
} else {
  warn("verify-docs.mjs não encontrado, pulando");
}

// ── Regra #13 — Scripts de validação existem ────────────────────────
console.log("\n── Regra #13: validações ──");
const hasHook = existsSync(resolve(ROOT, ".githooks/pre-commit"));
const hasPrePR = existsSync(resolve(ROOT, "scripts/pre-pr-check.mjs"));
const hasVerify = existsSync(resolve(ROOT, "scripts/verify-docs.mjs"));
if (hasHook && hasPrePR && hasVerify) {
  ok("scripts de validação presentes (regra #13)");
} else {
  err(`Faltam scripts: ${!hasHook ? ".githooks/pre-commit " : ""}${!hasPrePR ? "pre-pr-check.mjs " : ""}${!hasVerify ? "verify-docs.mjs " : ""}`);
}

// ── Resumo ───────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════");
console.log(`  ✅ ${passed} passed`);
if (warnings.length) console.log(`  ⚠️  ${warnings.length} warnings`);
if (errors.length) console.log(`  ❌ ${errors.length} errors`);
console.log("═══════════════════════════════════\n");

if (errors.length > 0) {
  console.log("Corrija os erros antes do PR:");
  errors.forEach(e => console.log(`  - ${e}`));
  if (STRICT) process.exit(1);
} else {
  console.log("✅ Tudo ok! Pode criar o PR.");
}
