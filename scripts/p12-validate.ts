#!/usr/bin/env node
/**
 * p12-validate.ts — P12 Real-World Validation runner.
 *
 * Executa o dataset real nas 3 estratégias, roda as análises P12-05..08 e
 * gera os entregáveis finais:
 *   docs/P12-REAL-WORLD-EVIDENCE-REPORT.md
 *   docs/P13-EVIDENCE-DRIVEN-ROADMAP.md
 *
 * Uso:
 *   npm run p12:validate
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runValidationSuite } from "@/ai/validation/runner";
import { analyzeReliability } from "@/ai/validation/reliability";
import { analyzeAgentModelRole } from "@/ai/validation/agent-model-role";
import { analyzeGraphRoi } from "@/ai/validation/graph-roi";
import { analyzeWorkflowEfficiency } from "@/ai/validation/workflow-efficiency";
import { REAL_TASK_DATASET } from "@/ai/validation/dataset";
import { generateEvidenceReport } from "./p12-report-generator";

const ROOT = resolve(import.meta.dirname, "..");

function repoState(): { commitSha: string; branch: string; workingTreeClean: boolean } {
  try {
    const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim();
    return { commitSha: sha, branch, workingTreeClean: dirty.length === 0 };
  } catch {
    return { commitSha: "unknown", branch: "unknown", workingTreeClean: false };
  }
}

function main() {
  const repo = repoState();
  const { runs } = runValidationSuite(REAL_TASK_DATASET, {
    commitSha: repo.commitSha,
    branch: repo.branch,
    workingTreeClean: repo.workingTreeClean,
    beforeSha: repo.commitSha,
    afterSha: repo.commitSha,
  });

  const reliability = analyzeReliability(runs);
  const agentModelRole = analyzeAgentModelRole(runs);
  const graphRoi = analyzeGraphRoi(runs);
  const workflow = analyzeWorkflowEfficiency(runs);

  const report = generateEvidenceReport({
    runs,
    reliability,
    agentModelRole,
    graphRoi,
    workflow,
    repo,
  });

  writeFileSync(resolve(ROOT, "docs/P12-REAL-WORLD-EVIDENCE-REPORT.md"), report.evidence, "utf8");
  writeFileSync(resolve(ROOT, "docs/P13-EVIDENCE-DRIVEN-ROADMAP.md"), report.roadmap, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        runs: runs.length,
        tasks: new Set(runs.map((r) => r.taskId)).size,
        strategies: [...new Set(runs.map((r) => r.strategy))],
        reliabilityTriggers: reliability.triggers.filter((t) => t.triggered).map((t) => t.name),
        topBottleneck: reliability.bottlenecks[0]?.phase ?? "none",
        unnecessaryRoles: workflow.unnecessaryRoles,
        graphVerdicts: graphRoi.byClass.map((c) => `${c.taskClass}:${c.verdict}`),
        neo4j: { score: graphRoi.neo4j.needScore, recommendation: graphRoi.neo4j.recommendation },
        insufficientEvidence: agentModelRole.insufficientEvidence.length,
        written: ["docs/P12-REAL-WORLD-EVIDENCE-REPORT.md", "docs/P13-EVIDENCE-DRIVEN-ROADMAP.md"],
      },
      null,
      2,
    ),
  );
}

main();
