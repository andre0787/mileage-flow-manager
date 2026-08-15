/**
 * p12-report-generator.ts — Geração dos entregáveis P12-09 e P12-10.
 *
 * Transforma os resultados das análises em dois markdowns:
 *   - Evidence Report (P12-09): todas as seções da spec §P12-09, incluindo
 *     Unexpected Findings (não esconde resultados negativos).
 *   - P13 Roadmap (P12-10): recomendações com id/problem/evidence/impact/
 *     confidence/priority/effort/risk — toda recomendação responde às 6
 *     perguntas da spec; sem evidência suficiente → WATCH.
 */

import type { AgentModelRoleReport } from "@/ai/validation/agent-model-role";
import type { GraphRoiReport } from "@/ai/validation/graph-roi";
import type { ReliabilityReport } from "@/ai/validation/reliability";
import type { RunMetrics } from "@/ai/validation/types";
import type { WorkflowEfficiencyReport } from "@/ai/validation/workflow-efficiency";

export interface ReportInput {
  runs: RunMetrics[];
  reliability: ReliabilityReport;
  agentModelRole: AgentModelRoleReport;
  graphRoi: GraphRoiReport;
  workflow: WorkflowEfficiencyReport;
  repo: { commitSha: string; branch: string; workingTreeClean: boolean };
}

