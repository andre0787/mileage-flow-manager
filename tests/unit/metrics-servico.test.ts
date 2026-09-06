import { describe, it, expect } from "vitest";
import { computeDashboardMetrics, computeMetricHistory, totalServiceRevenue } from "@/lib/metrics";

const owners: { id: string; name: string }[] = [];
const accts: {
  id: string;
  balance: number;
  totalInvested?: number;
  status: string;
  ownerId: string;
}[] = [];

const milesSale = {
  status: "concluido",
  date: new Date().toISOString().split("T")[0],
  saleValue: 500,
  profit: 100,
  milesUsed: 1000,
  accountId: "a1",
  passengers: [],
  kind: "milhas",
};

const serviceSale = {
  status: "concluido",
  date: new Date().toISOString().split("T")[0],
  saleValue: 300,
  profit: 300,
  milesUsed: 0,
  accountId: null,
  passengers: [],
  kind: "servico",
};

describe("KPIs de milhagem excluem vendas-serviço", () => {
  it("totalRevenue/totalProfit/totalSoldMiles ignoram servico", () => {
    const m = computeDashboardMetrics(accts, [milesSale, serviceSale], [], owners);
    expect(m.totalSoldMiles).toBe(1000);
    expect(m.totalRevenue).toBe(500);
    expect(m.totalProfit).toBe(100);
  });

  it("séries mensais ignoram servico", () => {
    const h = computeMetricHistory([milesSale, serviceSale], [], 1);
    expect(h.revenue).toEqual([500]);
    expect(h.profit).toEqual([100]);
    expect(h.milesStock).toEqual([0 - 1000]);
  });

  it("totalServiceRevenue soma só servico não-cancelada", () => {
    expect(totalServiceRevenue([milesSale, serviceSale])).toBe(300);
    expect(totalServiceRevenue([{ ...serviceSale, status: "cancelado" }, milesSale])).toBe(0);
  });

  it("venda sem kind conta como milhas (compat com mocks/linhas antigas)", () => {
    const legacy = { ...milesSale } as Record<string, unknown>;
    delete legacy.kind;
    const m = computeDashboardMetrics(accts, [legacy as never], [], owners);
    expect(m.totalRevenue).toBe(500);
  });
});
