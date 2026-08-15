/**
 * classifier.ts — Task Classifier (P11-05 Adaptive Orchestration).
 *
 * Classifica uma task em Tiny/Small/Medium/Large com base em sinais
 * objetivos (arquivos afetados, dependências, risco, schema, API, security,
 * histórico, graph complexity). Determinístico: mesma task → mesma classe.
 *
 * Workflow resultante (spec §P11-05):
 *   Tiny:   implement → validate
 *   Small:  graph/context → implement → test
 *   Medium: scout → architect → implement → test → review
 *   Large:  graph scout + domain scout + test scout + history scout →
 *           architect → implement → test → review → validator
 */

export type TaskClass = "tiny" | "small" | "medium" | "large";

export interface ClassificationSignals {
  /** Arquivos afetados (writeScope + dependências conhecidas). */
  affectedFiles: string[];
  /** Quantidade de módulos/dependências impactados. */
  dependencyCount: number;
  /** Risco declarado da task. */
  risk: "low" | "medium" | "high";
  /** Task mexe em schema/migration? */
  touchesSchema: boolean;
  /** Task mexe em API pública/contrato? */
  touchesApi: boolean;
  /** Task mexe em segurança/auth/RLS? */
  touchesSecurity: boolean;
  /** Complexidade do grafo (nós alcançáveis). */
  graphComplexity: number;
  /** Estimativa de mudança em linhas (0 se desconhecida). */
  estimatedLinesChanged?: number;
  /** Mudou comportamento histórico (bugfix/regressão)? */
  touchesHistory: boolean;
}

export interface ClassificationResult {
  taskId: string;
  taskClass: TaskClass;
  reasons: string[];
}

const SIGNALS_SCORES: Record<
  keyof Omit<ClassificationSignals, "affectedFiles" | "estimatedLinesChanged">,
  number
> = {
  dependencyCount: 2,
  risk: 3,
  touchesSchema: 5,
  touchesApi: 4,
  touchesSecurity: 5,
  graphComplexity: 3,
  touchesHistory: 2,
};

/** Pontua sinais binários/numéricos; quanto maior, mais complexa a task. */
export function scoreSignals(signals: ClassificationSignals): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (signals.affectedFiles.length === 0) {
    score += 1;
  } else if (signals.affectedFiles.length === 1) {
    score += 2;
  } else {
    score += 3;
    reasons.push(`${signals.affectedFiles.length} arquivos afetados`);
  }
  if (signals.dependencyCount >= 5) {
    score += SIGNALS_SCORES.dependencyCount;
    reasons.push(`${signals.dependencyCount} dependências`);
  }
  if (signals.risk === "high") {
    score += SIGNALS_SCORES.risk;
    reasons.push("risco alto");
  }
  if (signals.touchesSchema) {
    score += SIGNALS_SCORES.touchesSchema;
    reasons.push("mexe em schema");
  }
  if (signals.touchesApi) {
    score += SIGNALS_SCORES.touchesApi;
    reasons.push("mexe em API");
  }
  if (signals.touchesSecurity) {
    score += SIGNALS_SCORES.touchesSecurity;
    reasons.push("mexe em security/RLS");
  }
  if (signals.graphComplexity >= 20) {
    score += SIGNALS_SCORES.graphComplexity;
    reasons.push(`graph complexo (${signals.graphComplexity} nós)`);
  }
  if (signals.touchesHistory) {
    score += SIGNALS_SCORES.touchesHistory;
    reasons.push("mexe em histórico/regressão");
  }
  if ((signals.estimatedLinesChanged ?? 0) >= 500) {
    score += 2;
    reasons.push("mudança grande");
  }
  return { score, reasons };
}

/** Converte a pontuação em classe (thresholds configuráveis). */
export function scoreToClass(score: number): TaskClass {
  if (score <= 2) return "tiny";
  if (score <= 5) return "small";
  if (score <= 8) return "medium";
  return "large";
}

/** Classifica uma task (determinística). Fail-open: sem sinais → tiny. */
export function classifyTask(taskId: string, signals: ClassificationSignals): ClassificationResult {
  const { score, reasons } = scoreSignals(signals);
  return { taskId, taskClass: scoreToClass(score), reasons };
}
