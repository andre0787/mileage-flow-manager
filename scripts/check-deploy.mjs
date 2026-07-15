#!/usr/bin/env node

/**
 * check-deploy.mjs — Verifica status do último deploy.
 *
 * Checa se o último workflow de deploy foi bem-sucedido.
 * Usa a GitHub API (via gh CLI) para consultar.
 *
 * Uso:
 *   node scripts/check-deploy.mjs              # status do último deploy
 *   node scripts/check-deploy.mjs --verbose    # detalhes
 *
 * Exit code: 0 se deploy ok, 1 se falhou, 2 se sem dados.
 *
 * ponytail: gh CLI, zero deps.
 */

import { execSync } from "child_process";

function gh(args, opts = {}) {
  try {
    return execSync(`gh api ${args}`, { encoding: "utf8", timeout: 10_000, ...opts }).trim();
  } catch (e) {
    return null;
  }
}

async function main() {
  const verbose = process.argv.includes("--verbose");

  // Busca última run do workflow de deploy na main
  const runsJson = gh('repos/andre0787/mileage-flow-manager/actions/workflows/deploy.yml/runs?branch=main&per_page=1&status=completed');

  if (!runsJson) {
    console.log("  ⚠️  Não foi possível consultar GitHub API");
    process.exit(2);
  }

  const runs = JSON.parse(runsJson);
  if (!runs.total_count || runs.total_count === 0) {
    console.log("  ⚠️  Nenhum deploy encontrado");
    process.exit(2);
  }

  const last = runs.workflow_runs[0];
  const conclusion = last.conclusion;
  const createdAt = last.created_at?.slice(0, 19).replace("T", " ");
  const headBranch = last.head_branch;
  const displayTitle = last.display_title?.slice(0, 60);

  if (verbose) {
    console.log(`  Último deploy: ${displayTitle}`);
    console.log(`  Branch: ${headBranch}`);
    console.log(`  Data:   ${createdAt}`);
    console.log(`  Status: ${last.status}`);
    console.log(`  Conclusão: ${conclusion}`);
  }

  if (conclusion === "success") {
    console.log(`  ✅ Último deploy bem-sucedido (${createdAt})`);
    process.exit(0);
  } else if (conclusion === "failure" || conclusion === "cancelled") {
    console.log(`  ❌ Último deploy falhou: ${conclusion} (${createdAt})`);
    console.log(`     https://github.com/andre0787/mileage-flow-manager/actions/runs/${last.id}`);
    process.exit(1);
  } else {
    console.log(`  ⏳ Último deploy: ${conclusion || "em andamento"} (${createdAt})`);
    process.exit(0);
  }
}

main().catch(() => process.exit(2));
