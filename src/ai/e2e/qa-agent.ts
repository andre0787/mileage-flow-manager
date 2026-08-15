/**
 * qa-agent.ts — E2E QA Agent (P12.5-08).
 *
 * Role `e2e-qa`: lê cenário → prepara ambiente → executa passos no browser →
 * assert → captura evidência → classifica → reporta. Atua como black-box/
 * gray-box tester observando UI, network, console e telemetry. NÃO edita
 * código, NÃO commita, NÃO faz deploy, NÃO merge.
 *
 * Tipos/capabilities em qa-types.ts (rule-41).
 */

import type { BrowserAdapter } from "./browser-adapter";
import { createEvidencePack, type FindingSeverity } from "./evidence";
import type { QaAgentOptions, QaFinding, QaRunConfig } from "./qa-types";

export type { QaAgentCapability, QaFinding, QaRunConfig, QaAgentOptions } from "./qa-types";
export { QA_AGENT_CAPABILITIES, QA_AGENT_FORBIDDEN } from "./qa-types";

/** Executa um cenário no browser e produz evidência + finding. */
export async function runScenario(
  adapter: BrowserAdapter,
  config: QaRunConfig,
  opts: QaAgentOptions = {},
): Promise<QaFinding> {
  const { scenario, runId, commitSha, environment, browser } = config;
  const stepDescriptions = scenario.steps.map((s) => {
    if (s.action === "open") return `open ${s.url}`;
    if (s.action === "click") return `click ${s.selector}`;
    if (s.action === "fill") return `fill ${s.selector} = ${s.value}`;
    if (s.action === "select") return `select ${s.selector} = ${s.value}`;
    return `wait ${s.condition.type}`;
  });

  const failedAssertions: string[] = [];
  let httpError = false;

  try {
    for (const step of scenario.steps) {
      switch (step.action) {
        case "open":
          await adapter.open(step.url);
          break;
        case "click":
          await adapter.click(step.selector);
          break;
        case "fill":
          await adapter.fill(step.selector, step.value);
          break;
        case "select":
          await adapter.select(step.selector, step.value);
          break;
        case "wait":
          await adapter.wait(step.condition);
          break;
      }
    }
  } catch (err) {
    httpError = String(err).includes("HTTP 500");
    failedAssertions.push(String(err));
  }

  for (const assertion of scenario.assertions) {
    const result = await adapter.assert(assertion);
    if (!result.passed) {
      failedAssertions.push(
        `${assertion.type}: expected=${result.expected} actual=${result.actual}`,
      );
    }
  }

  const [screenshot, trace, consoleLogs, networkEvents] = await Promise.all([
    adapter.screenshot(`${scenario.scenarioId}.png`),
    adapter.trace(),
    adapter.console(),
    adapter.network(),
  ]);

  const passed = failedAssertions.length === 0 && !httpError;
  const severity: FindingSeverity = passed
    ? "info"
    : (opts.onFailureSeverity ?? (scenario.risk === "high" ? "critical" : "high"));

  const evidence = createEvidencePack({
    findingId: `finding_${runId}_${scenario.scenarioId}`,
    runId,
    scenarioId: scenario.scenarioId,
    commitSha,
    environment,
    browser,
    url: await adapter.currentUrl(),
    preconditions: scenario.preconditions,
    steps: stepDescriptions,
    expected: scenario.assertions
      .map(
        (a) =>
          `${a.type}:${"expected" in a ? String(a.expected) : "selector" in a ? a.selector : a.pattern}`,
      )
      .join("; "),
    actual: passed ? "all assertions passed" : failedAssertions.join("; "),
    severity,
    screenshots: [screenshot],
    traces: [trace],
    domSnapshots: [],
    consoleLogs,
    networkEvents,
    telemetryRefs: [runId],
  });

  return {
    findingId: evidence.findingId,
    runId,
    scenarioId: scenario.scenarioId,
    severity,
    evidence,
    passed,
  };
}
