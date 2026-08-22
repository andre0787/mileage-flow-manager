/**
 * adaptive.test.ts — P11-05 Adaptive Orchestration.
 *
 * Cobre: task classification (tiny/small/medium/large), workflow dinâmico
 * por classe, anti-over-orchestration (skip de scouts caros) e
 * explainability (why_run/why_skip/why_parallel/why_serial/why_retry/why_escalate).
 */

import { describe, expect, it } from "vitest";
import {
  classifyTask,
  scoreToClass,
  type ClassificationSignals,
} from "@/ai/orchestration/classifier";
import { buildAdaptivePlan, ROLE_OVERHEAD_TOKENS, shouldUseGraph } from "@/ai/orchestration/adaptive-planner";
import { ExplainabilityLog } from "@/ai/orchestration/explainability";

function baseSignals(partial: Partial<ClassificationSignals> = {}): ClassificationSignals {
  return {
    affectedFiles: ["src/lib/x.ts"],
    dependencyCount: 0,
    risk: "low",
    touchesSchema: false,
    touchesApi: false,
    touchesSecurity: false,
    graphComplexity: 0,
    touchesHistory: false,
    ...partial,
  };
}

describe("task classifier (P11-05)", () => {
  it("tiny: um arquivo, risco baixo, sem schema/api/security", () => {
    const result = classifyTask("T1", baseSignals());
    expect(result.taskClass).toBe("tiny");
  });

  it("small: 2-4 sinais leves", () => {
    const result = classifyTask(
      "T2",
      baseSignals({ affectedFiles: ["a.ts", "b.ts"], risk: "medium" }),
    );
    expect(result.taskClass).toBe("small");
  });

  it("medium: API + dependências", () => {
    const result = classifyTask(
      "T3",
      baseSignals({ touchesApi: true, dependencyCount: 6, risk: "medium" }),
    );
    expect(result.taskClass).toBe("medium");
  });

  it("large: schema + security + graph complexo", () => {
    const result = classifyTask(
      "T4",
      baseSignals({
        touchesSchema: true,
        touchesSecurity: true,
        graphComplexity: 30,
        risk: "high",
      }),
    );
    expect(result.taskClass).toBe("large");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("scoreToClass thresholds", () => {
    expect(scoreToClass(0)).toBe("tiny");
    expect(scoreToClass(2)).toBe("tiny");
    expect(scoreToClass(5)).toBe("small");
    expect(scoreToClass(8)).toBe("medium");
    expect(scoreToClass(20)).toBe("large");
  });
});

describe("adaptive planner (P11-05)", () => {
  it("tiny: implementer + final-validator apenas (anti-over-orchestration)", () => {
    const plan = buildAdaptivePlan("T1", "tiny");
    expect(plan.steps.map((s) => s.role)).toEqual(["implementer", "final-validator"]);
    expect(plan.decisions.every((d) => d.decision === "run")).toBe(true);
  });

  it("small: implementer + tester (sem graph-scout — P13-03)", () => {
    const plan = buildAdaptivePlan("T2", "small");
    expect(plan.steps.map((s) => s.role)).toEqual(["implementer", "tester"]);
    expect(plan.graphEnabled).toBe(false);
    expect(plan.decisions.every((d) => d.decision === "run")).toBe(true);
  });

  it("large: scouts + architect + implementer + test + review + validator", () => {
    const plan = buildAdaptivePlan("T4", "large");
    const roles = plan.steps.map((s) => s.role);
    expect(roles).toContain("graph-scout");
    expect(roles).toContain("domain-scout");
    expect(roles).toContain("history-scout");
    expect(roles).toContain("architect");
    expect(roles).toContain("reviewer");
    expect(roles).toContain("final-validator");
  });

  it("anti-over-orchestration: pula scouts quando overhead excede o orçamento", () => {
    const plan = buildAdaptivePlan("T2", "medium", {
      skipWhen: () => true, // nenhum scout tem valor esperado
      overheadBudgetTokens: 700, // graph-scout (800) estoura já no primeiro
    });
    const skipped = plan.decisions.filter((d) => d.decision === "skip");
    expect(skipped.length).toBeGreaterThan(0);
    expect(skipped.every((d) => d.role.endsWith("-scout"))).toBe(true);
    const run = plan.steps.map((s) => s.role);
    // O workflow continua com os papéis obrigatórios.
    expect(run).toContain("architect");
    expect(run).toContain("implementer");
  });

  it("P13-03: shouldUseGraph retorna false para tiny/small, true para medium/large", () => {
    expect(shouldUseGraph("tiny")).toBe(false);
    expect(shouldUseGraph("small")).toBe(false);
    expect(shouldUseGraph("medium")).toBe(true);
    expect(shouldUseGraph("large")).toBe(true);
  });

  it("overhead por papel definido para todos os papéis do workflow", () => {
    for (const role of [
      "graph-scout",
      "domain-scout",
      "test-scout",
      "history-scout",
      "architect",
      "implementer",
      "tester",
      "reviewer",
      "final-validator",
    ]) {
      expect(ROLE_OVERHEAD_TOKENS[role]).toBeGreaterThan(0);
    }
  });
});

describe("explainability (P11-05)", () => {
  it("registra why_run, why_skip, why_parallel, why_serial", () => {
    const log = new ExplainabilityLog();
    log.whyRun("reviewer", "high-risk task");
    log.whySkip("domain-scout", "overhead alto");
    log.whyParallel(["scout-a", "scout-b"], "writeScopes disjuntos");
    log.whySerial(["a", "b"], "dependência de dados");
    expect(log.size).toBe(4);
    expect(log.byType("why_run")).toHaveLength(1);
    expect(log.byType("why_skip")[0].data?.role).toBe("domain-scout");
    expect(log.byType("why_parallel")[0].data?.roles).toEqual(["scout-a", "scout-b"]);
  });

  it("registra why_retry e why_escalate com metadados", () => {
    const log = new ExplainabilityLog();
    log.whyRetry("implementer", "spawn:busy", 2);
    log.whyEscalate("tester", "qwen-local", "qwen-strong", "validação falhou 3×");
    const retry = log.byType("why_retry")[0];
    expect(retry.data?.errorCode).toBe("spawn:busy");
    expect(retry.data?.attempt).toBe(2);
    const escalate = log.byType("why_escalate")[0];
    expect(escalate.data?.toModel).toBe("qwen-strong");
  });

  it("imutável externamente (append-only)", () => {
    const log = new ExplainabilityLog();
    log.whyRun("architect", "x");
    const snapshot = log.all;
    expect(snapshot).toHaveLength(1);
    // all retorna read-only — não deve crescer por fora.
    expect(log.size).toBe(1);
  });
});
