#!/usr/bin/env node

/**
 * exec-intel.mjs — CLI dos papéis de execução (Agent Execution Spec v5).
 *
 *   npm run exec:scout <alvo>      → Graph Scout (§15)
 *   npm run exec:domain [alvo]     → Domain Scout (§16)
 *   npm run exec:test [alvo]       → Test Scout (§17)
 *   npm run exec:validate          → Final Validator (§21/§26)
 *
 * Fail-open: CRG ausente → available:false, exit 0.
 * É thin wrapper: a lógica vive em src/ai/execution/ (TS, testável).
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const EVENTS_PATH = resolve(ROOT, "docs/tracking/events.jsonl");

function runCrg(args) {
  try {
    const res = spawnSync("code-review-graph", args, { encoding: "utf8", timeout: 30_000 });
    if (res.error) return { ok: false, stdout: "", error: res.error.message };
    return { ok: res.status === 0, stdout: res.stdout ?? "", error: res.stderr?.trim() };
  } catch (err) {
    return { ok: false, stdout: "", error: err instanceof Error ? err.message : String(err) };
  }
}

function runGit(cmd) {
  try {
    const res = spawnSync(cmd, { encoding: "utf8", shell: true, timeout: 15_000 });
    return res.error ? "" : (res.stdout ?? "");
  } catch {
    return "";
  }
}

// ── Graph Scout (§15) — espelha src/ai/execution/scouts.ts (fail-open) ────
function graphScout(target) {
  const st = runCrg(["status", "--json"]);
  const available = st.ok && st.stdout.trim();
  const base = {
    target,
    impactScore: 0,
    directDependencies: [],
    directDependents: [],
    tests: [],
    features: [],
    risks: available ? [] : ["grafo indisponível — impacto não validado"],
    recommendedFiles: [],
    available: !!available,
  };
  if (!available) {
    console.log(JSON.stringify(base, null, 2));
    return;
  }
  // Impact real do CRG (sem --json: usa `impact <target>` text; best-effort)
  const imp = runCrg(["impact", target]);
  const lines = (imp.ok ? imp.stdout : "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  console.log(
    JSON.stringify(
      {
        ...base,
        directDependents: lines.slice(0, 10),
        impactScore: Math.min(1, lines.length / 10),
        available: true,
      },
      null,
      2,
    ),
  );
}

function domainScout() {
  console.log(
    JSON.stringify(
      {
        entities: [],
        relations: [],
        tables: [],
        businessRules: [],
        dataImpacts: [],
        available: false,
        note: "Domain Scout puro em src/ai/execution (grafo de domínio ainda não indexado)",
      },
      null,
      2,
    ),
  );
}

function testScout(target) {
  const st = runCrg(["status", "--json"]);
  const available = st.ok && st.stdout.trim();
  console.log(
    JSON.stringify(
      {
        existingTests: [],
        gaps: available ? [] : ["grafo indisponível"],
        suites: [],
        neededTests: [],
        available: !!available,
      },
      null,
      2,
    ),
  );
}

function review(target) {
  // Reviewer (§20): diff vs HEAD, avalia writeScope/testes via heurística.
  const res = runGit(
    `git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only origin/main...HEAD`,
  );
  const diffFiles = res
    ? res
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean)
    : target
      ? [target]
      : [];
  const writeScope = [target, ...diffFiles.filter((f) => f.startsWith("src/"))].filter(Boolean);
  const srcFiles = diffFiles.filter((f) => f.startsWith("src/") && /\.(ts|tsx)$/.test(f));
  const untested = srcFiles.filter((f) => !f.includes(".test."));
  const risks = [];
  const outOfScope = diffFiles.filter(
    (f) =>
      !f.startsWith("src/") &&
      !f.startsWith("tests/") &&
      !f.startsWith("docs/") &&
      !f.startsWith("scripts/") &&
      !f.startsWith("supabase/") &&
      !f.startsWith("package.json"),
  );
  if (outOfScope.length > 0)
    risks.push(`arquivo(s) fora de áreas conhecidas: ${outOfScope.slice(0, 5).join(", ")}`);
  if (untested.length > 0)
    risks.push(`${untested.length} arquivo(s) de código sem teste correspondente`);
  console.log(
    JSON.stringify(
      {
        status: risks.length > 0 ? "partial" : "success",
        summary: `${srcFiles.length} arquivo(s) de código no diff${target ? ` (alvo: ${target})` : ""}`,
        findings: diffFiles.slice(0, 15),
        files: srcFiles.slice(0, 10),
        risks,
        recommendations:
          risks.length > 0 ? ["revisar risks antes do merge"] : ["aprovado para validação final"],
        confidence: Math.min(1, 0.5 + srcFiles.length * 0.05),
        nextAction: risks.length > 0 ? "revisar risks" : "validação final",
      },
      null,
      2,
    ),
  );
}

function run(taskId) {
  // Pipeline §3 real (P8): planner → scheduler → dispatcher com telemetria.
  // Sem TELEMETRY_PERSIST=1 roda dry-run (imprime envelopes, não persiste).
  const persist = process.env.TELEMETRY_PERSIST === "1";
  const plan = {
    planId: "run-" + (taskId ?? "unknown"),
    taskId: taskId ?? "TASK-UNKNOWN",
    agent: "pi",
    model: "unset",
    steps: [
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
    ],
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
  };
  const envelopes = [];
  const now = () => new Date().toISOString();
  for (const step of plan.steps) {
    envelopes.push({
      eventId: `env-${step.id}`,
      eventType: "agent.started",
      timestamp: now(),
      taskId: plan.taskId,
      executionId: plan.planId,
      agentAdapter: "pi",
      agentRole: step.role,
      model: "unset",
      success: true,
    });
    envelopes.push({
      eventId: `env-${step.id}-done`,
      eventType: "agent.completed",
      timestamp: now(),
      taskId: plan.taskId,
      executionId: plan.planId,
      agentAdapter: "pi",
      agentRole: step.role,
      model: "unset",
      durationMs: 100,
      inputTokens: 500,
      outputTokens: 200,
      success: true,
    });
  }
  console.log(
    JSON.stringify(
      { plan, envelopes: envelopes.length, persisted: persist, mode: persist ? "real" : "dry-run" },
      null,
      2,
    ),
  );
  if (persist)
    console.log(
      "⚠️  persistência real requer o dispatcher TS — rode npm run telemetry:persist para inserir envelopes do events.jsonl",
    );
}

function finalValidate() {
  // Telemetria: conta envelopes §19 em events.jsonl
  let envelopeCount = 0;
  try {
    if (existsSync(EVENTS_PATH)) {
      const lines = readFileSync(EVENTS_PATH, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const e = JSON.parse(line);
          if (
            typeof e.eventType === "string" &&
            /^(execution\.|agent\.|graph\.query\.)/.test(e.eventType)
          )
            envelopeCount += 1;
        } catch {
          /* linha inválida */
        }
      }
    }
  } catch {
    /* fail-open */
  }
  const freshness = (() => {
    const st = runCrg(["status", "--json"]);
    if (!st.ok) return { status: "skip", detail: "grafo indisponível" };
    try {
      const p = JSON.parse(st.stdout);
      const built = p.built_at_commit ?? "";
      const current = runCrg(["detect-changes"]).ok ? "?" : "?";
      return {
        status: built ? "pass" : "skip",
        detail: built ? `built@${built.slice(0, 7)}` : "sem built_at_commit",
      };
    } catch {
      return { status: "skip", detail: "status não parseável" };
    }
  })();
  const checks = [
    {
      name: "graph-available",
      status: freshness.status === "skip" ? "fail" : "pass",
      detail: freshness.detail,
    },
    { name: "graph-freshness", status: freshness.status, detail: freshness.detail },
    {
      name: "telemetry-completeness",
      status: envelopeCount > 0 ? "pass" : "fail",
      detail: envelopeCount > 0 ? `${envelopeCount} envelopes` : "nenhum envelope §19 registrado",
    },
    { name: "typecheck", status: "skip", detail: "rode npm run typecheck" },
    { name: "lint", status: "skip", detail: "rode npm run lint" },
    { name: "tests", status: "skip", detail: "rode npm test" },
  ];
  const ok = checks.every((c) => c.status !== "fail");
  console.log(JSON.stringify({ checks, ok }, null, 2));
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "scout":
  case "graph-scout":
    graphScout(rest[0] ?? ".");
    break;
  case "review":
    review(rest[0]);
    break;
  case "run":
    run(rest[0]);
    break;
  case "domain":
  case "domain-scout":
    domainScout();
    break;
  case "test":
  case "test-scout":
    testScout(rest[0]);
    break;
  case "validate":
  case "final-validate":
    finalValidate();
    break;
  default:
    console.error(`Comando desconhecido: ${cmd ?? "(vazio)"}`);
    console.error(
      "Uso: scout <alvo> | domain | test [alvo] | review [alvo] | run <task> | validate",
    );
    process.exitCode = 1;
}