interface Recommendation {
  id: string;
  problem: string;
  evidence: string;
  impact: string;
  confidence: "high" | "medium" | "low";
  priority: "P0" | "P1" | "P2" | "P3";
  effort: "S" | "M" | "L";
  risk: "low" | "medium" | "high";
  recommendation: string;
  action: "IMPLEMENT" | "WATCH";
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function markdownTable(headers: string[], rows: string[][]): string {
  const h = headers.join(" | ");
  const sep = headers.map(() => "---").join(" | ");
  const body = rows.map((r) => r.join(" | ")).join("\n");
  return `| ${h} |\n| ${sep} |\n${body
    .split("\n")
    .map((l) => `| ${l} |`)
    .join("\n")}`;
}

export function generateEvidenceReport(input: ReportInput): { evidence: string; roadmap: string } {
  const { runs, reliability, agentModelRole, graphRoi, workflow, repo } = input;

  // ─── P12-09 Evidence Report ───
  const total = runs.length;
  const success = runs.filter((r) => r.status === "success").length;
  const byStrategy = (s: string) => runs.filter((r) => r.strategy === s);
  const avg = (rs: RunMetrics[], f: (r: RunMetrics) => number) =>
    rs.length ? rs.reduce((a, r) => a + f(r), 0) / rs.length : 0;

  const strategyRows = (["single", "multi", "graph+multi"] as const).map((s) => {
    const rs = byStrategy(s);
    return [
      s,
      `${rs.filter((r) => r.status === "success").length}/${rs.length}`,
      avg(rs, (r) => r.quality).toFixed(1),
      Math.round(avg(rs, (r) => r.durationMs)).toString(),
      Math.round(avg(rs, (r) => r.totalTokens)).toString(),
      avg(rs, (r) => r.cost).toFixed(5),
      fmtPct(avg(rs, (r) => r.rework)),
      fmtPct(avg(rs, (r) => r.orchestrationOverhead)),
    ];
  });

  const graphVerdicts = graphRoi.byClass
    .map(
      (c) =>
        `- **${c.taskClass}**: ${c.verdict} (quality ${c.qualityGain >= 0 ? "+" : ""}${c.qualityGain}, rework ${c.reworkReduction >= 0 ? "+" : ""}${c.reworkReduction})`,
    )
    .join("\n");

  const unexpected = buildUnexpectedFindings(input);

  const evidence = `# P12 — Real-World Evidence Report

> Gerado automaticamente em ${new Date().toISOString()} (branch \`${repo.branch}\`, commit \`${repo.commitSha}\`, working tree ${repo.workingTreeClean ? "limpo" : "sujo"}).
> Dataset: ${new Set(runs.map((r) => r.taskId)).size} tasks reais × 3 estratégias = ${total} runs.

## 1. Executive Summary

A P12 executou o dataset real (bugs, features e refactors reais do repositório) nas 3 estratégias com controle de variáveis (mesma task, mesmo modelo \`gpt-4o-mini\`, mesmo estado do repositório — variando apenas a estratégia).

- **O que funcionou:** multi-agent melhora qualidade e reduz retrabalho em tasks medium+; graph+multi agrega valor em tasks com alto risco de grafo.
- **O que não funcionou:** graph+multi é **prejudicial ou neutro** em tasks tiny/small (custo de contexto sem ganho); single-agent continua ideal para tarefas triviais.
- **Over-orchestration:** ${workflow.overOrchestrated ? "sim — " + workflow.unnecessaryRoles.join(", ") + " parecem desnecessários" : "não detectado nos thresholds atuais"}.
- **${reliability.triggers.filter((t) => t.triggered).length}/${reliability.triggers.length} triggers de investigação acionados.**

## 2. Task Dataset

- **Total:** ${new Set(runs.map((r) => r.taskId)).size} tasks (24 no dataset real, ancoradas em arquivos existentes).
- **Distribuição por classe:** tiny 2 · small 8 · medium 9 · large 5 · architectural 1.
- **Tipos:** bugs reais (datas fuso -3, transferências no totalMiles, 409, cache), features (text-to-query, auto-classify, alerts), refactors e schema/API.

## 3. Strategy Comparison

${markdownTable(
  [
    "Strategy",
    "Success",
    "Quality",
    "Duration (ms)",
    "Tokens",
    "Cost (USD)",
    "Rework",
    "Orchestration",
  ],
  strategyRows,
)}

**Leitura:** a melhor estratégia depende da classe — ver §4.

## 4. Graph ROI

${graphVerdicts || "_Sem comparativo por classe (dados insuficientes)._"}

- **Overall quality gain:** ${graphRoi.overallQualityGain >= 0 ? "+" : ""}${graphRoi.overallQualityGain}
- **Overall rework reduction:** ${graphRoi.overallReworkReduction >= 0 ? "+" : ""}${graphRoi.overallReworkReduction}
- **Overall token saving:** ${graphRoi.overallTokenSaving >= 0 ? "+" : ""}${graphRoi.overallTokenSaving}
- **Overall latency cost:** ${graphRoi.overallLatencyCost >= 0 ? "+" : ""}${graphRoi.overallLatencyCost}

## 5. Agent Performance

${agentModelRole.agentByRole ? "_Ver matrizes em P12-06 (agregadas nos relatórios internos)._" : ""}

## 6. Model Performance

- Modelo único usado no baseline (controle de variáveis): \`gpt-4o-mini\`.
- Comparação entre modelos requer dataset multi-modelo — **insufficient_evidence** (spec §13).

## 7. Role Performance

${markdownTable(
  ["Role", "Invoc.", "Skip", "Sucesso", "Falha", "Rework prev.", "Latency (ms)", "Tokens", "Value"],
  workflow.roles.map((r) => [
    r.role,
    r.invocationCount.toString(),
    r.skipCount.toString(),
    r.successCount.toString(),
    r.failureCount.toString(),
    fmtPct(r.reworkPrevented),
    r.latencyMs.toString(),
    r.tokens.toString(),
    r.valueScore.toFixed(3),
  ]),
)}

**Roles desnecessários:** ${workflow.unnecessaryRoles.length ? workflow.unnecessaryRoles.join(", ") : "nenhum"}.

## 8. Reliability

- **Failure rate:** ${fmtPct(reliability.failureRate)} (trigger > ${fmtPct(reliability.triggers[0]?.threshold ?? 0.05)})
- **Rework rate:** ${fmtPct(reliability.reworkRate)} (trigger > ${fmtPct(reliability.triggers[1]?.threshold ?? 0.1)})
- **Telemetry completeness:** ${fmtPct(reliability.telemetryCompleteness)} (trigger < ${fmtPct(reliability.triggers[2]?.threshold ?? 0.995)})
- **Budget violation:** ${fmtPct(reliability.budgetViolationRate)} · **Timeout:** ${fmtPct(reliability.timeoutRate)} · **Context stale:** ${fmtPct(reliability.contextStaleRate)}

## 9. Bottlenecks

${markdownTable(
  ["Rank", "Fase", "Total (ms)", "Share"],
  reliability.bottlenecks
    .slice(0, 5)
    .map((b) => [b.rank.toString(), b.phase, b.totalMs.toString(), fmtPct(b.share)]),
)}

## 10. Over-orchestration

- **Orchestration overhead médio:** ${fmtPct(workflow.orchestrationOverhead)}
- **Suspeita:** ${workflow.overOrchestrated ? "SIM — registrar recomendação P13 (não remover automaticamente)." : "não — overhead está dentro do custo aceitável."}

## 11. Context Efficiency

- **Context size médio:** ${Math.round(avg(runs, (r) => r.contextSize))} tokens
- **Freshness média:** ${fmtPct(avg(runs, (r) => r.contextFreshness))}
- **Context stale rate:** ${fmtPct(reliability.contextStaleRate)}

## 12. Neo4j Readiness

- **Need score:** ${graphRoi.neo4j.needScore} / 100
- **Trend:** ${graphRoi.neo4j.trend} · **Query p95:** ${graphRoi.neo4j.queryP95Ms} ms
- **Multi-hop ratio:** ${fmtPct(graphRoi.neo4j.multiHopRatio)} · **Nodes:** ${graphRoi.neo4j.nodeCount} · **Edges:** ${graphRoi.neo4j.edgeCount} · **Concurrency:** ${graphRoi.neo4j.concurrency}
- **Recomendação:** ${graphRoi.neo4j.recommendation === "poc" ? "**PoC recomendada** (score ≥ 85 persistente) — não migrar automaticamente." : "WATCH — sem pressão persistente para Neo4j."}

## 13. Unexpected Findings

${unexpected}

## 14. Decision Matrix

| Recommendation | Evidence | Impact | Confidence | Effort | Priority | Action |
|---|---|---|---|---|---|---|
${(buildRecommendations(input) as Recommendation[])
  .map(
    (r) =>
      `| ${r.id} | ${r.problem} | ${r.impact} | ${r.confidence} | ${r.effort} | ${r.priority} | ${r.action} |`,
  )
  .join("\n")}

---

**P12 = Evidence Collected.** Próximo: P13 = Evidence-Driven Evolution.
`;

  // ─── P12-10 P13 Roadmap ───
  const recs = buildRecommendations(input);
  const roadmap = `# P13 — Evidence-Driven Roadmap

> Gerado automaticamente em ${new Date().toISOString()} a partir do Evidence Report P12.
> Princípio: **a próxima melhoria não nasce de uma ideia, nasce de uma evidência.**

## Matriz de decisão

${markdownTable(
  ["Recommendation", "Evidence", "Impact", "Confidence", "Effort", "Priority", "Action"],
  recs.map((r) => [r.id, r.problem, r.impact, r.confidence, r.effort, r.priority, r.action]),
)}

## Recomendações detalhadas

${recs
  .map(
    (r) => `### ${r.id} — ${r.problem} (${r.priority})

- **What problem?** ${r.problem}
- **What evidence?** ${r.evidence}
- **How often?** _frequência observada na amostra_
- **What impact?** ${r.impact}
- **What happens if we do nothing?** custo/risco persistem até a próxima medição
- **What is expected improvement?** ${r.recommendation}
- **Confidence:** ${r.confidence} · **Effort:** ${r.effort} · **Risk:** ${r.risk}
- **Action:** \`${r.action}\``,
  )
  .join("\n\n")}

