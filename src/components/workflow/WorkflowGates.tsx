import { GATES } from "@/lib/workflowDemoData";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * WorkflowGates — "Os portões": cards dos gates de qualidade.
 * Port da seção de gates do relatório ilustrativo.
 */
export function WorkflowGates() {
  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Os portões
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        4 gates que protegem a entrega
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Cada gate tem uma pergunta simples. Se a resposta for "não", o fluxo para — e o sistema diz
        como destravar.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {GATES.map((g) => (
          <Card key={g.title}>
            <CardContent className="p-5">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="text-xl">{g.emoji}</span>
                {g.title}
              </h4>
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                <b className="text-foreground">Pergunta:</b> {g.question}
                <br />
                <b className="text-foreground">Como funciona:</b> {g.how}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {g.rule}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-bold",
                    g.stateKind === "ok" &&
                      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                    g.stateKind === "fail" &&
                      "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
                    g.stateKind === "warn" &&
                      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
                  )}
                >
                  {g.state}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
