/**
 * triage.ts — Failure Triage (P12.5-09).
 *
 * Finding → Triage Agent → classificação → confidence → root cause
 * hypothesis. Hipótese NUNCA é fato: baixa confiança (< 0.70) → manual
 * review. O output segue o shape JSON da spec.
 */

import type { EvidencePack } from "./evidence";

export type TriageClassification =
  | "ui_bug"
  | "api_bug"
  | "data_bug"
  | "validation_bug"
  | "auth_bug"
  | "authorization_bug"
  | "regression"
  | "performance"
  | "flaky_test"
  | "environment_failure"
  | "network_failure"
  | "browser_failure"
  | "telemetry_failure"
  | "unknown";

export interface TriageResult {
  findingId: string;
  classification: TriageClassification;
  severity: string;
  confidence: number;
  rootCauseHypothesis: string;
  affectedArea: string;
  recommendedNextAction: "fix" | "manual_review" | "retry" | "close";
  evidence: string[];
}

export function confidenceBand(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

/** Heurísticas de classificação baseadas em evidência observável. */
export function classifyFinding(pack: EvidencePack): TriageResult {
  const text = [
    pack.actual,
    ...pack.steps,
    ...pack.consoleLogs.map((c) => `${c.level}: ${c.text}`),
    ...pack.networkEvents.map((n) => `${n.method} ${n.status} ${n.url}`),
  ]
    .join("\n")
    .toLowerCase();

  let classification: TriageClassification = "unknown";
  let confidence = 0.5;
  let hypothesis = "no clear signal from evidence";
  let affectedArea = "unknown";
  let action: TriageResult["recommendedNextAction"] = "manual_review";

  if (/http 500|status.?[=: ]?500|server error/.test(text)) {
    classification = "api_bug";
    confidence = 0.91;
    hypothesis = "server returned 500 after request; likely unhandled exception in API handler";
    affectedArea = "api";
    action = "fix";
  } else if (/401|unauthorized|403|forbidden/.test(text)) {
    classification = "authorization_bug";
    confidence = 0.87;
    hypothesis = "request rejected by auth/authorization layer; session or RLS policy issue";
    affectedArea = "auth";
    action = "fix";
  } else if (/milhas inválidas|validation error|invalid/.test(text)) {
    classification = "validation_bug";
    confidence = 0.85;
    hypothesis = "form/domain validation rejected input unexpectedly";
    affectedArea = "validation";
    action = "fix";
  } else if (/network|net::err|failed to fetch|timeout/.test(text)) {
    classification = "network_failure";
    confidence = 0.75;
    hypothesis = "transient network failure during execution";
    affectedArea = "network";
    action = "retry";
  } else if (/flaky|retry|transient/.test(text)) {
    classification = "flaky_test";
    confidence = 0.72;
    hypothesis = "test flakiness suspected; requires repeat to confirm";
    affectedArea = "test";
    action = "retry";
  } else if (/console.*error/.test(text)) {
    classification = "ui_bug";
    confidence = 0.78;
    hypothesis = "client-side console error during interaction";
    affectedArea = "ui";
    action = "fix";
  }

  if (classification === "unknown") {
    confidence = 0.4;
    action = "manual_review";
    hypothesis = "evidence insufficient; requires manual review";
  }

  return {
    findingId: pack.findingId,
    classification,
    severity: pack.severity,
    confidence,
    rootCauseHypothesis: hypothesis,
    affectedArea,
    recommendedNextAction: action,
    evidence: pack.telemetryRefs.length > 0 ? pack.telemetryRefs : ["no telemetry refs"],
  };
}

/** Decisão final: hipótese só vira fato com confiança ≥ 0.90 (T21). */
export function isBugConfirmed(triage: TriageResult): boolean {
  return triage.confidence >= 0.9 && triage.recommendedNextAction === "fix";
}
