/**
 * Logger estruturado para debug e auditoria.
 * Ativo apenas quando VITE_ENABLE_DEBUG_LOG=true
 */

const ENABLE_DEBUG_LOG = import.meta.env.VITE_ENABLE_DEBUG_LOG !== "false";

interface LogEntry {
  timestamp: string;
  userId?: string;
  type: "error" | "destructive_op" | "info" | "warn";
  context: string;
  details?: Record<string, unknown>;
  error?: string;
}

function getUserId(): string | null {
  try {
    const session = JSON.parse(localStorage.getItem("sb-" + "*") || "{}");
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function persist(entry: LogEntry): void {
  if (!ENABLE_DEBUG_LOG) return;

  // Console em dev
  if (import.meta.env.DEV) {
    console.log(`[Logger] ${entry.type}:`, entry);
  }

  // localStorage para persistir entre refreshs
  try {
    const logs = JSON.parse(localStorage.getItem("mc_debug_logs") || "[]");
    logs.push(entry);
    // Manter apenas últimos 100 logs
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    localStorage.setItem("mc_debug_logs", JSON.stringify(logs));
  } catch {
    // localStorage cheio ou indisponível — ignorar
  }
}

/**
 * Logga informação genérica (fetch, transição, etc.)
 */
export function logInfo(context: string, details?: Record<string, unknown>): void {
  persist({
    timestamp: new Date().toISOString(),
    userId: getUserId() ?? undefined,
    type: "info",
    context,
    details,
  });
}

/**
 * Logga aviso (estado inesperado não crítico)
 */
export function logWarn(context: string, details?: Record<string, unknown>): void {
  persist({
    timestamp: new Date().toISOString(),
    userId: getUserId() ?? undefined,
    type: "warn",
    context,
    details,
  });
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

/**
 * Recupera logs (para debug)
 */
export function getLogs(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem("mc_debug_logs") || "[]");
  } catch {
    return [];
  }
}

/**
 * Limpa logs
 */
export function clearLogs(): void {
  localStorage.removeItem("mc_debug_logs");
}
