/**
 * context-packet.ts — Context Packet (SDD v5.0, seção 7).
 *
 * O Graph Engine produz um pacote mínimo de contexto para uma task:
 * arquivos afetados, símbolos, dependências/dependentes, testes,
 * entidades de domínio, riscos e restrições — com metadados de
 * governança (packet_id, graph_version, commit, token_estimate,
 * pruned_items, hash). Determinístico a partir de um GraphQueryResult.
 */

import { createHash, randomUUID } from "node:crypto";
import type { GraphQueryResult } from "./graph-types";

export interface ContextPacket {
  packet_id: string;
  graph_version?: string;
  commit?: string;
  created_at: string; // ISO-8601
  token_estimate: number;
  pruned_items: number;
  hash: string;
  task?: Record<string, unknown>;
  intent?: Record<string, unknown>;
  affectedFiles: string[];
  symbols: string[];
  dependencies: string[];
  dependents: string[];
  tests: string[];
  domainEntities: string[];
  relatedTasks: string[];
  decisions: string[];
  risks: string[];
  constraints: string[];
  /** P11-04: contextos especializados do Context Assembler. */
  graphContext?: string[];
  domainContext?: string[];
  historyContext?: string[];
  testContext?: string[];
  /** P11-04: confiança 0..1 do contexto (fail-open → 0). */
  confidence?: number;
  /** P11-04: freshness do grafo (fresh/stale/unknown). */
  freshness?: "fresh" | "stale" | "unknown";
  /** P11-04: quantidade de fontes que alimentaram o packet. */
  source_count?: number;
}

/** Estimativa grosseira de tokens: ~4 chars/token no conteúdo textual. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Hash estável (sha256, prefixo 12) dos itens — usado para diff de freshness. */
export function packetHash(items: string[]): string {
  return createHash("sha256").update(items.join("\u0000")).digest("hex").slice(0, 12);
}

/**
 * Constrói um ContextPacket a partir de um GraphQueryResult.
 * Fail-open: resultado vazio gera packet vazio (nunca lança).
 */
export function buildContextPacket(
  result: GraphQueryResult,
  opts?: {
    task?: Record<string, unknown>;
    intent?: Record<string, unknown>;
    commit?: string;
    prunedItems?: number;
    /** P11-04: contextos especializados (graph/domain/history/test). */
    graphContext?: string[];
    domainContext?: string[];
    historyContext?: string[];
    testContext?: string[];
    /** P11-04: confiança 0..1 do contexto. */
    confidence?: number;
    /** P11-04: freshness do grafo. */
    freshness?: "fresh" | "stale" | "unknown";
  },
): ContextPacket {
  const affectedFiles = result.nodes.filter((n) => n.type === "file").map((n) => n.label);
  const symbols = result.nodes
    .filter((n) => n.type !== "file" && n.type !== "test" && n.type !== "domain")
    .map((n) => n.label);
  const dependencies = result.edges.map((e) => e.target);
  const dependents = result.edges.map((e) => e.source);
  const tests = result.nodes.filter((n) => n.type === "test").map((n) => n.label);
  const domainEntities = result.nodes.filter((n) => n.type === "domain").map((n) => n.label);
  const unique = (xs: string[]) => [...new Set(xs)];

  const items = unique([...affectedFiles, ...symbols, ...tests, ...domainEntities]);
  const text = items.join("\n");
  const prunedItems = opts?.prunedItems ?? 0;
  const specialized = [
    ...(opts?.graphContext ?? []),
    ...(opts?.domainContext ?? []),
    ...(opts?.historyContext ?? []),
    ...(opts?.testContext ?? []),
  ];
  const sourceCount = new Set([
    ...(items.length > 0 ? ["graph"] : []),
    ...(specialized.length > 0 ? ["assembler"] : []),
  ]).size;

  return {
    packet_id: randomUUID(),
    graph_version: result.graphVersion,
    commit: opts?.commit,
    created_at: new Date().toISOString(),
    token_estimate: estimateTokens(text),
    pruned_items: prunedItems,
    hash: packetHash(items),
    task: opts?.task,
    intent: opts?.intent,
    affectedFiles: unique(affectedFiles),
    symbols: unique(symbols),
    dependencies: unique(dependencies),
    dependents: unique(dependents),
    tests: unique(tests),
    domainEntities: unique(domainEntities),
    relatedTasks: [],
    decisions: [],
    risks: [],
    constraints: [],
    graphContext: opts?.graphContext,
    domainContext: opts?.domainContext,
    historyContext: opts?.historyContext,
    testContext: opts?.testContext,
    confidence: opts?.confidence,
    freshness: opts?.freshness,
    source_count: sourceCount,
  };
}
