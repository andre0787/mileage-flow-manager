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
export * from "./adapters/registry";
export * from "./adapters/pi";
export * from "./adapters/generic";
export * from "./orchestration/planner";
export * from "./orchestration/scheduler";
export * from "./orchestration/dependency-resolver";
export * from "./orchestration/budget";
export * from "./orchestration/dispatcher";
