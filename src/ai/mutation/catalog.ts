/**
 * P12.6-02 — Mutation Catalog
 *
 * 10 mutations iniciais cobrindo UI, API, Data, Validation, State,
 * Workflow, Regression, Performance e Authorization.
 *
 * Evolui para 20 na fase de expansão.
 */

import type { MutationCase, MutationCategory, MutationSeverity } from "./types";

// ─── Mutation Definitions ──────────────────────────────────────

export const MUTATION_CATALOG: MutationCase[] = [
  // ── M01: Dashboard total incorreto (UI) ──
  {
    id: "M01",
    category: "ui",
    severity: "high",
    target: "src/pages/Dashboard.tsx",
    description: "Dashboard exibe total de entradas incorreto — valor hardcoded em vez de calculado",
    expectedBehavior: "Dashboard mostra soma real das entradas do usuário",
    mutatedBehavior: "Dashboard mostra valor fixo hardcoded (ex: 0 ou 99999)",
    activation: {
      type: "file_replace",
      file: "src/pages/Dashboard.tsx",
      search: "totalEntradas",
      replace: "99999",
    },
    cleanup: { type: "git_checkout", file: "src/pages/Dashboard.tsx" },
    tags: ["dashboard", "display", "total"],
    estimatedDetectionDifficulty: "easy",
  },

  // ── M02: Create funciona no backend mas UI não atualiza (State) ──
  {
    id: "M02",
    category: "state",
    severity: "high",
    target: "src/features/entradas",
    description: "Entrada é criada no backend mas a lista na UI não atualiza (refetch removido)",
    expectedBehavior: "Após criar entrada, lista é atualizada automaticamente",
    mutatedBehavior: "Lista não atualiza — entrada aparece só após refresh da página",
    activation: {
      type: "file_inject",
      file: "src/features/entradas/index.ts",
      after: "onSuccess",
      inject: "// MUTATION: removed refetch",
    },
    cleanup: { type: "git_checkout", file: "src/features/entradas/index.ts" },
    tags: ["state", "refetch", "cache", "stale"],
    estimatedDetectionDifficulty: "medium",
  },

  // ── M03: Validação aceita valor inválido (Validation) ──
  {
    id: "M03",
    category: "validation",
    severity: "critical",
    target: "src/pages/Entradas.tsx",
    description: "Validação de formulário aceita valor negativo para campos monetários",
    expectedBehavior: "Formulário rejeita valores negativos em campos de valor",
    mutatedBehavior: "Formulário aceita valores negativos sem erro",
    activation: {
      type: "file_replace",
      file: "src/pages/Entradas.tsx",
      search: "min: 0",
      replace: "min: -999999",
    },
    cleanup: { type: "git_checkout", file: "src/pages/Entradas.tsx" },
    tags: ["validation", "form", "negative", "boundary"],
    estimatedDetectionDifficulty: "easy",
  },

  // ── M04: Delete atualiza UI mas mantém total incorreto (UI + State) ──
  {
    id: "M04",
    category: "ui",
    severity: "medium",
    target: "src/pages/Dashboard.tsx",
    description: "Após deletar entrada, item some da lista mas total permanece o mesmo",
    expectedBehavior: "Total é recalculado após delete",
    mutatedBehavior: "Total não muda após delete — permanece com valor anterior",
    activation: {
      type: "file_inject",
      file: "src/pages/Dashboard.tsx",
      after: "totalEntradas",
      inject: "// MUTATION: stale total calculation\n// Total not updated after delete",
    },
    cleanup: { type: "git_checkout", file: "src/pages/Dashboard.tsx" },
    tags: ["ui", "delete", "total", "stale"],
    estimatedDetectionDifficulty: "medium",
  },

  // ── M05: Filtro retorna item indevido (API) ──
  {
    id: "M05",
    category: "api",
    severity: "high",
    target: "src/features/entradas/index.ts",
    description: "Filtro por programa retorna entradas de outros programas",
    expectedBehavior: "Filtro retorna apenas entradas do programa selecionado",
    mutatedBehavior: "Filtro ignora critério — retorna todas as entradas",
    activation: {
      type: "file_replace",
      file: "src/features/entradas/index.ts",
      search: ".eq(",
      replace: ".neq(",
    },
    cleanup: { type: "git_checkout", file: "src/features/entradas/index.ts" },
    tags: ["api", "filter", "query", "wrong-result"],
    estimatedDetectionDifficulty: "medium",
  },

  // ── M06: Endpoint retorna 500 (API) ──
  {
    id: "M06",
    category: "api",
    severity: "critical",
    target: "src/features/api/baseApi.ts",
    description: "Endpoint de contas retorna erro 500 em vez de dados",
    expectedBehavior: "Endpoint retorna lista de contas com status 200",
    mutatedBehavior: "Endpoint lança exceção — status 500",
    activation: {
      type: "file_inject",
      file: "src/features/api/baseApi.ts",
      after: "fetchBaseQuery",
      inject: "\n// MUTATION: throw error on accounts endpoint\nthrow new Error('Simulated 500');",
    },
    cleanup: { type: "git_checkout", file: "src/features/api/baseApi.ts" },
    tags: ["api", "error", "500", "endpoint"],
    estimatedDetectionDifficulty: "easy",
  },

  // ── M07: API retorna campo/valor incorreto (Data) ──
  {
    id: "M07",
    category: "data",
    severity: "high",
    target: "src/features/vendas/index.ts",
    description: "Endpoint de vendas retorna campo 'valor' com valor duplicado (2x)",
    expectedBehavior: "Campo 'valor' retorna o valor correto da venda",
    mutatedBehavior: "Campo 'valor' retorna o dobro do valor real",
    activation: {
      type: "file_inject",
      file: "src/features/vendas/index.ts",
      after: "data",
      inject: "\n// MUTATION: double the value field\n.map((v: any) => ({ ...v, valor: v.valor * 2 }))",
    },
    cleanup: { type: "git_checkout", file: "src/features/vendas/index.ts" },
    tags: ["data", "transformation", "wrong-value", "vendas"],
    estimatedDetectionDifficulty: "hard",
  },

  // ── M08: Estado local fica stale (State) ──
  {
    id: "M08",
    category: "state",
    severity: "medium",
    target: "src/features/entradas/index.ts",
    description: "Cache do RTK Query não invalida após mutation — dados ficam stale",
    expectedBehavior: "Cache é invalidado automaticamente após create/update/delete",
    mutatedBehavior: "Tags de invalidação removidas — dados ficam stale indefinidamente",
    activation: {
      type: "file_replace",
      file: "src/features/entradas/index.ts",
      search: "invalidatesTags",
      replace: "() => []",
    },
    cleanup: { type: "git_checkout", file: "src/features/entradas/index.ts" },
    tags: ["state", "cache", "stale", "rtk"],
    estimatedDetectionDifficulty: "hard",
  },

  // ── M09: Workflow informa status incorreto (Workflow) ──
  {
    id: "M09",
    category: "workflow",
    severity: "medium",
    target: "src/pages/Workflow.tsx",
    description: "Workflow mostra status 'Concluído' quando está 'Em andamento'",
    expectedBehavior: "Status reflete o estado real do workflow",
    mutatedBehavior: "Status hardcoded como 'Concluído' independente do estado real",
    activation: {
      type: "file_replace",
      file: "src/pages/Workflow.tsx",
      search: "status",
      replace: "'Concluído'",
    },
    cleanup: { type: "git_checkout", file: "src/pages/Workflow.tsx" },
    tags: ["workflow", "status", "incorrect"],
    estimatedDetectionDifficulty: "easy",
  },

  // ── M10: Boundary de autorização exposto (Authorization) ──
  {
    id: "M10",
    category: "authorization",
    severity: "critical",
    target: "src/features/auth/authSlice.ts",
    description: "Verificação de autorização exposta — dados de admin visíveis para usuários comuns",
    expectedBehavior: "Dados sensíveis não são expostos no client-side",
    mutatedBehavior: "Dados admin expostos no state global do Redux",
    activation: {
      type: "file_inject",
      file: "src/features/auth/authSlice.ts",
      after: "initialState",
      inject: "\n// MUTATION: expose admin data\nisAdmin: true, adminToken: 'exposed-token-123'",
    },
    cleanup: { type: "git_checkout", file: "src/features/auth/authSlice.ts" },
    tags: ["auth", "security", "exposed", "admin"],
    estimatedDetectionDifficulty: "hard",
  },
];

