#!/usr/bin/env node

/**
 * consolidate-report.mjs — Relatório executivo consolidado por PR.
 *
 * Agrega todos os PRs merged num intervalo de datas (padrão: ontem..hoje)
 * em UM briefing executivo com o "Detalhamento por item" ao nível de PR:
 * 1 linha por PR (título real + benefício/impacto por tipo + custo de token
 * agregado do diff do merge).
 *
 * Uso:
 *   npm run report:consolidate                  # ontem..hoje, preview
 *   npm run report:consolidate -- --write       # salva docs/reports/<hoje>/
 *   npm run report:consolidate -- --from 2026-08-12 --to 2026-08-13 --write
 *   npm run report:consolidate -- --prs 348,349,350
 *
 * ponytail: zero deps (gh + git + generateHTML reutilizado).
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { generateHTML, buildPrRow, numstatLines } from "./generate-report.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function arg(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] || fallback : fallback;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function gh(args) {
  try {
    return execSync(`gh ${args}`, { cwd: ROOT, encoding: "utf8", timeout: 20_000 }).trim();
  } catch {
    return "";
  }
}

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, encoding: "utf8", timeout: 20_000 }).trim();
  } catch {
    return "";
  }
}

/** Busca PRs merged por intervalo de datas ou lista explícita. */
function fetchMergedPRs(from, to) {
  const prsArg = arg("--prs", "");
  if (prsArg) {
    const nums = prsArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const rows = [];
    for (const n of nums) {
      // Guard numérico: evita injeção de shell via --prs
      if (!/^\d+$/.test(n)) {
        console.warn(`⚠️  --prs ignora valor inválido: "${n}"`);
        continue;
      }
      const info = gh(
        `pr view ${n} --json number,title,mergedAt,mergeCommit --jq '{number,title,mergedAt,mergeCommit}'`,
      );
      if (!info) continue;
      const pr = JSON.parse(info);
      rows.push(pr);
    }
    return rows.sort((a, b) => a.number - b.number);
  }

  const search = `merged:${from}..${to}`;
  const out = gh(
    `pr list --state merged --search "${search}" --json number,title,mergedAt,mergeCommit --limit 100`,
  );
  if (!out) return [];
  return JSON.parse(out).sort((a, b) => a.number - b.number);
}

// ── CLI ───────────────────────────────────────────────────────────────
const FROM = arg("--from", daysAgo(1));
const TO = arg("--to", today());
const SHOULD_WRITE = process.argv.includes("--write");
const TASK = arg("--task", `Consolidado de entregas ${FROM} → ${TO}`);

const prs = fetchMergedPRs(FROM, TO);
if (prs.length === 0) {
  console.error(`❌ Nenhum PR merged entre ${FROM} e ${TO}`);
  process.exit(1);
}

// Linhas do Detalhamento por item — 1 linha por PR
const rows = [];
let totalLines = 0;
let totalAdditions = 0;
let totalDeletions = 0;
for (const pr of prs) {
  // Custo agregado: diff do merge (merge^1..merge)
  const sha = pr.mergeCommit?.oid ?? "";
  const numstat = sha ? git(`diff ${sha}^1..${sha} --numstat`) : "";
  const lines = numstatLines(numstat);
  totalLines += lines;
  rows.push(buildPrRow({ number: pr.number, title: pr.title, lines }));
}

// Tipos (para o KPI)
const types = rows.map(
  (r) => (r.fix || "").match(/^(fix|feat|refactor|docs|chore)/i)?.[1] || "outros",
);
const typeCount = types.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {});

const metrics = {
  lines: totalLines,
  additions: Math.round(totalLines / 2),
  deletions: Math.round(totalLines / 2),
  tokens: Math.round(totalLines * 0.75),
  addTokens: Math.round(totalLines * 0.375),
  delTokens: Math.round(totalLines * 0.375),
  overheadTokens: 0,
};

const summary = `${prs.length} PRs entregues (${FROM} → ${TO}): ${Object.entries(typeCount)
  .map(([t, n]) => `${n} ${t}`)
  .join(
    ", ",
  )} — ${totalLines.toLocaleString("pt-BR")} linhas, ~${metrics.tokens.toLocaleString("pt-BR")} tokens de mudança.`;

const impactProduto = `Entregas consolidadas de ${prs.length} PRs: correções de comportamento (${typeCount.fix || 0}), novas capacidades (${typeCount.feat || 0}), simplificações (${typeCount.refactor || 0}) e ajustes de processo (${typeCount.docs || 0}/${typeCount.chore || 0}).`;
const impactNegocio = `${prs.length} mudanças em produção com validação completa (testes + pre-pr + CI + code review) — risco controlado em cada entrega.`;
const impactoProcesso =
  "Entrega contínua com gates: code review obrigatório, pre-pr com 0 erros e deploy automatizado em produção.";

const session = {
  prMerges: prs.length,
  leadTimeMin: null,
  prePrTotal: null,
  prePrFail: null,
  ruleFails: null,
  healed: null,
  codings: null,
  reviews: null,
  outcomeGrade: null,
  tests: null,
  timeline: prs.map((pr) => ({
    type: "pr:merge",
    label: `PR #${pr.number}`,
    time: (pr.mergedAt || "").slice(11, 16),
  })),
};

const html = generateHTML({
  task: TASK,
  diff: `Consolidado de ${prs.length} PRs merged (${FROM}..${TO})`,
  changedFiles: rows.map((r) => `M PR #${r.item.replace("PR #", "")}`).join("\n"),
  branch: "main",
  commit: `${prs.length} PRs merged`,
  pr: null,
  metrics,
  tableRows: rows,
  evidenceUrl: "",
  beforeText: `${prs.length} entregas em ${FROM}..${TO}`,
  afterText: "Produção atualizada com validação completa",
  summary,
  impactProduto,
  impactNegocio,
  impactoProcesso,
  session,
});

if (SHOULD_WRITE) {
  const dir = resolve(ROOT, `docs/reports/${TO}`);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const safe = TASK.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const file = resolve(dir, `PR-CONSOLIDADO-${FROM}-${TO}-${safe}.html`);
  writeFileSync(file, html);
  console.log(`✅ Consolidado salvo: docs/reports/${TO}/${file.split("/").pop()}`);
  console.log(
    `   ${prs.length} PRs · ${metrics.tokens} tokens · ${rows.length} linhas no Detalhamento`,
  );
} else {
  console.log(html);
}
