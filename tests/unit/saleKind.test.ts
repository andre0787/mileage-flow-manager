import { describe, it, expect } from "vitest";
import { validateSaleKind } from "@/lib/saleKind";

describe("validateSaleKind", () => {
  it("servico válido passa", () => {
    expect(
      validateSaleKind({
        kind: "servico",
        milesUsed: 0,
        accountId: null,
        saleValue: 500,
        clientId: "c1",
        serviceType: "consultoria",
        pricePerMile: null,
      }),
    ).toEqual([]);
  });

  it("servico com milhas falha", () => {
    const errs = validateSaleKind({
      kind: "servico",
      milesUsed: 100,
      accountId: null,
      saleValue: 500,
      clientId: "c1",
      serviceType: "taxa",
      pricePerMile: null,
    });
    expect(errs.length).toBeGreaterThan(0);
  });

  it("servico com conta falha", () => {
    const errs = validateSaleKind({
      kind: "servico",
      milesUsed: 0,
      accountId: "a1",
      saleValue: 500,
      clientId: "c1",
      serviceType: "outro",
      pricePerMile: null,
    });
    expect(errs.length).toBeGreaterThan(0);
  });

  it("milhas sem miles falha", () => {
    const errs = validateSaleKind({
      kind: "milhas",
      milesUsed: 0,
      accountId: "a1",
      saleValue: 100,
      clientId: "c1",
      serviceType: null,
      pricePerMile: 16,
    });
    expect(errs.length).toBeGreaterThan(0);
  });

  it("milhas com observations falha", () => {
    const errs = validateSaleKind({
      kind: "milhas",
      milesUsed: 100,
      accountId: "a1",
      saleValue: 100,
      clientId: "c1",
      serviceType: null,
      pricePerMile: 16,
      observations: "x",
    });
    expect(errs.length).toBeGreaterThan(0);
  });
});

describe("helpers extraídos (rule-41)", () => {
  it("isMilesSaleKind: ausente/null = milhas", async () => {
    const { isMilesSaleKind } = await import("@/lib/saleKind");
    expect(isMilesSaleKind(undefined)).toBe(true);
    expect(isMilesSaleKind(null)).toBe(true);
    expect(isMilesSaleKind("milhas")).toBe(true);
    expect(isMilesSaleKind("servico")).toBe(false);
  });

  it("kindInputForAdd monta o input com defaults", async () => {
    const { kindInputForAdd } = await import("@/lib/saleKind");
    expect(kindInputForAdd({ saleValue: 500, clientId: "c1" })).toMatchObject({
      kind: "milhas",
      milesUsed: 0,
      accountId: null,
      saleValue: 500,
    });
  });

  it("validateEffectiveKind rejeita servico ganhando conta", async () => {
    const { validateEffectiveKind } = await import("@/lib/saleKind");
    const errs = validateEffectiveKind(
      { sale_kind: "servico", miles_used: 0, sale_value: 500, client_id: "c1" },
      { accountId: "a1" },
    );
    expect(errs.length).toBeGreaterThan(0);
  });

  it("validateEffectiveKind aceita patch válido de milhas", async () => {
    const { validateEffectiveKind } = await import("@/lib/saleKind");
    const errs = validateEffectiveKind(
      { sale_kind: "milhas", miles_used: 100, sale_value: 500, client_id: "c1" },
      { observations: null },
    );
    expect(errs).toEqual([]);
  });
});
