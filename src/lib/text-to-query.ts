/**
 * text-to-query.ts — Conversão de linguagem natural para filtros de consulta.
 *
 * Domínio específico: relatórios de milhas/pontos (entradas, vendas, contas).
 *
 * Uso:
 *   import { parseNaturalQuery } from "@/lib/text-to-query";
 *   const filters = parseNaturalQuery("vendas do mês passado por cliente");
 *   // → { table: "sales", dateRange: "lastMonth", groupBy: "client" }
 *
 * ponytail: regex + lookup tables, zero deps externas
 */

// ── Tipos ───────────────────────────────────────────────────────────

export interface QueryFilter {
  /** Tabela alvo */
  table: "entries" | "sales" | "accounts" | "clients";
  /** Período de data */
  period?: "today" | "this_week" | "this_month" | "last_month" | "this_year" | "last_year" | "all";
  /** Campo de agregação */
  groupBy?: "program" | "account" | "client" | "owner" | "status" | "none";
  /** Métrica principal */
  metric?: "amount" | "profit" | "count" | "cost" | "balance";
  /** Status específico */
  status?: "confirmada" | "aguardando" | "pendente" | "pago" | "concluido" | "cancelado";
  /** Nome de programa específico */
  program?: string;
  /** Texto livre adicional */
  searchText?: string;
  /** Flag se é agregação */
  isAggregate: boolean;
  /** Label da query em pt-BR */
  label: string;
}

// ── Dicionário de padrões ───────────────────────────────────────────

type PatternHandler = (match: RegExpExecArray) => Partial<QueryFilter>;

interface NLPattern {
  regex: RegExp;
  handler: PatternHandler;
  labelTemplate: string;
}

const PATTERNS: NLPattern[] = [
  // Vendas
  {
    regex: /vendas?\s*(por|de|do)?\s*(cliente|clientes)/i,
    handler: () => ({ table: "sales", groupBy: "client", metric: "profit" }),
    labelTemplate: "Vendas por cliente",
  },
  {
    regex: /vendas?\s*(do|no|por)?\s*(mês|mes)\s*(passado|anterior)/i,
    handler: () => ({ table: "sales", period: "last_month", metric: "profit" }),
    labelTemplate: "Vendas do mês passado",
  },
  {
    regex: /vendas?\s*(do|no|por)?\s*(mês|mes|periodo)/i,
    handler: () => ({ table: "sales", period: "this_month", metric: "profit" }),
    labelTemplate: "Vendas do mês",
  },
  {
    regex: /vendas?\s*(por|de)\s*programa/i,
    handler: () => ({ table: "sales", groupBy: "program", metric: "profit" }),
    labelTemplate: "Vendas por programa",
  },
  {
    regex: /vendas?\s*(pendentes|abertos)/i,
    handler: () => ({ table: "sales", status: "pendente", metric: "count" }),
    labelTemplate: "Vendas pendentes",
  },
  {
    regex: /vendas?\s*(concluídas|concluidas|finalizadas)/i,
    handler: () => ({ table: "sales", status: "concluido", metric: "profit" }),
    labelTemplate: "Vendas concluídas",
  },

  // Entradas (compras de milhas/pontos)
  {
    regex: /entradas?\s*(por|de|do)?\s*(mês|mes|periodo)/i,
    handler: () => ({ table: "entries", period: "this_month", metric: "amount" }),
    labelTemplate: "Entradas do mês",
  },
  {
    regex: /entradas?\s*(do|no)?\s*(mês|mes)\s*(passado|anterior)/i,
    handler: () => ({ table: "entries", period: "last_month", metric: "amount" }),
    labelTemplate: "Entradas do mês passado",
  },
  {
    regex: /entradas?\s*(por|de)\s*programa/i,
    handler: () => ({ table: "entries", groupBy: "program", metric: "amount" }),
    labelTemplate: "Entradas por programa",
  },
  {
    regex: /compras?\s*(do|de|por)?\s*(mês|mes)/i,
    handler: () => ({ table: "entries", period: "this_month", metric: "amount" }),
    labelTemplate: "Compras do mês",
  },

  // Contas/Saldos
  {
    regex: /saldos?\s*(por|de)\s*programa/i,
    handler: () => ({ table: "accounts", groupBy: "program", metric: "balance" }),
    labelTemplate: "Saldo por programa",
  },
  {
    regex: /saldo\s*(atual|total|geral)/i,
    handler: () => ({ table: "accounts", period: "all", metric: "balance", isAggregate: true }),
    labelTemplate: "Saldo total",
  },
  {
    regex: /contas?\s*(ativas|ativa)/i,
    handler: () => ({ table: "accounts", status: "confirmada", metric: "count", isAggregate: true }),
    labelTemplate: "Contas ativas",
  },
  {
    regex: /contas?\s*(inativas|inativa)/i,
    handler: () => ({ table: "accounts", status: "aguardando", metric: "count", isAggregate: true }),
    labelTemplate: "Contas inativas",
  },

  // Clientes
  {
    regex: /clientes?\s*(mais|que mais)\s*compraram/i,
    handler: () => ({ table: "clients", groupBy: "client", metric: "count" }),
    labelTemplate: "Clientes que mais compraram",
  },
  {
    regex: /clientes?\s*ativos/i,
    handler: () => ({ table: "clients", status: "confirmada", metric: "count", isAggregate: true }),
    labelTemplate: "Clientes ativos",
  },

  // Lucro/ROI
  {
    regex: /lucro\s*(do|no)?\s*(mês|mes)/i,
    handler: () => ({ table: "sales", period: "this_month", metric: "profit" }),
    labelTemplate: "Lucro do mês",
  },
  {
    regex: /lucro\s*(total|geral|acumulado)/i,
    handler: () => ({ table: "sales", period: "all", metric: "profit", isAggregate: true }),
    labelTemplate: "Lucro total",
  },
  {
    regex: /rentabilidade|roi|retorno/i,
    handler: () => ({ table: "entries", period: "all", metric: "cost", isAggregate: true }),
    labelTemplate: "Rentabilidade geral",
  },

  // Períodos gerais
  {
    regex: /(hoje|hj|di[ea]\s+atual)/i,
    handler: () => ({ period: "today" }),
    labelTemplate: "Hoje",
  },
  {
    regex: /(essa|esta|nessa)\s*semana/i,
    handler: () => ({ period: "this_week" }),
    labelTemplate: "Esta semana",
  },
  {
    regex: /esse\s*ano|este\s*ano|ano\s*atual/i,
    handler: () => ({ period: "this_year", metric: "profit" }),
    labelTemplate: "Este ano",
  },
  {
    regex: /ano\s*(passado|anterior)/i,
    handler: () => ({ period: "last_year", metric: "profit" }),
    labelTemplate: "Ano passado",
  },
  {
    regex: /(?:todo|tudo|todos|geral|completo)/i,
    handler: () => ({ period: "all", isAggregate: true }),
    labelTemplate: "Geral (todos os períodos)",
  },
];

