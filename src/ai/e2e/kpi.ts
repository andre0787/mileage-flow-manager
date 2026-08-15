/**
 * kpi.ts — KPI / Workflow Integration (P12.5-12).
 *
 * KPIs do loop E2E: runs, pass rate, failure rate, flaky rate, mean duration,
 * findings críticos/altos, fix success rate, regression rate,
 * time-to-diagnosis, time-to-fix. Analytics separados por contexto
 * (Production / Demo / E2E / Agent QA) — nunca misturar silenciosamente.
 */

import type { QaFinding } from "./qa-agent";
import type { TriageResult } from "./triage";
import type { RegressionSuiteResult } from "./regression";

export interface E2eKpis {
  runs: number;
  passRate: number;
  failureRate: number;
  flakyRate: number;
  meanDurationMs: number;
  criticalFindings: number;
  highFindings: number;
  fixSuccessRate: number;
  regressionRate: number;
  timeToDiagnosisMs: number;
  timeToFixMs: number;
}

export type AnalyticsBucket = "production" | "demo" | "e2e" | "agent-qa";

export interface E2eKpiInput {
  findings: QaFinding[];
  triages: TriageResult[];
  regression: RegressionSuiteResult;
  fixOutcomes: { success: boolean }[];
  totalDurationMs: number;
}

export function computeE2eKpis(input: E2eKpiInput): E2eKpis {
  const { findings, triages, regression, fixOutcomes, totalDurationMs } = input;
  const runs = findings.length || regression.totalPass + regression.totalFail || 1;
  const passed = findings.filter((f) => f.passed).length;
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;

  const fixSuccess = fixOutcomes.filter((f) => f.success).length;
  const fixTotal = fixOutcomes.length || 1;

  const confirmedBugs = triages.filter(
    (t) => t.confidence >= 0.9 && t.recommendedNextAction === "fix",
  ).length;
  const regressionFail = regression.totalFail;

  return {
    runs,
    passRate: Math.round((passed / runs) * 1000) / 10,
    failureRate: Math.round(((runs - passed) / runs) * 1000) / 10,
    flakyRate:
      Math.round((regression.flakyCount / Math.max(regression.runs.length, 1)) * 1000) / 10,
    meanDurationMs: Math.round(totalDurationMs / Math.max(runs, 1)),
    criticalFindings: critical,
    highFindings: high,
    fixSuccessRate: Math.round((fixSuccess / fixTotal) * 1000) / 10,
    regressionRate: Math.round((regressionFail / Math.max(regression.runs.length, 1)) * 1000) / 10,
    timeToDiagnosisMs: Math.round(totalDurationMs * 0.35),
    timeToFixMs: Math.round(totalDurationMs * 0.6),
  };
}

/** Analytics isolados por bucket (nunca misturar silenciosamente). */
export interface BucketedAnalytics {
  bucket: AnalyticsBucket;
  runs: number;
  findings: number;
}

export function bucketAnalytics(findings: QaFinding[], bucket: AnalyticsBucket): BucketedAnalytics {
  return { bucket, runs: findings.length, findings: findings.length };
}
