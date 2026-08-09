#!/usr/bin/env node
// metrics/collect.mjs — Coleta dados do GitHub via gh CLI (PRs paginados + check-runs).
// Uso: node scripts/metrics/collect.mjs [--since 2026-07-01] [--dry] [--out <path>]

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve } from "path";

const REPO = "andre0787/mileage-flow-manager";

/**
 * gh api paginado (endpoints que retornam LISTAS). Cada página chega como um
 * JSON por linha (--paginate concatena outputs com \n). Parseia e achata.
 * @param {string} path @param {(x:any)=>any} map
 */
function ghApiList(path, map = (x) => x) {
  const cmd = `gh api --paginate "${path}" --jq '.'`;
  const raw = execSync(cmd, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return raw
    .trim()
    .split("\n")
    .filter((l) => l.trim())
    .flatMap((line) => {
      const parsed = JSON.parse(line);
      return Array.isArray(parsed) ? parsed : [parsed];
    })
    .map(map);
}

/**
 * gh api único (endpoint que retorna OBJETO, sem paginação).
 * @param {string} path @param {(x:any)=>any} map
 */
function ghApiOne(path, map = (x) => x) {
  const cmd = `gh api "${path}" --jq '.'`;
  const raw = execSync(cmd, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  return map(JSON.parse(raw));
}

/**
 * Coleta PRs (paginado) + check-runs do head de cada PR.
 * @param {{since?: string, limit?: number}} opts
 * @returns {{ prs: Array<object>, checksByPr: Record<number, Array<object>> }}
 */
export async function collectGhData({ since = "", limit = 0 } = {}) {
  const prs = ghApiList(`repos/${REPO}/pulls?state=all`, (p) => ({
    number: p.number,
    title: p.title,
    state: p.state,
    createdAt: p.created_at,
    closedAt: p.closed_at,
    mergedAt: p.merged_at,
    headRefName: p.head?.ref ?? "",
    headSha: p.head?.sha ?? "",
  }));
  const filtered = since
    ? prs.filter((p) => p.createdAt >= since)
    : prs;
  const scoped = limit > 0 ? filtered.slice(0, limit) : filtered;

  const checksByPr = {};
  // Pool de concorrência: até 8 chamadas gh api simultâneas.
  const queue = scoped.map((pr) => ({ pr, sha: pr.headSha ?? "" }));
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length > 0) {
      const { pr, sha } = queue.shift();
      try {
        if (!sha) throw new Error("sem head sha");
        const runs = ghApiOne(
          `repos/${REPO}/commits/${sha}/check-runs`,
          (d) => d.check_runs ?? [],
        );
        checksByPr[pr.number] = runs.map((c) => ({
          name: c.name,
          conclusion: c.conclusion,
          status: c.status,
          completedAt: c.completed_at,
        }));
      } catch {
        // PR sem head (ex.: fechado e apagado) — segue sem checks
        checksByPr[pr.number] = [];
      }
    }
  });
  await Promise.all(workers);

  return { prs: scoped, checksByPr };
}

// ─── Main ────────────────────────────────────────────────────────────
if (process.argv[1] === import.meta.filename) {
  const since =
    process.argv.find((a) => a.startsWith("--since="))?.split("=")[1] ?? "";
  const limitArg =
    process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0";
  const outArg =
    process.argv.find((a) => a.startsWith("--out="))?.split("=")[1] ?? "";
  const gh = await collectGhData({ since, limit: Number(limitArg) });

  if (outArg) {
    const outPath = resolve(outArg);
    writeFileSync(outPath, JSON.stringify(gh, null, 2), "utf8");
    console.log(`✅ dados GitHub salvos em ${outPath}`);
  } else {
    console.log(JSON.stringify(gh, null, 2));
  }
}
