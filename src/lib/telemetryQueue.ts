/** Fila resiliente de telemetria IA: persiste falhas no navegador e reenvia depois. */
import { supabase } from "@/lib/supabase";
import type { AiTelemetryRecord } from "@/lib/aiTelemetry";

export type TelemetryPayload = Omit<AiTelemetryRecord, "id" | "created_at">;

type QueueItem = { id: string; payload: TelemetryPayload; attempts: number; queuedAt: string };

const STORAGE_KEY = "milescontrol:ai-telemetry-queue";
const FALLBACK_LOCK_KEY = `${STORAGE_KEY}:flush-lock`;
const MAX_ATTEMPTS = 5;
let flushPromise: Promise<void> | null = null;

function isQueueItem(value: unknown): value is QueueItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<QueueItem>;
  const payload = item.payload as Partial<TelemetryPayload> | undefined;
  const attempts = item.attempts;
  const tokens = payload?.tokens_used;
  const cost = payload?.cost_estimate;
  const duration = payload?.total_execution_time_ms;
  const successRate = payload?.success_rate;
  return Boolean(
    typeof item.id === "string" &&
    typeof attempts === "number" &&
    Number.isInteger(attempts) &&
    attempts >= 0 &&
    attempts < MAX_ATTEMPTS &&
    typeof item.queuedAt === "string" &&
    payload &&
    (payload.area === undefined || typeof payload.area === "string") &&
    typeof payload.user_id === "string" &&
    payload.user_id.length > 0 &&
    typeof payload.session_id === "string" &&
    payload.session_id.length > 0 &&
    typeof tokens === "number" &&
    Number.isFinite(tokens) &&
    tokens >= 0 &&
    typeof cost === "number" &&
    Number.isFinite(cost) &&
    cost >= 0 &&
    typeof duration === "number" &&
    Number.isFinite(duration) &&
    duration >= 0 &&
    typeof successRate === "number" &&
    Number.isFinite(successRate) &&
    successRate >= 0 &&
    successRate <= 1 &&
    typeof payload.prompt_tokens_saved_by_pruning === "number" &&
    Number.isFinite(payload.prompt_tokens_saved_by_pruning) &&
    payload.prompt_tokens_saved_by_pruning >= 0 &&
    !Number.isNaN(Date.parse(item.queuedAt)),
  );
}

function readQueue(): QueueItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isQueueItem) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage cheio/bloqueado não pode interromper a aplicação.
  }
}

export function saveToQueue(payload: TelemetryPayload): void {
  const item: QueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    payload,
    attempts: 0,
    queuedAt: new Date().toISOString(),
  };
  writeQueue([...readQueue(), item]);
}

async function flushQueueOnce(): Promise<void> {
  const pending = readQueue();
  if (!pending.length) return;

  const remaining: QueueItem[] = [];
  for (const item of pending) {
    const { error } = await supabase.from("ai_telemetry").insert(item.payload as never);
    if (error && item.attempts + 1 < MAX_ATTEMPTS) {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
    // Após MAX_ATTEMPTS, descarta o item inválido/indisponível para não criar
    // uma fila infinita. O evento original permanece no log local da aplicação.
  }
  // Releia antes de persistir: recordTelemetry pode adicionar novos itens
  // enquanto os inserts aguardam rede. Preserve esses itens recém-chegados.
  const processedIds = new Set(pending.map((item) => item.id));
  const additions = readQueue().filter((item) => !processedIds.has(item.id));
  writeQueue([...additions, ...remaining]);
}

async function flushWithFallbackLock(): Promise<void> {
  if (typeof localStorage === "undefined") return;
  const token = `${Date.now()}:${Math.random()}`;
  try {
    const current = JSON.parse(localStorage.getItem(FALLBACK_LOCK_KEY) ?? "null") as {
      startedAt?: number;
    } | null;
    if (current?.startedAt && Date.now() - current.startedAt < 3_600_000) return;
    localStorage.setItem(FALLBACK_LOCK_KEY, JSON.stringify({ token, startedAt: Date.now() }));
    const acquired = JSON.parse(localStorage.getItem(FALLBACK_LOCK_KEY) ?? "null") as {
      token?: string;
    } | null;
    if (acquired?.token !== token) return;
    await flushQueueOnce();
  } finally {
    try {
      const owner = JSON.parse(localStorage.getItem(FALLBACK_LOCK_KEY) ?? "null") as {
        token?: string;
      } | null;
      if (owner?.token === token) localStorage.removeItem(FALLBACK_LOCK_KEY);
    } catch {
      /* fail-open */
    }
  }
}

export function flushTelemetryQueue(): Promise<void> {
  if (!flushPromise) {
    const locks =
      typeof navigator !== "undefined"
        ? (
            navigator as Navigator & {
              locks?: {
                request: (
                  name: string,
                  options: { mode: "exclusive" },
                  callback: () => Promise<void>,
                ) => Promise<void>;
              };
            }
          ).locks
        : undefined;
    const run = locks
      ? locks.request(STORAGE_KEY, { mode: "exclusive" }, flushQueueOnce)
      : flushWithFallbackLock();
    flushPromise = run.finally(() => {
      flushPromise = null;
    });
  }
  return flushPromise;
}

export async function recordTelemetry(payload: TelemetryPayload): Promise<void> {
  const { error } = await supabase.from("ai_telemetry").insert(payload as never);
  if (error) saveToQueue(payload);
}

export function queuedTelemetryCount(): number {
  return readQueue().length;
}

export const TELEMETRY_QUEUE_STORAGE_KEY = STORAGE_KEY;
