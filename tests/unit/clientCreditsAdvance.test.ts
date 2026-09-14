import { describe, it, expect } from "vitest";
import { planAdvance } from "@/lib/clientCredits";

describe("planAdvance (adiantamento antes da emissão)", () => {
  it("sanitiza valor com 2 casas e nota", () => {
    const plan = planAdvance({ amount: 1234.567, note: "  PIX recebido  " });
    expect(plan.ok).toBe(true);
    expect(plan.amount).toBe(1234.57);
    expect(plan.note).toBe("PIX recebido");
  });

  it("rejeita zero e negativo", () => {
    expect(planAdvance({ amount: 0 }).ok).toBe(false);
    expect(planAdvance({ amount: -10 }).ok).toBe(false);
  });

  it("rejeita NaN e string não numérica", () => {
    expect(planAdvance({ amount: Number.NaN }).ok).toBe(false);
    expect(planAdvance({ amount: "abc" as unknown as number }).ok).toBe(false);
  });

  it("nota vazia vira undefined (coluna nullable)", () => {
    const plan = planAdvance({ amount: 100, note: "   " });
    expect(plan.ok).toBe(true);
    expect(plan.note).toBeUndefined();
  });

  it("nota é truncada em 200 caracteres", () => {
    const plan = planAdvance({ amount: 100, note: "x".repeat(300) });
    expect(plan.ok).toBe(true);
    expect(plan.note).toHaveLength(200);
  });

  it("aceita nota undefined (só valor)", () => {
    const plan = planAdvance({ amount: 50 });
    expect(plan.ok).toBe(true);
    expect(plan.amount).toBe(50);
    expect(plan.note).toBeUndefined();
  });

  it("aceita data válida YYYY-MM-DD", () => {
    const plan = planAdvance({ amount: 100, date: "2026-09-10" });
    expect(plan.ok).toBe(true);
    expect(plan.date).toBe("2026-09-10");
  });

  it("rejeita data inválida", () => {
    expect(planAdvance({ amount: 100, date: "10/09/2026" }).ok).toBe(false);
    expect(planAdvance({ amount: 100, date: "2026-02-30" }).ok).toBe(false);
  });

  it("data omitida segue válida (usa hoje no ledger)", () => {
    const plan = planAdvance({ amount: 100 });
    expect(plan.ok).toBe(true);
    expect(plan.date).toBeUndefined();
  });
});