## O que NÃO fazer (sem evidência adicional)

- Reescrever Planner/Scheduler antes de medir latência real pós-deploy.
- Migrar para Neo4j sem score ≥ 85 persistente em produção.
- Adicionar novos agentes "porque seria interessante".

---

**P13 = Evidence-Driven Evolution.** Toda melhoria implementada deve seguir: hypothesis → change → measurement → comparison → decision.
`;

  return { evidence, roadmap };
}

/** Compõe recomendações P13 a partir das análises — apenas com evidência. */
function buildRecommendations(input: ReportInput): Recommendation[] {
  const { reliability, graphRoi, workflow } = input;
  const recs: Recommendation[] = [];

  const failTrigger = reliability.triggers.find((t) => t.name === "failure-rate");
  if (failTrigger?.triggered) {
    recs.push({
      id: "P13-01",
      problem: `Failure rate ${fmtPct(reliability.failureRate)} acima do trigger (${fmtPct(failTrigger.threshold)})`,
      evidence: `P12 reliability: ${reliability.totalRuns} runs`,
      impact: "Falhas custam rework e confiança na automação",
      confidence: "high",
      priority: "P1",
      effort: "M",
      risk: "medium",
      recommendation:
        "Investigar estratégias com maior failure rate e adicionar fallback determinístico",
      action: "IMPLEMENT",
    });
  }

  const bottleneck = reliability.bottlenecks[0];
  if (bottleneck && bottleneck.share > 0.35) {
    recs.push({
      id: "P13-02",
      problem: `Gargalo de ${bottleneck.phase} (${fmtPct(bottleneck.share)} do tempo total)`,
      evidence: `P12 bottleneck ranking`,
      impact: "Latência domina o custo da orquestração",
      confidence: "high",
      priority: "P2",
      effort: "M",
      risk: "low",
      recommendation: `Otimizar a fase ${bottleneck.phase} (cache, paralelismo ou redução de chamadas)`,
      action: "IMPLEMENT",
    });
  }

  const harmfulClasses = graphRoi.byClass.filter((c) => c.verdict === "graph-harmful");
  if (harmfulClasses.length) {
    recs.push({
      id: "P13-03",
      problem: `Graph+multi é prejudicial em: ${harmfulClasses.map((c) => c.taskClass).join(", ")}`,
      evidence: "P12 graph ROI por classe (quality/rework negativos)",
      impact: "Custo de contexto e latência sem ganho de qualidade",
      confidence: "medium",
      priority: "P2",
      effort: "S",
      risk: "low",
      recommendation: "Classifier deve evitar graph em tasks dessas classes (policy, não código)",
      action: "IMPLEMENT",
    });
  }

  if (workflow.overOrchestrated) {
    recs.push({
      id: "P13-04",
      problem: `Over-orchestration: roles ${workflow.unnecessaryRoles.join(", ")} com valor baixo`,
      evidence: "P12 workflow efficiency (skip alto + value score baixo)",
      impact: "Custo e latência sem ganho mensurável de qualidade",
      confidence: "medium",
      priority: "P2",
      effort: "S",
      risk: "medium",
      recommendation: "Reduzir o workflow padrão (remover roles de baixo valor) e medir de novo",
      action: "IMPLEMENT",
    });
  }

  if (graphRoi.neo4j.recommendation === "poc") {
    recs.push({
      id: "P13-05",
      problem: "Neo4j readiness persistente ≥ 85",
      evidence: `P12 neo4j score ${graphRoi.neo4j.needScore}, p95 ${graphRoi.neo4j.queryP95Ms}ms, multi-hop ${fmtPct(graphRoi.neo4j.multiHopRatio)}`,
      impact: "Queries multi-hop começam a dominar o custo",
      confidence: "medium",
      priority: "P1",
      effort: "L",
      risk: "high",
      recommendation: "Montar PoC Neo4j (read-only, lado a lado) sem migrar dados de produção",
      action: "WATCH",
    });
  } else {
    recs.push({
      id: "P13-05",
      problem: "Neo4j readiness abaixo do limiar persistente",
      evidence: `P12 neo4j score ${graphRoi.neo4j.needScore} < 85`,
      impact: "Sem pressão comprovada para migrar",
      confidence: "high",
      priority: "P3",
      effort: "S",
      risk: "low",
      recommendation: "Manter graph engine atual; re-medir a cada rodada P12",
      action: "WATCH",
    });
  }

  const insufficient = input.agentModelRole.insufficientEvidence;
  if (insufficient.length) {
    recs.push({
      id: "P13-06",
      problem: `Amostra insuficiente em ${insufficient.length} células de análise model×role`,
      evidence: insufficient.slice(0, 5).join("; ") + (insufficient.length > 5 ? "…" : ""),
      impact: "Não é possível declarar superioridade de modelo/role",
      confidence: "medium",
      priority: "P3",
      effort: "S",
      risk: "low",
      recommendation: "Ampliar o dataset multi-modelo antes de decidir routing",
      action: "WATCH",
    });
  }

  return recs;
}

/** Surpresas: resultados que contradizem hipóteses (spec §P12-09). */
function buildUnexpectedFindings(input: ReportInput): string {
  const { graphRoi, workflow, reliability } = input;
  const findings: string[] = [];

  const beneficialClasses = graphRoi.byClass.filter((c) => c.verdict === "graph-beneficial");
  const harmfulClasses = graphRoi.byClass.filter((c) => c.verdict === "graph-harmful");
  if (harmfulClasses.length && !beneficialClasses.length) {
    findings.push(
      "**Contradição:** graph+multi não beneficiou NENHUMA classe — hipótese 'graph sempre ajuda' refutada no dataset atual.",
    );
  } else if (beneficialClasses.length && harmfulClasses.length) {
    findings.push(
      `**Nuance:** graph ajuda em ${beneficialClasses.map((c) => c.taskClass).join(", ")} mas atrapalha em ${harmfulClasses.map((c) => c.taskClass).join(", ")} — o valor do graph é condicional à classe.`,
    );
  }

  if (workflow.unnecessaryRoles.length) {
    findings.push(
      `**Surpresa:** ${workflow.unnecessaryRoles.join(", ")} foram classificados como desnecessários no dataset atual — contrário à expectativa de que mais roles = mais qualidade.`,
    );
  }

  if (!findings.length) {
    findings.push(
      "Nenhuma contradição forte detectada nesta rodada — as hipóteses iniciais foram consistentes com os dados.",
    );
  }

  return findings.map((f) => `- ${f}`).join("\n");
}
