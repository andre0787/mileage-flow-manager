/**
 * implementer.ts — Implementer (Agent Execution Spec §19).
 *
 * Recebe: task + ContextPacket + architecture plan + write scope.
 * Não redescobre o projeto — deriva um plano de implementação concreto
 * dos insumos já coletados (scouts/architect). Retorna SubagentResult
 * (fail-open, nunca lança).
 */

import { emptySubagentResult, type SubagentResult } from "./subagent-result";
import type { ContextPacket } from "@/ai/core/context-packet";
import type { ExecutionPlan, ExecutionStep } from "@/ai/core/execution-plan";

export interface ImplementInput {
  taskId: string;
  intent: string;
  /** Arquivos afetados (ex.: do ContextPacket ou do writeScope do architect). */
  files: string[];
  /** Escopo de escrita permitido — nenhuma edição fora dele. */
  writeScope: string[];
  contextPacket?: ContextPacket;
  plan?: ExecutionPlan;
  /** Validação esperada após implementar (ex.: typecheck, testes). */
  validation?: string[];
}

/** Próximo passo (ex.: testes) após o implementer. */
const NEXT_AFTER_IMPLEMENT = "executar validação e testes";

/**
 * Constrói o plano de implementação a partir dos insumos (fail-open).
 * Heurísticas determinísticas:
 *  - arquivos alvo = files ∩ writeScope (fora do escopo vira risk §8);
 *  - se o plano tem step "tester", a validação esperada é reforçada.
 */
export function implementFromPlan(input: ImplementInput): SubagentResult {
  const result = emptySubagentResult();
  const scopeSet = new Set(input.writeScope);

  const inScope = input.files.filter((f) => scopeSet.has(f));
  const outOfScope = input.files.filter((f) => !scopeSet.has(f));

  if (inScope.length === 0 && input.files.length > 0) {
    result.status = "partial";
    result.risks.push("nenhum arquivo alvo dentro do writeScope — verificar isolamento (§8)");
  } else if (outOfScope.length > 0) {
    result.status = "partial";
    result.risks.push(
      `arquivo(s) fora do writeScope: ${outOfScope.slice(0, 5).join(", ")} — não tocar (§8)`,
    );
  } else {
    result.status = "success";
  }

  const hasTester =
    input.plan?.steps.some((s: ExecutionStep) => s.role === "tester" && !s.skipped) ?? false;

  result.summary = `Implementar "${input.intent}" em ${inScope.length} arquivo(s)`;
  result.files = inScope;
  result.findings = [
    `alvo(s): ${inScope.length > 0 ? inScope.join(", ") : "(nenhum — revisar task)"}`,
    ...(input.contextPacket
      ? [
          `contexto: packet ${input.contextPacket.packet_id.slice(0, 8)} — ${input.contextPacket.affectedFiles.length} arquivo(s) afetado(s)`,
        ]
      : []),
  ];
  result.recommendations = input.validation?.length
    ? [...input.validation]
    : ["npm run typecheck", "npm test"];
  if (hasTester) {
    result.recommendations.push("aguardar step tester do plano antes de revisar");
  }
  result.nextAction = NEXT_AFTER_IMPLEMENT;
  result.confidence = inScope.length > 0 ? 0.8 : 0.3;
  return result;
}
