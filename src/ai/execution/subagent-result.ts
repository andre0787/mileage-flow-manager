/**
 * subagent-result.ts — Resultado estruturado de subagente (Agent Execution Spec §14).
 *
 * Todo subagente deve retornar este contrato. Se o agente devolver texto
 * livre: parse → validate → normalize (fail-open — nunca lança).
 */

export interface SubagentResult {
  status: "success" | "failure" | "partial";
  summary: string;
  findings: string[];
  files: string[];
  risks: string[];
  recommendations: string[];
  confidence: number; // 0..1
  nextAction: string;
}

export function emptySubagentResult(): SubagentResult {
  return {
    status: "partial",
    summary: "",
    findings: [],
    files: [],
    risks: [],
    recommendations: [],
    confidence: 0,
    nextAction: "",
  };
}

/** Normaliza um valor em string[] seguro (array de strings, sem null). */
function toSafeArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function toSafeNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.min(1, v));
  const n = Number(v);
  if (Number.isFinite(n)) return Math.max(0, Math.min(1, n));
  return fallback;
}

function toSafeStatus(v: unknown): SubagentResult["status"] {
  if (v === "success" || v === "failure" || v === "partial") return v;
  return "partial";
}

/** Normaliza um objeto parcial em SubagentResult válido (fail-open). */
export function normalizeSubagentResult(raw: unknown): SubagentResult {
  if (!raw || typeof raw !== "object") return emptySubagentResult();
  const o = raw as Record<string, unknown>;
  return {
    status: toSafeStatus(o.status),
    summary: typeof o.summary === "string" ? o.summary : "",
    findings: toSafeArray(o.findings),
    files: toSafeArray(o.files),
    risks: toSafeArray(o.risks),
    recommendations: toSafeArray(o.recommendations),
    confidence: toSafeNumber(o.confidence),
    nextAction: typeof o.nextAction === "string" ? o.nextAction : "",
  };
}

/**
 * Parse: tenta JSON primeiro; se falhar, extrai do texto livre (linhas de
 * arquivos "a.ts, b.ts" e bullets "— risco"). Fail-open.
 */
export function parseSubagentResult(output: string): SubagentResult {
  if (!output || typeof output !== "string") return emptySubagentResult();
  const trimmed = output.trim();

  // 1. Tenta JSON (objeto completo ou array com um objeto)
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.length > 0) return normalizeSubagentResult(parsed[0]);
    return normalizeSubagentResult(parsed);
  } catch {
    /* cai no parser de texto */
  }

  // 2. Texto livre: usa a primeira linha como summary e bullets como findings
  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const summary = lines[0] ?? "";
  const files = lines
    .filter((l) => /\.(ts|tsx|mjs|sql)$/.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, ""));
  const fileSet = new Set(files);
  const findings = lines
    .slice(1)
    .filter((l) => /^[-•*]|^(\d+[.)])\s/.test(l))
    .map((l) => l.replace(/^[-•*]\s*|^(\d+[.)])\s*/, ""))
    .filter((l) => !fileSet.has(l));

  return {
    status: "partial",
    summary,
    findings,
    files,
    risks: [],
    recommendations: [],
    confidence: 0.5,
    nextAction: "",
  };
}

/** Valida: retorna true se o resultado tem o mínimo utilizável (summary ou findings). */
export function validateSubagentResult(result: SubagentResult): boolean {
  return result.summary.length > 0 || result.findings.length > 0 || result.files.length > 0;
}
