import { describe, it, expect } from "vitest";
import { sumRoiEligibleProfit } from "@/lib/metrics";
import { mapSale } from "@/hooks/useDatabase/mappers";
import { buildVendaUpdate } from "@/features/vendas/buildVendaUpdate";

// ─── sumRoiEligibleProfit (numerador do ROI com opt-out por venda) ───

describe("sumRoiEligibleProfit", () => {
  it("soma tudo quando nenhuma venda sai do ROI", () => {
    expect(sumRoiEligibleProfit([{ profit: 100 }, { profit: 50, includeInRoi: true }])).toBe(150);
  });

  it("exclui vendas com includeInRoi === false", () => {
    const sales = [{ profit: 100 }, { profit: 30, includeInRoi: false }, { profit: 20 }];
    expect(sumRoiEligibleProfit(sales)).toBe(120);
  });

  it("linhas antigas sem o campo contam (default true)", () => {
    expect(sumRoiEligibleProfit([{ profit: 7, includeInRoi: undefined }])).toBe(7);
  });

  it("lista vazia soma zero", () => {
    expect(sumRoiEligibleProfit([])).toBe(0);
  });
});

// ─── mapSale: default defensivo para linhas pré-migration ───

const baseRow = {
  id: "sale-1",
  account_id: "acc-1",
  account_name: "Conta",
  owner_name: "Dono",
  program: "Smiles",
  client_id: "client-1",
  client_name: "Cliente",
  miles_used: 1000,
  sale_value: 200,
  cost_per_mile: 0.05,
  profit: 150,
  profit_margin: 0.75,
  status: "pendente",
  ticket_locator: "AB12",
  passengers: [],
  date: "2026-10-20",
};

describe("mapSale — includeInRoi", () => {
  it("default true quando a coluna falta (linhas pré-migration)", () => {
    expect(mapSale({ ...baseRow } as never).includeInRoi).toBe(true);
  });

  it("false só quando a coluna é false", () => {
    expect(mapSale({ ...baseRow, include_in_roi: false } as never).includeInRoi).toBe(false);
    expect(mapSale({ ...baseRow, include_in_roi: true } as never).includeInRoi).toBe(true);
  });
});

// ─── buildVendaUpdate: passthrough do flag no update ───

describe("buildVendaUpdate — include_in_roi", () => {
  it("inclui include_in_roi=false quando informado", () => {
    const payload = buildVendaUpdate({ sale_value: 200 }, { includeInRoi: false });
    expect(payload.include_in_roi).toBe(false);
  });

  it("omite o campo quando não informado (não sobrescreve)", () => {
    const payload = buildVendaUpdate({ sale_value: 200 }, { saleValue: 300 });
    expect("include_in_roi" in payload).toBe(false);
  });
});
