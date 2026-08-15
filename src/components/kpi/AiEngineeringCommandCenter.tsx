/**
 * AiEngineeringCommandCenter.tsx — P11-08 AI Engineering Command Center.
 *
 * Repagina a aba KPI com a telemetria nova (§19): visão executiva (Tasks,
 * Success Rate, Cost, Tokens, Tokens Saved, Rework, Avg Latency, Graph ROI,
 * Agent Efficiency), Workflow Efficiency (planning→validation), Agent
 * Performance, Model Performance, Bottlenecks, Graph ROI e Neo4j readiness.
 *
 * Os painéis menores vivem em arquivos próprios (rule-41 — hard limit de
 * 150 linhas por arquivo).
 */

import { useMemo } from "react";
import KPICard from "@/components/KPICard";
import KPITable from "@/components/KPITable";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { buildAiEngineeringDashboard } from "@/lib/aiEngineering";
import WorkflowEfficiencyPanel from "./WorkflowEfficiencyPanel";
import BottlenecksPanel from "./BottlenecksPanel";
import GraphRoiNeo4jPanel from "./GraphRoiNeo4jPanel";

interface Props {
  envelopes: TelemetryEnvelope[];
  graphNodes?: number;
  graphEdges?: number;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function money(value: number): string {
  return `US$ ${value.toFixed(4)}`;
}

export default function AiEngineeringCommandCenter({ envelopes, graphNodes, graphEdges }: Props) {
  const dashboard = useMemo(
    () =>
      buildAiEngineeringDashboard(envelopes, {
        nodes: graphNodes ?? 0,
        edges: graphEdges ?? 0,
        multiHopRatio: 0,
        queryP95Ms: null,
        concurrency: 1,
        scannedNodes: 0,
        growthPct: 0,
      }),
    [envelopes, graphNodes, graphEdges],
  );

  const { executive } = dashboard;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold">🤖 AI Engineering Command Center</h3>
        <p className="text-sm text-muted-foreground">
          Telemetria real do pipeline de agentes (envelopes §19) — mede se a arquitetura está
          ficando melhor, não só quanto executou.
        </p>
      </div>

      {/* Visão executiva */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard label="Tasks" value={executive.tasks} description="execuções únicas (run:task)" />
        <KPICard
          label="Success Rate"
          value={pct(executive.successRate)}
          description={`${Math.round(executive.avgLatencyMs)}ms de latência média`}
        />
        <KPICard label="Cost" value={money(executive.cost)} description="custo estimado (USD)" />
        <KPICard
          label="Tokens"
          value={executive.tokens.toLocaleString()}
          description={`${executive.tokensSaved.toLocaleString()} tokens salvos`}
        />
        <KPICard label="Rework" value={executive.reworkCount} description="falhas + retries > 1" />
        <KPICard
          label="Graph ROI"
          value={`${executive.graphRoiPct}%`}
          description="tokens salvos / tokens totais"
        />
      </div>

      {/* Workflow efficiency */}
      <WorkflowEfficiencyPanel phases={dashboard.phases} />

      {/* Agent performance */}
      <KPITable
        title="Agent Performance"
        headers={["Role", "Exec", "Success", "Latency", "Tokens", "Cost", "Rework", "Retries"]}
        rows={dashboard.agents.map((a) => [
          a.role,
          String(a.executions),
          pct(a.successRate),
          `${Math.round(a.avgLatencyMs)}ms`,
          a.tokens.toLocaleString(),
          a.cost.toFixed(4),
          String(a.rework),
          String(a.retries),
        ])}
      />

      {/* Model performance */}
      <KPITable
        title="Model × Role Performance"
        headers={["Model", "Role", "Exec", "Success", "Latency", "Tokens", "Cost", "Failures"]}
        rows={dashboard.models.map((m) => [
          m.model,
          m.role,
          String(m.executions),
          pct(m.successRate),
          `${Math.round(m.avgLatencyMs)}ms`,
          m.tokens.toLocaleString(),
          m.cost.toFixed(4),
          String(m.failures),
        ])}
      />

      {/* Bottlenecks */}
      <BottlenecksPanel bottlenecks={dashboard.bottlenecks} />

      {/* Graph ROI + Neo4j readiness */}
      <GraphRoiNeo4jPanel dashboard={dashboard} />
    </div>
  );
}
