#!/usr/bin/env node

/**
 * post-pr.mjs — Renomeia relatórios para prefixo PR<num> após criar PR.
 *
 * Uso:
 *   node scripts/post-pr.mjs              # auto-detecta PR da branch atual
 *   node scripts/post-pr.mjs PR<num>      # prefixo explícito
 *   node scripts/post-pr.mjs --no-push    # só renomeia, não commita/pusha
 *
 * ponytail: execSync, stdlib, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readdirSync, renameSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ARGS = process.argv.slice(2);

const shouldPush = !ARGS.includes("--no-push");

// ── Detecta PR ──────────────────────────────────────────────────────
let prNum = null;

// Tenta argumento explícito
for (const arg of ARGS) {
  const m = arg.match(/PR?(\d+)/);
  if (m) { prNum = m[1]; break; }
}

// Se não veio como argumento, detecta da branch
if (!prNum) {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
    const out = execSync(`gh pr list --head "${branch}" --json number 2>/dev/null || true`, { cwd: ROOT, encoding: "utf8", timeout: 5000 }).trim();
    const prs = JSON.parse(out || "[]");
    if (prs.length > 0) prNum = prs[0].number;
  } catch {}
}

if (!prNum) {
  console.log("❌ Nenhum PR encontrado. Passe o número: node scripts/post-pr.mjs PR<num>");
  process.exit(1);
}

const prefix = `PR${prNum}`;
const today = new Date().toISOString().slice(0, 10);
const dir = resolve(ROOT, `docs/reports/${today}`);

if (!existsSync(dir)) {
  console.log("ℹ️  Nenhum relatório encontrado em docs/reports/${today}/");
  process.exit(0);
}

// Só renomeia arquivos que NÃO têm prefixo PR<num> (ex: fix-..., feat-..., docs-..., chore-..., auto-...)
const files = readdirSync(dir).filter(f => f.endsWith(".html") && !/^PR\d+-/.test(f));
if (files.length === 0) {
  console.log(`✅ Todos os relatórios já com prefixo ${prefix}`);
  process.exit(0);
}

// ── Renomeia ────────────────────────────────────────────────────────
for (const file of files) {
  // Substitui o prefixo original (até a data YYYY-MM-DD) pelo prefixo PR<num>
  // Ex: auto-rename-report-after-pr-2026-07-13-nome.html → PR127-2026-07-13-nome.html
  const newName = file.replace(/^(.+?)-(\d{4}-\d{2}-\d{2})/, `${prefix}-$2`);
  if (newName === file) continue;
  renameSync(resolve(dir, file), resolve(dir, newName));
  console.log(`  🔄 ${file} → ${newName}`);
}

console.log(`  ✅ ${files.length} relatório(s) renomeado(s) para ${prefix}`);

// ── Commit + Push ───────────────────────────────────────────────────
if (shouldPush) {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();

  try {
    execSync(`git add docs/reports/${today}/`, { cwd: ROOT, encoding: "utf8", timeout: 3000 });
    execSync(`git commit -m "chore: normalize report prefix to ${prefix}"`, { cwd: ROOT, encoding: "utf8", timeout: 3000 });
    execSync(`git push origin "${branch}"`, { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    console.log(`  📤 Rename commit pushed to ${branch}`);
  } catch (e) {
    console.log(`  ⚠️  Erro ao commitar/pushar: ${e.message.slice(0, 100)}`);
    console.log("     Pode ser que não haja nada a commitar (relatório já staged).");
  }
} else {
  console.log("  ℹ️  Modo --no-push: renomeado localmente apenas.");
}
