import { GATE_EFFICIENCY, DATA_DATE } from "@/lib/workflowDemoData";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * WorkflowEfficiency — "Os gates estão pegando bugs?" Seção com dados REAIS
 * de docs/tracking/: violações bloqueadas, auto-correções (healed) e as
 * regras que mais falharam. Port do objetivo "validar eficiência do processo".
 */

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
            "text-2xl md:text-3xl font-extrabold font-display",
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
  const max = GATE_EFFICIENCY.topViolations[0]?.count ?? 1;
  const pct = Math.round((count / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-xs font-mono font-semibold text-foreground">{rule}</span>
        <span className="shrink-0 text-xs font-bold text-foreground">{count}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-warning/70 to-destructive"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function WorkflowEfficiency() {
  const { ruleFails, healed, healedRate, prePrTotal, prePrPass, prePrPassRate, gateBlocked } =
    GATE_EFFICIENCY;

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Eficiência real
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        Os gates estão pegando bugs?
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Números <b className="text-foreground">reais</b> do repositório em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{DATA_DATE}</code> — cada
        violação de regra é um problema <b className="text-foreground">pego antes do PR</b>, não em
        produção:
      </p>

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
          sub={`${healedRate}% do pre-pr corrige sozinho`}
          tone="ok"
        />
        <StatCard
          value={`${prePrPassRate}%`}
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
        {GATE_EFFICIENCY.topViolations.map((v) => (
          <ViolationRow key={v.rule} rule={v.rule} count={v.count} hint={v.hint} />
        ))}
        <p className="pt-1 text-[11px] text-muted-foreground">
          📌 A regra <code className="font-mono">rule-10-clean</code> domina: artefatos gerados
          (relatórios/tracking) esquecem de ser commitados. Se ela fosse automatizada no pre-pr, a
          fricção cairia pela metade.
        </p>
      </div>
    </div>
  );
}
