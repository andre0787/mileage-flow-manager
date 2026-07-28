/**
 * useSmartQuery — Hook para consulta inteligente em linguagem natural.
 *
 * Encapsula parseNaturalQuery + auto-aplicação de filtros para páginas
 * de relatório do sistema MilesControl.
 *
 * Uso:
 *   const { nlQuery, setNlQuery, nlFilters, clearQuery, suggestions } = useSmartQuery();
 *
 * Integração:
 *   <SearchInput value={nlQuery} onChange={setNlQuery} ... />
 *   {nlFilters && <Badge>{describeFilters(nlFilters)}</Badge>}
 *
 * ponytail: zero estado externo, apenas React hooks + text-to-query
 */

import { useState, useMemo, useCallback } from "react";
import { parseNaturalQuery, describeFilters } from "@/lib/text-to-query";
import type { QueryFilter } from "@/lib/text-to-query";

const SUGGESTIONS = [
  "vendas do mês passado",
  "vendas pendentes",
  "entradas por programa",
  "clientes ativos",
  "lucro total",
  "saldo por programa",
  "rentabilidade geral",
] as const;

interface UseSmartQueryReturn {
  /** Valor atual da query em linguagem natural */
  nlQuery: string;
  /** Atualiza a query */
  setNlQuery: (value: string) => void;
  /** Filtros interpretados (null se vazio ou sem match) */
  nlFilters: QueryFilter | null;
  /** Descrição amigável dos filtros atuais */
  description: string;
  /** Limpa a query */
  clearQuery: () => void;
  /** Sugestões de consulta pré-definidas */
  suggestions: readonly string[];
  /** true se a query atual é válida */
  isValid: boolean;
}

export function useSmartQuery(): UseSmartQueryReturn {
  const [nlQuery, setNlQuery] = useState("");

  const nlFilters = useMemo(() => {
    if (!nlQuery.trim()) return null;
    return parseNaturalQuery(nlQuery);
  }, [nlQuery]);

  const description = useMemo(() => {
    if (!nlQuery.trim()) return "";
    return nlFilters ? describeFilters(nlFilters) : "Consulta não reconhecida";
  }, [nlQuery, nlFilters]);

  const clearQuery = useCallback(() => setNlQuery(""), []);

  return {
    nlQuery,
    setNlQuery,
    nlFilters,
    description,
    clearQuery,
    suggestions: SUGGESTIONS,
    isValid: nlQuery.trim() ? nlFilters !== null : true,
  };
}

/**
 * Mapeia QueryFilter.period para períodos numéricos do sistema.
 */
export function periodFromFilter(
  period?: string
): string | undefined {
  const periodMap: Record<string, string> = {
    today: "1",
    this_week: "7",
    this_month: "30",
    last_month: "60",
    this_year: "365",
    last_year: "730",
  };
  return period ? periodMap[period] : undefined;
}
