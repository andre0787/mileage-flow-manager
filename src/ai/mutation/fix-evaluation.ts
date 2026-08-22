/**
 * P12.6-08 — Controlled Fix Evaluation
 *
 * Fluxo: Finding → Fix Agent → patch → tests
 *
 * O Fix Agent recebe: finding, evidence, triage, relevant repository context.
 * NÃO recebe a implementação da mutation.
 *
 * Uma correção só conta como sucesso se:
 *   mutation removed + original behavior restored + existing tests pass
 *   + E2E passes + no security regression
 *
 * P12.6-09 — Regression Evaluation
 *
 * Executar: original scenario + related scenarios + full regression.
 * Meta inicial: regression rate < 5%. Meta madura: regression rate < 2%.
 */

import type {
  DetectionFinding,
  EvidencePack,
  TriageResult,
  FixResult,
  RegressionResult,
  CostMetrics,
  RegressionFinding,
} from "./types";

// ─── Fix Agent Context ─────────────────────────────────────────

export interface FixAgentContext {
  finding: DetectionFinding;
  evidence: EvidencePack;
  triage: TriageResult;
  repositoryContext: RepositoryContext;
}

export interface RepositoryContext {
  relevantFiles: string[];
  fileContents: Record<string, string>;
  recentChanges: string[];
  testFiles: string[];
}

// ─── Fix Evaluator ─────────────────────────────────────────────

export interface FixEvaluation {
  fixId: string;
  findingId: string;
  result: FixResult;
  cost: CostMetrics;
  evaluatedAt: string;
  overallSuccess: boolean;
  failureReasons: string[];
}

export class FixEvaluator {
  /**
   * Evaluate a fix attempt.
   */
  evaluate(
    finding: DetectionFinding,
    fixResult: FixResult,
    cost: CostMetrics,
  ): FixEvaluation {
    const failureReasons: string[] = [];

    if (!fixResult.mutationRemoved) {
      failureReasons.push("Mutation not removed");
    }
    if (!fixResult.originalBehaviorRestored) {
      failureReasons.push("Original behavior not restored");
    }
    if (!fixResult.existingTestsPass) {
      failureReasons.push("Existing tests failing");
    }
    if (!fixResult.e2ePasses) {
      failureReasons.push("E2E tests failing");
    }
    if (fixResult.securityRegression) {
      failureReasons.push("Security regression detected");
    }

    const overallSuccess = failureReasons.length === 0;

    return {
      fixId: `fix-${finding.id}-${Date.now()}`,
      findingId: finding.id,
      result: fixResult,
      cost,
      evaluatedAt: new Date().toISOString(),
      overallSuccess,
      failureReasons,
    };
  }

  /**
   * Calculate fix success rate across multiple evaluations.
   */
  calculateFixSuccessRate(evaluations: FixEvaluation[]): number {
    if (evaluations.length === 0) return 0;
    const successful = evaluations.filter((e) => e.overallSuccess).length;
    return successful / evaluations.length;
  }
}

// ─── Regression Evaluator ──────────────────────────────────────

export interface RegressionEvaluation {
  evaluationId: string;
  fixId: string;
  result: RegressionResult;
  overallRegressionRate: number;
  evaluatedAt: string;
  withinTarget: boolean;
  regressionTarget: number;
}

export class RegressionEvaluator {
  private target: number;

  constructor(target: number = 0.05) {
    this.target = target;
  }

  /**
   * Evaluate regression after a fix.
   */
  evaluate(
    fixId: string,
    originalScenarioPass: boolean,
    relatedScenarioPass: boolean[],
    fullRegressionPass: boolean,
  ): RegressionEvaluation {
    const totalScenarios = 2 + relatedScenarioPass.length;
    const passedScenarios =
      (originalScenarioPass ? 1 : 0) +
      (fullRegressionPass ? 1 : 0) +
      relatedScenarioPass.filter(Boolean).length;

    const regressionRate = 1 - passedScenarios / totalScenarios;

    const regressions: RegressionFinding[] = [];

    if (!originalScenarioPass) {
      regressions.push({
        scenarioId: "original",
        description: "Original scenario no longer passes",
        relatedToMutation: true,
      });
    }

    relatedScenarioPass.forEach((pass, idx) => {
      if (!pass) {
        regressions.push({
          scenarioId: `related-${idx}`,
          description: `Related scenario ${idx} no longer passes`,
          relatedToMutation: false,
        });
      }
    });

    if (!fullRegressionPass) {
      regressions.push({
        scenarioId: "full-regression",
        description: "Full regression suite has failures",
        relatedToMutation: false,
      });
    }

    return {
      evaluationId: `reg-${fixId}-${Date.now()}`,
      fixId,
      result: {
        originalScenarioPass,
        relatedScenariosPass: relatedScenarioPass.every(Boolean),
        fullRegressionPass,
        regressionRate,
        regressions,
      },
      overallRegressionRate: regressionRate,
      evaluatedAt: new Date().toISOString(),
      withinTarget: regressionRate <= this.target,
      regressionTarget: this.target,
    };
  }

  /**
   * Evaluate multiple regression results.
   */
  evaluateBatch(
    evaluations: Array<{
      fixId: string;
      original: boolean;
      related: boolean[];
      full: boolean;
    }>,
  ): {
    avgRegressionRate: number;
    worstRegressionRate: number;
    allWithinTarget: boolean;
    results: RegressionEvaluation[];
  } {
    const results = evaluations.map((e) =>
      this.evaluate(e.fixId, e.original, e.related, e.full),
    );

    const avgRegressionRate =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.overallRegressionRate, 0) /
          results.length
        : 0;

    const worstRegressionRate = Math.max(
      ...results.map((r) => r.overallRegressionRate),
      0,
    );

    return {
      avgRegressionRate,
      worstRegressionRate,
      allWithinTarget: results.every((r) => r.withinTarget),
      results,
    };
  }
}
