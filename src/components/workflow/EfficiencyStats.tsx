import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkflowGateEfficiency } from "@/types/kpi";

function StatCard({
  value,
  label,
  sub,
  tone = "default",
}: {
  value: string;
  label: string;
  sub: string;
  tone?: "default" | "ok" | "warn";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={cn(
            "font-display text-2xl font-extrabold md:text-3xl",
            tone === "ok" && "text-success",
            tone === "warn" && "text-warning",
            tone === "default" && "text-primary",
          )}
        >
          {value}
        </div>
        <div className="mt-1 text-xs font-semibold text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function ViolationRow({ rule, count, hint }: { rule: string; count: number; hint: string }) {
  const max = 100; // barra relativa ao topo (100%)
  const pct = Math.min(100, Math.round((count / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-mono text-xs font-semibold text-foreground">{rule}</span>
        <span className="shrink-0 text-xs font-bold text-foreground">{count}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-warning/70 to-destructive"
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Grade de estatísticas + violações (extraído do WorkflowEfficiency para
 * manter cada arquivo ≤150 linhas — rule-41).
 */
export function EfficiencyStats({ gateEfficiency }: { gateEfficiency: WorkflowGateEfficiency }) {
  const {
    ruleFails,
    healed,
    healedRate,
    prePrTotal,
    prePrPass,
    prePrPassRate,
    gateBlocked,
    topViolations,
  } = gateEfficiency;
  const topRule = topViolations[0]?.rule ?? "rule-10-clean";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          value={String(ruleFails)}
          label="violações bloqueadas"
          sub="detectadas antes de virar PR"
          tone="warn"
        />
        <StatCard
          value={String(healed)}
          label="auto-correções (healed)"
          sub={`${healedRate ?? "—"}% do pre-pr corrige sozinho`}
          tone="ok"
        />
        <StatCard
          value={`${prePrPassRate ?? "—"}%`}
          label="pre-pr aprovados"
          sub={`${prePrPass} pass / ${prePrTotal} execuções`}
        />
        <StatCard
          value={String(gateBlocked)}
          label="gates bloqueados"
          sub="aguardando decisão humana (AUTH/council)"
          tone="warn"
        />
      </div>

      <h3 className="pt-4 text-[17px] font-bold text-foreground">
        ⚠️ Regras que mais pegaram problemas
      </h3>
      <div className="space-y-3 rounded-xl border bg-card p-4">
        {topViolations.map((v) => (
          <ViolationRow key={v.rule} rule={v.rule} count={v.count} hint={v.hint} />
        ))}{" "}
        {topRule === "rule-10-clean" && (
          <p className="pt-1 text-[11px] text-muted-foreground">
            📌 A regra <code className="font-mono">rule-10-clean</code> domina: artefatos gerados
            (relatórios/tracking) esquecem de ser commitados. Se ela fosse automatizada no pre-pr, a
            fricção cairia pela metade.
          </p>
        )}
      </div>
    </>
  );
}
