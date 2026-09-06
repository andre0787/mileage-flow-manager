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
