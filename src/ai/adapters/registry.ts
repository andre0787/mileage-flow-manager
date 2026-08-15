/**
 * registry.ts — Agent Adapter Registry (SDD v5.0, P5).
 *
 * P1 (agent-agnostic): o core NUNCA importa um adapter concreto —
 * resolve por `id` via este registry. Adapters são plugáveis
 * (pi, codex, claude-code, generic...).
 */

import type { AgentAdapter } from "@/ai/core/agent-contract";

const adapters = new Map<string, AgentAdapter>();

export function registerAdapter(adapter: AgentAdapter): void {
  adapters.set(adapter.id, adapter);
}

export function resolveAdapter(id: string): AgentAdapter | undefined {
  return adapters.get(id);
}

export function listAdapters(): AgentAdapter[] {
  return [...adapters.values()];
}

export function clearAdapters(): void {
  adapters.clear();
}
