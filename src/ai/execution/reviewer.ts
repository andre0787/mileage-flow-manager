/**
 * reviewer.ts — Reviewer (Agent Execution Spec §20).
 *
 * Recebe: implementation diff + original task + architecture decision +
 * graph impact. Procura: regressões, contratos quebrados, segurança,
 * testes ausentes, inconsistências arquiteturais. Retorna SubagentResult.
 *
 * Heurísticas (fail-open, determinísticas):
 *  - arquivo fora do writeScope → risk de violação de isolamento (§8);
 *  - arquivo de src/ sem teste correspondente → gap de teste;
 *  - impacto alto + diff grande → risk de regressão.
 */

import { emptySubagentResult, type SubagentResult } from "./subagent-result";

export interface ReviewInput {
  diffFiles: string[];
  writeScope: string[];
  taskId?: string;
  intent?: string;
  impactScore?: number;
  /** Mapa arquivo → teste existente (ex.: do Test Scout). */
  testsByFile?: Record<string, string[]>;
}

/** Nome do teste esperado para um arquivo de código. */
export function expectedTestFile(file: string): string | undefined {
  if (!/\.(ts|tsx)$/.test(file)) return undefined;
  if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) return undefined;
  return file.replace(/\.(ts|tsx)$/, ".test.$1");
}

/** Verifica se um arquivo tem cobertura de teste (direta ou por correspondência). */
export function hasTestCoverage(file: string, testsByFile: Record<string, string[]> = {}): boolean {
  const expected = expectedTestFile(file);
  if (!expected) return true; // não é arquivo de código testável
  const direct = testsByFile[file] ?? [];
  if (direct.length > 0) return true;
  // fallback: testes que citam o arquivo
  return Object.values(testsByFile).some((tests) => tests.includes(file));
}

export function reviewDiff(input: ReviewInput): SubagentResult {
  const result = emptySubagentResult();
  const { diffFiles, writeScope, impactScore = 0, intent } = input;
  const scopeSet = new Set(writeScope);

  const srcFiles = diffFiles.filter((f) => /^src\//.test(f) && /\.(ts|tsx)$/.test(f));
  const outOfScope = diffFiles.filter(
    (f) => !scopeSet.has(f) && !f.startsWith("tests/") && !f.startsWith("docs/"),
  );
  const untested = srcFiles.filter((f) => !hasTestCoverage(f, input.testsByFile));

  result.status = outOfScope.length > 0 || untested.length > 0 ? "partial" : "success";
  result.summary = `${srcFiles.length} arquivo(s) de código no diff${intent ? ` (${intent})` : ""}`;

  if (outOfScope.length > 0) {
    result.risks.push(
      `arquivo(s) fora do writeScope: ${outOfScope.slice(0, 5).join(", ")} — verificar isolamento (§8)`,
    );
  }
  if (untested.length > 0) {
    result.findings.push(`${untested.length} arquivo(s) sem teste correspondente`);
    result.recommendations.push(`cobrir: ${untested.slice(0, 5).join(", ")}`);
  }
  if (impactScore > 0.6 && srcFiles.length > 5) {
    result.risks.push(
      `impacto alto (${Math.round(impactScore * 100)}%) com diff grande — revisar regressões`,
    );
  }
  if (diffFiles.some((f) => /^supabase\/migrations\//.test(f))) {
    result.findings.push("migration detectada — verificar schema drift e reversibilidade");
    result.recommendations.push("rodar supabase db push em staging antes do merge");
  }

  result.confidence = Math.max(0, Math.min(1, 0.5 + srcFiles.length * 0.05));
  result.nextAction =
    result.risks.length > 0 ? "revisar risks antes do merge" : "aprovado para validação final";
  result.files = srcFiles.slice(0, 10);
  return result;
}
