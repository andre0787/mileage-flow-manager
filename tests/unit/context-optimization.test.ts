import { describe, expect, it } from "vitest";
import { archiveNameFor, isUsableLine } from "../../scripts/trim-tracking.mjs";
import {
  bytesToTokens,
  CATEGORY_DOCS,
  auditContext,
} from "../../scripts/context-audit.mjs";
import { sessionHealth } from "../../scripts/generate-report.mjs";

describe("trim-tracking (rotação de telemetria)", () => {
  it("archiveNameFor usa o mês da primeira linha para nomear o arquivo", () => {
    expect(archiveNameFor("2026-08-12T10:00:00.000Z", "events.jsonl")).toBe(
      "events-2026-08.jsonl",
    );
    expect(archiveNameFor("", "quality.jsonl")).toBe("quality-unknown.jsonl");
  });

  it("isUsableLine aceita JSON válido e rejeita corrompido/vazio", () => {
    expect(isUsableLine('{"type":"session:start","timestamp":"2026-08-12T00:00:00.000Z"}')).toBe(true);
    expect(isUsableLine("linha truncada sem fechar json")).toBe(false);
    expect(isUsableLine("")).toBe(false);
  });
});

describe("context-audit (custo de contexto do workflow)", () => {
  it("categoria feature usa WORKFLOW-QUICKSTART enxuto (não o WORKFLOW.md pesado)", () => {
    expect(CATEGORY_DOCS.feature).toContain("docs/WORKFLOW-QUICKSTART.md");
    expect(CATEGORY_DOCS.feature).not.toContain("docs/WORKFLOW.md");
  });

  it("bytesToTokens estima ~4 chars por token", () => {
    expect(bytesToTokens(4000)).toBe(1000);
    expect(bytesToTokens(0)).toBe(0);
  });

  it("auditContext reporta overhead fixo de tracking", () => {
    const audit = auditContext();
    expect(audit.overhead.events).toBeGreaterThan(0);
    expect(audit.overhead.quality).toBeGreaterThan(0);
    expect(audit.categories.feature.tokens).toBeGreaterThan(0);
    expect(audit.status.label).toMatch(/Enxuto|Moderado|Pesado/);
  });

  it("sessionHealth classifica por entregas e violações líquidas", () => {
    expect(sessionHealth({ prMerges: 2, prePrFail: 0, ruleFails: 3, healed: 1 }).label).toBe("Saudável");
    expect(sessionHealth({ prMerges: 0, prePrFail: 0, ruleFails: 15, healed: 0 }).label).toBe("Precisa atenção");
  });
});
