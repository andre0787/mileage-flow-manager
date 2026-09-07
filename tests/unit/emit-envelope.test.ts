import { describe, it, expect } from "vitest";
import { buildEnvelope } from "../../scripts/emit-envelope.mjs";

describe("buildEnvelope (emit-envelope)", () => {
  it("constrói envelope persistível com defaults seguros", () => {
    const env = buildEnvelope({ type: "execution.started", role: "task" });
    expect(env.eventType).toBe("execution.started");
    expect(env.agentRole).toBe("task");
    expect(env.agentAdapter).toBe("milescontrol");
    expect(env.success).toBe(true);
    expect(env.errorCode).toBeNull();
    expect(env.eventId).toMatch(/^env-task-/);
    expect(env.sessionId).toBeTruthy();
  });

  it("aceita os três prefixos persistíveis", () => {
    expect(() => buildEnvelope({ type: "agent.completed", role: "tools" })).not.toThrow();
    expect(() => buildEnvelope({ type: "graph.query.completed", role: "graph" })).not.toThrow();
  });

  it("rejeita eventType fora do escopo da ai_telemetry", () => {
    expect(() => buildEnvelope({ type: "session:start", role: "task" })).toThrow(
      /não persistível/,
    );
    expect(() => buildEnvelope({ type: "tool.started", role: "tools" })).toThrow();
  });

  it("rejeita role ausente/vazio", () => {
    expect(() => buildEnvelope({ type: "agent.completed", role: "  " })).toThrow(/agentRole/);
  });

  it("--fail vira success=false; durationMs inválido é omitido", () => {
    const fail = buildEnvelope({ type: "agent.completed", role: "tools", success: false });
    expect(fail.success).toBe(false);

    const badMs = buildEnvelope({
      type: "agent.completed",
      role: "tools",
      durationMs: Number.NaN,
    });
    expect(badMs.durationMs).toBeUndefined();

    const okMs = buildEnvelope({ type: "agent.completed", role: "tools", durationMs: 1234.6 });
    expect(okMs.durationMs).toBe(1235);
  });

  it("desc vira phase truncado em 120 chars", () => {
    const env = buildEnvelope({
      type: "agent.completed",
      role: "classifier",
      desc: "x".repeat(300),
    });
    expect(env.phase).toHaveLength(120);
  });
});
