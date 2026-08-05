import { describe, expect, it } from "vitest";
import {
  parseProcessEvents,
  summarizeProcessEvidence,
  validateProcessEvent,
  validateProcessEvents,
} from "../../scripts/lib/process-events.mjs";

const resolvedEvent = {
  type: "llm.route.resolved",
  timestamp: "2026-08-01T10:00:00Z",
  taskId: "task-resolved",
  category: "feature",
  capability: null,
  profile: "coding",
  model: "model/primary",
  fallbackModels: [],
  source: "category-default",
  retrySafety: "may-write",
  configVersion: 1,
  skills: [],
};

describe("process-events parser", () => {
  it("parseia JSONL plano sem perder eventos", () => {
    const result = parseProcessEvents(
      '{"type":"pre-pr","timestamp":"2026-08-01T10:00:00Z","branch":"feat/a","errors":0}\n',
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "pre-pr", errors: 0, branch: "feat/a" });
  });

  it("informa a linha do JSONL corrompido", () => {
    expect(() => parseProcessEvents('{broken}\n')).toThrow(/linha 1/i);
  });
});

describe("process-events validation", () => {
  it("aceita pre-pr plano válido", () => {
    expect(
      validateProcessEvent({
        type: "pre-pr",
        timestamp: "2026-08-01T10:00:00Z",
        branch: "feat/a",
        errors: 0,
      }),
    ).toEqual([]);
  });

  it("rejeita gate desconhecido e campo sensível sem ecoar valor", () => {
    const issues = validateProcessEvent({
      type: "gate",
      timestamp: "2026-08-01T10:00:00Z",
      gate: "wrong",
      prompt: "segredo que não deve aparecer",
    });

    expect(issues).toEqual(expect.arrayContaining([expect.stringMatching(/gate/i)]));
    expect(issues).toEqual(expect.arrayContaining([expect.stringMatching(/sensitive|prompt/i)]));
    expect(issues.join(" ")).not.toContain("segredo");
  });

  it("aceita healed com regra (telemetria de auto-correção)", () => {
    expect(
      validateProcessEvent({
        type: "healed",
        timestamp: "2026-08-05T10:00:00Z",
        rule: "rule-26",
        branch: "feat/x",
      }),
    ).toEqual([]);
  });

  it("rejeita healed sem regra", () => {
    const issues = validateProcessEvent({
      type: "healed",
      timestamp: "2026-08-05T10:00:00Z",
    });
    expect(issues).toEqual(expect.arrayContaining([expect.stringMatching(/rule/i)]));
  });

  it("valida eventos router pelo contrato compartilhado", () => {
    expect(validateProcessEvent(resolvedEvent)).toEqual([]);
    expect(
      validateProcessEvent({
        ...resolvedEvent,
        model: "",
      }),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/model/i)]));
  });

  it("agrega tipos, inválidos e resoluções sem conclusão", () => {
    const events = [
      resolvedEvent,
      {
        type: "pre-pr",
        timestamp: "2026-08-01T11:00:00Z",
        branch: "feat/a",
        errors: 0,
      },
      {
        type: "gate",
        timestamp: "2026-08-01T12:00:00Z",
        gate: "wrong",
      },
    ];

    expect(validateProcessEvents(events)).toHaveLength(1);
    expect(summarizeProcessEvidence(events)).toMatchObject({
      total: 3,
      invalid: 1,
      byType: { "llm.route.resolved": 1, "pre-pr": 1, gate: 1 },
      unobserved: 1,
    });
  });
});
