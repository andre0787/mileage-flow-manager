/**
 * GraphRoiNeo4jPanel.tsx — P11-08 Graph ROI + Neo4j readiness.
 *
 * Extraído de AiEngineeringCommandCenter.tsx (rule-41 — hard limit de 150
 * linhas por arquivo).
 */

import type { AiEngineeringDashboard } from "@/lib/aiEngineering";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function GraphRoiNeo4jPanel({ dashboard }: { dashboard: AiEngineeringDashboard }) {
  return (
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
  );
}
