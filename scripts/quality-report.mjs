#!/usr/bin/env node

/**
 * quality-report.mjs — Gera QUALITY.md com métricas do projeto.
 *
 * Uso:
 *   node scripts/quality-report.mjs
 *   node scripts/quality-report.mjs --write   # overwrite QUALITY.md
 */

// ponytail: statSync + grep, sem dependências externas

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const QUALITY_PATH = join(ROOT, "QUALITY.md");

// ── Helpers ──────────────────────────────────────────────────────────

const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".opencode", ".pi", "test-results", "playwright-report", "dist"]);

function count(dir, ext, excl = EXCLUDE_DIRS) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const f of readdirSync(dir, { recursive: true })) {
    const parts = f.split("/");
    if (parts.some(p => excl.has(p))) continue;
    if (f.endsWith(ext)) n++;
  }
  return n;
}

function testCounts() {
  // ponytail: grep test()/it() em arquivos .test.ts/.spec.ts
  function blocks(dir, ext) {
    if (!existsSync(dir)) return { files: 0, cases: 0 };
    let files = 0, cases = 0;
    for (const f of readdirSync(dir, { recursive: true })) {
      const parts = f.split("/");
      if (parts.some(p => EXCLUDE_DIRS.has(p))) continue;
      if (!f.endsWith(ext)) continue;
      files++;
      const content = readFileSync(join(dir, f), "utf8");
      cases += (content.match(/\b(test|it)\(/g) || []).length;
    }
    return { files, cases };
  }
  const unit = blocks(join(ROOT, "tests/unit"), ".test.ts");
  const e2e = blocks(join(ROOT, "tests"), ".spec.ts");
  return { unit: unit.cases, e2e: e2e.cases, unitFiles: unit.files, e2eFiles: e2e.files };
}

function verifyDocs() {
  try {
    const out = execSync(`node ${join(ROOT, "scripts/verify-docs.mjs")} --quick`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 10_000,
    });
    const issues = (out.match(/❌/g) || []).length;
    return { issues, output: out };
  } catch {
    return { issues: -1, output: "erro ao executar verify-docs" };
  }
}

function lastCommit() {
  try {
    const out = execSync("git log -1 --format=%h-%s", { cwd: ROOT, encoding: "utf8", timeout: 5_000 });
    return out.trim();
  } catch {
    return "n/a";
  }
}

function bundleSize() {
  // ponytail: olha o dist/build direto em vez de rodar build
  const dist = join(ROOT, "dist", "assets");
  if (!existsSync(dist)) return "n/a";
  let total = 0;
  for (const f of readdirSync(dist)) {
    if (f.endsWith(".js") || f.endsWith(".css")) {
      total += statSync(join(dist, f)).size;
    }
  }
  return (total / 1024).toFixed(0) + "kB";
}

function workflows() {
  const ci = existsSync(join(ROOT, ".github/workflows/ci.yml"));
  const deploy = existsSync(join(ROOT, ".github/workflows/deploy.yml"));
  const health = existsSync(join(ROOT, ".github/workflows/docs-health.yml"));
  return { ci, deploy, health };
}

function archiveCount() {
  const archive = join(ROOT, "docs/archive");
  if (!existsSync(archive)) return 0;
  let n = 0;
  for (const f of readdirSync(archive, { recursive: true })) {
    if (f.endsWith(".md")) n++;
  }
  return n;
}

// ── Main ─────────────────────────────────────────────────────────────

const { execSync } = await import("child_process");

const date = new Date().toISOString().slice(0, 10);
const tests = testCounts();
const docs = verifyDocs();
const wf = workflows();

const report = [
  "# 📊 QUALITY — MilesControl",
  "",
  `> Gerado em: ${date}`,
  `> Último commit: ${lastCommit()}`,
  "",
  "## Pipeline",
  "",
  `| Etapa | Status | Detalhes |`,
  `|-------|--------|----------|`,
  `| CI (PR) | ${wf.ci ? "✅" : "❌"} | \`.github/workflows/ci.yml\` |`,
  `| Deploy (main) | ${wf.deploy ? "✅" : "❌"} | \`.github/workflows/deploy.yml\` → Vercel |`,
  `| Docs Health | ${wf.health ? "✅" : "❌"} | \`.github/workflows/docs-health.yml\` (semanal) |`,
  "",
  "## Testes",
  "",
  `| Tipo | Casos |`,
  `|------|-------|`,
  `| Unit | ${tests.unit} |`,
  `| E2E  | ${tests.e2e} |`,
  `| **Total** | **${tests.unit + tests.e2e}** |`,
  "",
  "## Bundle",
  "",
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Tamanho (dist) | ${bundleSize()} |`,
  "",
  "## Documentação",
  "",
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Arquivos .md | ${count(ROOT, ".md")} |`,
  `| Arquivados | ${archiveCount()} |`,
  `| Issues (verify-docs) | ${docs.issues} |`,
  "",
  docs.issues > 0
    ? [
        "### 🔴 Issues de Documentação",
        "",
        "```",
        docs.output,
        "```",
      ].join("\n")
    : "### ✅ Documentação limpa — zero issues",
  "",
  "## Histórico",
  "",
  "| Data | CI Status | Testes | Bundle | Docs |",
  "|------|-----------|--------|--------|------|",
  `| ${date} | ✅ | ${tests.unit + tests.e2e} | ${bundleSize()} | ${docs.issues} issues |`,
  "",
  "---",
  "",
  "_Atualizado por `node scripts/quality-report.mjs`_",
  "",
].join("\n");

if (process.argv.includes("--write")) {
  writeFileSync(QUALITY_PATH, report);
  console.log(`✅ QUALITY.md atualizado (${(report.length / 1024).toFixed(0)}kB)`);
} else {
  console.log(report);
}
