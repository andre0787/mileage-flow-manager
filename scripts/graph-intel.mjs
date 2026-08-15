#!/usr/bin/env node
/**
 * graph-intel.mjs — CLI do Graph Intelligence (SDD v5.0, P5-01).
 *
 *   npm run graph:status             → estado do grafo (CRG)
 *   npm run graph:build              → constrói o grafo
 *   npm run graph:update             → atualiza o grafo
 *   npm run graph:impact <alvo>      → impacto de um arquivo/símbolo
 *   npm run graph:context <alvo>     → Context Packet (JSON)
 *   npm run graph:query [seletor]    → nós/arestas (JSON)
 *   npm run graph:neo4j-readiness    → score 0..1 + banda
 *
 * Fail-open: CRG ausente/falha → JSON com `available:false` (exit 0),
 * nunca crasha. É um thin wrapper: a lógica real vive em src/ai/ (TS).
 */

import { spawnSync } from "node:child_process";

const CRG = "code-review-graph";

function runCrg(args) {
  try {
    const res = spawnSync(CRG, args, { encoding: "utf8", timeout: 30_000 });
    if (res.error) return { ok: false, stdout: "", error: res.error.message };
    return { ok: res.status === 0, stdout: res.stdout ?? "", error: res.stderr?.trim() };
  } catch (err) {
    return { ok: false, stdout: "", error: err instanceof Error ? err.message : String(err) };
  }
}

function parseJsonOr(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function status() {
  const res = runCrg(["status", "--json"]);
  if (!res.ok || !res.stdout.trim()) {
    console.log(
      JSON.stringify(
        { available: false, error: res.error ?? "code-review-graph indisponível" },
        null,
        2,
      ),
    );
    return;
  }
  const parsed = parseJsonOr(res.stdout);
  console.log(JSON.stringify({ available: true, ...(parsed ?? {}) }, null, 2));
}

function build(update) {
  const res = runCrg(update ? ["update"] : ["build"]);
  console.log(
    JSON.stringify({ ok: res.ok, error: res.ok ? null : (res.error ?? "falha") }, null, 2),
  );
}

function impact(target) {
  if (!target) {
    console.error("Uso: npm run graph:impact -- <alvo>");
    process.exitCode = 1;
    return;
  }
  const res = runCrg(["impact", "--json", target]);
  if (!res.ok || !res.stdout.trim()) {
    console.log(
      JSON.stringify({ available: false, error: res.error ?? "sem dados de impacto" }, null, 2),
    );
    return;
  }
  console.log(
    JSON.stringify(
      { available: true, ...(parseJsonOr(res.stdout) ?? { raw: res.stdout }) },
      null,
      2,
    ),
  );
}

function query(selector) {
  const args = ["architecture", "--json"];
  if (selector) args.push(selector);
  const res = runCrg(args);
  if (!res.ok || !res.stdout.trim()) {
    console.log(
      JSON.stringify({ available: false, error: res.error ?? "sem dados de query" }, null, 2),
    );
    return;
  }
  console.log(
    JSON.stringify(
      { available: true, ...(parseJsonOr(res.stdout) ?? { raw: res.stdout }) },
      null,
      2,
    ),
  );
}

function plan(taskId) {
  // Dry-run do ExecutionPlan (P6): mostra o pipeline de papéis sem executar.
  // Fail-open: sempre imprime o plano lógico de referência.
  if (!taskId) {
    console.error("Uso: npm run graph:plan -- <taskId>");
    process.exitCode = 1;
    return;
  }
  const roles = [
    { id: "graph-scout", role: "graph-scout", parallelGroup: 1 },
    { id: "test-scout", role: "test-scout", parallelGroup: 1 },
    {
      id: "architect",
      role: "architect",
      parallelGroup: 2,
      dependsOn: ["graph-scout", "test-scout"],
    },
    { id: "implementer", role: "implementer", parallelGroup: 3, dependsOn: ["architect"] },
    { id: "tester", role: "tester", parallelGroup: 4, dependsOn: ["implementer"] },
    { id: "reviewer", role: "reviewer", parallelGroup: 5, dependsOn: ["tester"] },
  ];
  console.log(
    JSON.stringify(
      {
        planId: "dry-run",
        taskId,
        agent: "pi",
        model: "unset",
        steps: roles,
        budget: {
          maxAgents: 8,
          maxParallel: 4,
          maxTurns: 60,
          maxToolCalls: 150,
          maxTokens: 100000,
          maxCost: 2.0,
          maxDurationMs: 900000,
        },
        createdAt: new Date().toISOString(),
        dryRun: true,
      },
      null,
      2,
    ),
  );
}

function neo4jReadiness() {
  const st = runCrg(["status", "--json"]);
  const available = st.ok && st.stdout.trim();
  if (!available) {
    console.log(
      JSON.stringify(
        {
          score: 0,
          band: "local/postgres",
          available: false,
          rationale: "Grafo indisponível (CRG ausente) — sem evidência para migração.",
        },
        null,
        2,
      ),
    );
    return;
  }
  console.log(
    JSON.stringify(
      {
        score: 0,
        band: "local/postgres",
        available: true,
        rationale:
          "Grafos locais vivem bem em Postgres/Supabase. Rodar graph:query para métricas reais de densidade.",
      },
      null,
      2,
    ),
  );
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "status":
    status();
    break;
  case "build":
    build(false);
    break;
  case "update":
    build(true);
    break;
  case "impact":
    impact(rest[0]);
    break;
  case "context":
    impact(rest[0]); // mesmo pipeline do impacto (envelope v2 em src/ai)
    break;
  case "query":
    query(rest[0]);
    break;
  case "plan":
    plan(rest[0]);
    break;
  case "neo4j-readiness":
    neo4jReadiness();
    break;
  default:
    console.error(`Comando desconhecido: ${cmd ?? "(vazio)"}`);
    console.error(
      "Uso: status | build | update | impact <alvo> | context <alvo> | query [seletor] | plan <task> | neo4j-readiness",
    );
    process.exitCode = 1;
}
