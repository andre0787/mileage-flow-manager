/**
 * adapter-contract.test.ts — Adapter Contract suite (P11-01 Real Agent Foundation).
 *
 * Executa o contrato de adapter contra os dois adapters concretos:
 *   - Generic Adapter (degradação máxima)
 *   - Pi Adapter (execução real via command-runner)
 *
 * Valida: id/version/capabilities, health check, execução com timeout,
 * normalização de erro/saída e model identity.
 */

import { describe, expect, it } from "vitest";
import { genericAdapter } from "@/ai/adapters/generic";
import { piAdapter } from "@/ai/adapters/pi";
import { runCommand, classifyRetry } from "@/ai/execution/command-runner";
import type { AgentAdapter } from "@/ai/core/agent-contract";

const adapters: Array<{ name: string; adapter: AgentAdapter }> = [
  { name: "generic", adapter: genericAdapter },
  { name: "pi", adapter: piAdapter },
];

describe("adapter contract — shape comum", () => {
  for (const { name, adapter } of adapters) {
    describe(name, () => {
      it("id e version nunca vazios", () => {
        expect(adapter.id.length).toBeGreaterThan(0);
        expect(adapter.version().length).toBeGreaterThan(0);
      });

      it("capabilities declara campos completos", () => {
        const caps = adapter.capabilities();
        expect(typeof caps.toolCalling).toBe("boolean");
        expect(typeof caps.parallelAgents).toBe("boolean");
        expect(typeof caps.streaming).toBe("boolean");
        expect(typeof caps.sessionPersistence).toBe("boolean");
        expect(typeof caps.structuredOutput).toBe("boolean");
        expect(typeof caps.subagents).toBe("boolean");
        expect(typeof caps.worktrees).toBe("boolean");
        expect(Array.isArray(caps.roles)).toBe(true);
      });

      it("health() resolve sem lançar e com versão/model", async () => {
        const health = await adapter.health();
        expect(typeof health.ok).toBe("boolean");
        expect(health.adapter).toBe(adapter.id);
        expect(health.version.length).toBeGreaterThan(0);
        if (health.model !== undefined) expect(health.model.length).toBeGreaterThan(0);
      });

      it("execute() resolve com resultado normalizado (nunca lança)", async () => {
        const res = await adapter.execute({
          taskId: "T1",
          // implementer → git status (rápido e determinístico); tester rodaria
          // typecheck completo (lento). O contrato não depende do papel.
          intent: "implementer",
          model: adapter === piAdapter ? "pi-local" : undefined,
        });
        expect(typeof res.success).toBe("boolean");
        expect(res.output).toBeDefined();
        if (res.errorCode !== null && res.errorCode !== undefined) {
          expect(res.errorCode.length).toBeGreaterThan(0);
        }
      });

      it("respeita timeout no budget (pi real)", async () => {
        if (adapter !== piAdapter) return; // generic não roda comando real
        const started = Date.now();
        const res = await adapter.execute({
          taskId: "T2",
          intent: "tester",
          budget: { maxDurationMs: 500 },
        });
        expect(res.durationMs).toBeLessThanOrEqual(15_000);
        expect(Date.now() - started).toBeLessThan(30_000);
        expect(typeof res.success).toBe("boolean");
      });
    });
  }
});

describe("command-runner (real execution base)", () => {
  it("executa comando real com sucesso e mede duração", () => {
    const res = runCommand("node", ["-e", "console.log('ok')"]);
    expect(res.success).toBe(true);
    expect(res.output).toContain("ok");
    expect(res.errorCode).toBeNull();
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("normaliza erro de comando inexistente (spawn:)", () => {
    const res = runCommand("comando-inexistente-xyz", []);
    expect(res.success).toBe(false);
    expect(res.errorCode?.startsWith("spawn:")).toBe(true);
  });

  it("normaliza erro de exit code (exit:N)", () => {
    const res = runCommand("node", ["-e", "process.exit(3)"]);
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe("exit:3");
  });

  it("trunca output no limite", () => {
    const res = runCommand("node", ["-e", "console.log('x'.repeat(5000))"], {
      maxOutputChars: 100,
    });
    expect(res.output.length).toBeLessThanOrEqual(100);
  });

  it("classifica retry por errorCode", () => {
    expect(classifyRetry(null)).toBe("non_retryable");
    expect(classifyRetry("timeout")).toBe("conditional");
    expect(classifyRetry("exit:1")).toBe("non_retryable");
    expect(classifyRetry("spawn:ENOENT")).toBe("retryable");
  });
});
