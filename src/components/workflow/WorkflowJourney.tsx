import { useState } from "react";
import { JOURNEY_STEPS } from "@/lib/workflowStaticData";
import { cn } from "@/lib/utils";

/**
 * WorkflowJourney — "A jornada": etapas clicáveis com evidência de telemetria.
 * Port do stepper do relatório ilustrativo.
 */
export function WorkflowJourney() {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        A jornada
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        De ideia a entrega, passo a passo
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Clique em cada etapa para ver o que acontece e qual{" "}
        <b className="text-foreground">telemetria</b> fica registrada. As etapas em{" "}
        <span className="font-bold text-emerald-600 dark:text-emerald-400">verde</span> já foram
        concluídas na prática; em{" "}
        <span className="font-bold text-red-600 dark:text-red-400">vermelho</span>, o que acontece
        se você pular uma delas.
      </p>

      <div className="space-y-2">
        {JOURNEY_STEPS.map((step, i) => {
          const isOpen = open.has(i);
          const isDone = step.done || i === 0;
          return (
            <div
              key={step.title + i}
              className={cn(
                "rounded-xl border bg-card transition-colors",
                step.blocked && "border-red-300 dark:border-red-900",
                isOpen && "ring-1 ring-ring",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="w-full flex items-start gap-3 p-4 text-left"
              >
                <span className="text-2xl leading-none">{step.dot}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{step.title}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        step.badgeKind === "gate"
                          ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        step.blocked &&
                          "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
                      )}
                    >
                      {step.badge}
                    </span>
                    {isDone && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ concluído
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[13.5px] text-muted-foreground">
                    {step.body}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-muted-foreground transition-transform shrink-0",
                    isOpen && "rotate-180",
                  )}
                >
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className="mx-4 mb-4 rounded-lg border border-dashed bg-muted/50 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    📡 Evidência registrada
                  </div>
                  <pre className="whitespace-pre-wrap text-xs font-mono text-foreground leading-relaxed">
                    {step.ev}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
