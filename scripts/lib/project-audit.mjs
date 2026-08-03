/**
 * project-audit.mjs — Núcleo puro de classificação da auditoria estrutural.
 *
 * Um arquivo rastreado é classificado em uma categoria explícita; a saída
 * nunca contém conteúdo de arquivo, apenas caminho relativo, categoria,
 * severidade e motivo. Read-only por construção: nenhuma função escreve.
 *
 * ponytail: função pura, zero deps, sem filesystem.
 */

const GENERATED_DIRS = [
  "playwright-report/",
  "test-results/",
  "dist/",
  "coverage/",
];

const HISTORICAL_PREFIXES = ["docs/archive/", "docs/reports/", "docs/audits/"];

// Diretórios de operação/evidência que são permitidos mesmo rastreados.
const OPERATIONAL_PREFIXES = [
  "docs/tracking/",
  "supabase/migrations/",
  ".pi/skills/",
  "scripts/lib/",
  "scripts/rules/",
  "docs/superpowers/specs/",
  "docs/superpowers/plans/",
  "docs/council/",
];

const GENERATED_TRACKED_GLOB = /(^|\/)(playwright-report|test-results|dist|coverage)(\/|$)/;

/**
 * Classifica cada caminho rastreado em { path, category, severity, reason }.
 * @param {string[]} paths
 * @returns {Array<{path: string, category: string, severity: string, reason: string}>}
 */
export function classifyTrackedArtifacts(paths) {
  const safe = Array.isArray(paths) ? paths : [];
  const findings = [];

  for (const raw of safe) {
    const path = String(raw).replace(/\\/g, "/");
    if (!path) continue;

    if (HISTORICAL_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      findings.push({
        path,
        category: "historical",
        severity: "info",
        reason: "documentação histórica/operacional preservada",
      });
      continue;
    }

    if (OPERATIONAL_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      findings.push({
        path,
        category: "allowlisted",
        severity: "info",
        reason: "diretório operacional permitido",
      });
      continue;
    }

    if (GENERATED_DIRS.some((dir) => path === dir || path.startsWith(dir))) {
      findings.push({
        path,
        category: "generated",
        severity: "critical",
        reason: "artefato gerado versionado indevidamente",
      });
      continue;
    }

    if (path.startsWith("src/") || path.startsWith("docs/") || path.startsWith("scripts/")) {
      findings.push({
        path,
        category: "source",
        severity: "info",
        reason: "código/documentação intencional",
      });
      continue;
    }

    findings.push({
      path,
      category: "other",
      severity: "info",
      reason: "arquivo fora das categorias conhecidas",
    });
  }

  return sortAuditFindings(findings);
}

/**
 * Ordena deterministicamente: críticos primeiro, depois por caminho.
 * @returns {Array<object>} mesmos findings, ordenados
 */
export function sortAuditFindings(findings) {
  const severityRank = { critical: 0, warning: 1, info: 2 };
  return [...findings].sort((a, b) => {
    const rankDiff = (severityRank[a.severity] ?? 2) - (severityRank[b.severity] ?? 2);
    if (rankDiff !== 0) return rankDiff;
    return a.path.localeCompare(b.path);
  });
}