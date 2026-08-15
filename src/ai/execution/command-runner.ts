/**
 * command-runner.ts — Execução real de comandos (P11-01 Real Agent Foundation).
 *
 * Base do Pi Adapter para execução NÃO simbólica: roda um comando real com
 * timeout, normaliza erro/saída e mede duração. Fail-open — nunca lança;
 * todo caminho de falha vira um CommandResult com errorCode.
 *
 * Separation (P11-01): Synthetic Execution (executeStep injetado em testes)
 * vs Real Execution (este runner, usado pelo adapter pi).
 */

import { spawnSync } from "node:child_process";

export interface CommandResult {
  success: boolean;
  /** stdout normalizado (trim + truncado em maxOutputChars). */
  output: string;
  /** stderr normalizado (trim + truncado). */
  stderr: string;
  /** Código de erro normalizado: exit:N | timeout | spawn:<message> | null. */
  errorCode: string | null;
  durationMs: number;
}

export interface CommandOptions {
  /** Timeout em ms (default 30s). Timeout → errorCode "timeout". */
  timeoutMs?: number;
  /** Limite de caracteres do output capturado (default 100_000). */
  maxOutputChars?: number;
  cwd?: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT = 100_000;

/** Executa um comando real com timeout e normalização (nunca lança). */
export function runCommand(cmd: string, args: string[], opts: CommandOptions = {}): CommandResult {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutput = opts.maxOutputChars ?? DEFAULT_MAX_OUTPUT;
  const started = Date.now();
  const normalize = (s: string) => s.trim().slice(0, maxOutput);

  try {
    const res = spawnSync(cmd, args, {
      encoding: "utf8",
      timeout: timeoutMs,
      cwd: opts.cwd,
      maxBuffer: 1024 * 1024 * 8,
    });
    const durationMs = Date.now() - started;
    if (res.error) {
      // spawnSync: ETIMEDOUT (timeout) | ENOENT (comando inexistente) | outros.
      const message = (res.error as NodeJS.ErrnoException).message ?? String(res.error);
      const isTimeout = (res.error as NodeJS.ErrnoException).code === "ETIMEDOUT";
      return {
        success: false,
        output: normalize(res.stdout ?? ""),
        stderr: normalize(res.stderr ?? ""),
        errorCode: isTimeout ? "timeout" : `spawn:${message}`,
        durationMs,
      };
    }
    return {
      success: res.status === 0,
      output: normalize(res.stdout ?? ""),
      stderr: normalize(res.stderr ?? ""),
      errorCode: res.status !== 0 ? `exit:${res.status}` : null,
      durationMs,
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      stderr: "",
      errorCode: err instanceof Error ? `spawn:${err.message}` : "spawn:unknown",
      durationMs: Date.now() - started,
    };
  }
}

/** Classifica um errorCode em retryable/non_retryable/conditional (P11-02). */
export type RetryClass = "retryable" | "non_retryable" | "conditional";

export function classifyRetry(errorCode: string | null | undefined): RetryClass {
  if (!errorCode) return "non_retryable"; // sucesso não é retryable
  if (errorCode === "timeout") return "conditional";
  if (errorCode.startsWith("exit:")) return "non_retryable";
  if (errorCode.startsWith("spawn:")) return "retryable"; // ENOENT pode ser transitório
  return "non_retryable";
}