// ─── Catalog Helpers ───────────────────────────────────────────

/**
 * Get mutation by ID.
 */
export function getMutationById(id: string): MutationCase | undefined {
  return MUTATION_CATALOG.find((m) => m.id === id);
}

/**
 * Get mutations by category.
 */
export function getMutationsByCategory(category: MutationCategory): MutationCase[] {
  return MUTATION_CATALOG.filter((m) => m.category === category);
}

/**
 * Get mutations by severity.
 */
export function getMutationsBySeverity(severity: MutationSeverity): MutationCase[] {
  return MUTATION_CATALOG.filter((m) => m.severity === severity);
}

/**
 * Get mutations by difficulty.
 */
export function getMutationsByDifficulty(
  difficulty: "easy" | "medium" | "hard",
): MutationCase[] {
  return MUTATION_CATALOG.filter((m) => m.estimatedDetectionDifficulty === difficulty);
}

/**
 * Get all categories present in the catalog.
 */
export function getCatalogCategories(): MutationCategory[] {
  return [...new Set(MUTATION_CATALOG.map((m) => m.category))];
}

/**
 * Get catalog statistics.
 */
export function getCatalogStats(): {
  total: number;
  byCategory: Record<MutationCategory, number>;
  bySeverity: Record<MutationSeverity, number>;
  byDifficulty: Record<string, number>;
} {
  const byCategory = {} as Record<MutationCategory, number>;
  const bySeverity = {} as Record<MutationSeverity, number>;
  const byDifficulty: Record<string, number> = {};

  for (const m of MUTATION_CATALOG) {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    bySeverity[m.severity] = (bySeverity[m.severity] || 0) + 1;
    const diff = m.estimatedDetectionDifficulty || "unknown";
    byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
  }

  return { total: MUTATION_CATALOG.length, byCategory, bySeverity, byDifficulty };
}
