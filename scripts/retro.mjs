#!/usr/bin/env node

/**
 * retro.mjs — Gera relatório de retrospectiva.
 *
 * Coleta métricas do período: PRs mergeados, CI status, feedbacks resolvidos,
 * deploys, e gera um resumo markdown.
 *
 * Uso:
 *   node scripts/retro.mjs                          # últimas 2 semanas (padrão)
 *   node scripts/retro.mjs --days 30                # últimos 30 dias
 *   node scripts/retro.mjs --period "2026-06-01..2026-06-30"
 *   node scripts/retro.mjs --write                  # salva em docs/retro/
 *   node scripts/retro.mjs --help
 *
 * ponytail: gh CLI, zero deps.
 */

import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Uso: node scripts/retro.mjs [flags]

Flags:
  --days <N>         Últimos N dias (padrão: 14)
  --period <inicio..fim>  Período específico
  --write            Salva em docs/retro/<data>-retrospectiva.md
  --help, -h         Ajuda
`);
  process.exit(0);
}

function jsonCmd(cmd) {
  try {
    const out = execSync(cmd, { encoding: "utf8", timeout: 15_000 }).trim();
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function textCmd(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: 10_000 }).trim();
  } catch {
    return "";
  }
}

// ── Período ────────────────────────────────────────────────────────
let startDate, endDate;
const periodArg = process.argv.indexOf("--period");
const daysArg = process.argv.indexOf("--days");

if (periodArg !== -1) {
  [startDate, endDate] = (process.argv[periodArg + 1] || "").split("..");
} else {
  const days = daysArg !== -1 ? parseInt(process.argv[daysArg + 1]) || 14 : 14;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  startDate = start.toISOString().slice(0, 10);
  endDate = end.toISOString().slice(0, 10);
}

if (!startDate || !endDate) {
  console.error("❌ Período inválido. Use --period YYYY-MM-DD..YYYY-MM-DD");
  process.exit(1);
}

// ── Métricas ─────────────────────────────────────────────────────

function getMergedPRs() {
  const data = jsonCmd(
    `gh pr list --state merged --search "merged:${startDate}..${endDate}" --json number,title,mergedAt,headRefName --limit 50`
  );
  if (!data) return [];
  return data.map(p => ({
    number: p.number,
    title: p.title,
    mergedAt: p.mergedAt?.slice(0, 10),
    branch: p.headRefName,
  }));
}

function getCIHealth() {
  const data = jsonCmd(
    `gh run list --workflow ci.yml --branch main --limit 30 --json conclusion,createdAt`
  );
  if (!data) return { total: 0, success: 0, failure: 0 };
  const inPeriod = data.filter(r => r.createdAt?.slice(0, 10) >= startDate && r.createdAt?.slice(0, 10) <= endDate);
  return {
    total: inPeriod.length,
    success: inPeriod.filter(r => r.conclusion === "success").length,
    failure: inPeriod.filter(r => r.conclusion === "failure").length,
  };
}

function getDeploys() {
  const data = jsonCmd(
    `gh run list --workflow deploy.yml --branch main --limit 30 --json conclusion,createdAt`
  );
  if (!data) return { total: 0, success: 0, failure: 0 };
  const inPeriod = data.filter(r => r.createdAt?.slice(0, 10) >= startDate && r.createdAt?.slice(0, 10) <= endDate);
  return {
    total: inPeriod.length,
    success: inPeriod.filter(r => r.conclusion === "success").length,
    failure: inPeriod.filter(r => r.conclusion === "failure").length,
  };
}

function getCommits() {
  const out = textCmd(`git log --since="${startDate}" --until="${endDate}" --oneline --format="%h - %s"`);
  return out ? out.split("\n") : [];
}

function getResolvedFeedbacks() {
  try {
    const out = execSync(
      `npx supabase db query --linked "SELECT id FROM feedback WHERE status='done' AND created_at >= '${startDate}' AND created_at <= '${endDate}'" 2>/dev/null`,
      { encoding: "utf8", timeout: 15_000 }
    );
    return out.trim().split("\n").filter(Boolean).length - 1; // -1 for header
  } catch {
    return "n/a";
  }
}

// ── Gera markdown ──────────────────────────────────────────────

function generateRetro(prs, feedbacks, ci, deploys, commits) {
  const types = { fix: 0, feat: 0, chore: 0, docs: 0, other: 0 };
  prs.forEach(pr => {
    const m = pr.title.match(/^(fix|feat|chore|docs)/i);
    if (m) types[m[1].toLowerCase()]++;
    else types.other++;
  });

  const ciRate = ci.total > 0 ? Math.round(ci.success / ci.total * 100) : "—";
  const deployRate = deploys.total > 0 ? Math.round(deploys.success / deploys.total * 100) : "—";

  const prListMd = prs.length === 0
    ? "*Nenhum PR no período*"
    : prs.map(pr => `- PR #${pr.number} — ${pr.title} (${pr.mergedAt})`).join("\n");

  const commitsMd = commits.length === 0
    ? "*Nenhum commit no período*"
    : "```\n" + commits.slice(0, 40).join("\n") + (commits.length > 40 ? `\n... +${commits.length - 40} commits` : "") + "\n```";

  return `# 📊 Retrospectiva — ${startDate} a ${endDate}

> Gerado automaticamente em ${new Date().toISOString().slice(0, 19).replace("T", " ")}

---

## 🚀 Visão Geral

| Métrica | Valor |
|---------|-------|
| PRs mergeados | ${prs.length} |
| Feedbacks resolvidos | ${feedbacks} |
| Commits | ${commits.length} |
| CI runs | ${ci.total} (✅ ${ci.success} / ❌ ${ci.failure}) |
| Deploys | ${deploys.total} (✅ ${deploys.success} / ❌ ${deploys.failure}) |
| CI success rate | ${ciRate}% |
| Deploy success rate | ${deployRate}% |

## 📦 PRs por Tipo

| Tipo | Quantidade |
|------|-----------|
| 🐛 fix | ${types.fix} |
| ✨ feat | ${types.feat} |
| 🔧 chore | ${types.chore} |
| 📝 docs | ${types.docs} |
| Outros | ${types.other} |

## 📋 PRs Mergeados

${prListMd}

${ci.failure > 0 ? `\n## ⚠️ CI Failures\n\n${ci.failure} falha(s) detectada(s) no período.\n` : ""}

## 🧾 Commits

${commitsMd}

---

*Relatório gerado por \`scripts/retro.mjs\`*
`;
}

// ── Main ──────────────────────────────────────────────────────────

console.log(`📊 Retrospectiva: ${startDate} a ${endDate}\n`);

const prs = getMergedPRs();
const feedbacks = getResolvedFeedbacks();
const ci = getCIHealth();
const deploys = getDeploys();
const commits = getCommits();

const md = generateRetro(prs, feedbacks, ci, deploys, commits);

if (process.argv.includes("--write")) {
  const dir = resolve(ROOT, "docs/retro");
  const filepath = resolve(dir, `${endDate}-retrospectiva.md`);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filepath, md);
  console.log(`✅ Salvo em docs/retro/${endDate}-retrospectiva.md`);
} else {
  console.log(md);
}
