import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  mapToEnvelope,
  loadEnvelopes,
  _resetEnvelopesCache,
  ENVELOPES_TTL_MS,
} from "@/lib/telemetryAdapter";

let mockRows: unknown[] = [];

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => {
      const builder = {
        select: () => builder,
        order: () => builder,
        limit: () => builder,
        then: (res: (v: { data: unknown[] }) => unknown, rej: (e: unknown) => unknown) =>
          Promise.resolve({ data: mockRows }).then(res, rej),
      };
      return builder;
    },
  },
}));

describe("telemetryAdapter", () => {
  describe("mapToEnvelope", () => {
    it("maps a full ai_telemetry row to TelemetryEnvelope", () => {
      const row = {
        id: "evt-1",
        event_type: "agent.completed",
        created_at: "2026-08-24T00:00:00.000Z",
        session_id: "sess-1",
        task_id: "task-1",
        execution_id: "exec-1",
        agent_adapter: "pi",
        agent_role: "coder",
        model: "gpt-4",
        tokens_used: 1000,
        prompt_tokens_saved_by_pruning: 200,
        total_execution_time_ms: 5000,
        tool_calls: 12,
        cost_estimate: 0.05,
        success_rate: 1,
        error_code: null,
      };

      const env = mapToEnvelope(row);

      expect(env.eventId).toBe("evt-1");
      expect(env.eventType).toBe("agent.completed");
      expect(env.timestamp).toBe("2026-08-24T00:00:00.000Z");
      expect(env.sessionId).toBe("sess-1");
      expect(env.taskId).toBe("task-1");
      expect(env.executionId).toBe("exec-1");
      expect(env.agentAdapter).toBe("pi");
      expect(env.agentRole).toBe("coder");
      expect(env.model).toBe("gpt-4");
      expect(env.durationMs).toBe(5000);
      expect(env.toolCalls).toBe(12);
      expect(env.cost).toBe(0.05);
      expect(env.success).toBe(true);
      expect(env.errorCode).toBeNull();
    });

    it("splits tokens 70/30 between input and output", () => {
      const row = { tokens_used: 1000, prompt_tokens_saved_by_pruning: 0 };
      const env = mapToEnvelope(row);
      expect(env.inputTokens).toBe(700);
      expect(env.outputTokens).toBe(300);
    });

    it("defaults to success true when success_rate is missing", () => {
      const env = mapToEnvelope({});
      expect(env.success).toBe(true);
    });

    it("sets success false when success_rate is 0", () => {
      const env = mapToEnvelope({ success_rate: 0 });
      expect(env.success).toBe(false);
    });

    it("maps tokensSaved from prompt_tokens_saved_by_pruning", () => {
      const env = mapToEnvelope({
        tokens_used: 1000,
        prompt_tokens_saved_by_pruning: 150,
      });
      expect(env.tokensSaved).toBe(150);
    });

    it("returns undefined for optional fields when absent", () => {
      const env = mapToEnvelope({});
      expect(env.sessionId).toBeUndefined();
      expect(env.taskId).toBeUndefined();
      expect(env.executionId).toBeUndefined();
      expect(env.agentAdapter).toBeUndefined();
      expect(env.agentRole).toBeUndefined();
      expect(env.model).toBeUndefined();
      expect(env.durationMs).toBeUndefined();
      expect(env.toolCalls).toBeUndefined();
      expect(env.cost).toBeUndefined();
      expect(env.inputTokens).toBeUndefined();
      expect(env.outputTokens).toBeUndefined();
      expect(env.tokensSaved).toBeUndefined();
    });

    it("defaults eventId to empty string when id is absent", () => {
      const env = mapToEnvelope({});
      expect(env.eventId).toBe("");
    });

    it("defaults eventType to agent.completed when event_type is absent", () => {
      const env = mapToEnvelope({});
      expect(env.eventType).toBe("agent.completed");
    });
  });

  describe("loadEnvelopes (cache TTL)", () => {
    beforeEach(() => {
      _resetEnvelopesCache();
      mockRows = [];
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
      _resetEnvelopesCache();
    });

    it("retorna a mesma promise dentro da janela de TTL (sem refetch)", async () => {
      mockRows = [{ id: "evt-1", event_type: "agent.completed" }];
      const first = await loadEnvelopes();
      const second = await loadEnvelopes();
      expect(first).toBe(second);
      expect(first).toHaveLength(1);
    });

    it("refetch após expirar o TTL (dados novos aparecem)", async () => {
      mockRows = [{ id: "evt-1" }];
      const first = await loadEnvelopes();
      expect(first).toHaveLength(1);

      vi.setSystemTime(new Date(Date.now() + ENVELOPES_TTL_MS + 1));
      mockRows = [{ id: "evt-1" }, { id: "evt-2" }];
      const second = await loadEnvelopes();
      expect(second).toHaveLength(2);
    });
  });
});
