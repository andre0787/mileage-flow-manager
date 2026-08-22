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
});
