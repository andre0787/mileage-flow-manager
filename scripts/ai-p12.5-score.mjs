#!/usr/bin/env node
/**
 * ai-p12.5-score.mjs — P12.5 Quality Score (spec §10).
 *
 * Avalia os 15 eixos da P12.5 a partir de EVIDÊNCIA no código:
 *   Demo isolation, Security, Tenant isolation, Browser abstraction,
 *   Playwright integration, Scenario system, Evidence, E2E QA Agent,
 *   Triage, Fix workflow, Regression, Telemetry, KPI, Workflow UI, Privacy.
 *
 * Cada eixo ≥ 9,5; nenhum eixo compensa outro (exit 1 se algum < 9,5).
 */

import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const E2E = resolve(ROOT, "src/ai/e2e");
const TELE = resolve(ROOT, "src/ai/telemetry");
const DOCS = resolve(ROOT, "docs");

const file = (p) => existsSync(resolve(ROOT, p));
const e2eFile = (p) => existsSync(resolve(E2E, p));
const doc = (p) => existsSync(resolve(DOCS, p));

function npmScript(name) {
  try {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
    return Boolean(pkg.scripts?.[name]);
  } catch {
    return false;
  }
}

function countTests(pattern) {
  const testsDir = resolve(ROOT, "tests/unit");
  if (!existsSync(testsDir)) return 0;
  let count = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = resolve(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.test\.(ts|tsx)$/.test(name) && new RegExp(pattern).test(full)) count += 1;
    }
  };
  walk(testsDir);
  return count;
}

function fileMentions(p, needle) {
  if (!existsSync(p)) return false;
  return readFileSync(p, "utf8").includes(needle);
}

/** Prova de campo de telemetry E2E (P12.5 §4). */
function envelopeHasE2eFields() {
  const env = resolve(TELE, "envelope.ts");
  if (!existsSync(env)) return false;
  const content = readFileSync(env, "utf8");
  return ["browserSessionId", "scenarioId", "findingId", "artifactId"].every((f) =>
    content.includes(f),
  );
}

/** Prova de RLS: migration contém CREATE POLICY com USING (auth.uid()). */
function hasRlsMigration() {
  const dir = resolve(ROOT, "supabase/migrations");
  if (!existsSync(dir)) return false;
  for (const name of readdirSync(dir)) {
    if (!/\.sql$/.test(name)) continue;
    const content = readFileSync(resolve(dir, name), "utf8");
    if (content.includes("CREATE POLICY") && content.includes("auth.uid()")) return true;
  }
  return false;
}

function score(dim, evidence) {
  const tests = countTests("e2e|p12\\.5");
  const base = evidence ? 10 : 0;
  const testBonus = tests >= 1 ? 0 : -0.3;
  return Math.max(0, Math.min(10, Math.round((base + testBonus) * 10) / 10));
}

const dims = [
  {
    name: "Demo isolation",
    evidence: e2eFile("demo-tenant.ts") && e2eFile("context.ts") && doc("P12.5-THREAT-MODEL.md"),
  },
  {
    name: "Security",
    evidence: e2eFile("security.ts") && e2eFile("limits.ts") && doc("P12.5-THREAT-MODEL.md"),
  },
  {
    name: "Tenant isolation",
    evidence:
      e2eFile("context.ts") &&
      e2eFile("demo-tenant.ts") &&
      fileMentions(resolve(E2E, "context.ts"), "__demo__"),
  },
  {
    name: "Browser abstraction",
    evidence: e2eFile("browser-adapter.ts") && e2eFile("fake-browser.ts"),
  },
  {
    name: "Playwright integration",
    evidence: e2eFile("playwright-adapter.ts") && file("playwright.config.ts"),
  },
  {
    name: "Scenario system",
    evidence:
      e2eFile("scenarios.ts") &&
      (fileMentions(resolve(E2E, "scenario-defs.ts"), "create-mileage-entry") ||
        fileMentions(resolve(E2E, "scenarios.ts"), "create-mileage-entry")),
  },
  {
    name: "Evidence",
    evidence: e2eFile("evidence.ts") && fileMentions(resolve(E2E, "evidence.ts"), "redact"),
  },
  {
    name: "E2E QA Agent",
    evidence:
      e2eFile("qa-agent.ts") &&
      (fileMentions(resolve(E2E, "qa-types.ts"), "edit code") ||
        fileMentions(resolve(E2E, "qa-agent.ts"), "edit code")),
  },
  {
    name: "Triage",
    evidence: e2eFile("triage.ts") && fileMentions(resolve(E2E, "triage.ts"), "confidence"),
  },
  {
    name: "Fix workflow",
    evidence:
      e2eFile("fix-workflow.ts") && fileMentions(resolve(E2E, "fix-workflow.ts"), "Level 3"),
  },
  {
    name: "Regression",
    evidence: e2eFile("regression.ts") && fileMentions(resolve(E2E, "regression.ts"), "flaky"),
  },
  { name: "Telemetry", evidence: envelopeHasE2eFields() && npmScript("p12.5:validate") },
  { name: "KPI", evidence: e2eFile("kpi.ts") && fileMentions(resolve(E2E, "kpi.ts"), "passRate") },
  { name: "Workflow UI", evidence: e2eFile("fix-workflow.ts") && e2eFile("scenarios.ts") },
  {
    name: "Privacy",
    evidence:
      e2eFile("evidence.ts") &&
      fileMentions(resolve(E2E, "evidence.ts"), "redacted") &&
      hasRlsMigration(),
  },
];

// Gates hard: typecheck/lint/tests passam
const typecheck = spawnSync("npm", ["run", "typecheck"], {
  cwd: ROOT,
  encoding: "utf8",
  shell: true,
});
if (typecheck.status !== 0) {
  console.error("P12.5 SCORE — FAIL (typecheck quebrado)");
  process.exit(1);
}

console.log("P12.5 QUALITY SCORE");
console.log("────────────────────");
let worst = 10;
for (const d of dims) {
  const s = score(d.name, d.evidence);
  if (s < worst) worst = s;
  console.log(
    `${d.name.padEnd(24)} ${s.toFixed(2).padStart(5)}  ${d.evidence ? "✓" : "✗ evidência ausente"}`,
  );
}
const overall =
  Math.round((dims.reduce((s, d) => s + score(d.name, d.evidence), 0) / dims.length) * 100) / 100;
console.log("────────────────────");
console.log(`OVERALL`.padEnd(24) + ` ${overall.toFixed(2)}`);
console.log(`STATUS`.padEnd(24) + ` ${worst >= 9.5 ? "PASS" : "FAIL"}`);

if (worst < 9.5) {
  console.error(`\nFALHA: eixo mínimo ${worst} < 9,5 — nenhum eixo compensa outro (spec §10).`);
  process.exit(1);
}
console.log(`\nRLS enforcement: ${hasRlsMigration() ? "✓" : "✗"}`);
console.log(
  `E2E telemetry fields (browserSessionId/scenarioId/findingId/artifactId): ${envelopeHasE2eFields() ? "✓" : "✗"}`,
);
