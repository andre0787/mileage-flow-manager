/**
 * P12.6 — Mutation Lab Module
 *
 * Barrel público do Mutation Lab (Trilha A) + Promotion Intelligence (Trilha B).
 *
 * Trilha A: Agent QA Mutation Lab
 *   - Types, Lifecycle, Catalog, Evaluation, Blast Radius,
 *     Graph Diagnosis, Cost Analysis, Context Mode/Caveman Eval
 *
 * Trilha B: Promotion Intelligence
 *   - Types, Source Registry, Scout, Extraction, Validation,
 *     Deduplication, Alert Engine, Freshness, Change Detection
 */

// ─── Trilha A — QA Mutation Lab ────────────────────────────────

export * from "./types";
export * from "./lifecycle";
export * from "./catalog";
export * from "./evaluation";
export * from "./blast-radius";
export * from "./graph-diagnosis";
export * from "./cost-analysis";
export * from "./context-mode-eval";
export * from "./blind-qa";
export * from "./fix-evaluation";
export * from "./promotion-mutation-lab";
export * from "./promotion-orchestration";
export * from "./telemetry-events";
export * from "./target-resolver";
export * from "./evidence-generator";
export * from "./experiment-runner";
export * from "./context-mode-runner";
export * from "./graph-experiment";
export * from "./orchestration-experiment";

// ─── Trilha B — Promotion Intelligence ─────────────────────────

export * from "./promotion/types";
export * from "./promotion/source-registry";
export * from "./promotion/scout";
export * from "./promotion/extraction";
export * from "./promotion/validation";
export * from "./promotion/deduplication";
export * from "./promotion/alerts";
export * from "./promotion/freshness";
export * from "./promotion/change-detection";
export * from "./promotion/scout-real";
export * from "./promotion/scheduler";
export * from "./promotion/validator-real";
export * from "./promotion/alerts-real";
