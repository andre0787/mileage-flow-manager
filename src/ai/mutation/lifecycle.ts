/**
 * P12.6-01 — Mutation Lifecycle Manager
 *
 * Lifecycle:
 *   create mutation → verify baseline → activate mutation → verify mutation
 *   → run QA → disable mutation → restore baseline → run regression
 *
 * Se não puder restaurar com segurança: ABORT
 * Nunca modificar permanentemente main.
 */

import type {
  MutationCase,
  MutationRun,
  MutationState,
  MutationActivation,
  MutationCleanup,
} from "./types";

// ─── State Machine ─────────────────────────────────────────────

const VALID_TRANSITIONS: Record<MutationState, MutationState[]> = {
  registered: ["activating", "aborted"],
  activating: ["active", "error", "aborted"],
  active: ["detecting", "cleaning", "error", "aborted"],
  detecting: ["detected", "not_detected", "error"],
  detected: ["fixing", "cleaning"],
  not_detected: ["cleaning", "aborted"],
  fixing: ["fixed", "regressing", "error"],
  fixed: ["cleaning"],
  regressing: ["cleaning", "aborted"],
  cleaning: ["cleaned", "error"],
  cleaned: [],
  aborted: [],
  error: ["aborted"],
};

export class MutationLifecycleError extends Error {
  constructor(
    public readonly mutationId: string,
    public readonly from: MutationState,
    public readonly to: MutationState,
  ) {
    super(
      `Invalid transition for mutation ${mutationId}: ${from} → ${to}. Valid: ${VALID_TRANSITIONS[from]?.join(", ")}`,
    );
    this.name = "MutationLifecycleError";
  }
}

// ─── Lifecycle Manager ─────────────────────────────────────────

export interface MutationLifecycleHooks {
  onActivate?: (mutation: MutationCase) => Promise<void> | void;
  onDeactivate?: (mutation: MutationCase) => Promise<void> | void;
  onVerify?: (mutation: MutationCase) => Promise<boolean> | boolean;
  onAbort?: (mutation: MutationCase, reason: string) => Promise<void> | void;
}

export class MutationLifecycle {
  private runs = new Map<string, MutationRun>();
  private hooks: MutationLifecycleHooks;

  constructor(hooks: MutationLifecycleHooks = {}) {
    this.hooks = hooks;
  }

  /**
   * Create a new mutation run. Does NOT activate.
   */
  createRun(mutationId: string): MutationRun {
    const run: MutationRun = {
      id: `run-${mutationId}-${Date.now()}`,
      mutationId,
      state: "registered",
      startedAt: new Date().toISOString(),
    };
    this.runs.set(run.id, run);
    return run;
  }

  /**
   * Transition a run to a new state. Throws on invalid transition.
   */
  transition(run: MutationRun, to: MutationState): void {
    const allowed = VALID_TRANSITIONS[run.state];
    if (!allowed || !allowed.includes(to)) {
      throw new MutationLifecycleError(run.mutationId, run.state, to);
    }
    run.state = to;
  }

  /**
   * Full lifecycle: activate → verify → detect → (fix) → cleanup → regression
   *
   * Each phase is isolated. If restoration fails, ABORT immediately.
   */
  async executeFullLifecycle(
    mutation: MutationCase,
    detect: (mutation: MutationCase) => Promise<MutationRun>,
    fix?: (mutation: MutationCase, run: MutationRun) => Promise<MutationRun>,
    regression?: (mutation: MutationCase, run: MutationRun) => Promise<MutationRun>,
  ): Promise<MutationRun> {
    const run = this.createRun(mutation.id);

    try {
      // Phase 1: Activate
      this.transition(run, "activating");
      await this.hooks.onActivate?.(mutation);
      this.transition(run, "active");

      // Phase 2: Detect
      const detectedRun = await detect(mutation);
      run.detectionResult = detectedRun.detectionResult;
      run.cost = detectedRun.cost;
      this.transition(run, detectedRun.state === "detected" ? "detected" : "not_detected");

      // Phase 3: Fix (if detected)
      if (run.state === "detected" && fix) {
        this.transition(run, "fixing");
        const fixedRun = await fix(mutation, run);
        run.fixResult = fixedRun.fixResult;
        this.transition(run, fixedRun.state === "fixed" ? "fixed" : "regressing");
      }

      // Phase 4: Cleanup
      this.transition(run, "cleaning");
      await this.hooks.onDeactivate?.(mutation);

      // Phase 5: Verify restoration
      const restored = await this.hooks.onVerify?.(mutation);
      if (restored === false) {
        this.transition(run, "aborted");
        await this.hooks.onAbort?.(mutation, "Baseline restoration failed");
        return run;
      }

      this.transition(run, "cleaned");

      // Phase 6: Regression (if fix was applied)
      if (run.state === "cleaned" && regression && run.fixResult) {
        const regResult = await regression(mutation, run);
        run.regressionResult = regResult.regressionResult;
      }

      run.completedAt = new Date().toISOString();
      run.duration = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
    } catch (error) {
      run.state = "error";
      run.completedAt = new Date().toISOString();
      await this.hooks.onAbort?.(mutation, String(error));
    }

    return run;
  }

  /**
   * Get all runs for a mutation.
   */
  getRuns(mutationId: string): MutationRun[] {
    return Array.from(this.runs.values()).filter((r) => r.mutationId === mutationId);
  }

  /**
   * Get a specific run.
   */
  getRun(runId: string): MutationRun | undefined {
    return this.runs.get(runId);
  }

  /**
   * Get all runs.
   */
  getAllRuns(): MutationRun[] {
    return Array.from(this.runs.values());
  }

  /**
   * Export all runs as serializable data.
   */
  export(): MutationRun[] {
    return this.getAllRuns();
  }
}
