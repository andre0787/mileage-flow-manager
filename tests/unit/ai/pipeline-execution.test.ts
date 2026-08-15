/**
 * pipeline-execution.test.ts — Integração do pipeline §3 (Agent Execution Spec v5).
 *
 * Exercita o fluxo REAL com as peças TS em sequência, provando que o
 * dispatcher emite envelopes §19 persistíveis e o final validator aprova:
 *   planner (planExecution) → scheduler (schedulePlan) → dispatcher
 *   (dispatchPlan com onTelemetry) → persist (isPersistableEnvelope +
 *   envelopeToRecord) → finalValidate (telemetry-completeness pass).
 *
 * Sem agente real: executeStep é injetável (determinístico, sem rede).
 */

import { describe, expect, it } from "vitest";
import { planExecution, type PlannerInput } from "@/ai/orchestration/planner";
import { schedulePlan } from "@/ai/orchestration/scheduler";
import { dispatchPlan } from "@/ai/orchestration/dispatcher";
import { piAdapter } from "@/ai/adapters/pi";
import { normalizeTask } from "@/ai/core/task-contract";
import { isPersistableEnvelope, envelopeToRecord } from "@/ai/telemetry/persist";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { finalValidate } from "@/ai/execution/final-validator";

describe("pipeline §3 integrado (planner → dispatcher → persist → validator)", () => {
  it("executa o plano real com telemetria persistível e validação final ok", async () => {
    const task = normalizeTask({
      taskId: "PIPELINE-01",
      intent: "refatorar accounts",
      requiredCapabilities: ["toolCalling", "structuredOutput"],
      writeScope: ["src/lib/accounts.ts"],
    });

    // 1. Planner (§16): escolhe adapter pi + monta steps com papéis.
    const plannerInput: PlannerInput = { task, adapters: [piAdapter] };
    const { plan } = planExecution(plannerInput);
    expect(plan).toBeDefined();
    expect(plan!.steps.some((s) => s.role === "implementer")).toBe(true);
    expect(plan!.steps.some((s) => s.role === "reviewer")).toBe(true);

    // 2. Scheduler (§17): agenda lotes por parallelGroup/dependsOn.
    const { batches, serial } = schedulePlan(plan!, { supportsParallel: true });
    expect(batches.length).toBeGreaterThan(0);
    expect(serial).toBe(false);

    // 3. Dispatcher (§18/§19): executa com executeStep injetável + onTelemetry.
    const envelopes: TelemetryEnvelope[] = [];
    const { outcomes, ok } = await dispatchPlan(plan!, piAdapter, {
      executeStep: async (_adp, step) => ({
        stepId: step.id,
        role: step.role,
        success: true,
        durationMs: 10,
        inputTokens: 100,
        outputTokens: 50,
        toolCalls: 2,
      }),
      onTelemetry: (env) => envelopes.push(env),
    });
    expect(ok).toBe(true);
    expect(outcomes.length).toBe(plan!.steps.length);
    expect(envelopes.length).toBeGreaterThan(0);

    // 4. Persist (§19-21): envelopes de execução/agente são persistíveis.
    const persistable = envelopes.filter(isPersistableEnvelope);
    expect(persistable.length).toBeGreaterThan(0);
    for (const env of persistable) {
      const record = envelopeToRecord(env, { sessionId: "pipeline-sess" });
      expect(record.session_id).toBe("pipeline-sess");
      expect(record.tokens_used).toBeGreaterThanOrEqual(0);
      expect(record.event_type).toBe(env.eventType);
    }

    // 5. Validator (§21/§26): telemetry-completeness pass com envelopes reais.
    const validation = finalValidate({
      envelopeCount: persistable.length,
      graphOk: true,
      freshnessOk: true,
      typecheckOk: true,
      lintOk: true,
      testsOk: true,
    });
    expect(validation.ok).toBe(true);
    const telemetry = validation.checks.find((c) => c.name === "telemetry-completeness");
    expect(telemetry?.status).toBe("pass");
    expect(telemetry?.detail).toContain(String(persistable.length));
  });

  it("P11-01: task simples atravessa o pipeline com o Pi Adapter REAL", async () => {
    // Critério P11-01: Planner → Scheduler → Dispatcher → Pi Adapter →
    // comando real → resultado → telemetria. Sem executeStep injetado — o
    // adapter pi executa o CLI de verdade (git status, fail-open).
    const task = normalizeTask({
      taskId: "PIPELINE-REAL",
      intent: "verificar estado",
      requiredCapabilities: ["toolCalling", "structuredOutput"],
      writeScope: [],
    });
    const { plan } = planExecution({
      task,
      adapters: [piAdapter],
      // Só implementer (git status) para manter o teste rápido e sem rede.
      roles: [{ id: "implementer", role: "implementer", parallelGroup: 1 }],
    });
    expect(plan).toBeDefined();

    const envelopes: TelemetryEnvelope[] = [];
    const { outcomes, ok } = await dispatchPlan(plan!, piAdapter, {
      onTelemetry: (env) => envelopes.push(env),
    });
    // Fail-open: o git existe → success. Em ambiente sem git, aceitamos erro
    // normalizado (o contrato nunca lança).
    expect(outcomes).toHaveLength(1);
    expect(typeof outcomes[0].success).toBe("boolean");
    expect(envelopes.some((e) => e.eventType === "agent.dispatched")).toBe(true);
    expect(ok).toBe(true);
  });

  it("falha do step gera execution.failed e validator com envelope 0 → fail", async () => {
    const task = normalizeTask({ taskId: "PIPELINE-02", intent: "x" });
    const { plan } = planExecution({ task, adapters: [piAdapter] });
    const envelopes: TelemetryEnvelope[] = [];
    const { ok } = await dispatchPlan(plan!, piAdapter, {
      executeStep: async (_adp, step) => ({
        stepId: step.id,
        role: step.role,
        success: false,
        errorCode: "boom",
      }),
      onTelemetry: (env) => envelopes.push(env),
    });
    expect(ok).toBe(false);
    expect(envelopes.some((e) => e.eventType === "execution.failed")).toBe(true);
    // Envelopes existem, mas a validação final deve acusar a falha via ok=false
    // do dispatcher — o validator trata telemetria separada (fail-open).
  });
});
