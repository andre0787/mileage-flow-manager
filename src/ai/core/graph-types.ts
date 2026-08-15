/**
 * graph-types.ts — Tipos e parsers do Graph Engine (SDD v5.0, P5-01).
 *
 * O core é agnóstico de agente: estes tipos descrevem o grafo lógico do
 * projeto (Code/Domain/Workflow/Knowledge) sem depender de nenhum SDK.
 *
 * `parseGraphNodes`/`parseGraphEdges` consomem a saída real do CRG CLI
 * (code-review-graph) de forma fail-open: entrada inválida/ausente → [].
 */

/** Nó do grafo (arquivo, símbolo, entidade de domínio, task, gate...). */
export interface GraphNode {
  id: string;
  type: string; // "file" | "symbol" | "module" | "component" | "hook" | "test" | "domain" | ...
  label: string;
  /** Metadados livres (ex.: path absoluto, kind, owner do domínio). */
  meta?: Record<string, unknown>;
}

/** Aresta direcionada entre nós. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  /** "imports" | "depends-on" | "implements" | "references" | "contains" | ... */
  type: string;
  meta?: Record<string, unknown>;
}

/** Resultado de uma query ao grafo. */
export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Nós alcançados (BFS/impacto) quando a query é de alcance. */
  reachable?: string[];
  /** Quantos nós/arestas foram varridos para responder (métrica de readiness). */
  scannedNodes?: number;
  queriedAt: string; // ISO-8601
  graphVersion?: string;
}

/** Normaliza entradas vindas do CRG (strings ou objetos) em GraphNode. */
export function parseGraphNodes(input: unknown): GraphNode[] {
  if (!Array.isArray(input)) return [];
  const nodes: GraphNode[] = [];
  for (const raw of input) {
    if (typeof raw === "string" && raw.trim()) {
      nodes.push({ id: raw, type: "file", label: raw });
    } else if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : typeof o.name === "string" ? o.name : "";
      const type = typeof o.type === "string" ? o.type : "symbol";
      const label = typeof o.label === "string" ? o.label : id;
      if (id) nodes.push({ id, type, label, meta: o.meta as Record<string, unknown> | undefined });
    }
  }
  return nodes;
}

/** Normaliza entradas vindas do CRG em GraphEdge. */
export function parseGraphEdges(input: unknown): GraphEdge[] {
  if (!Array.isArray(input)) return [];
  const edges: GraphEdge[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const source =
      typeof o.source === "string" ? o.source : typeof o.from === "string" ? o.from : "";
    const target = typeof o.target === "string" ? o.target : typeof o.to === "string" ? o.to : "";
    if (!source || !target) continue;
    const type = typeof o.type === "string" ? o.type : "depends-on";
    const id = typeof o.id === "string" ? o.id : `${source}->${target}:${type}`;
    edges.push({ id, source, target, type, meta: o.meta as Record<string, unknown> | undefined });
  }
  return edges;
}

/**
 * Constrói um GraphQueryResult vazio mas válido — usado como fallback quando
 * o CRG não está disponível (fail-open: o caller nunca vê crash).
 */
export function emptyGraphResult(graphVersion?: string): GraphQueryResult {
  return {
    nodes: [],
    edges: [],
    scannedNodes: 0,
    queriedAt: new Date().toISOString(),
    graphVersion,
  };
}
