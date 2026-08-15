/**
 * dataset.ts — Benchmark Dataset (P11-06 Benchmark Framework).
 *
 * Tasks representativas T1-T8 (spec §P11-06): trivial, local, cross-file,
 * domain, schema, API, regression, architectural. Cada task declara sinais
 * objetivos para o classifier (P11-05) — permitindo benchmark por classe.
 */

import type { ClassificationSignals } from "@/ai/orchestration/classifier";

export interface BenchmarkTask {
  id: string;
  label: string;
  category: string;
  signals: ClassificationSignals;
}

/** Dataset canônico de benchmark (T1-T8). */
export const BENCHMARK_DATASET: BenchmarkTask[] = [
  {
    id: "T1",
    label: "trivial — renomear label local",
    category: "trivial",
    signals: {
      affectedFiles: ["src/lib/utils.ts"],
      dependencyCount: 0,
      risk: "low",
      touchesSchema: false,
      touchesApi: false,
      touchesSecurity: false,
      graphComplexity: 0,
      touchesHistory: false,
    },
  },
  {
    id: "T2",
    label: "local — ajustar cálculo de saldo em accounts",
    category: "local",
    signals: {
      affectedFiles: ["src/lib/accounts.ts"],
      dependencyCount: 2,
      risk: "low",
      touchesSchema: false,
      touchesApi: false,
      touchesSecurity: false,
      graphComplexity: 4,
      touchesHistory: false,
    },
  },
  {
    id: "T3",
    label: "cross-file — mover formatação de data entre módulos",
    category: "cross-file",
    signals: {
      affectedFiles: ["src/lib/dateUtils.ts", "src/lib/dates.ts", "src/components/x.tsx"],
      dependencyCount: 6,
      risk: "medium",
      touchesSchema: false,
      touchesApi: true,
      touchesSecurity: false,
      graphComplexity: 15,
      touchesHistory: false,
    },
  },
  {
    id: "T4",
    label: "domain — regra de negócio de milhas/entradas",
    category: "domain",
    signals: {
      affectedFiles: ["src/lib/entryOperations.ts", "src/lib/metrics.ts"],
      dependencyCount: 5,
      risk: "medium",
      touchesSchema: false,
      touchesApi: false,
      touchesSecurity: false,
      graphComplexity: 12,
      touchesHistory: false,
    },
  },
  {
    id: "T5",
    label: "schema — migration nova com RLS",
    category: "schema",
    signals: {
      affectedFiles: ["supabase/migrations/new.sql", "src/lib/supabase-types.ts"],
      dependencyCount: 4,
      risk: "high",
      touchesSchema: true,
      touchesApi: true,
      touchesSecurity: true,
      graphComplexity: 18,
      touchesHistory: false,
    },
  },
  {
    id: "T6",
    label: "api — endpoint/contrato público",
    category: "api",
    signals: {
      affectedFiles: ["src/pages/Entradas.tsx", "src/lib/entryFormValidation.ts"],
      dependencyCount: 7,
      risk: "medium",
      touchesSchema: false,
      touchesApi: true,
      touchesSecurity: false,
      graphComplexity: 22,
      touchesHistory: false,
    },
  },
  {
    id: "T7",
    label: "regression — corrigir bug de histórico",
    category: "regression",
    signals: {
      affectedFiles: ["src/lib/recurrence.ts"],
      dependencyCount: 3,
      risk: "high",
      touchesSchema: false,
      touchesApi: false,
      touchesSecurity: false,
      graphComplexity: 8,
      touchesHistory: true,
    },
  },
  {
    id: "T8",
    label: "architectural — orquestração de features",
    category: "architectural",
    signals: {
      affectedFiles: ["src/features/kpi/index.ts", "src/features/workflow/index.ts"],
      dependencyCount: 12,
      risk: "high",
      touchesSchema: false,
      touchesApi: true,
      touchesSecurity: true,
      graphComplexity: 40,
      touchesHistory: false,
    },
  },
];
