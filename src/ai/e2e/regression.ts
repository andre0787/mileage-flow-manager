/**
 * regression.ts — Regression Loop (P12.5-11).
 *
 * Finding → Fix → Unit tests → Cenário E2E original → Cenários relacionados
 * → Suíte de regressão. Falhas potencialmente flaky são repetidas (repeat ≥ 3)
 * e registram pass_count/fail_count/flaky_score. NUNCA classificar como bug
 * com uma única execução quando há sinais de flakiness (T20).
 */

export interface RegressionRun {
  scenarioId: string;
  passCount: number;
  failCount: number;
  attempts: number;
  flakyScore: number;
  verdict: "pass" | "fail" | "flaky";
}

export interface RegressionConfig {
  /** Repetições mínimas para cenários com falha. */
  repeatOnFailure: number;
  /** Repetições mínimas totais por cenário. */
  minAttempts: number;
  /** Limiar de flakiness (0..1): proporção mínima de outcomes mistos. */
  flakyThreshold: number;
}

export const DEFAULT_REGRESSION_CONFIG: RegressionConfig = {
  repeatOnFailure: 3,
  minAttempts: 3,
  flakyThreshold: 0.5,
};

/**
 * Executa um cenário `attempts` vezes com resultado determinístico por
 * tentativa (seedable) e computa flaky_score.
 *
 * Veredito (T20): qualquer mistura pass+fail = flaky; só all-fail = fail;
 * só all-pass = pass. Uma única execução com falha NUNCA confirma bug.
 */
export function runRegressionScenario(
  scenarioId: string,
  attempts: number,
  outcomes: boolean[],
  _config: RegressionConfig = DEFAULT_REGRESSION_CONFIG,
): RegressionRun {
  const passCount = outcomes.filter(Boolean).length;
  const failCount = outcomes.length - passCount;
  const flakyScore =
    Math.round((Math.min(passCount, failCount) / Math.max(outcomes.length, 1)) * 100) / 100;

  let verdict: RegressionRun["verdict"] = "pass";
  if (failCount === 0) {
    verdict = "pass";
  } else if (passCount === 0) {
    verdict = "fail";
  } else {
    verdict = "flaky";
  }
  return { scenarioId, passCount, failCount, attempts, flakyScore, verdict };
}

/** Decisão: só classifica como bug se falhou em TODAS as repetições (T20). */
export function isConfirmedRegression(
  run: RegressionRun,
  config: RegressionConfig = DEFAULT_REGRESSION_CONFIG,
): boolean {
  if (run.attempts < config.minAttempts) return false;
  return run.failCount === run.attempts;
}

/** Executa o loop completo: cenário original + relacionados. */
export interface RegressionSuiteResult {
  runs: RegressionRun[];
  totalPass: number;
  totalFail: number;
  flakyCount: number;
  regressionsConfirmed: string[];
  needsFixReturn: boolean;
}

export function runRegressionSuite(
  scenarioOutcomes: Record<string, boolean[]>,
  relatedScenarioIds: string[],
  config: RegressionConfig = DEFAULT_REGRESSION_CONFIG,
): RegressionSuiteResult {
  const ids = [...new Set([...Object.keys(scenarioOutcomes), ...relatedScenarioIds])];
  const runs = ids.map((id) => {
    const outcomes = scenarioOutcomes[id] ?? [];
    const attempts = outcomes.length;
    return runRegressionScenario(id, attempts, outcomes, config);
  });

  const confirmed = runs.filter((r) => isConfirmedRegression(r, config)).map((r) => r.scenarioId);
  return {
    runs,
    totalPass: runs.reduce((s, r) => s + r.passCount, 0),
    totalFail: runs.reduce((s, r) => s + r.failCount, 0),
    flakyCount: runs.filter((r) => r.verdict === "flaky").length,
    regressionsConfirmed: confirmed,
    needsFixReturn: confirmed.length > 0,
  };
}
