/**
 * engine.ts — Graph Engine (SDD v5.0, seções 5-6).
 *
 * API pública do Graph Intelligence: status, build, update, query,
 * impact, context, neo4jReadiness. A implementação de referência fala
 * com o CRG CLI (code-review-graph) via spawnSync e é FAIL-OPEN: se o
 * binário não existe ou falha, degrada (status unavailable / resultado
 * vazio) em vez de quebrar.
 */

import { spawnSync } from "node:child_process";
import {
  emptyGraphResult,
  parseGraphEdges,
  parseGraphNodes,
  type GraphQueryResult,
} from "@/ai/core/graph-types";
import { buildContextPacket, type ContextPacket } from "@/ai/core/context-packet";

export interface GraphStatus {
  available: boolean;
  version?: string;
  graphVersion?: string;
  nodes?: number;
  edges?: number;
  lastBuildAt?: string;
  error?: string;
}

export interface Neo4jReadiness {
  score: number; // 0..1
  band: "local/postgres" | "observe" | "prepare-poc" | "recommend-poc" | "high-priority";
  metrics: {
    nodes: number;
    edges: number;
    multiHopPct: number;
    queryP95Ms: number | null;
    scannedNodes: number;
    concurrency: number;
  };
  rationale: string;
}

const CRG = "code-review-graph";

function runCrg(args: string[]): { ok: boolean; stdout: string; stderr: string; error?: string } {
  try {
    const res = spawnSync(CRG, args, { encoding: "utf8", timeout: 30_000 });
    if (res.error) return { ok: false, stdout: "", stderr: "", error: res.error.message };
    return { ok: res.status === 0, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
  } catch (err) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Classifica o score de readiness em banda (SDD seção 25). */
export function readinessBand(score: number): Neo4jReadiness["band"] {
  if (score < 0.4) return "local/postgres";
  if (score < 0.6) return "observe";
  if (score < 0.75) return "prepare-poc";
  if (score < 0.9) return "recommend-poc";
  return "high-priority";
}

/** Métrica composta de readiness (0..1). Fail-open: sem dados → 0. */
export function computeReadinessScore(metrics: Neo4jReadiness["metrics"]): number {
  const { nodes, edges, multiHopPct } = metrics;
  if (nodes === 0) return 0;
  const density = Math.min(1, edges / Math.max(1, nodes * 2));
  const multiHop = Math.min(1, multiHopPct / 100);
  return Math.round((density * 0.5 + multiHop * 0.5) * 100) / 100;
}

/** graph.status() — estado do grafo (fail-open: unavailable sem CRG). */
export function graphStatus(): GraphStatus {
  const res = runCrg(["status", "--json"]);
  if (!res.ok || !res.stdout.trim()) {
    return {
      available: false,
      error: (res.error ?? res.stderr.trim()) || "code-review-graph indisponível",
    };
  }
  try {
    const parsed = JSON.parse(res.stdout) as Record<string, unknown>;
    return {
      available: true,
      version: typeof parsed.version === "string" ? parsed.version : undefined,
      graphVersion: typeof parsed.graphVersion === "string" ? parsed.graphVersion : undefined,
      nodes: typeof parsed.nodes === "number" ? parsed.nodes : undefined,
      edges: typeof parsed.edges === "number" ? parsed.edges : undefined,
      lastBuildAt: typeof parsed.lastBuildAt === "string" ? parsed.lastBuildAt : undefined,
    };
  } catch {
    return { available: true, error: "status retornou JSON inválido" };
  }
}

/** graph.build() / graph.update() — delega ao CRG (fail-open). */
export function graphBuild(update = false): { ok: boolean; error?: string } {
  const res = runCrg(update ? ["update"] : ["build"]);
  return res.ok ? { ok: true } : { ok: false, error: res.error ?? res.stderr.trim() };
}

/** graph.query() — consulta nós/arestas (fail-open → resultado vazio). */
export function graphQuery(selector?: string): GraphQueryResult {
  const args = ["architecture", "--json"];
  if (selector) args.push(selector);
  const res = runCrg(args);
  if (!res.ok || !res.stdout.trim()) return emptyGraphResult("unknown");

  try {
    const parsed = JSON.parse(res.stdout) as {
      nodes?: unknown;
      edges?: unknown;
      graphVersion?: string;
    };
    const nodes = parseGraphNodes(parsed.nodes);
    const edges = parseGraphEdges(parsed.edges);
    return {
      nodes,
      edges,
      scannedNodes: nodes.length,
      queriedAt: new Date().toISOString(),
      graphVersion: parsed.graphVersion,
    };
  } catch {
    return emptyGraphResult("unknown");
  }
}

/** graph.impact() — nós alcançáveis a partir de um arquivo/símbolo. */
export function graphImpact(target: string): GraphQueryResult {
  const res = runCrg(["impact", "--json", target]);
  if (!res.ok || !res.stdout.trim()) return emptyGraphResult("unknown");
  try {
    const parsed = JSON.parse(res.stdout) as {
      nodes?: unknown;
      edges?: unknown;
      reachable?: unknown;
    };
    const nodes = parseGraphNodes(parsed.nodes);
    const edges = parseGraphEdges(parsed.edges);
    return {
      nodes,
      edges,
      reachable: Array.isArray(parsed.reachable) ? parsed.reachable.map(String) : undefined,
      scannedNodes: nodes.length,
      queriedAt: new Date().toISOString(),
    };
  } catch {
    return emptyGraphResult("unknown");
  }
}

/** graph.context() — Context Packet derivado do impacto (SDD seção 7). */
export function graphContext(target: string, opts?: { commit?: string }): ContextPacket {
  const result = graphImpact(target);
  return buildContextPacket(result, { commit: opts?.commit });
}

/** graph.neo4jReadiness() — score 0..1; fail-open: sem grafo → 0 (local/postgres). */
export function graphNeo4jReadiness(): Neo4jReadiness {
  const status = graphStatus();
  if (!status.available) {
    return {
      score: 0,
      band: "local/postgres",
      metrics: {
        nodes: 0,
        edges: 0,
        multiHopPct: 0,
        queryP95Ms: null,
        scannedNodes: 0,
        concurrency: 1,
      },
      rationale: "Grafo indisponível (CRG ausente) — sem evidência para migração (P4).",
    };
  }
  const result = graphQuery();
  const metrics: Neo4jReadiness["metrics"] = {
    nodes: result.nodes.length,
    edges: result.edges.length,
    multiHopPct: 0,
    queryP95Ms: null,
    scannedNodes: result.scannedNodes ?? result.nodes.length,
    concurrency: 1,
  };
  const score = computeReadinessScore(metrics);
  return {
    score,
    band: readinessBand(score),
    metrics,
    rationale: `${metrics.nodes} nós / ${metrics.edges} arestas — grafos pequenos vivem bem em Postgres/Supabase (P4).`,
  };
}
