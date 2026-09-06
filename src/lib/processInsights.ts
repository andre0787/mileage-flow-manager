import type { AiTelemetryAreaCost, DailyMetric, MonthlyKPI } from "@/types/kpi";

export type InsightSeverity = "ok" | "warn" | "info";

export interface ProcessInsight {
  id: string;
  severity: InsightSeverity;
  title: string;
  finding: string;
  recommendation: string;
  actionLabel: string;
  actionCommand: string;
}

export interface ProcessInsightsInput {
  daily: DailyMetric[];
  months: MonthlyKPI[];
  aiCosts?: AiTelemetryAreaCost[];
}

interface KnownRuleAction {
  recommendation: string;
  actionLabel: string;
  actionCommand: string;
}

/** Ações conhecidas por regra — fora daqui, a ação padrão é rodar o pre-pr. */
const RULE_ACTIONS: Record<string, KnownRuleAction> = {
  "rule-10-clean": {
    recommendation:
      "Artefatos gerados (relatórios/tracking) esquecem de ser commitados. Confira o git status antes do PR.",
    actionLabel: "Ver status",
    actionCommand: "git status --short",
  },
};

const DEFAULT_RULE_ACTION: KnownRuleAction = {
  recommendation: "Corrija as violações localmente antes de abrir o PR.",
  actionLabel: "Rodar pre-pr",
  actionCommand: "npm run pre-pr",
};

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Top violação somando os 2 últimos meses com dados (fonte: quality.jsonl via nightly). */
function topViolationInsight(months: MonthlyKPI[]): ProcessInsight | null {
  const counts = new Map<string, number>();
  for (const m of months.slice(-2)) {
    for (const v of m.topViolations ?? []) {
      counts.set(v.rule, (counts.get(v.rule) ?? 0) + num(v.count));
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] <= 0) return null;
  const known = RULE_ACTIONS[top[0]] ?? DEFAULT_RULE_ACTION;
  return {
    id: "top-violation",
    severity: "warn",
    title: `Regra que mais trava: ${top[0]}`,
    finding: `${top[1]} violações somadas nos últimos meses.`,
    recommendation: known.recommendation,
    actionLabel: known.actionLabel,
    actionCommand: known.actionCommand,
  };
}

/** Tendência da nota de qualidade entre os 2 últimos meses com nota. */
function gradeTrendInsight(months: MonthlyKPI[]): ProcessInsight | null {
  const graded = months.filter((m) => typeof m.avgOutcomeGrade === "number");
  const last2 = graded.slice(-2) as Array<MonthlyKPI & { avgOutcomeGrade: number }>;
  if (last2.length < 2) return null;
  const [prev, curr] = last2;
  const delta = curr.avgOutcomeGrade - prev.avgOutcomeGrade;
  const up = delta >= 0;
  return {
    id: "grade-trend",
    severity: up ? "ok" : "warn",
    title: `Nota de qualidade ${up ? "subiu" : "caiu"} (${prev.month} → ${curr.month})`,
    finding: `${prev.avgOutcomeGrade.toFixed(1)} → ${curr.avgOutcomeGrade.toFixed(1)} (${up ? "+" : ""}${delta.toFixed(1)}).`,
    recommendation: up
      ? "Mantenha o ritmo — revise qual gate mais ajudou e documente o padrão."
      : "Investigue as violações do mês antes do próximo PR para reverter a queda.",
    actionLabel: "Ver violações",
    actionCommand: "npm run pre-pr",
  };
}

/** Falhas de pre-pr nos últimos 7 dias com atividade. */
function prePrInsight(daily: DailyMetric[]): ProcessInsight | null {
  const week = daily.slice(-7);
  const total = week.reduce((s, d) => s + num(d.prePrTotal), 0);
  if (total <= 0) return null;
  const fails = week.reduce((s, d) => s + num(d.prePrFail), 0);
  if (fails <= 0) {
    return {
      id: "prepr-clean",
      severity: "ok",
      title: "Pre-pr limpo na semana",
      finding: `${total} execuções, 0 falhas nos últimos 7 dias.`,
      recommendation: "Mantenha rodando o pre-pr antes de todo PR.",
      actionLabel: "Rodar pre-pr",
      actionCommand: "npm run pre-pr",
    };
  }
  return {
    id: "prepr-fails",
    severity: "warn",
    title: "Falhas de pre-pr na semana",
    finding: `${fails} falhas em ${total} execuções nos últimos 7 dias.`,
    recommendation:
      "Rode o pre-pr local e corrija antes de empurrar — cada falha no CI custa um ciclo.",
    actionLabel: "Rodar pre-pr",
    actionCommand: "npm run pre-pr",
  };
}

/** Área de IA com maior custo estimado (fonte: ai_telemetry via nightly). */
function aiCostInsight(aiCosts?: AiTelemetryAreaCost[]): ProcessInsight | null {
  if (!aiCosts || aiCosts.length === 0) return null;
  const top = [...aiCosts].sort((a, b) => b.cost - a.cost)[0];
  return {
    id: "ai-cost",
    severity: "info",
    title: `Maior custo de IA: ${top.area}`,
    finding: `$${top.cost.toFixed(5)} em ${top.executions} execuções.`,
    recommendation: "Audite o custo por área e corte execuções redundantes no maior consumidor.",
    actionLabel: "Auditar telemetria",
    actionCommand: "npm run telemetry:audit",
  };
}

const SEVERITY_RANK: Record<InsightSeverity, number> = { warn: 0, info: 1, ok: 2 };

/**
 * Insights acionáveis do processo — lib pura a partir dos agregados do
 * nightly (events/quality). Sem dados de negócio (lucro/margem) aqui.
 */
export function buildProcessInsights(input: ProcessInsightsInput): ProcessInsight[] {
  const { daily, months, aiCosts } = input;
  const insights: ProcessInsight[] = [];
  const top = topViolationInsight(months);
  if (top) insights.push(top);
  const trend = gradeTrendInsight(months);
  if (trend) insights.push(trend);
  const prepr = prePrInsight(daily);
  if (prepr) insights.push(prepr);
  const cost = aiCostInsight(aiCosts);
  if (cost) insights.push(cost);
  return insights.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 4);
}
