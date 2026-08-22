/**
 * P12.6-04 — Blind QA Campaign
 *
 * O QA Agent NÃO recebe:
 *   mutation ID, mutation description, expected failure,
 *   target file, expected output, git diff, mutation catalog.
 *
 * Recebe APENAS:
 *   application URL, scenario inventory, allowed browser capabilities,
 *   QA instructions.
 *
 * Modos:
 *   A — Scenario Guided: Agent receives scenario
 *   B — Exploratory: Agent receives goal
 *   C — Hybrid: Agent receives scenario + permission to explore
 */

import type { MutationCase, DetectionFinding, CostMetrics } from "./types";

// ─── Campaign Types ────────────────────────────────────────────

export type QAMode = "guided" | "exploratory" | "hybrid";

export interface QACampaignConfig {
  appUrl: string;
  scenarios: ScenarioInventory[];
  browserCapabilities: string[];
  qaInstructions: string;
  mode: QAMode;
  timeout?: number;
}

export interface ScenarioInventory {
  id: string;
  name: string;
  description: string;
  steps: string[];
  expectedOutcome: string;
  category: string;
}

// ─── Blind Context ─────────────────────────────────────────────

/**
 * The context given to the QA Agent — deliberately blind.
 * No mutation info leaks here.
 */
export interface BlindQAContext {
  appUrl: string;
  scenarios: ScenarioInventory[];
  browserCapabilities: string[];
  qaInstructions: string;
  mode: QAMode;
}

export function createBlindContext(
  config: QACampaignConfig,
  mutations: MutationCase[], // NOT passed to agent, used for evaluation
): BlindQAContext {
  return {
    appUrl: config.appUrl,
    scenarios: config.scenarios,
    browserCapabilities: config.browserCapabilities,
    qaInstructions: config.qaInstructions,
    mode: config.mode,
  };
}

// ─── QA Campaign Runner ────────────────────────────────────────

export interface QACampaignResult {
  campaignId: string;
  mode: QAMode;
  startedAt: string;
  completedAt: string;
  findings: DetectionFinding[];
  metrics: {
    scenariosRun: number;
    scenariosPassed: number;
    scenariosFailed: number;
    findingsGenerated: number;
    timePerScenario: number;
  };
  cost: CostMetrics;
}

export class QACampaign {
  private results: QACampaignResult[] = [];

  /**
   * Execute a blind QA campaign in the specified mode.
   */
  async executeCampaign(
    config: QACampaignConfig,
    _mutations: MutationCase[], // for evaluation only
  ): Promise<QACampaignResult> {
    const blindContext = createBlindContext(config, _mutations);
    const campaignId = `campaign-${config.mode}-${Date.now()}`;

    const startedAt = Date.now();

    // The agent would use blindContext to perform testing.
    // Here we define the structure for recording results.
    const result: QACampaignResult = {
      campaignId,
      mode: config.mode,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: "", // set after execution
      findings: [],
      metrics: {
        scenariosRun: 0,
        scenariosPassed: 0,
        scenariosFailed: 0,
        findingsGenerated: 0,
        timePerScenario: 0,
      },
      cost: {
        tokens: 0,
        cost: 0,
        duration: 0,
        agentCount: 1,
        toolCalls: 0,
        browserActions: 0,
        retries: 0,
        contextSize: 0,
      },
    };

    // Record result
    result.completedAt = new Date().toISOString();
    result.metrics.scenariosRun = blindContext.scenarios.length;
    result.metrics.timePerScenario =
      blindContext.scenarios.length > 0
        ? (Date.now() - startedAt) / blindContext.scenarios.length
        : 0;

    this.results.push(result);
    return result;
  }

  /**
   * Compare results across modes.
   */
  compareModes(): {
    guided: QACampaignResult | undefined;
    exploratory: QACampaignResult | undefined;
    hybrid: QACampaignResult | undefined;
    bestMode: QAMode | null;
    analysis: string;
  } {
    const guided = this.results.find((r) => r.mode === "guided");
    const exploratory = this.results.find((r) => r.mode === "exploratory");
    const hybrid = this.results.find((r) => r.mode === "hybrid");

    // Simple comparison: mode with most findings and fewest false positives
    const modes: Array<{ mode: QAMode; result?: QACampaignResult }> = [
      { mode: "guided", result: guided },
      { mode: "exploratory", result: exploratory },
      { mode: "hybrid", result: hybrid },
    ];

    let bestMode: QAMode | null = null;
    let bestScore = -1;

    for (const { mode, result } of modes) {
      if (!result) continue;
      const score =
        result.findings.length * 0.5 +
        result.metrics.scenariosFailed * 0.3 +
        (1 / Math.max(result.cost.tokens, 1)) * 1000 * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestMode = mode;
      }
    }

    const analysis = bestMode
      ? `Mode '${bestMode}' produced the most meaningful findings with best efficiency.`
      : "No campaign results available for comparison.";

    return { guided, exploratory, hybrid, bestMode, analysis };
  }

  /**
   * Get all campaign results.
   */
  getAllResults(): QACampaignResult[] {
    return [...this.results];
  }
}

// ─── Mode-Specific Instructions ────────────────────────────────

export const MODE_INSTRUCTIONS: Record<QAMode, string> = {
  guided:
    "Execute each scenario step by step. Report any deviations from expected behavior.",
  exploratory:
    "Explore the application freely. Try to find bugs by testing edge cases, boundary conditions, and unusual interactions.",
  hybrid:
    "Follow the provided scenarios first, then explore areas that seem suspicious or incomplete.",
};
