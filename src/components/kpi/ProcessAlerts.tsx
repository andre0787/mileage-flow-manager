import { cn } from "@/lib/utils";
import type { DailyMetric, Summary30 } from "@/types/kpi";

interface ProcessAlertsProps {
  daily: DailyMetric[];
  summary: Summary30;
}

interface Alert {
  tone: "ok" | "warn" | "critical";
  title: string;
  detail: string;
}

/**
 * ProcessAlerts — alertas de saúde do processo (datadog interno):
 * taxa de pre-pr, fricção do dia, entregas em 30d e auto-correção.
 * Lógica pura `buildProcessAlerts` separada para teste unitário.
 */
export function buildProcessAlerts(daily: DailyMetric[], summary: Summary30): Alert[] {
  const alerts: Alert[] = [];
  const today = daily[daily.length - 1];
  const healedRate =
    summary.violations > 0 ? Math.round((summary.healed / summary.violations) * 100) : null;

  if (summary.prePrPassRate !== null && summary.prePrPassRate < 70) {
    alerts.push({
      tone: "warn",
      title: "Taxa de pre-pr baixa",
      detail: `${summary.prePrPassRate}% em 30 dias — processo com fricção mecânica alta`,
    });
  }
  if (today && today.ruleFails > 10) {
    alerts.push({
      tone: "warn",
      title: "Fricção alta hoje",
      detail: `${today.ruleFails} violações hoje (média diária ~${summary.violations ? Math.max(1, Math.round(summary.violations / 30)) : 0})`,
    });
  }
  if (summary.merges === 0) {
    alerts.push({
      tone: "critical",
      title: "Nenhuma entrega em 30 dias",
      detail: "Fluxo parado — revisar gates ou fila de trabalho",
    });
  }
  if (healedRate !== null && healedRate < 10 && summary.violations > 20) {
    alerts.push({
      tone: "warn",
      title: "Auto-correção baixa",
      detail: `Apenas ${healedRate}% das violações são corrigidas sozinhas`,
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      tone: "ok",
      title: "Processo saudável",
      detail: `Taxa ${summary.prePrPassRate ?? "—"}% · ${summary.merges} entregas em 30d`,
    });
  }
  return alerts;
}

const TONE_STYLES = {
  ok: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warn: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  critical:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

export function ProcessAlerts({ daily, summary }: ProcessAlertsProps) {
  const alerts = buildProcessAlerts(daily, summary);

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.map((a) => (
        <div
          key={a.title}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11.5px] font-semibold",
            TONE_STYLES[a.tone],
          )}
        >
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              a.tone === "ok"
                ? "bg-emerald-500"
                : a.tone === "warn"
                  ? "bg-amber-500"
                  : "bg-red-500",
            )}
          />
          <span>{a.title}</span>
          <span className="font-normal opacity-80">· {a.detail}</span>
        </div>
      ))}
    </div>
  );
}
