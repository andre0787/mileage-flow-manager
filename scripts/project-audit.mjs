#!/usr/bin/env node

/**
 * project-audit.mjs — Auditoria estrutural read-only do repositório.
 *
 * Roda as regras existentes (14/15/16/18/23/31/32) sem duplicar seus
 * algoritmos, inventaria arquivos rastreados via git ls-files e classifica
 * artefatos gerados indevidamente versionados.
 *
 * Uso:
 *   node scripts/project-audit.mjs            # relatório humano
 *   node scripts/project-audit.mjs --json     # um documento JSON
 *   node scripts/project-audit.mjs --strict   # exit 1 em critical/failed
 *
 * Read-only: nenhum modo escreve arquivos nem altera estado do git.
 * ponytail: fs + child_process nativos, zero deps.
 */

import { execFileSync } from "child_process";
import { readdirSync } from "fs";
import { resolve } from "path";
import { classifyTrackedArtifacts } from "./lib/project-audit.mjs";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "..");
const RULES_DIR = resolve(ROOT, "scripts/rules");
const AUDIT_RULES = [
  "rule-14-orphan-files.mjs",
  "rule-15-duplicate-code.mjs",
  "rule-16-orphan-scripts.mjs",
  "rule-18-no-duplicate-root-docs.mjs",
  "rule-23-skill-orphans.mjs",
  "rule-31-lib-test-coverage.mjs",
  "rule-32-component-test-coverage.mjs",
];

function runDocsVerifier() {
  const verifierPath = resolve(ROOT, "scripts/verify-docs.mjs");
  try {
    const stdout = execFileSync(process.execPath, [verifierPath, "--strict"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, MOCK_ROOT: ROOT },
    });
    return { rule: "verify-docs", status: "pass", summary: stdout.trim().split("\n").filter(Boolean).pop() || "" };
  } catch (error) {
    const e = error;
    const stdout = e.stdout ? String(e.stdout) : "";
    const summary = stdout.trim().split("\n").filter(Boolean).pop() || e.message?.slice(0, 120) || "";
    return { rule: "verify-docs", status: "fail", summary };
  }
}

function runRule(ruleFile) {
  const rulePath = resolve(RULES_DIR, ruleFile);
  try {
    const stdout = execFileSync(process.execPath, [rulePath], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
      env: { ...process.env, MOCK_ROOT: ROOT },
    });
    return { rule: ruleFile.replace(/\.mjs$/, ""), status: "pass", summary: stdout.trim().split("\n").pop() || "" };
  } catch (error) {
    const e = error;
    const stdout = e.stdout ? String(e.stdout) : "";
    const summary = stdout.trim().split("\n").filter(Boolean).pop() || e.message?.slice(0, 120) || "";
    return { rule: ruleFile.replace(/\.mjs$/, ""), status: "fail", summary };
  }
}

function trackedPaths() {
  try {
    const out = execFileSync("git", ["ls-files"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 10000,
      env: { ...process.env, MOCK_ROOT: ROOT },
    });
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const strictMode = args.includes("--strict");

  const checks = [...AUDIT_RULES.map(runRule), runDocsVerifier()];
  const findings = classifyTrackedArtifacts(trackedPaths());

  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const failedChecks = checks.filter((c) => c.status === "fail");
  const exitCode = strictMode && (criticalFindings.length > 0 || failedChecks.length > 0) ? 1 : 0;

  if (jsonMode) {
    console.log(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        checks,
        findings,
        summary: {
          checksTotal: checks.length,
          checksFailed: failedChecks.length,
          findingsTotal: findings.length,
          critical: criticalFindings.length,
        },
      }),
    );
    process.exit(exitCode);
  }

  console.log("🔍 Auditoria estrutural do projeto");
  console.log("── Checks ──");
  for (const check of checks) {
    console.log(`  ${check.status === "pass" ? "✅" : "❌"} ${check.rule}: ${check.summary}`);
  }
  console.log("── Findings ──");
  if (findings.length === 0) {
    console.log("  Nenhum achado.");
  } else {
    for (const finding of findings) {
      const icon = finding.severity === "critical" ? "🚨" : finding.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`  ${icon} [${finding.severity}] ${finding.path} — ${finding.reason}`);
    }
  }
  console.log(`\nResumo: ${checks.length} checks, ${failedChecks.length} falha(s); ${findings.length} achado(s), ${criticalFindings.length} crítico(s).`);
  process.exit(exitCode);
}

main();
