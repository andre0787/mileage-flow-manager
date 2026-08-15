/**
 * WorkflowEfficiencyPanel.tsx — P11-08 Workflow Efficiency.
 *
 * Extraído de AiEngineeringCommandCenter.tsx (rule-41 — hard limit de 150
 * linhas por arquivo).
 */

import type { PhaseEfficiency } from "@/lib/aiEngineering";

export default function WorkflowEfficiencyPanel({ phases }: { phases: PhaseEfficiency[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h4 className="font-display text-sm font-semibold mb-3">Workflow Efficiency</h4>
      {phases.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados de fases no período.</p>
      ) : (
        <div className="space-y-2">
          {phases.map((phase) => (
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
  );
}
