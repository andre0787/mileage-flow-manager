#!/usr/bin/env node

/**
 * generate-report.mjs — Gera relatório HTML automático a partir do diff.
 *
 * Uso:
 *   node scripts/generate-report.mjs                          # preview no console
 *   node scripts/generate-report.mjs "Nome"                   # gera HTML
 *   node scripts/generate-report.mjs "Nome" --write           # salva em docs/reports/<data>/
 *   node scripts/generate-report.mjs "Nome" --prefix PR99     # prefixo custom
 *   node scripts/generate-report.mjs "Nome" --benefits "linha1
linha2"  # beneficios
 *   node scripts/generate-report.mjs "Nome" --prefix PR95 --benefits "Menos alertas
UX mais limpo" --write
 *
 * ponytail: template string + execSync, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const TASK = process.argv[2] || "auto";
const PREFIX = (() => {
  const idx = process.argv.indexOf("--prefix");
  return idx !== -1 ? process.argv[idx + 1] || "auto" : "auto";
})();
const SHOULD_WRITE = process.argv.includes("--write");
const BENEFITS = (() => {
  const idx = process.argv.indexOf("--benefits");
  if (idx === -1) return "";
  // Pega args ate o proximo --flag
  const parts = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) break;
    parts.push(process.argv[i]);
  }
  return parts.join("\n");
})();

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 10_000 }).trim();
  } catch {
    return "n/a";
  }
}

// ── Obtém diff ───────────────────────────────────────────────────────

function getDiff() {
  const mergeBase = git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const diff = git(`git diff ${mergeBase}..HEAD`);
  return diff !== "n/a" ? diff : git("git diff HEAD~1..HEAD");
}

function getChangedFiles() {
  const mergeBase = git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const out = git(`git diff ${mergeBase}..HEAD --name-status`);
  if (out === "n/a") return git("git diff HEAD~1..HEAD --name-status");
  return out;
}

function getBranch() {
  return git("git rev-parse --abbrev-ref HEAD");
}

function getCommit() {
  return git("git log -1 --format='%h — %s'");
}

function getPR() {
  const branch = getBranch();
  try {
    const out = execSync(`gh pr list --head "${branch}" --json number,title 2>/dev/null`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5_000,
    });
    const list = JSON.parse(out);
    if (list.length > 0) return { number: list[0].number, title: list[0].title };
  } catch {}
  return null;
}

// ── Estima tokens ────────────────────────────────────────────────────

function estimateTokens(diff) {
  const lines = diff.split("\n").length;
  const additions = (diff.match(/^\+/gm) || []).length;
  const deletions = (diff.match(/^-/gm) || []).length;
  // ~0.75 token por linha (média empírica)
  const tokens = Math.round(lines * 0.75);
  return { lines, additions, deletions, tokens };
}

// ── Gera HTML ─────────────────────────────────────────────────────────

function generateHTML(task, diff, changedFiles, branch, commit, pr, metrics, benefits) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const safeName = task.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const prefix = pr ? `PR${pr.number}` : PREFIX;
  const filename = `${prefix}-${date}-${safeName}.html`;

  const filesTable = changedFiles
    .split("\n")
    .filter(l => l.trim())
    .slice(0, 30) // max 30 files to keep it compact
    .map(l => {
      const [status, ...pathParts] = l.trim().split(/\s+/);
      const path = pathParts.join(" ");
      return `<tr><td>${status}</td><td>${path}</td></tr>`;
    })
    .join("\n");

  const prHtml = pr
    ? `<span class="badge pr">PR #${pr.number}</span>`
    : `<span class="badge auto">auto</span>`;

  return [
    `<!DOCTYPE html>`,
    `<html lang="pt-BR"><head>`,
    `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<title>${prefix} — ${task}</title>`,
    `<style>`,
    `body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;background:#fafafa;color:#1a1a1a}`,
    `h1{font-size:1.3rem;border-bottom:2px solid #ddd;padding-bottom:.5rem}`,
    `h2{font-size:1rem;margin-top:1.5rem}`,
    `.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600}`,
    `.badge.pr{background:#dbeafe;color:#1e40af}`,
    `.badge.auto{background:#fef3c7;color:#92400e}`,
    `.badge.fix{background:#fee2e2;color:#991b1b}`,
    `.badge.feat{background:#dcfce7;color:#166534}`,
    `.badge.docs{background:#ede9fe;color:#5b21b6}`,
    `.badge.chore{background:#f3f4f6;color:#374151}`,
    `table{width:100%;border-collapse:collapse;font-size:.85rem}`,
    `td,th{border:1px solid #ddd;padding:4px 8px;text-align:left}`,
    `th{background:#f3f4f6}`,
    `tr.add{background:#f0fdf4}`,
    `tr.del{background:#fef2f2}`,
    `.meta{font-size:.8rem;color:#666;margin:.5rem 0}`,
    `.diff{background:#1a1a1a;color:#e5e5e5;padding:.5rem;border-radius:4px;font:.75rem/1.4 'Courier New',monospace;overflow-x:auto;max-height:400px}`,
    `.diff .add{color:#4ade80}`,
    `.diff .del{color:#f87171}`,
    `</style></head><body>`,
    `<h1>📋 ${task}</h1>`,
    `<p class="meta">${date} ${time} &middot; ${branch} &middot; ${commit}</p>`,
    `<p>${prHtml} <span class="badge ${prefix.startsWith("fix") ? "fix" : prefix.startsWith("feat") ? "feat" : prefix.startsWith("docs") ? "docs" : prefix.startsWith("chore") ? "chore" : "auto"}">${prefix}</span></p>`,
    ``,
    benefits ? [
    `<h2>🎯 Benefícios</h2>`,
    `<ul>${benefits.split("\n").filter(l => l.trim()).map(l => `<li>${escapeHTML(l.replace(/^[\s*-]+/, ""))}</li>`).join("")}</ul>`,
    ``,
    ].join("\n") : "",
    `<h2>📊 Métricas</h2>`,
    `<table>`,
    `<tr><th>Métrica</th><th>Valor</th></tr>`,
    `<tr><td>Arquivos alterados</td><td>${changedFiles.split("\n").filter(l => l.trim()).length}</td></tr>`,
    `<tr><td>Adições</td><td>${metrics.additions}</td></tr>`,
    `<tr><td>Remoções</td><td>${metrics.deletions}</td></tr>`,
    `<tr><td>Tokens estimados</td><td>~${metrics.tokens}</td></tr>`,
    `</table>`,
    ``,
    `<h2>📁 Arquivos</h2>`,
    `<table><tr><th>Status</th><th>Arquivo</th></tr>`,
    filesTable,
    `</table>`,
    ``,
    `<h2>🔍 Diff</h2>`,
    `<div class="diff">`,
    diff.split("\n").slice(0, 100).map(l => {
      if (l.startsWith("+")) return `<span class="add">${escapeHTML(l)}</span>`;
      if (l.startsWith("-")) return `<span class="del">${escapeHTML(l)}</span>`;
      return escapeHTML(l);
    }).join("\n"),
    `</div>`,
    ``,
    `<p class="meta">Gerado por scripts/generate-report.mjs</p>`,
    `</body></html>`,
  ].join("\n");

  function escapeHTML(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// ── Main ─────────────────────────────────────────────────────────────

const diff = getDiff();
const changedFiles = getChangedFiles();
const branch = getBranch();
const commit = getCommit();
const pr = getPR();
const metrics = estimateTokens(diff);

const html = generateHTML(TASK, diff, changedFiles, branch, commit, pr, metrics, BENEFITS);

if (SHOULD_WRITE) {
  const date = new Date().toISOString().slice(0, 10);
  const safeName = TASK.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const prefix = pr ? `PR${pr.number}` : PREFIX;
  const dir = resolve(ROOT, `docs/reports/${date}`);
  const filepath = resolve(dir, `${prefix}-${date}-${safeName}.html`);

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filepath, html);
  console.log(`✅ Relatório salvo: docs/reports/${date}/${prefix}-${date}-${safeName}.html`);
} else {
  console.log(html);
}
