/**
 * src/ai/e2e/index.ts — Barrel do módulo E2E / Public Demo (P12.5).
 *
 * Tudo que conecta a arquitetura P11/P12 ao produto real: demo tenant,
 * acesso anônimo, lifecycle, limites, browser adapter, cenários, evidência,
 * QA Agent, triage, fix workflow, regression, KPI e certificação de
 * segurança. Autonomia máxima: Level 3.
 */

export * from "./context";
export * from "./context-factories";
export * from "./demo-tenant";
export * from "./access-gate";
export * from "./lifecycle";
export * from "./limits";
export * from "./browser-adapter";
export * from "./playwright-adapter";
export * from "./fake-browser";
export * from "./scenarios";
export * from "./scenario-defs";
export * from "./evidence";
export * from "./qa-agent";
export * from "./qa-types";
export * from "./triage";
export * from "./fix-workflow";
export * from "./regression";
export * from "./kpi";
export * from "./security";
export * from "./security-checks";
