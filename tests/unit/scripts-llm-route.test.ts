import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = resolve(ROOT, "scripts/llm-route.mjs");
const BASE_ENV = {
  ...process.env,
  EVENT_LOG_DISABLED: "1",
};

function run(args: string[]) {
  return execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: BASE_ENV,
  }).trim();
}

function runFailure(args: string[]) {
  try {
    run(args);
    throw new Error("command should have failed");
  } catch (error) {
    const result = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: result.status,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
    };
  }
}

describe("llm-route CLI", () => {
  it("valida a configuração ativa", () => {
    expect(run(["validate"])).toMatch(/válida|valid/i);
  });

  it("resolve um task-card sem capability usando o default da categoria", () => {
    const decision = JSON.parse(run(["resolve", "--task", "P1-09", "--no-log"]));

    expect(decision.source).toBe("category-default");
    expect(decision.profile).toBe("coding");
    expect(decision.model).toBe("openai-codex/gpt-5.4-mini");
    expect(decision.fallbackModels).toEqual(["opencode/deepseek-v4-flash-free"]);
    expect(decision.retrySafety).toBe("may-write");
  });

  it("resolve contexto com debugging pela rota de capability", () => {
    const decision = JSON.parse(
      run([
        "resolve",
        "--context",
        JSON.stringify({
          taskId: "manual-1",
          category: "bugfix",
          capability: "debugging",
          retrySafety: "read-only",
          source: "orchestrator-inference",
        }),
        "--no-log",
      ]),
    );

    expect(decision).toMatchObject({
      profile: "strong-reasoning",
      model: "openai-codex/gpt-5.6-luna",
      fallbackModels: ["opencode/deepseek-v4-flash-free"],
      source: "category-capability",
      retrySafety: "read-only",
    });
  });

  it("aplica --profile como override manual auditável", () => {
    const decision = JSON.parse(
      run(["resolve", "--task", "P1-09", "--profile", "independent-review", "--no-log"]),
    );

    expect(decision.source).toBe("manual");
    expect(decision.profile).toBe("independent-review");
  });

  it("normaliza categoria test para chore ao ler task-card", () => {
    const decision = JSON.parse(run(["resolve", "--task", "P1-15", "--no-log"]));

    expect(decision.source).toBe("category-default");
    expect(decision.profile).toBe("efficient");
  });

  it("falha com card inexistente", () => {
    const failure = runFailure(["resolve", "--task", "P9-99", "--no-log"]);

    expect(failure.status).toBe(1);
    expect(failure.stderr).toMatch(/não encontrado|not found/i);
  });

  it("falha com contexto JSON inválido", () => {
    const failure = runFailure(["resolve", "--context", "{"]);

    expect(failure.status).toBe(1);
    expect(failure.stderr).toMatch(/JSON|inválido|invalid/i);
  });

  it("registra conclusão somente com o evento sanitizado", () => {
    const event = JSON.parse(
      run([
        "complete",
        "--event",
        JSON.stringify({
          taskId: "P1-09",
          model: "openai-codex/gpt-5.4-mini",
          provider: "openai-codex",
          attempt: 1,
          status: "completed",
          durationMs: 42,
        }),
      ]),
    );

    expect(event).toEqual({
      type: "llm.route.completed",
      taskId: "P1-09",
      model: "openai-codex/gpt-5.4-mini",
      provider: "openai-codex",
      attempt: 1,
      status: "completed",
      durationMs: 42,
    });
    expect(JSON.stringify(event)).not.toMatch(/prompt|response|output|token/i);
  });
});
