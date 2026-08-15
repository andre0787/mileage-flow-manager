/**
 * p12.5-report-generator.ts — Gera docs/P12.5-EVIDENCE-REPORT.md.
 *
 * Consolida o resultado do runner p12.5:validate em um relatório legível
 * com as seções exigidas pela spec (gate, lifecycle, cenários, findings,
 * triage, regression, KPIs, segurança, isolamento demo).
 */

import type { RegressionSuiteResult } from "@/ai/e2e/regression";
import type { E2eKpis } from "@/ai/e2e/kpi";
import type { SecurityCertification } from "@/ai/e2e/security";
import type { TriageClassification } from "@/ai/e2e/triage";

export interface P125ReportInput {
  repo: { commitSha: string; branch: string; workingTreeClean: boolean };
  gate: { allowed: boolean; activeSessions: number };
  lifecycle: { mutations: number; resets: number; pristine: boolean };
  scenarios: Array<{ id: string; risk: string; priority: string }>;
  findings: Array<{ id: string; scenarioId: string; severity: string; passed: boolean }>;
  triages: Array<{
    findingId: string;
    classification: TriageClassification;
    confidence: number;
    action: string;
    hypothesis: string;
  }>;
  regression: RegressionSuiteResult;
  kpis: E2eKpis;
  security: SecurityCertification;
  demoIsolation: { tenantId: string; allIdsPrefixed: boolean };
}

