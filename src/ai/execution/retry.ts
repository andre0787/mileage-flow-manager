/**
 * retry.ts — Retry & timeout (P11-02 Execution Reliability).
 *
 * - `shouldRetry`: decide retry com base na classificação
 *   (retryable / conditional / non_retryable).
 * - `retryWithBackoff`: executa com tentativas, backoff exponencial com
 *   jitter e timeout global (deadline).
 */

import { classifyRetry, type RetryClass } from "./command-runner";
import { classifyFailure, type FailureCategory } from "./failure-taxonomy";

export interface RetryPolicy {
  maxRetries: number;
  /** Classes de erro que merecem retry (default: retryable + conditional). */
  retryableClasses?: RetryClass[];
  /** Backoff inicial em ms (default 200). */
  baseDelayMs?: number;
  /** Multiplicador (default 2). */
  factor?: number;
  /** Categorias de falha que NUNCA retry (override de classe). */
  neverRetryCategories?: FailureCategory[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  retryableClasses: ["retryable", "conditional"],
  baseDelayMs: 200,
  factor: 2,
};

/** Decide se um erro merece retry segundo a política. */
export function shouldRetry(
  errorCode: string | null | undefined,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  category?: FailureCategory,
): boolean {
  if (!errorCode) return false;
  if (policy.maxRetries <= 0) return false;
  // Deriva a categoria do errorCode quando não fornecida (consistência total).
  const resolvedCategory = category ?? classifyFailure(errorCode);
  if (policy.neverRetryCategories?.includes(resolvedCategory)) return false;
  const cls = classifyRetry(errorCode);
  return (policy.retryableClasses ?? ["retryable", "conditional"]).includes(cls);
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  retried: boolean;
  lastErrorCode?: string | null;
}

/**
 * Executa fn com retry (backoff exponencial + jitter) e deadline global.
 * A função deve retornar `{ success, errorCode }` — a decisão de retry é
 * baseada no errorCode. Nunca lança além do erro final.
 */
export async function retryWithBackoff<T extends { success: boolean; errorCode?: string | null }>(
  fn: () => Promise<T>,
  opts: {
    policy?: RetryPolicy;
    deadlineMs?: number;
    isRetryable?: (errorCode: string | null | undefined) => boolean;
  } = {},
): Promise<RetryResult<T>> {
  const policy = { ...DEFAULT_RETRY_POLICY, ...opts.policy };
  const deadline = opts.deadlineMs ? Date.now() + opts.deadlineMs : undefined;
  const isRetryable = opts.isRetryable ?? ((code) => shouldRetry(code, policy));

  let attempts = 0;
  let last: T | undefined;
  while (true) {
    attempts += 1;
    last = await fn();
    if (last.success) break;
    if (attempts > policy.maxRetries) break;
    if (!isRetryable(last.errorCode)) break;
    if (deadline !== undefined && Date.now() >= deadline) break;
    // Backoff exponencial + jitter (±20%).
    const delay = (policy.baseDelayMs ?? 200) * Math.pow(policy.factor ?? 2, attempts - 1);
    const jittered = Math.round(delay * (0.8 + Math.random() * 0.4));
    await new Promise((r) => setTimeout(r, jittered));
  }
  return {
    result: last as T,
    attempts,
    retried: attempts > 1,
    lastErrorCode: last?.errorCode,
  };
}

/** Executa com timeout global (deadline) — resolve com o que vier primeiro. */
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout após ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
