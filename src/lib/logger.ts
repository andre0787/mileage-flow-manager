/**
 * Logger estruturado para debug e auditoria.
 * Ativo apenas quando VITE_ENABLE_DEBUG_LOG=true
 */

const ENABLE_DEBUG_LOG = import.meta.env.VITE_ENABLE_DEBUG_LOG === "true";

interface LogEntry {
  timestamp: string;
  userId?: string;
  type: "error" | "destructive_op" | "info" | "warn";
  context: string;
  details?: Record<string, unknown>;
  error?: string;
}

const SENSITIVE_KEY_REGEX =
  /password|token|secret|auth|cpf|email|credit_card|card_number|cvv|api_key|bearer|authorization|pwd|pass/i;

function redactValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(redactValue);
  }
  if (typeof val === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = redactValue(value);
      }
    }
    return sanitized;
  }
  return String(val);
}

function sanitizeEntry(entry: LogEntry): LogEntry {
  const sanitized: LogEntry = {
    ...entry,
  };
  if (entry.details) {
    sanitized.details = redactValue(entry.details) as Record<string, unknown>;
  }
  return sanitized;
}

function getUserId(): string | null {
  try {
    const key = Object.keys(localStorage).find(
      (candidate) => candidate.startsWith("sb-") && candidate.endsWith("-auth-token"),
    );
    if (!key) return null;
    const session = JSON.parse(localStorage.getItem(key) || "{}");
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function persist(entry: LogEntry): void {
  if (!ENABLE_DEBUG_LOG || import.meta.env.PROD) return;

  // localStorage para persistir entre refreshs
  try {
    const sanitizedEntry = sanitizeEntry(entry);
    const logs = JSON.parse(localStorage.getItem("mc_debug_logs") || "[]");
    logs.push(sanitizedEntry);
    // Manter apenas últimos 100 logs
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    localStorage.setItem("mc_debug_logs", JSON.stringify(logs));
  } catch {
    // localStorage cheio ou indisponível — ignorar
  }
}

/**
 * Logga erro de mutation ou operação
 */
export function logError(context: string, error: unknown): void {
  const errorMsg = error instanceof Error ? error.message : String(error);
  persist({
    timestamp: new Date().toISOString(),
    userId: getUserId() ?? undefined,
    type: "error",
    context,
    error: errorMsg,
  });
}

/**
 * Logga operação destrutiva (delete, clear, cancel)
 */
export function logDestructiveOp(
  type: "delete" | "clear" | "cancel",
  context: string,
  details?: Record<string, unknown>,
): void {
  persist({
    timestamp: new Date().toISOString(),
    userId: getUserId() ?? undefined,
    type: "destructive_op",
    context: `${type}: ${context}`,
    details,
  });
}

// getLogs/clearLogs removidos — sem chamadores externos
