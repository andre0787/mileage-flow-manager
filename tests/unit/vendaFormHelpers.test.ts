import { describe, it, expect } from "vitest";
import {
  sumAdditionalCosts,
  buildCreateSaleInput,
  buildUpdateSaleInput,
  mapSaleToInitialFormData,
} from "@/features/vendas/vendaFormHelpers";
import type { SaleFormData } from "@/components/SaleForm";
import type { Sale } from "@/types";

describe("vendaFormHelpers", () => {
  const baseFormData: SaleFormData = {
    ownerName: "João",
    accountId: "acc-1",
    accountName: "Conta Smiles",
    program: "Smiles",
    clientId: "cli-1",
    clientName: "Cliente A",
    milesUsed: "10000",
    pricePerMile: "20",
    saleValue: "300",
    additionalCost: "0",
    additionalCostDesc: "",
    additionalCosts: [{ desc: "Taxa", amount: "10" }],
    ticketLocator: "ABCDEF",
    passengers: [{ name: "Passageiro 1", cpf: "123" }],
    costPerMile: 15,
    includeInRoi: true,
    kind: "milhas",
    serviceType: "",
    observations: "",
    date: "2026-03-01",
  };

  it("calcula soma de custos adicionais corretamente", () => {
    const res = sumAdditionalCosts(baseFormData);
    expect(res.total).toBe(10);
    expect(res.items).toEqual([{ desc: "Taxa", amount: 10 }]);
  });

  it("suporta modo legacy de custo adicional quando additionalCosts estiver vazio", () => {
    const legacyData: SaleFormData = {
      ...baseFormData,
      additionalCosts: [],
      additionalCost: "25",
      additionalCostDesc: "Taxa de emisso",
    };
    const res = sumAdditionalCosts(legacyData);
    expect(res.total).toBe(25);
    expect(res.items).toEqual([{ desc: "Taxa de emisso", amount: 25 }]);
  });

  it("cria payload de venda tipo milhas", () => {
    const input = buildCreateSaleInput(baseFormData);
    expect(input.kind).toBe("milhas");
    expect(input.milesUsed).toBe(10000);
    expect(input.saleValue).toBe(300);
    expect(input.additionalCost).toBe(10);
  });

  it("cria payload de venda tipo serviço", () => {
    const serviceData: SaleFormData = {
      ...baseFormData,
      kind: "servico",
      serviceType: "consultoria",
      saleValue: "500",
      observations: "Consultoria VIP",
    };
    const input = buildCreateSaleInput(serviceData);
    expect(input.kind).toBe("servico");
    expect(input.serviceType).toBe("consultoria");
    expect(input.profit).toBe(500);
    expect(input.profitMargin).toBe(100);
  });

  it("cria payload de atualização para venda tipo milhas", () => {
    const editingSale: Sale = {
      id: "sale-123",
      kind: "milhas",
      accountId: "acc-1",
      ownerName: "João",
      accountName: "Conta Smiles",
      program: "Smiles",
      clientId: "cli-1",
      clientName: "Cliente A",
      milesUsed: 10000,
      saleValue: 300,
      costPerMile: 15,
      amountReceived: 100,
      profit: 140,
      profitMargin: 46.6,
      status: "pendente",
      ticketLocator: "ABCDEF",
      passengers: [],
      date: "2026-03-01",
    };
    const updateInput = buildUpdateSaleInput(editingSale, baseFormData);
    expect(updateInput.id).toBe("sale-123");
    expect(updateInput.amountReceived).toBe(100);
  });

  it("mapeia Sale para SaleFormData inicial e lida com nulo", () => {
    expect(mapSaleToInitialFormData(null)).toBeUndefined();

    const editingSale: Sale = {
      id: "sale-123",
      kind: "milhas",
      accountId: "acc-1",
      ownerName: "João",
      accountName: "Conta Smiles",
      program: "Smiles",
      clientId: "cli-1",
      clientName: "Cliente A",
      milesUsed: 10000,
      saleValue: 300,
      costPerMile: 15,
      amountReceived: 100,
      profit: 140,
      profitMargin: 46.6,
      status: "pendente",
      ticketLocator: "ABCDEF",
      passengers: [],
      date: "2026-03-01",
    };
    const formData = mapSaleToInitialFormData(editingSale);
    expect(formData?.ownerName).toBe("João");
    expect(formData?.milesUsed).toBe("10000");
  });
});
