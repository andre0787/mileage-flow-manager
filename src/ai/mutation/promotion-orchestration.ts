/**
 * P12.6-21 — Promotion Agent Orchestration Experiment
 *
 * Não assumir que todos os agentes são necessários.
 * Comparar Strategy A (Single), B (Scout→Extraction→Validation),
 * C (Scout→Extraction→Validation→Dedup→Classification).
 * Objetivo: menor workflow que produz qualidade suficiente.
 *
 * P12.6-22 — Promotion Graph Experiment
 *
 * Promotion intelligence without Graph vs with Graph.
 * Medir dedup accuracy, relationship extraction, recommendation quality,
 * validation accuracy, query complexity, tokens, latency, cost.
 * Não migrar para Neo4j ainda.
 */

import type { Promotion, ConfidenceLevel } from "./promotion/types";
import type { CostMetrics } from "./types";

// ─── Orchestration Strategies ──────────────────────────────────

export type OrchestrationStrategy = "single" | "pipeline" | "full_pipeline";

export interface OrchestrationConfig {
  strategy: OrchestrationStrategy;
  model: string;
  temperature: number;
}

export interface OrchestrationResult {
  strategy: OrchestrationStrategy;
  promotionsProcessed: number;
  accuracy: number;
  coverage: number;
  latency: number;
  cost: number;
  tokens: number;
  duplicateRate: number;
  falsePositive: number;
  falseNegative: number;
  validationQuality: number;
  agentsUsed: string[];
}

// ─── Pipeline Stages ───────────────────────────────────────────

export interface PipelineStage {
  name: string;
  agent: string;
  input: unknown;
  output: unknown;
  duration: number;
  tokens: number;
}

// ─── Graph Experiment ──────────────────────────────────────────

export interface PromotionGraphExperiment {
  strategy: "without_graph" | "with_graph";
  promotions: Promotion[];
  results: {
    deduplicationAccuracy: number;
    relationshipExtraction: number;
    recommendationQuality: number;
    validationAccuracy: number;
    queryComplexity: number;
    tokens: number;
    latency: number;
    cost: number;
  };
}

export interface GraphRecommendation {
  promotionId: string;
  relatedPromotions: string[];
  transferRoutes: TransferRoute[];
  confidence: number;
}

export interface TransferRoute {
  from: string;
  to: string;
  bonusPercentage: number;
  source: string;
  validity: string;
}

// ─── Orchestration Runner ──────────────────────────────────────

export class PromotionOrchestrator {
  private results: OrchestrationResult[] = [];
  private graphExperiments: PromotionGraphExperiment[] = [];

  /**
   * Execute promotion processing with a given strategy.
   */
  async executeStrategy(
    config: OrchestrationConfig,
    promotions: Promotion[],
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();

    let agentsUsed: string[] = [];
    let processed = 0;

    switch (config.strategy) {
      case "single":
        agentsUsed = ["promotion-single-agent"];
        processed = promotions.length;
        break;
      case "pipeline":
        agentsUsed = ["promotion-scout", "promotion-extractor", "promotion-validator"];
        processed = promotions.length;
        break;
      case "full_pipeline":
        agentsUsed = [
          "promotion-scout",
          "promotion-extractor",
          "promotion-validator",
          "promotion-deduplicator",
          "promotion-classifier",
        ];
        processed = promotions.length;
        break;
    }

    const latency = Date.now() - startTime;

    // Placeholder metrics — in production these would be
    // measured from actual agent execution
    const result: OrchestrationResult = {
      strategy: config.strategy,
      promotionsProcessed: processed,
      accuracy: 0,
      coverage: 0,
      latency,
      cost: 0,
      tokens: 0,
      duplicateRate: 0,
      falsePositive: 0,
      falseNegative: 0,
      validationQuality: 0,
      agentsUsed,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Compare strategies.
   */
  compareStrategies(): {
    single?: OrchestrationResult;
    pipeline?: OrchestrationResult;
    fullPipeline?: OrchestrationResult;
    recommended: OrchestrationStrategy | null;
    analysis: string;
  } {
    const single = this.results.find((r) => r.strategy === "single");
    const pipeline = this.results.find((r) => r.strategy === "pipeline");
    const fullPipeline = this.results.find((r) => r.strategy === "full_pipeline");

    let recommended: OrchestrationStrategy | null = null;

    // Find strategy with best quality-to-cost ratio
    const candidates = [
      { strategy: "single" as const, result: single },
      { strategy: "pipeline" as const, result: pipeline },
      { strategy: "full_pipeline" as const, result: fullPipeline },
    ].filter((c) => c.result) as Array<{
      strategy: OrchestrationStrategy;
      result: OrchestrationResult;
    }>;

    if (candidates.length > 0) {
      const scored = candidates.map((c) => ({
        ...c,
        score:
          c.result.accuracy * 0.3 +
          c.result.validationQuality * 0.3 +
          (1 - c.result.duplicateRate) * 0.2 +
          (1 - c.result.falsePositive) * 0.2,
      }));

      scored.sort((a, b) => b.score - a.score);
      recommended = scored[0].strategy;
    }

    const analysis = recommended
      ? `Strategy '${recommended}' provides the best quality-to-cost ratio.`
      : "No strategy results available.";

    return { single, pipeline, fullPipeline, recommended, analysis };
  }

  /**
   * Run graph experiment.
   */
  runGraphExperiment(
    strategy: "without_graph" | "with_graph",
    promotions: Promotion[],
  ): PromotionGraphExperiment {
    // Placeholder — real implementation would run actual graph analysis
    const experiment: PromotionGraphExperiment = {
      strategy,
      promotions,
      results: {
        deduplicationAccuracy: 0,
        relationshipExtraction: 0,
        recommendationQuality: 0,
        validationAccuracy: 0,
        queryComplexity: 0,
        tokens: 0,
        latency: 0,
        cost: 0,
      },
    };

    this.graphExperiments.push(experiment);
    return experiment;
  }

  /**
   * Compare graph experiments.
   */
  compareGraphExperiments(): {
    withoutGraph?: PromotionGraphExperiment;
    withGraph?: PromotionGraphExperiment;
    recommendation: "graph_beneficial" | "graph_neutral" | "graph_harmful" | "graph_unnecessary";
    analysis: string;
  } {
    const withoutGraph = this.graphExperiments.find((e) => e.strategy === "without_graph");
    const withGraph = this.graphExperiments.find((e) => e.strategy === "with_graph");

    let recommendation:
      "graph_beneficial" | "graph_neutral" | "graph_harmful" | "graph_unnecessary" =
      "graph_unnecessary";
    let analysis = "No graph experiment results.";

    if (withoutGraph && withGraph) {
      const qualityImprovement =
        withGraph.results.deduplicationAccuracy - withoutGraph.results.deduplicationAccuracy;

      const costIncrease = withGraph.results.cost > withoutGraph.results.cost * 1.5;

      if (qualityImprovement > 0.1 && !costIncrease) {
        recommendation = "graph_beneficial";
        analysis = "Graph improves quality significantly without major cost increase.";
      } else if (costIncrease && qualityImprovement <= 0.05) {
        recommendation = "graph_unnecessary";
        analysis = "Graph increases cost without meaningful quality gain.";
      } else {
        recommendation = "graph_neutral";
        analysis = "Graph shows marginal improvement.";
      }
    }

    return { withoutGraph, withGraph, recommendation, analysis };
  }

  getAllResults(): OrchestrationResult[] {
    return [...this.results];
  }
}
