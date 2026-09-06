/**
 * Ordem canônica das abas de Relatórios (fluxo operacional).
 * Fonte única: os triggers são renderizados por map desta constante.
 * Constante separada do file de componentes por convenção (sem export de
 * constante em arquivo de componentes).
 */
export const REPORT_TABS = [
  { value: "pipeline", label: "Pipeline" },
  { value: "cobranca", label: "Cobrança" },
  { value: "donos", label: "Donos" },
  { value: "programas", label: "Programas" },
  { value: "insights", label: "Insights" },
] as const;
