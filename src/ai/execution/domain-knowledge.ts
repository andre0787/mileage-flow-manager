/**
 * domain-knowledge.ts — Conhecimento de domínio para o Domain Scout (§16).
 *
 * Regras de negócio NÃO são inferíveis do schema — são codificadas nas
 * convenções do projeto (docs/conventions/feature.md) e nas libs de
 * negócio (src/lib/metrics.ts, invariants). Este módulo materializa esse
 * conhecimento por tabela, para o `domainScout` responder
 * `businessRules`/`dataImpacts` de forma determinística.
 *
 * Fail-open: tabela desconhecida → regras vazias (nunca lança).
 */

export interface BusinessRule {
  rule: string;
  source: string;
}

export interface DomainKnowledge {
  tables: Record<string, { businessRules: BusinessRule[]; dataImpacts: string[] }>;
}

/** Regras financeiras documentadas em docs/conventions/feature.md §Invariantes. */
const FINANCIAL_RULES: BusinessRule[] = [
  {
    rule: "Toda operação que altera saldo de conta DEVE ter inversão espelhada testada",
    source: "docs/conventions/feature.md — Invariantes Financeiras",
  },
  {
    rule: "Reversão de transferência usa custo proporcional (calcProportionalCost), não valor integral",
    source: "src/lib/metrics.ts — calcProportionalCost",
  },
  {
    rule: "totalMiles é calculado de entradas - transferências - vendas (não de accounts.balance denormalizado)",
    source: "src/lib/metrics.ts — computeDashboardMetrics",
  },
  {
    rule: "Transferências movem milhas entre contas e não criam milhas novas (excluídas de milesIn)",
    source: "src/lib/metrics.ts — computeDashboardMetrics/computeMetricHistory",
  },
  {
    rule: "Vendas canceladas são excluídas de receita/lucro (filterActiveSales)",
    source: "src/lib/metrics.ts — filterActiveSales",
  },
];

/** Regras de dados do cadastro (CPF/RLS). */
const DATA_RULES: BusinessRule[] = [
  {
    rule: "Toda tabela tem RLS com auth.uid() — dados isolados por usuário",
    source: "AGENTS.md rule-40/43 + supabase/migrations",
  },
  {
    rule: "CPF em dados sensíveis deve ser tratado timezone-safe (parseDateOnly) e redigido em telemetria",
    source: "src/lib/dateUtils.ts + src/ai/execution/sanitize.ts",
  },
];

/** Conhecimento por tabela de domínio (materializado das convenções/código). */
export const DOMAIN_KNOWLEDGE: DomainKnowledge = {
  tables: {
    accounts: {
      businessRules: [...FINANCIAL_RULES],
      dataImpacts: ["balance", "total_invested", "average_cost_per_mile"],
    },
    entries: {
      businessRules: [
        FINANCIAL_RULES[0],
        FINANCIAL_RULES[2],
        FINANCIAL_RULES[3],
        {
          rule: "Entradas 'aguardando' não contam para milhas totais (entryStatus)",
          source: "src/lib/metrics.ts — confirmedEntries",
        },
      ],
      dataImpacts: ["accounts.balance", "accounts.total_invested", "totalMiles (dashboard)"],
    },
    sales: {
      businessRules: [
        FINANCIAL_RULES[0],
        FINANCIAL_RULES[4],
        {
          rule: "Lucro = valorVenda - milhasUsadas × custoPorMilha - custosAdicionais",
          source: "src/lib/metrics.ts — calcProfit",
        },
      ],
      dataImpacts: ["accounts.balance", "totalMiles (dashboard)", "CPF por owner (alerta)"],
    },
    owners: {
      businessRules: [
        {
          rule: "Alerta de CPF quando nº de CPFs usados por owner atinge maxCpfPerOwner - 4",
          source: "src/lib/metrics.ts — cpfAlerts",
        },
        ...DATA_RULES,
      ],
      dataImpacts: ["accounts.ownerId", "alerts (account_alerts)"],
    },
    clients: {
      businessRules: DATA_RULES,
      dataImpacts: [],
    },
    programs: {
      businessRules: [],
      dataImpacts: ["accounts.programId"],
    },
    origem_types: {
      businessRules: [
        {
          rule: "Tipos de origem são preservados ao recriar dados (UI promete 'Transferência' disponível)",
          source: "docs/conventions/feature.md — Promessas de UI",
        },
      ],
      dataImpacts: [],
    },
    account_alerts: {
      businessRules: [
        {
          rule: "Alertas derivam de regras de negócio (ex.: limite de CPFs por owner)",
          source: "src/lib/metrics.ts + src/features/alerts/",
        },
      ],
      dataImpacts: [],
    },
  },
};

/** Regras de negócio de uma tabela (fail-open: vazias se desconhecida). */
export function businessRulesForTable(table: string): BusinessRule[] {
  return DOMAIN_KNOWLEDGE.tables[table]?.businessRules ?? [];
}

/** Impactos de dados de uma tabela (fail-open: vazios se desconhecida). */
export function dataImpactsForTable(table: string): string[] {
  return DOMAIN_KNOWLEDGE.tables[table]?.dataImpacts ?? [];
}