// ── Função principal ────────────────────────────────────────────────

/**
 * Interpreta uma query em linguagem natural e retorna filtros estruturados.
 */
export function parseNaturalQuery(query: string): QueryFilter | null {
  const clean = query.trim();
  if (!clean) return null;

  const result: Partial<QueryFilter> = {
    isAggregate: false,
  };
  let matchedLabel = "Consulta personalizada";

  for (const pattern of PATTERNS) {
    const match = pattern.regex.exec(clean);
    if (match) {
      const partial = pattern.handler(match);
      Object.assign(result, partial);
      matchedLabel = pattern.labelTemplate;
      break; // first match wins
    }
  }

  // Tabela padrão se não identificada
  if (!result.table) {
    // Tenta inferir pelo contexto
    if (/venda|vender|lucro|receita|faturamento|cliente/i.test(clean)) {
      result.table = "sales";
    } else if (/conta|saldo|programa/i.test(clean)) {
      result.table = "accounts";
    } else if (/entrada|compra|adquirir|custo|investimento/i.test(clean)) {
      result.table = "entries";
    } else {
      result.table = "sales"; // fallback
    }
    result.label = matchedLabel;
  }

  // Extrai nome de programa na query
  const programMatch = clean.match(/(azul|latam|smiles|todes|livelo|esfera|dotz|tudo[\s-]?azul)/i);
  if (programMatch) {
    result.program = programMatch[0].trim();
  }

  return {
    table: result.table!,
    period: result.period,
    groupBy: result.groupBy,
    metric: result.metric,
    status: result.status,
    program: result.program,
    searchText: result.searchText,
    isAggregate: result.isAggregate ?? false,
    label: result.label ?? matchedLabel,
  };
}

/**
 * Gera um texto descritivo amigável a partir dos filtros.
 */
export function describeFilters(filters: QueryFilter): string {
  const parts: string[] = [];

  const tableLabels: Record<string, string> = {
    entries: "entradas",
    sales: "vendas",
    accounts: "contas",
    clients: "clientes",
  };

  if (filters.label && filters.label !== "Consulta personalizada") {
    return filters.label;
  }

  parts.push(`Relatório de ${tableLabels[filters.table] || filters.table}`);

  if (filters.period && filters.period !== "all") {
    const periodLabels: Record<string, string> = {
      today: "hoje",
      this_week: "esta semana",
      this_month: "este mês",
      last_month: "mês passado",
      this_year: "este ano",
      last_year: "ano passado",
    };
    parts.push(periodLabels[filters.period] || filters.period);
  }

  if (filters.groupBy && filters.groupBy !== "none") {
    parts.push(`agrupado por ${filters.groupBy}`);
  }

  if (filters.status) {
    parts.push(`status: ${filters.status}`);
  }

  if (filters.program) {
    parts.push(filters.program);
  }

  return parts.join(" | ");
}

/**
 * Converte QueryFilter para parâmetros de chamada Supabase.
 */
export function filtersToSupabaseParams(filters: QueryFilter): {
  table: string;
  select: string;
  range?: { start: string; end: string };
  eq?: Record<string, string>;
} {
  const tableMap: Record<string, string> = {
    entries: "point_entries",
    sales: "sales",
    accounts: "accounts",
    clients: "clients",
  };

  return {
    table: tableMap[filters.table] || filters.table,
    select: filters.isAggregate ? "count" : "*",
    eq: filters.status ? { status: filters.status } : undefined,
  };
}
