/**
 * P12.6-12 — Cost / Efficiency Analysis
 *
 * Toda execução deve registrar: tokens, cost, duration, agent_count,
 * tool_calls, browser_actions, retries, context_size.
 *
 * Comparar: single agent vs multi-agent vs graph+multi-agent
 * por complexidade: tiny, small, medium, large, architectural.
 */

import type { CostMetrics } from "./types";

// ─── Complexity Tiers ──────────────────────────────────────────

export type ComplexityTier = "tiny" | "small" | "medium" | "large" | "architectural";

export function classifyComplexity(metrics: {
  filesChanged: number;
  linesChanged: number;
  modulesTouched: number;
  agentCount: number;
}): ComplexityTier {
  const score =
    metrics.filesChanged +
    metrics.linesChanged / 10 +
    metrics.modulesTouched * 2 +
    metrics.agentCount;

  if (score <= 5) return "tiny";
  if (score <= 15) return "small";
  if (score <= 40) return "medium";
  if (score <= 80) return "large";
  return "architectural";
}

// ─── Strategy Comparison ───────────────────────────────────────

export type AgentStrategy = "single" | "multi" | "graph_multi";

export interface StrategyRun {
  strategy: AgentStrategy;
  complexity: ComplexityTier;
  metrics: CostMetrics;
  quality: number; // 0-1 composite quality score
  mutationId: string;
}

export interface StrategyComparison {
  strategy: AgentStrategy;
  runs: number;
  avgTokens: number;
  avgCost: number;
  avgDuration: number;
  avgQuality: number;
  avgToolCalls: number;
  avgRetries: number;
  costPerQualityPoint: number;
  tokenEfficiency: number; // quality / tokens * 1000
}

export function compareStrategies(runs: StrategyRun[]): StrategyComparison[] {
  const grouped = new Map<AgentStrategy, StrategyRun[]>();
  for (const run of runs) {
    const group = grouped.get(run.strategy) || [];
    group.push(run);
    grouped.set(run.strategy, group);
  }

  return Array.from(grouped.entries()).map(([strategy, group]) => {
    const n = group.length;
    const avgTokens = group.reduce((s, r) => s + r.metrics.tokens, 0) / n;
    const avgCost = group.reduce((s, r) => s + r.metrics.cost, 0) / n;
    const avgDuration = group.reduce((s, r) => s + r.metrics.duration, 0) / n;
    const avgQuality = group.reduce((s, r) => s + r.quality, 0) / n;
    const avgToolCalls = group.reduce((s, r) => s + r.metrics.toolCalls, 0) / n;
    const avgRetries = group.reduce((s, r) => s + r.metrics.retries, 0) / n;

    return {
      strategy,
      runs: n,
      avgTokens,
      avgCost,
      avgDuration,
      avgQuality,
      avgToolCalls,
      avgRetries,
      costPerQualityPoint: avgQuality > 0 ? avgCost / avgQuality : Infinity,
      tokenEfficiency: avgTokens > 0 ? (avgQuality / avgTokens) * 1000 : 0,
    };
  });
}

// ─── Cost Budget ───────────────────────────────────────────────

export interface CostBudget {
  maxTokensPerRun: number;
  maxCostPerRun: number;
  maxDurationPerRun: number;
  maxRetries: number;
}

export const DEFAULT_BUDGET: CostBudget = {
  maxTokensPerRun: 100_000,
  maxCostPerRun: 5.0,
  maxDurationPerRun: 600_000, // 10 minutes
  maxRetries: 3,
};

export function isWithinBudget(metrics: CostMetrics, budget: CostBudget): {
  withinBudget: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  if (metrics.tokens > budget.maxTokensPerRun)
    violations.push(`tokens: ${metrics.tokens} > ${budget.maxTokensPerRun}`);
  if (metrics.cost > budget.maxCostPerRun)
    violations.push(`cost: ${metrics.cost} > ${budget.maxCostPerRun}`);
  if (metrics.duration > budget.maxDurationPerRun)
    violations.push(`duration: ${metrics.duration}ms > ${budget.maxDurationPerRun}ms`);
  if (metrics.retries > budget.maxRetries)
    violations.push(`retries: ${metrics.retries} > ${budget.maxRetries}`);

  return { withinBudget: violations.length === 0, violations };
}

// ─── Efficiency Report ─────────────────────────────────────────

export interface EfficiencyReport {
  totalRuns: number;
  totalTokens: number;
  totalCost: number;
  totalDuration: number;
  byStrategy: StrategyComparison[];
  byComplexity: Record<ComplexityTier, StrategyComparison[]>;
  recommendations: string[];
}

export function generateEfficiencyReport(
  runs: StrategyRun[],
  budget: CostBudget = DEFAULT_BUDGET,
): EfficiencyReport {
  const byStrategy = compareStrategies(runs);

  // Group by complexity
  const byComplexity: Record<ComplexityTier, StrategyRun[]> = {
    tiny: [],
    small: [],
    medium: [],
    large: [],
    architectural: [],
  };
  for (const run of runs) {
    byComplexity[run.complexity].push(run);
  }

  const byComplexityComparisons: Record<ComplexityTier, StrategyComparison[]> = {
    tiny: compareStrategies(byComplexity.tiny),
    small: compareStrategies(byComplexity.small),
    medium: compareStrategies(byComplexity.medium),
    large: compareStrategies(byComplexity.large),
    architectural: compareStrategies(byComplexity.architectural),
  };

  // Generate recommendations
  const recommendations: string[] = [];
  for (const comparison of byStrategy) {
    if (comparison.costPerQualityPoint > 1.0) {
      recommendations.push(
        `${comparison.strategy}: custo por ponto de qualidade alto (${comparison.costPerQualityPoint.toFixed(2)}). Considerar simplificação.`,
      );
    }
    if (comparison.avgRetries > 2) {
      recommendations.push(
        `${comparison.strategy}: muitas tentativas (${comparison.avgRetries.toFixed(1)} média). Melhorar robustez.`,
      );
    }
  }

  // Compare single vs multi
  const single = byStrategy.find((s) => s.strategy === "single");
  const multi = byStrategy.find((s) => s.strategy === "multi");
  if (single && multi) {
    if (multi.avgCost > single.avgCost * 2 && multi.avgQuality < single.avgQuality * 1.1) {
      recommendations.push(
        "Multi-agent não justifica o custo adicional vs single-agent para este workload.",
      );
    }
  }

  return {
    totalRuns: runs.length,
    totalTokens: runs.reduce((s, r) => s + r.metrics.tokens, 0),
    totalCost: runs.reduce((s, r) => s + r.metrics.cost, 0),
    totalDuration: runs.reduce((s, r) => s + r.metrics.duration, 0),
    byStrategy,
    byComplexity: byComplexityComparisons,
    recommendations,
  };
}
