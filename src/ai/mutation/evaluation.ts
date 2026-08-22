/**
 * P12.6-05/06/07 — Evaluation Metrics
 *
 * Detection, Evidence, and Triage evaluation.
 * Métricas detalhadas por mutation — não esconder atrás de um score.
 */

import type {
  DetectionResult,
  EvidencePack,
  TriageClassification,
  MutationCategory,
} from "./types";

// ─── Detection Metrics (P12.6-05) ──────────────────────────────

export interface DetectionMetrics {
  recall: number; // bugs detected / bugs injected
  precision: number; // true positives / all findings
  falsePositiveRate: number; // false positives / all findings
  falseNegativeRate: number; // missed bugs / bugs injected
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  totalInjected: number;
  totalFound: number;
  timeToDetect?: number; // ms average
}

export function computeDetectionMetrics(result: DetectionResult): DetectionMetrics {
  const { truePositives, falsePositives, falseNegatives, trueNegatives } = result;
  const totalInjected = truePositives + falseNegatives;
  const totalFound = truePositives + falsePositives;

  return {
    recall: totalInjected > 0 ? truePositives / totalInjected : 0,
    precision: totalFound > 0 ? truePositives / totalFound : 0,
    falsePositiveRate: totalFound > 0 ? falsePositives / totalFound : 0,
    falseNegativeRate: totalInjected > 0 ? falseNegatives / totalInjected : 0,
    truePositives,
    falsePositives,
    falseNegatives,
    trueNegatives,
    totalInjected,
    totalFound,
  };
}

// ─── Evidence Metrics (P12.6-06) ───────────────────────────────

export interface EvidenceMetrics {
  completeness: number; // 0-1: how many evidence fields are populated
  reproducibility: number; // 0-1: can another agent reproduce from evidence alone
  hasScreenshot: boolean;
  hasDOM: boolean;
  hasTrace: boolean;
  hasConsole: boolean;
  hasNetwork: boolean;
  hasTelemetry: boolean;
  hasSteps: boolean;
  hasExpected: boolean;
  hasActual: boolean;
  completenessFields: string[];
  missingFields: string[];
}

const EVIDENCE_FIELDS: (keyof EvidencePack)[] = [
  "screenshot",
  "dom",
  "trace",
  "console",
  "network",
  "telemetry",
  "steps",
  "expectedBehavior",
  "actualBehavior",
  "commitSha",
  "scenarioId",
];

