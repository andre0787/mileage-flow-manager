#!/usr/bin/env node
/**
 * exec-run-real.ts — Pipeline §3 REAL via dispatcher TS (Agent Execution Spec v5).
 *
 * Conecta o `onTelemetry` do dispatcher à persistência env-gated:
 *   planner (planExecution) → scheduler (schedulePlan) → dispatcher
 *   (dispatchPlan com onTelemetry) → envelopes §19 → `telemetry:persist`.
 *
 * Uso:
 *   npm run exec:run:real <taskId>            # dry-run (imprime envelopes)
 *   TELEMETRY_PERSIST=1 npm run exec:run:real <taskId>  # grava envelopes.jsonl
 *
 * Sem agente real: usa o adapter pi com executeStep simulado (CLI bridge,
 * fail-open) — determinístico, sem rede. Rodado via tsx (respeita @/ alias).
 */

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { planExecution } from "@/ai/orchestration/planner";
import { schedulePlan } from "@/ai/orchestration/scheduler";
import { dispatchPlan } from "@/ai/orchestration/dispatcher";
import { piAdapter } from "@/ai/adapters/pi";
import { normalizeTask } from "@/ai/core/task-contract";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { isPersistableEnvelope, envelopeToRecord } from "@/ai/telemetry/persist";
import { finalValidate } from "@/ai/execution/final-validator";

const ROOT = resolve(import.meta.dirname, "..");
const ENVELOPES_PATH = resolve(ROOT, "docs/tracking/envelopes.jsonl");

function readExistingEventIds(): Set<string> {
  const ids = new Set<string>();
  try {
    if (!existsSync(ENVELOPES_PATH)) return ids;
    for (const line of readFileSync(ENVELOPES_PATH, "utf8").split("\n").filter(Boolean)) {
      try {
        const e = JSON.parse(line) as { eventId?: string };
        if (e.eventId) ids.add(e.eventId);
      } catch {
        /* linha inválida */
      }
    }
  } catch {
    /* fail-open */
  }
  return ids;
}

async function main() {
  const taskId = process.argv[2] ?? "TASK-UNKNOWN";
  const persist = process.env.TELEMETRY_PERSIST === "1";

  // 1. Planner (§16): capability-driven, adapter pi.
  const task = normalizeTask({
    taskId,
    intent: `executar pipeline §3 para ${taskId}`,
    requiredCapabilities: ["toolCalling", "structuredOutput"],
    writeScope: [],
  });
  const { plan, error } = planExecution({ task, adapters: [piAdapter] });
  if (!plan) {
    console.log(JSON.stringify({ ok: false, error }, null, 2));
    process.exit(1);
  }

  // 2. Scheduler (§17): agendamento por parallelGroup/dependsOn.
  const { batches, serial } = schedulePlan(plan, { supportsParallel: true });

  // 3. Dispatcher (§18/§19): executeStep simulado (CLI bridge) + onTelemetry.
  const envelopes: TelemetryEnvelope[] = [];
  const onTelemetry = (env: TelemetryEnvelope) => envelopes.push(env);
  const { outcomes, ok, state } = await dispatchPlan(plan, piAdapter, {
    executeStep: async (_adp, step) => ({
      stepId: step.id,
      role: step.role,
      success: true,
      durationMs: 10,
      inputTokens: 100,
      outputTokens: 50,
      toolCalls: 2,
    }),
    onTelemetry,
  });

  // 4. Persist (§19-21): envelopes persistíveis → registro; env-gated grava.
  const persistable = envelopes.filter(isPersistableEnvelope);
  let appended = 0;
  let skipped = 0;
  if (persist) {
    const existing = readExistingEventIds();
    const fresh = persistable.filter((e) => !existing.has(e.eventId));
    skipped = persistable.length - fresh.length;
    try {
      if (fresh.length > 0) {
        appendFileSync(
          ENVELOPES_PATH,
          fresh.map((e) => JSON.stringify(e)).join("\n") + "\n",
          "utf8",
        );
      }
      appended = fresh.length;
    } catch (err) {
      console.log(`⚠️  falha ao gravar envelopes.jsonl (${(err as Error).message}) — fail-open`);
    }
  }

  // 5. Validator (§21/§26): telemetry-completeness com envelopes reais.
  const validation = finalValidate({
    envelopeCount: persistable.length,
    graphOk: true,
    freshnessOk: true,
  });
  const persistSample = persistable.slice(0, 3).map((e) =>
    envelopeToRecord(e, { sessionId: process.env.TELEMETRY_SESSION_ID ?? taskId }),
  );

  console.log(
    JSON.stringify(
      {
        ok,
        taskId,
        planId: plan.planId,
        agent: plan.agent,
        model: plan.model,
        batches: batches.length,
        serial,
        steps: plan.steps.length,
        outcomes: outcomes.length,
        envelopes: envelopes.length,
        persistable: persistable.length,
        persisted: persist,
        appended,
        skipped,
        budget: {
          agents: state.agentsDispatched,
          tokens: state.tokensUsed,
          turns: state.turnsUsed,
        },
        validation: {
          ok: validation.ok,
          checks: validation.checks.map((c) => ({ name: c.name, status: c.status })),
        },
        sampleRecords: persistSample,
        nextStep: persist
          ? "rode npm run telemetry:persist para inserir na ai_telemetry"
          : "TELEMETRY_PERSIST=1 para gravar envelopes §19",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(`❌ pipeline falhou: ${(err as Error).message}`);
  process.exit(1);
});
