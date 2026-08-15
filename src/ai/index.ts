/**
 * src/ai/index.ts — Barrel público do AI Core (SDD v5.0, P5-01).
 *
 * Entry point da lib: consumido por scripts (scripts/graph-intel.mjs via
 * CLI), testes e futuros adapters. O core é agnóstico de agente — nada
 * aqui importa SDK de agente (P1).
 */

export * from "./core/graph-types";
export * from "./core/context-packet";
export * from "./core/agent-contract";
export * from "./core/model-contract";
export * from "./core/task-contract";
export * from "./core/execution-plan";
export * from "./telemetry/envelope";
export * from "./telemetry/persist";
export * from "./graph/engine";
export * from "./graph/metrics";
export * from "./graph/graph-value";
export * from "./adapters/registry";
export * from "./adapters/pi";
export * from "./adapters/generic";
export * from "./orchestration/planner";
export * from "./orchestration/classifier";
export * from "./orchestration/adaptive-planner";
export * from "./orchestration/explainability";
export * from "./benchmark/dataset";
export * from "./benchmark/runner";
export * from "./orchestration/scheduler";
export * from "./orchestration/dependency-resolver";
export * from "./orchestration/budget";
export * from "./orchestration/dispatcher";
export * from "./execution/subagent-result";
export * from "./execution/scouts";
export * from "./execution/architect";
export * from "./execution/implementer";
export * from "./execution/domain-knowledge";
export * from "./execution/command-runner";
export * from "./execution/failure-taxonomy";
export * from "./execution/retry";
export * from "./execution/sanitize";
export * from "./execution/graph-freshness";
export * from "./execution/final-validator";
export * from "./execution/reviewer";