export function computeEvidenceMetrics(evidence: EvidencePack): EvidenceMetrics {
  const populated = EVIDENCE_FIELDS.filter((f) => {
    const val = evidence[f];
    if (val === undefined || val === null) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  const missing = EVIDENCE_FIELDS.filter((f) => {
    const val = evidence[f];
    return val === undefined || val === null || (Array.isArray(val) && val.length === 0);
  });

  return {
    completeness: populated.length / EVIDENCE_FIELDS.length,
    reproducibility: 0, // set externally after cross-agent verification
    hasScreenshot: !!evidence.screenshot,
    hasDOM: !!evidence.dom,
    hasTrace: !!evidence.trace,
    hasConsole: !!(evidence.console && evidence.console.length > 0),
    hasNetwork: !!(evidence.network && evidence.network.length > 0),
    hasTelemetry: !!evidence.telemetry,
    hasSteps: !!(evidence.steps && evidence.steps.length > 0),
    hasExpected: !!evidence.expectedBehavior,
    hasActual: !!evidence.actualBehavior,
    completenessFields: populated as string[],
    missingFields: missing as string[],
  };
}

// ─── Triage Metrics (P12.6-07) ─────────────────────────────────

export interface TriageMetrics {
  classificationAccuracy: number;
  severityAccuracy: number;
  rootCauseAccuracy: number;
  confidenceCalibration: number;
  correct: number;
  partiallyCorrect: number;
  incorrect: number;
  unknown: number;
  total: number;
}

export interface TriageEval {
  classification: TriageClassification;
  severityCorrect: boolean;
  rootCauseCorrect: boolean;
  confidence: number;
}

export function computeTriageMetrics(evaluations: TriageEval[]): TriageMetrics {
  const total = evaluations.length;
  if (total === 0) {
    return {
      classificationAccuracy: 0,
      severityAccuracy: 0,
      rootCauseAccuracy: 0,
      confidenceCalibration: 0,
      correct: 0,
      partiallyCorrect: 0,
      incorrect: 0,
      unknown: 0,
      total: 0,
    };
  }

  let correct = 0;
  let partiallyCorrect = 0;
  let incorrect = 0;
  let unknown = 0;
  let severityCorrect = 0;
  let rootCauseCorrect = 0;
  let confidenceSum = 0;

  for (const ev of evaluations) {
    switch (ev.classification) {
      case "correct":
        correct++;
        break;
      case "partially_correct":
        partiallyCorrect++;
        break;
      case "incorrect":
        incorrect++;
        break;
      case "unknown":
        unknown++;
        break;
    }
    if (ev.severityCorrect) severityCorrect++;
    if (ev.rootCauseCorrect) rootCauseCorrect++;
    confidenceSum += ev.confidence;
  }

  const classificationScore = (correct * 1 + partiallyCorrect * 0.5) / total;

  return {
    classificationAccuracy: classificationScore,
    severityAccuracy: severityCorrect / total,
    rootCauseAccuracy: rootCauseCorrect / total,
    confidenceCalibration: confidenceSum / total,
    correct,
    partiallyCorrect,
    incorrect,
    unknown,
    total,
  };
}

// ─── Score Thresholds ──────────────────────────────────────────

export interface ScoreThresholds {
  productionReady: {
    detectionRecall: number;
    detectionPrecision: number;
    evidenceReproducibility: number;
    triageAccuracy: number;
    fixSuccess: number;
    regressionRate: number;
  };
  excellent: {
    detectionRecall: number;
    detectionPrecision: number;
    evidenceReproducibility: number;
    triageAccuracy: number;
    fixSuccess: number;
    regressionRate: number;
  };
}

export const DEFAULT_THRESHOLDS: ScoreThresholds = {
  productionReady: {
    detectionRecall: 0.95,
    detectionPrecision: 0.95,
    evidenceReproducibility: 0.95,
    triageAccuracy: 0.90,
    fixSuccess: 0.90,
    regressionRate: 0.05,
  },
  excellent: {
    detectionRecall: 0.98,
    detectionPrecision: 0.97,
    evidenceReproducibility: 0.98,
    triageAccuracy: 0.95,
    fixSuccess: 0.95,
    regressionRate: 0.02,
  },
};

// ─── Scorecard ─────────────────────────────────────────────────

export interface QAScorecard {
  detection: DetectionMetrics;
  evidence: EvidenceMetrics;
  triage: TriageMetrics;
  fixSuccess: number;
  regressionRate: number;
  blastRadiusScore: number;
  graphROI: number;
  costPerMutation: number;
  timeToDetect: number;
  timeToDiagnose: number;
  timeToFix: number;
  overallGrade: "A" | "B" | "C" | "D" | "F";
  passedProductionReady: boolean;
  passedExcellent: boolean;
}

export function computeScorecard(params: {
  detection: DetectionMetrics;
  evidence: EvidenceMetrics;
  triage: TriageMetrics;
  fixSuccess: number;
  regressionRate: number;
  blastRadiusScore: number;
  graphROI: number;
  costPerMutation: number;
  timeToDetect: number;
  timeToDiagnose: number;
  timeToFix: number;
  thresholds?: ScoreThresholds;
}): QAScorecard {
  const t = params.thresholds || DEFAULT_THRESHOLDS;

  const passedProductionReady =
    params.detection.recall >= t.productionReady.detectionRecall &&
    params.detection.precision >= t.productionReady.detectionPrecision &&
    params.evidence.reproducibility >= t.productionReady.evidenceReproducibility &&
    params.triage.classificationAccuracy >= t.productionReady.triageAccuracy &&
    params.fixSuccess >= t.productionReady.fixSuccess &&
    params.regressionRate <= t.productionReady.regressionRate;

  const passedExcellent =
    params.detection.recall >= t.excellent.detectionRecall &&
    params.detection.precision >= t.excellent.detectionPrecision &&
    params.evidence.reproducibility >= t.excellent.evidenceReproducibility &&
    params.triage.classificationAccuracy >= t.excellent.triageAccuracy &&
    params.fixSuccess >= t.excellent.fixSuccess &&
    params.regressionRate <= t.excellent.regressionRate;

  const avgScore =
    (params.detection.recall +
      params.detection.precision +
      params.evidence.completeness +
      params.triage.classificationAccuracy +
      params.fixSuccess +
      (1 - params.regressionRate)) /
    6;

  let overallGrade: QAScorecard["overallGrade"];
  if (avgScore >= 0.95) overallGrade = "A";
  else if (avgScore >= 0.85) overallGrade = "B";
  else if (avgScore >= 0.75) overallGrade = "C";
  else if (avgScore >= 0.60) overallGrade = "D";
  else overallGrade = "F";

  return {
    detection: params.detection,
    evidence: params.evidence,
    triage: params.triage,
    fixSuccess: params.fixSuccess,
    regressionRate: params.regressionRate,
    blastRadiusScore: params.blastRadiusScore,
    graphROI: params.graphROI,
    costPerMutation: params.costPerMutation,
    timeToDetect: params.timeToDetect,
    timeToDiagnose: params.timeToDiagnose,
    timeToFix: params.timeToFix,
    overallGrade,
    passedProductionReady,
    passedExcellent,
  };
}
