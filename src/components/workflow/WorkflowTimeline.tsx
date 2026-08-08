import { FLUXO_ITEMS, FLUXO_LOOP } from "@/lib/workflowDemoData";
import { cn } from "@/lib/utils";

/**
 * WorkflowTimeline — "Linha do tempo do workflow": visão conectada com linha
 * contínua central, fases, gates em âmbar, passo fail-closed e loop de correção.
 * Port da seção #fluxo do relatório ilustrativo.
 */
export function WorkflowTimeline() {
  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Como funciona na prática
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        Linha do tempo do workflow
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        A visão conectada: uma <b className="text-foreground">linha contínua</b> atravessa todos os
        passos em ordem. <span className="font-bold text-amber-700 dark:text-amber-400">Âmbar</span>{" "}
        = portão (gate) que decide se o fluxo segue;{" "}
        <span className="font-bold text-red-700 dark:text-red-400">vermelho</span> = passo
        fail-closed (falha de propósito). As fases marcam a evolução do tempo.
      </p>

      <div className="relative mt-6">
        {/* linha central */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 md:-translate-x-1/2 bg-gradient-to-b from-primary via-muted to-muted" />

        <div className="space-y-6">
          {FLUXO_ITEMS.map((item, i) => {
            if (item.type === "phase") {
              return (
                <div key={i} className="relative z-10 flex justify-start md:justify-center pl-0">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                    {item.phase.label}
                  </span>
                </div>
              );
            }
            const s = item.step;
            const side = s.side;
            const isGate = s.kind === "gate";
            const isFail = s.kind === "fail";
            return (
              <div key={i} className={cn("relative flex items-start gap-4", "md:gap-0")}>
                {/* dot na linha */}
                <div
                  className={cn(
                    "absolute left-4 md:left-1/2 top-4 h-3 w-3 -translate-x-1/2 rounded-full border-2 bg-card z-10",
                    isFail ? "border-red-500" : isGate ? "border-amber-500" : "border-primary",
                  )}
                />
                {/* card alternando lado */}
                <div
                  className={cn(
                    "ml-10 md:ml-0 md:w-1/2",
                    side === "right" ? "md:pl-8" : "md:pr-8 md:text-right md:ml-auto",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
                      isFail
                        ? "border-red-300 dark:border-red-900"
                        : isGate
                          ? "border-amber-300 dark:border-amber-900"
                          : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wide",
                        isFail
                          ? "text-red-600 dark:text-red-400"
                          : isGate
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {s.time}
                    </span>
                    <div className="mt-0.5 text-sm font-bold text-foreground">{s.title}</div>
                    <p className="mt-1 text-[13px] text-muted-foreground">{s.desc}</p>
                    <span
                      className={cn(
                        "mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        s.tagKind === "warn"
                          ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : s.tagKind === "fail"
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                            : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      )}
                    >
                      {s.tag}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* loop de correção (desvio fail-closed) */}
          <div className="relative z-10 text-center">
            <div className="inline-block max-w-md text-left rounded-xl border-2 border-dashed border-red-400 bg-red-50 dark:bg-red-950/40 p-4">
              <div className="text-xs font-extrabold text-red-600 dark:text-red-400">
                {FLUXO_LOOP.failArrow}
              </div>
              <div className="mt-1 text-sm font-bold text-foreground">{FLUXO_LOOP.title}</div>
              <p className="mt-1 text-[13px] text-muted-foreground">{FLUXO_LOOP.desc}</p>
              <span className="mt-2 inline-block rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {FLUXO_LOOP.tag}
              </span>
            </div>
            <div className="mt-2 text-xs font-extrabold text-red-600 dark:text-red-400">
              {FLUXO_LOOP.okArrow}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
