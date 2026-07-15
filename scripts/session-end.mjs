#!/usr/bin/env node

/**
 * session-end.mjs — Finaliza sessão: add + commit + handoff + push.
 *
 * Uso:
 *   node scripts/session-end.mjs "mensagem do commit"
 *   node scripts/session-end.mjs "feat: implementa X" --dry-run  # só mostra
 *
 * ponytail: execSync em série, zero deps
 */

import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const MSG = process.argv[2] || "chore: session end";
const DRY_RUN = process.argv.includes("--dry-run");

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 15_000 }).trim();
    return out;
  } catch (e) {
    console.error(`❌ ${cmd}: ${e.stderr?.slice(0, 300) || e.message}`);
    process.exit(1);
  }
}

function dry(cmd) {
  console.log(`  🔍 ${cmd}`);
}

console.log("\n── SESSION END ──\n");

if (DRY_RUN) {
  console.log("🔍 Modo dry-run — nenhuma ação executada\n");
  dry(`git add .`);
  dry(`git commit -m "${MSG}"`);
  dry(`node scripts/handoff-snapshot.mjs --write`);
  dry(`node scripts/update-handoff.mjs --write`);
  dry(`git add docs/handoff.md`);
  dry(`git commit -m "docs: update handoff"`);
  dry(`git push origin HEAD`);
  console.log("\nPara executar: node scripts/session-end.mjs \"sua mensagem\"\n");
  process.exit(0);
}

// 1. Git status
const status = run("git status --short");
if (!status) {
  console.log("✅ Nada a commitar.");
  try {
    run("node scripts/handoff-snapshot.mjs --write");
    run("node scripts/update-handoff.mjs --write");
    run("git add docs/handoff.md");
    try {
      run('git commit -m "docs: update handoff"');
      run("git push origin HEAD");
      console.log("\n✅ HANDOFF atualizado e push feito.");
    } catch {
      console.log("  (nada a commitar no HANDOFF)");
    }
  } catch (e) {
    console.error(`❌ Erro no handoff/push: ${e.message}`);
  }
  process.exit(0);
}

// 2. Add all
console.log("📦 Stage tudo...");
run("git add .");

// 3. Commit com mensagem do usuário
console.log(`📝 Commit: "${MSG}"`);
run(`git commit -m "${MSG}"`);

// 4. Update handoff — snapshot + estado
console.log("📋 Atualizando handoff...");
run("node scripts/handoff-snapshot.mjs --write");
run("node scripts/update-handoff.mjs --write");
run("git add docs/handoff.md");
try {
  run('git commit -m "docs: update HANDOFF"');
} catch {
  // nothing to commit in handoff
}

// 5. Push
console.log("☁️  Push...");
run("git push origin HEAD");

console.log(`\n✅ Sessão finalizada: ${MSG}`);
