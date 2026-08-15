/**
 * BottlenecksPanel.tsx — P11-08 Bottlenecks.
 *
 * Extraído de AiEngineeringCommandCenter.tsx (rule-41 — hard limit de 150
 * linhas por arquivo).
 */

import type { BottleneckRow } from "@/lib/aiEngineering";

export default function BottlenecksPanel({ bottlenecks }: { bottlenecks: BottleneckRow[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h4 className="font-display text-sm font-semibold mb-2">Bottlenecks</h4>
      {bottlenecks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum gargalo detectado no período. ✅</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {bottlenecks.map((b, i) => (
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
  );
}
