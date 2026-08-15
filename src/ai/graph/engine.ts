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
  type GraphEdge,
  type GraphNode,
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
export function readinessBandLegacy(score: number): Neo4jReadiness["band"] {
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

/** Normaliza o formato v2.3.7 do CRG (kind/name/qualified_name → GraphNode). */
function normalizeCrgNode(raw: unknown): GraphNode | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string" ? o.id : typeof o.qualified_name === "string" ? o.qualified_name : "";
  const label = typeof o.name === "string" ? o.name : id;
  if (!id) return undefined;
  const kind = typeof o.kind === "string" ? o.kind : "";
  const type = kind.toLowerCase() === "test" ? "test" : "symbol";
  return {
    id,
    type,
    label,
    meta: {
      ...(kind ? { kind } : {}),
      ...(typeof o.file_path === "string" ? { file_path: o.file_path } : {}),
      ...(typeof o.signature === "string" ? { signature: o.signature } : {}),
      ...(typeof o.impact_score === "number" ? { impact_score: o.impact_score } : {}),
    },
  };
}

/** Normaliza edge no formato v2.3.7 (kind/source/target → GraphEdge). */
function normalizeCrgEdge(raw: unknown): GraphEdge | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const source = typeof o.source === "string" ? o.source : "";
  const target = typeof o.target === "string" ? o.target : "";
  if (!source || !target) return undefined;
  const kind = typeof o.kind === "string" ? o.kind : "depends-on";
  const id = typeof o.id === "string" ? o.id : `${source}->${target}:${kind}`;
  return { id, source, target, type: kind.toLowerCase(), meta: { kind } };
}

/** graph.query() — consulta nós/arestas (fail-open → resultado vazio). */
export function graphQuery(selector?: string): GraphQueryResult {
  // v2.3.7: `impact` sem --files (auto-detect) entrega o grafo de impacto real.
  const args = selector ? ["impact", "--files", selector] : ["impact"];
  const res = runCrg(args);
  if (!res.ok || !res.stdout.trim()) return emptyGraphResult("unknown");

  try {
    const parsed = JSON.parse(res.stdout) as {
      changed_nodes?: unknown;
      impacted_nodes?: unknown;
      edges?: unknown;
      impacted_files?: unknown;
      changed_files?: unknown;
    };
    const changed = Array.isArray(parsed.changed_nodes) ? parsed.changed_nodes : [];
    const impacted = Array.isArray(parsed.impacted_nodes) ? parsed.impacted_nodes : [];
    const nodes = [...changed, ...impacted]
      .map(normalizeCrgNode)
      .filter((n): n is GraphNode => Boolean(n));
    const edges = (Array.isArray(parsed.edges) ? parsed.edges : [])
      .map(normalizeCrgEdge)
      .filter((e): e is GraphEdge => Boolean(e));
    const reachable =
      Array.isArray(parsed.impacted_files) || Array.isArray(parsed.changed_files)
        ? [
            ...new Set<string>([
              ...(parsed.changed_files as string[]),
              ...(parsed.impacted_files as string[]),
            ]),
          ]
        : undefined;
    return {
      nodes,
      edges,
      reachable,
      scannedNodes: nodes.length,
      queriedAt: new Date().toISOString(),
      graphVersion: undefined,
    };
  } catch {
    return emptyGraphResult("unknown");
  }
}

/** graph.impact() — nós alcançáveis a partir de um arquivo/símbolo (v2.3.7: `impact --files`). */
export function graphImpact(target: string): GraphQueryResult {
  const res = runCrg(["impact", "--files", target]);
  if (!res.ok || !res.stdout.trim()) return emptyGraphResult("unknown");
  try {
    const parsed = JSON.parse(res.stdout) as {
      changed_nodes?: unknown;
      impacted_nodes?: unknown;
      edges?: unknown;
      impacted_files?: unknown;
    };
    const changed = Array.isArray(parsed.changed_nodes) ? parsed.changed_nodes : [];
    const impacted = Array.isArray(parsed.impacted_nodes) ? parsed.impacted_nodes : [];
    const nodes = [...changed, ...impacted]
      .map(normalizeCrgNode)
      .filter((n): n is GraphNode => Boolean(n));
    const edges = (Array.isArray(parsed.edges) ? parsed.edges : [])
      .map(normalizeCrgEdge)
      .filter((e): e is GraphEdge => Boolean(e));
    return {
      nodes,
      edges,
      reachable: Array.isArray(parsed.impacted_files)
        ? (parsed.impacted_files as string[])
        : undefined,
      scannedNodes: nodes.length,
      queriedAt: new Date().toISOString(),
    };
  } catch {
    return emptyGraphResult("unknown");
  }
}

/**
 * graph.search() — busca entidades no grafo (v2.3.7: `search --kind <kind> <query>`).
 * Fail-open: CRG ausente/erro → resultado vazio (nunca lança).
 */
export function graphSearch(query: string, kind?: string): GraphQueryResult {
  const args = kind
    ? ["search", "--kind", kind, "--limit", "20", query]
    : ["search", "--limit", "20", query];
  const res = runCrg(args);
  if (!res.ok || !res.stdout.trim()) return emptyGraphResult("unknown");
  try {
    const parsed = JSON.parse(res.stdout) as { results?: unknown };
    const nodes = (Array.isArray(parsed.results) ? parsed.results : [])
      .map(normalizeCrgNode)
      .filter((n): n is GraphNode => Boolean(n));
    return {
      nodes,
      edges: [],
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
    band: readinessBandLegacy(score),
    metrics,
    rationale: `${metrics.nodes} nós / ${metrics.edges} arestas — grafos pequenos vivem bem em Postgres/Supabase (P4).`,
  };
}
