import { useState } from "react";
import { SIM_SCENARIOS } from "@/lib/workflowDemoData";
import { cn } from "@/lib/utils";

/**
 * WorkflowSimulator — "O que acontece se...?": simula o comportamento dos
 * gates em dois cenários. Port da seção de simulador do relatório ilustrativo.
 */
export function WorkflowSimulator() {
  const [active, setActive] = useState<string | null>(null);
  const scenario = SIM_SCENARIOS.find((s) => s.id === active) ?? null;

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Experimente
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        O que acontece se...?
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Clique nos botões para ver o comportamento real dos gates em dois cenários.
      </p>

      <div className="flex flex-wrap gap-3">
        {SIM_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              active === s.id
                ? s.id === "fail"
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-emerald-600 bg-emerald-600 text-white"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {scenario ? (
        <div className="rounded-xl border bg-card p-4 font-mono text-xs leading-relaxed overflow-x-auto">
          {scenario.lines.map((l, i) => (
            <div
              key={i}
              className={cn(
                "whitespace-pre-wrap",
                l.kind === "muted" && "text-muted-foreground",
                l.kind === "ok" && "text-emerald-600 dark:text-emerald-400 font-semibold",
                l.kind === "fail" && "text-red-600 dark:text-red-400 font-semibold",
                l.kind === "title" && "text-foreground font-bold",
              )}
            >
              {l.text}
            </div>
          ))}
          <div
            className={cn(
              "mt-3 border-t pt-2 font-bold",
              scenario.summaryKind === "fail"
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {scenario.summary}
          </div>
          <div className="mt-1 text-muted-foreground">{scenario.hint}</div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          Clique em um cenário acima para simular...
        </div>
      )}
    </div>
  );
}
