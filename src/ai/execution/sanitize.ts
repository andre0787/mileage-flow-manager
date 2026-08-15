/**
 * sanitize.ts — Sanitização de secrets (Agent Execution Spec §12).
 *
 * NUNCA enviar para telemetria: API keys, tokens, senhas, CPF, dados
 * privados, conteúdo integral de documentos. Esta lib redige padrões
 * comuns antes do envelope. Patterns são customizáveis (fail-open).
 */

/** Patterns padrão de redação (CPF BR, chaves/tokens, senhas, e-mails, URLs com segredo). */
export const DEFAULT_SANITIZE_PATTERNS: { name: string; re: RegExp; replace: string }[] = [
  { name: "cpf", re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, replace: "CPF_REDACTED" },
  { name: "cpf-raw", re: /\b\d{11}\b/g, replace: "CPF_REDACTED" },
  {
    name: "api-key",
    re: /\b(?:sk|pk|rk|service|publishable)[_-][A-Za-z0-9_-]{8,}\b/g,
    replace: "KEY_REDACTED",
  },
  { name: "bearer", re: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/g, replace: "Bearer REDACTED" },
  {
    name: "password",
    re: /(password|passwd|senha|secret|token)\s*[=:]\s*[^\s,;]+/gi,
    replace: "$1=REDACTED",
  },
  {
    name: "email",
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replace: "EMAIL_REDACTED",
  },
  {
    name: "jwt",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    replace: "JWT_REDACTED",
  },
];

/** Redige texto livre (fail-open: entrada não-string retorna vazio). */
export function sanitizeText(
  input: string,
  patterns: { name: string; re: RegExp; replace: string }[] = DEFAULT_SANITIZE_PATTERNS,
): string {
  if (typeof input !== "string") return "";
  let out = input;
  for (const p of patterns) out = out.replace(p.re, p.replace);
  return out;
}

/**
 * Redige todos os campos de string de um objeto (envelope/record) —
 * usado antes de persistir telemetria. Retorna cópia, não muta.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  patterns?: { name: string; re: RegExp; replace: string }[],
): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? sanitizeText(v, patterns) : v;
  }
  return out as T;
}

/** Verifica se um texto ainda contém segredos (para testes/validação). */
export function containsSecrets(
  input: string,
  patterns: { name: string; re: RegExp; replace: string }[] = DEFAULT_SANITIZE_PATTERNS,
): boolean {
  if (typeof input !== "string") return false;
  // Cópia sem flag g: `.test()` com /g é stateful (lastIndex compartilhado) e
  // daria falso-negativo entre chamadas com os mesmos patterns de módulo.
  return patterns.some((p) => new RegExp(p.re.source, p.re.flags.replace("g", "")).test(input));
}
