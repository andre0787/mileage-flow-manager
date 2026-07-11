#!/usr/bin/env node

/**
 * pre-pr-check.mjs — Valida tudo antes do PR.
 *
 * Uso:
 *   node scripts/pre-pr-check.mjs          # roda todas as verificações
 *   node scripts/pre-pr-check.mjs --strict # exit code 1 se falhar
 *
 * Verifica:
 *   1. git status limpo
 *   2. npm run build
 *   3. npm test (unit)
 *   4. verify-docs (se existir)
 *   5. console.log esquecido
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
    const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
    ok(label);
    return out.trim();
  } catch (e) {
    err(`${label}: ${e.stderr?.slice(0, 200) || e.message}`);
    return null;
  }
}

console.log("\n🔍 PRE-PR CHECK\n");

// 1. Git status
console.log("── Git ──");
try {
  const status = execSync("git status --short", { cwd: ROOT, encoding: "utf8", timeout: 5_000 }).trim();
  if (status) {
    warn("Arquivos não commitados:");
    status.split("\n").forEach(l => console.log(`     ${l}`));
  } else {
    ok("git status limpo");
  }
} catch {
  warn("git status falhou");
}

// 2. console.log esquecido
console.log("\n── Sanity ──");
try {
  const logCheck = execSync(
    `git diff HEAD -- ":(exclude)src/lib/logger.ts" | grep "console\\." || true`,
    { cwd: ROOT, encoding: "utf8", timeout: 5_000 }
  ).trim();
  if (logCheck) {
    warn("console.log encontrado no diff (exceto logger.ts)");
  } else {
    ok("sem console.log no diff");
  }
} catch {
  warn("verificação de console.log falhou");
}

// 3. Build
console.log("\n── Build ──");
run("npm run build 2>&1", "build");

// 4. Unit tests (rápido: só roda se build passou)
console.log("\n── Testes ──");
run("npm test 2>&1", "test (unit)");

// 5. Verify docs
console.log("\n── Docs ──");
const verifyScript = resolve(ROOT, "scripts/verify-docs.mjs");
if (existsSync(verifyScript)) {
  run(`node ${verifyScript}`, "verify-docs");
} else {
  warn("verify-docs.mjs não encontrado, pulando");
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
