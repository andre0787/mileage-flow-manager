import { describe, expect, it } from "vitest";
import {
  parseProcessEvents,
  summarizeProcessEvidence,
  validateProcessEvent,
  validateProcessEvents,
} from "../../scripts/lib/process-events.mjs";


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

  it("aceita gate:blocked com regra (telemetria de bloqueio de gate)", () => {
    expect(
      validateProcessEvent({
        type: "gate:blocked",
        timestamp: "2026-08-05T10:00:00Z",
        rule: "rule-27-council-veredict",
        gate: "council",
        branch: "feat/x",
      }),
    ).toEqual([]);
  });

  it("rejeita gate:blocked sem regra e com gate desconhecido", () => {
    const issues = validateProcessEvent({
      type: "gate:blocked",
      timestamp: "2026-08-05T10:00:00Z",
      gate: "magic",
    });
    expect(issues).toEqual(expect.arrayContaining([expect.stringMatching(/rule/i)]));
    expect(issues).toEqual(expect.arrayContaining([expect.stringMatching(/gate/i)]));
  });

  it("aceita gate de council no tipo gate (novo gate do workflow feature)", () => {
    expect(
      validateProcessEvent({
        type: "gate",
        timestamp: "2026-08-05T10:00:00Z",
        gate: "council",
      }),
    ).toEqual([]);
  });

  it("agrega tipos e inválidos", () => {
    const events = [
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
      total: 2,
      invalid: 1,
      byType: { "pre-pr": 1, gate: 1 },
      unobserved: 0,
    });
  });
});
