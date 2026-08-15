/**
 * dataset-base.ts — P12-01 Real Task Dataset (R1-R6).
 *
 * Split do dataset.ts para respeitar o hard limit de 150 linhas (rule-41).
 */

import type { RealTask } from "./types";

export const BASE_TASKS: RealTask[] = [
  {
    taskId: "R1",
    description: "Datas exibidas com 1 dia a menos no fuso -3 (América/São Paulo)",
    class: "small",
    risk: "medium",
    expectedFiles: ["src/lib/dates.ts", "src/lib/dateUtils.ts"],
    expectedModules: ["dates", "dateUtils"],
    domainRisk: "high",
    graphRisk: "low",
    testRisk: "high",
    apiRisk: "low",
    schemaRisk: "low",
    acceptanceCriteria: [
      "datas com fuso -3 preservam o dia correto",
      "sem regressão nas datas existentes",
    ],
  },
  {
    taskId: "R2",
    description: "Dashboard: transferências contadas como milhas novas inflando totalMiles",
    class: "medium",
    risk: "high",
    expectedFiles: ["src/lib/metrics.ts", "src/lib/dashboardSelectors.ts"],
    expectedModules: ["metrics", "dashboardSelectors"],
    domainRisk: "critical",
    graphRisk: "medium",
    testRisk: "high",
    apiRisk: "low",
    schemaRisk: "low",
    acceptanceCriteria: [
      "transferências não contam como milhas novas",
      "totalMiles reflete apenas milhas geradas",
      "testes de regressão de dashboard passam",
    ],
  },
  {
    taskId: "R3",
    description: "Seleção de conta de pontos vazia na transferência",
    class: "medium",
    risk: "high",
    expectedFiles: [
      "src/lib/transferCalc.ts",
      "src/lib/entryOperations.ts",
      "src/pages/Entradas.tsx",
    ],
    expectedModules: ["transferCalc", "entryOperations"],
    domainRisk: "high",
    graphRisk: "medium",
    testRisk: "high",
    apiRisk: "low",
    schemaRisk: "low",
    acceptanceCriteria: [
      "contas de pontos aparecem na seleção",
      "transferência completa sem cache manual",
    ],
  },
  {
    taskId: "R4",
    description: "Tipos de origem não aparecem na edição/exclusão",
    class: "small",
    risk: "medium",
    expectedFiles: ["src/lib/origemTypes.ts", "src/pages/Configuracoes.tsx"],
    expectedModules: ["origemTypes"],
    domainRisk: "medium",
    graphRisk: "low",
    testRisk: "medium",
    apiRisk: "low",
    schemaRisk: "low",
    acceptanceCriteria: [
      "tipos de origem visíveis na edição",
      "exclusão de tipo funciona sem recarregar",
    ],
  },
  {
    taskId: "R5",
    description: "Registro de entrada só salva após limpar cache",
    class: "small",
    risk: "medium",
    expectedFiles: ["src/lib/entryOperations.ts", "src/lib/supabase.ts"],
    expectedModules: ["entryOperations", "supabase"],
    domainRisk: "medium",
    graphRisk: "low",
    testRisk: "medium",
    apiRisk: "medium",
    schemaRisk: "low",
    acceptanceCriteria: [
      "entrada salva sem limpeza de cache",
      "dados aparecem imediatamente após salvar",
    ],
  },
  {
    taskId: "R6",
    description: "Supabase API retorna 409 no fluxo completo (conflito de chave)",
    class: "medium",
    risk: "high",
    expectedFiles: ["src/lib/entryOperations.ts", "src/lib/transferCalc.ts"],
    expectedModules: ["entryOperations", "transferCalc"],
    domainRisk: "high",
    graphRisk: "low",
    testRisk: "high",
    apiRisk: "critical",
    schemaRisk: "medium",
    acceptanceCriteria: [
      "fluxo completo não retorna 409",
      "tratamento de conflito com retry/upsert",
    ],
  },
];
