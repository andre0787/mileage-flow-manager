import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TELEMETRY_QUEUE_STORAGE_KEY,
  flushTelemetryQueue,
  queuedTelemetryCount,
  recordTelemetry,
  saveToQueue,
} from "@/lib/telemetryQueue";
import { supabase } from "@/lib/supabase";

const payload = {
  user_id: "user-1",
  session_id: "session-1",
  area: "test",
  tokens_used: 10,
  prompt_tokens_saved_by_pruning: 0,
  total_execution_time_ms: 20,
  cost_estimate: 0.001,
  success_rate: 1,
};

describe("telemetryQueue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: { request: (_name: string, _options: unknown, callback: () => Promise<void>) => callback() },
    });
  });

  it("persiste eventos no localStorage", () => {
    saveToQueue(payload);
    expect(queuedTelemetryCount()).toBe(1);
    expect(localStorage.getItem(TELEMETRY_QUEUE_STORAGE_KEY)).toContain("session-1");
  });

  it("envia e remove eventos quando o Supabase responde sem erro", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as never);
    saveToQueue(payload);
    await flushTelemetryQueue();
    expect(queuedTelemetryCount()).toBe(0);
  });

  it("coloca o evento na fila quando o envio falha", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error("offline") }),
    } as never);
    await recordTelemetry(payload);
    expect(queuedTelemetryCount()).toBe(1);
  });

  it("benchmarks flushing multiple items (baseline vs batch)", async () => {
    const insertMock = vi.fn().mockImplementation(async (arg) => {
      // Simulate small network delay per call
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { error: null };
    });
    vi.spyOn(supabase, "from").mockReturnValue({
      insert: insertMock,
    } as never);

    const N = 50;
    for (let i = 0; i < N; i++) {
      saveToQueue({ ...payload, session_id: `session-${i}` });
    }
    expect(queuedTelemetryCount()).toBe(N);

    const start = performance.now();
    await flushTelemetryQueue();
    const duration = performance.now() - start;

    expect(queuedTelemetryCount()).toBe(0);
    console.log(`Flush ${N} items call count: ${insertMock.mock.calls.length}, duration: ${duration.toFixed(2)}ms`);
  });
});
