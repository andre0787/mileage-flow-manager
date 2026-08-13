import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PrRow, PrType } from "@/types/kpi";

const TYPE_STYLES: Record<PrType, string> = {
  feat: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  fix: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  refactor:
    "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
  docs: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  chore:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  other:
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/**
 * PrsPanel — "O que foi entregue": últimos PRs merged com tipo, benefício,
 * impacto no negócio e custo de token (derivados pelo gerador de dados).
 */
export function PrsPanel({ prs }: { prs: PrRow[] }) {
  if (prs.length === 0) return null;

  return (
    <section className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Entregas recentes
      </span>
      <h2 className="text-lg md:text-xl font-bold text-foreground font-display">
        O que foi entregue
      </h2>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {prs.map((pr) => (
              <div
                key={pr.number}
                className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
              >
                <span className="mt-0.5 shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                  #{pr.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13px] font-semibold text-foreground"
                    title={pr.title}
                  >
                    {pr.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    <b className="text-foreground">{pr.benefit}</b> · {pr.impact}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-bold",
                      TYPE_STYLES[pr.type],
                    )}
                  >
                    {pr.type}
                  </span>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">
                    {pr.date} · ~{pr.tokens} tok
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
