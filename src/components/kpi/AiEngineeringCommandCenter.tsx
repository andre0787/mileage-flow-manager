/**
 * AiEngineeringCommandCenter.tsx — P11-08 AI Engineering Command Center.
 *
 * Repagina a aba KPI com a telemetria nova (§19): visão executiva (Tasks,
 * Success Rate, Cost, Tokens, Tokens Saved, Rework, Avg Latency, Graph ROI,
 * Agent Efficiency), Workflow Efficiency (planning→validation), Agent
 * Performance, Model Performance, Bottlenecks, Graph ROI e Neo4j readiness.
 *
 * UX: responde "o sistema está ficando melhor?" (trend/scores) e não apenas
 * "quanto foi executado?".
 */

import { useMemo } from "react";
import KPICard from "@/components/KPICard";
import KPITable from "@/components/KPITable";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { buildAiEngineeringDashboard } from "@/lib/aiEngineering";

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
      <div className="rounded-xl border bg-card p-4">
        <h4 className="font-display text-sm font-semibold mb-3">Workflow Efficiency</h4>
        {dashboard.phases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados de fases no período.</p>
        ) : (
          <div className="space-y-2">
            {dashboard.phases.map((phase) => (
              <div key={phase.phase} className="flex items-center gap-3">
                <span className="w-28 text-xs text-muted-foreground capitalize">{phase.phase}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.max(2, phase.pct)}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs tabular-nums">
                  {phase.pct}% · {(phase.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
      <div className="rounded-xl border bg-card p-4">
        <h4 className="font-display text-sm font-semibold mb-2">Bottlenecks</h4>
        {dashboard.bottlenecks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum gargalo detectado no período. ✅</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {dashboard.bottlenecks.map((b, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="font-medium text-foreground">{b.type}</span> — {b.role ?? b.model}:{" "}
                {b.type === "latency"
                  ? `${b.value}ms`
                  : b.type === "expensive"
                    ? `US$ ${b.value.toFixed(4)}`
                    : String(b.value)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Graph ROI + Neo4j readiness */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-display text-sm font-semibold mb-2">Graph ROI</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Graph queries</dt>
              <dd className="tabular-nums">{dashboard.graphRoi.graphQueries}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tokens saved</dt>
              <dd className="tabular-nums">{dashboard.graphRoi.tokensSaved.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Context reuse</dt>
              <dd className="tabular-nums">
                {dashboard.graphRoi.contextReuseTokens.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cache hit rate</dt>
              <dd className="tabular-nums">{pct(dashboard.graphRoi.cacheHitRate)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-display text-sm font-semibold mb-2">Neo4j Readiness</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-display">{dashboard.readiness.score}</span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              /100 · {dashboard.readiness.band}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Drivers: {dashboard.readiness.drivers.join(" · ")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{dashboard.readiness.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
