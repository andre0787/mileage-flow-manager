/**
 * P12.6-11 — Graph-Assisted Diagnosis Experiment
 *
 * Testar a hipótese:
 *   Graph pode ser pouco útil para execução, mas muito útil para diagnóstico.
 *
 * Strategy A: Evidence + LLM
 * Strategy B: Evidence + LLM + Graph Context
 *
 * Manter constantes: model, temperature, task, mutation, environment, evidence.
 * Alterar apenas Graph Context.
 */

import type { GraphBenefit, GraphDiagnosisResult, CostMetrics } from "./types";

// ─── Experiment Setup ──────────────────────────────────────────

export interface GraphExperimentConfig {
  mutationId: string;
  model: string;
  temperature: number;
  evidence: unknown;
  strategy: "evidence_llm" | "evidence_llm_graph";
  graphContext?: GraphContextData;
}

export interface GraphContextData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  query?: string;
}

export interface GraphNode {
  id: string;
  type: "file" | "function" | "component" | "api" | "type" | "data" | "config";
  label: string;
  filePath?: string;
  dependencies?: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "imports" | "calls" | "extends" | "uses" | "defines" | "mutates" | "reads";
}

// ─── Experiment Runner ─────────────────────────────────────────

export interface GraphExperimentResult {
  strategyA: GraphDiagnosisResult;
  strategyB: GraphDiagnosisResult;
  comparison: GraphComparison;
}

export interface GraphComparison {
  rootCauseAccuracyDelta: number;
  timeDelta: number;
  tokenDelta: number;
  costDelta: number;
  filesChangedDelta: number;
  fixSuccessDelta: boolean;
  regressionDelta: boolean;
  confidenceDelta: number;
  recommendation: GraphBenefit;
}

/**
 * Compare results from Strategy A (no graph) vs Strategy B (with graph).
 *
 * Classification:
 *   graph_beneficial  — graph improves quality significantly
 *   graph_neutral     — no meaningful difference
 *   graph_harmful     — graph degrades quality
 *   graph_unnecessary — cost increase without quality gain
 */
export function compareGraphStrategies(
  strategyA: GraphDiagnosisResult,
  strategyB: GraphDiagnosisResult,
  qualityThreshold: number = 0.1, // 10% improvement needed
  costThreshold: number = 1.5, // 50% more tokens is "significant"
): GraphComparison {
  const rootCauseAccuracyDelta =
    strategyB.rootCauseAccuracy - strategyA.rootCauseAccuracy;
  const timeDelta = strategyA.timeToDiagnosis - strategyB.timeToDiagnosis;
  const tokenDelta = strategyB.tokens - strategyA.tokens;
  const costDelta = strategyB.cost - strategyA.cost;
  const filesChangedDelta =
    strategyB.filesChanged.length - strategyA.filesChanged.length;
  const fixSuccessDelta = strategyB.fixSuccess && !strategyA.fixSuccess;
  const regressionDelta = strategyB.regression && !strategyA.regression;
  const confidenceDelta = strategyB.confidence - strategyA.confidence;

  // Decision logic
  let recommendation: GraphBenefit;

  const qualityImproved =
    rootCauseAccuracyDelta > qualityThreshold ||
    (strategyB.fixSuccess && !strategyA.fixSuccess) ||
    confidenceDelta > qualityThreshold;

  const costIncreased =
    strategyB.tokens > strategyA.tokens * costThreshold ||
    strategyB.cost > strategyA.cost * costThreshold;

  if (qualityImproved && !costIncreased) {
    recommendation = "graph_beneficial";
  } else if (costIncreased && !qualityImproved) {
    recommendation = "graph_unnecessary";
  } else if (qualityImproved && costIncreased) {
    // Quality improved but at higher cost — neutral if marginal
    recommendation =
      rootCauseAccuracyDelta > qualityThreshold * 2
        ? "graph_beneficial"
        : "graph_neutral";
  } else if (regressionDelta) {
    recommendation = "graph_harmful";
  } else {
    recommendation = "graph_neutral";
  }

  return {
    rootCauseAccuracyDelta,
    timeDelta,
    tokenDelta,
    costDelta,
    filesChangedDelta,
    fixSuccessDelta,
    regressionDelta,
    confidenceDelta,
    recommendation,
  };
}

// ─── Graph Builder (conceptual) ────────────────────────────────

/**
 * Build a conceptual graph from repository exploration.
 * NOT a full Neo4j dependency — just in-memory structure.
 */
export function buildConceptualGraph(
  files: Array<{ path: string; imports?: string[]; exports?: string[] }>,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const file of files) {
    const nodeId = file.path;
    nodes.push({
      id: nodeId,
      type: file.path.endsWith(".tsx")
        ? "component"
        : file.path.endsWith(".ts")
          ? "function"
          : "file",
      label: file.path.split("/").pop() || file.path,
      filePath: file.path,
    });

    if (file.imports) {
      for (const imp of file.imports) {
        edges.push({ from: nodeId, to: imp, type: "imports" });
      }
    }

    if (file.exports) {
      for (const exp of file.exports) {
        edges.push({ from: nodeId, to: exp, type: "defines" });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Find relevant subgraph for a given mutation target.
 */
export function findRelevantSubgraph(
  graph: { nodes: GraphNode[]; edges: GraphEdge[] },
  targetFile: string,
  depth: number = 2,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const relevantNodes = new Set<string>();
  const queue: Array<{ id: string; currentDepth: number }> = [];

  // Start from target
  const targetNode = graph.nodes.find((n) => n.filePath === targetFile);
  if (targetNode) {
    queue.push({ id: targetNode.id, currentDepth: 0 });
    relevantNodes.add(targetNode.id);
  }

  // BFS to depth
  while (queue.length > 0) {
    const { id, currentDepth } = queue.shift()!;
    if (currentDepth >= depth) continue;

    // Find connected nodes
    for (const edge of graph.edges) {
      const neighbor =
        edge.from === id ? edge.to : edge.to === id ? edge.from : null;
      if (neighbor && !relevantNodes.has(neighbor)) {
        relevantNodes.add(neighbor);
        queue.push({ id: neighbor, currentDepth: currentDepth + 1 });
      }
    }
  }

  return {
    nodes: graph.nodes.filter((n) => relevantNodes.has(n.id)),
    edges: graph.edges.filter(
      (e) => relevantNodes.has(e.from) && relevantNodes.has(e.to),
    ),
  };
}
