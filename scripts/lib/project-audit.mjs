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

// ─── Política de dependências (P1: GHSA-qwww-vcr4-c8h2 react-router 8 + React 19) ───

// Semver helpers mínimos (comparação no formato ^X.Y.Z | >=X.Y.Z | X.Y.Z).
function parseSemver(raw) {
  if (typeof raw !== "string") return null;
  const m = raw.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function compareSemver(a, b) {
  if (!a || !b) return NaN;
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function versionAtLeast(raw, min) {
  const v = parseSemver(raw);
  if (!v) return false; // sem versão detectável = falha (nunca aprova no escuro)
  return compareSemver(v, parseSemver(min)) >= 0;
}

/**
 * Verifica a política de dependências de runtime (read-only, função pura).
 *
 * Regras ativas (P1 — upgrade react-router 8 + React 19):
 *   1. `react-router >= 8.3.0` (GHSA-qwww-vcr4-c8h2: RSC CSRF, range <8.3.0)
 *   2. `react >= 19` e `react-dom >= 19` (peer obrigatório do router 8)
 *   3. proibido `react-router-dom` direto — v8 unifica tudo no core `react-router`
 *   4. `@types/react`/`@types/react-dom` seguem a major do runtime
 *
 * @param {object} pkg package.json (deps + devDeps)
 * @returns {Array<{packageName, version, section, severity, reason}>}
 */
export function checkDependencyPolicy(pkg) {
  const safe = pkg && typeof pkg === "object" ? pkg : {};
  const all = {
    ...(safe.dependencies || {}),
    ...(safe.devDependencies || {}),
  };
  const findings = [];

  const reactVersion = all["react"] || "";
  const reactDomVersion = all["react-dom"] || "";
  const routerVersion = all["react-router"] || "";

  // 1. react-router >= 8.3.0 (GHSA)
  if (routerVersion && !versionAtLeast(routerVersion, "8.3.0")) {
    findings.push({
      packageName: "react-router",
      version: routerVersion,
      section: safe.dependencies?.["react-router"] ? "dependencies" : "devDependencies",
      severity: "critical",
      reason: "GHSA-qwww-vcr4-c8h2: upgrade para react-router >=8.3.0",
    });
  }
  if (!routerVersion) {
    findings.push({
      packageName: "react-router",
      version: "",
      section: "dependencies",
      severity: "critical",
      reason: "react-router obrigatório (>=8.3.0) — GHSA-qwww-vcr4-c8h2",
    });
  }

  // 2. react/react-dom >= 19 (peer do router 8)
  for (const name of ["react", "react-dom"]) {
    const v = all[name] || "";
    if (v && !versionAtLeast(v, "19.0.0")) {
      findings.push({
        packageName: name,
        version: v,
        section: safe.dependencies?.[name] ? "dependencies" : "devDependencies",
        severity: "critical",
        reason: "react-router@8 exige react >=19 como peer — upgrade major",
      });
    }
    if (name === "react" && !v) {
      findings.push({
        packageName: "react",
        version: "",
        section: "dependencies",
        severity: "critical",
        reason: "react obrigatório (>=19)",
      });
    }
  }

  // 3. react-router-dom proibido como dependência direta (v8 unificou)
  if (all["react-router-dom"]) {
    findings.push({
      packageName: "react-router-dom",
      version: all["react-router-dom"],
      section: safe.dependencies?.["react-router-dom"] ? "dependencies" : "devDependencies",
      severity: "warning",
      reason: "v8 unificou tudo no core react-router — importar de react-router",
    });
  }

  // 4. @types acompanham o runtime
  if (reactDomVersion && all["@types/react"] && !versionAtLeast(all["@types/react"], "19.0.0")) {
    findings.push({
      packageName: "@types/react",
      version: all["@types/react"],
      section: "devDependencies",
      severity: "warning",
      reason: "@types/react deve acompanhar react >=19",
    });
  }

  return findings;
}

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