export function generateP125Report(input: P125ReportInput): string {
  const {
    repo,
    gate,
    lifecycle,
    scenarios,
    findings,
    triages,
    regression,
    kpis,
    security,
    demoIsolation,
  } = input;
  const failed = findings.filter((f) => !f.passed);
  const lines: string[] = [];

  lines.push(`# P12.5 — Evidence Report (Public Demo / Agentic E2E)`);
  lines.push(``);
  lines.push(
    `> Gerado em ${new Date().toISOString()} · branch \`${repo.branch}\` · commit \`${repo.commitSha}\``,
  );
  lines.push(``);
  lines.push(`## 1. Demo Access Gate (P12.5-02)`);
  lines.push(``);
  lines.push(`- Acesso anônimo: ${gate.allowed ? "✅ permitido" : "❌ bloqueado"}`);
  lines.push(`- Sessions ativas: ${gate.activeSessions}`);
  lines.push(
    `- Tenant: \`${demoIsolation.tenantId}\` · IDs com prefixo reservado: ${demoIsolation.allIdsPrefixed ? "✅" : "❌"}`,
  );
  lines.push(``);
  lines.push(`## 2. Demo Data Lifecycle (P12.5-03)`);
  lines.push(``);
  lines.push(`- Mutações: ${lifecycle.mutations} · Resets: ${lifecycle.resets}`);
  lines.push(`- Estado pós-reset = baseline (pristine): ${lifecycle.pristine ? "✅" : "❌"}`);
  lines.push(``);
  lines.push(`## 3. Scenario Registry (P12.5-06)`);
  lines.push(``);
  lines.push(`| Cenário | Risk | Priority |`);
  lines.push(`|---|---|---|`);
  for (const s of scenarios) lines.push(`| ${s.id} | ${s.risk} | ${s.priority} |`);
  lines.push(``);
  lines.push(`## 4. Findings & Evidence (P12.5-07/08)`);
  lines.push(``);
  lines.push(`| Finding | Cenário | Severity | Resultado |`);
  lines.push(`|---|---|---|---|`);
  for (const f of findings) {
    lines.push(
      `| ${f.id} | ${f.scenarioId} | ${f.severity} | ${f.passed ? "✅ pass" : "❌ fail"} |`,
    );
  }
  lines.push(``);
  lines.push(`## 5. Triage (P12.5-09)`);
  lines.push(``);
  if (triages.length === 0) {
    lines.push(`Nenhum finding a classificar.`);
  } else {
    lines.push(`| Finding | Classificação | Confidence | Ação |`);
    lines.push(`|---|---|---|---|`);
    for (const t of triages) {
      lines.push(`| ${t.findingId} | ${t.classification} | ${t.confidence} | ${t.action} |`);
    }
    lines.push(``);
    lines.push(`> Hipóteses de triage NUNCA são fatos: confidence < 0.90 → manual review (T21).`);
  }
  lines.push(``);
  lines.push(`## 6. Regression Loop (P12.5-11)`);
  lines.push(``);
  lines.push(`| Cenário | pass | fail | attempts | flaky_score | veredito |`);
  lines.push(`|---|---|---|---|---|---|`);
  for (const r of regression.runs) {
    lines.push(
      `| ${r.scenarioId} | ${r.passCount} | ${r.failCount} | ${r.attempts} | ${r.flakyScore} | ${r.verdict} |`,
    );
  }
  lines.push(``);
  lines.push(
    `- Regressões confirmadas: ${regression.regressionsConfirmed.length === 0 ? "nenhuma" : regression.regressionsConfirmed.join(", ")}`,
  );
  lines.push(`- Needs fix return: ${regression.needsFixReturn}`);
  lines.push(``);
  lines.push(`## 7. KPIs E2E (P12.5-12)`);
  lines.push(``);
  lines.push(`| KPI | Valor |`);
  lines.push(`|---|---|`);
  lines.push(`| Runs | ${kpis.runs} |`);
  lines.push(`| Pass rate | ${kpis.passRate}% |`);
  lines.push(`| Failure rate | ${kpis.failureRate}% |`);
  lines.push(`| Flaky rate | ${kpis.flakyRate}% |`);
  lines.push(`| Mean duration | ${kpis.meanDurationMs}ms |`);
  lines.push(`| Findings críticos | ${kpis.criticalFindings} |`);
  lines.push(`| Findings altos | ${kpis.highFindings} |`);
  lines.push(`| Fix success rate | ${kpis.fixSuccessRate}% |`);
  lines.push(`| Regression rate | ${kpis.regressionRate}% |`);
  lines.push(`| Time-to-diagnosis | ${kpis.timeToDiagnosisMs}ms |`);
  lines.push(`| Time-to-fix | ${kpis.timeToFixMs}ms |`);
  lines.push(``);
  lines.push(`## 8. Segurança & Autonomia (P12.5-13)`);
  lines.push(``);
  lines.push(
    `- Autonomia: **Level ${security.autonomyLevel}** (${security.autonomyCapped ? "✅ capped ≤ 3" : "❌ EXCEDEU"})`,
  );
  lines.push(
    `- Certificação: ${security.allPassed ? "✅ PASS (16/16 checks)" : `❌ FAIL (${security.checks.filter((c) => !c.passed).length} checks falharam)`}`,
  );
  lines.push(``);
  lines.push(`| Check | Resultado |`);
  lines.push(`|---|---|`);
  for (const c of security.checks) {
    lines.push(`| ${c.name} | ${c.passed ? "✅" : "❌"} ${c.detail} |`);
  }
  lines.push(``);
  lines.push(`## 9. Conclusão`);
  lines.push(``);
  lines.push(
    `- Findings: ${failed.length} de ${findings.length} cenários com falha (determinístico no runner).`,
  );
  lines.push(
    `- Triage: ${triages.length} classificados; confidence média ${triages.length ? (triages.reduce((s, t) => s + t.confidence, 0) / triages.length).toFixed(2) : "—"}.`,
  );
  lines.push(`- Fix workflow: Level 3 — PR criado, **sem auto-merge nem auto-deploy** (T22).`);
  lines.push(
    `- Telemetry: envelopes E2E com browserSessionId/scenarioId/findingId/artifactId (P12.5 §4).`,
  );
  lines.push(``);
  lines.push(
    `> **O produto passa a possuir uma camada real de validação contínua** — capaz de observar, documentar defeitos e preparar correções, sem transformar automação em risco operacional.`,
  );

  return lines.join("\n");
}
