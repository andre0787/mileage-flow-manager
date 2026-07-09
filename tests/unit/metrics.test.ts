import { describe, it, expect } from "vitest";
import {
  calcCostPerMile,
  calcCostPerThousand,
  calcAverageCostPerMile,
  calcProfit,
  calcProfitMargin,
  calcROI,
  calcMilesGenerated,
  calcProportionalCost,
  calcWeightedAverageCost,
  calcRevenueChange,
  filterActiveSales,
  filterSalesByMonth,
  computeDashboardMetrics,
} from "@/lib/metrics";

// ─── Cálculos de Custo ───

describe("calcCostPerMile", () => {
  it("calcula custo por milha", () => {
    expect(calcCostPerMile(100, 1000)).toBe(0.1);
  });

  it("retorna 0 quando milhas é 0", () => {
    expect(calcCostPerMile(100, 0)).toBe(0);
  });
});

describe("calcCostPerThousand", () => {
  it("calcula custo por milheiro", () => {
    expect(calcCostPerThousand(50, 1000)).toBe(50);
  });

  it("retorna 0 quando amount é 0", () => {
    expect(calcCostPerThousand(50, 0)).toBe(0);
  });
});

describe("calcAverageCostPerMile", () => {
  it("calcula custo médio ponderado", () => {
    expect(calcAverageCostPerMile(500, 5000)).toBe(0.1);
  });

  it("retorna 0 quando totalMiles é 0", () => {
    expect(calcAverageCostPerMile(500, 0)).toBe(0);
  });
});

// ─── Cálculos de Venda ───

describe("calcProfit", () => {
  it("calcula lucro sem custo adicional", () => {
    expect(calcProfit(1000, 1000, 0.5)).toBe(500);
  });

  it("calcula lucro com custo adicional", () => {
    expect(calcProfit(1000, 1000, 0.5, 100)).toBe(400);
  });
});

describe("calcProfitMargin", () => {
  it("calcula margem percentual", () => {
    expect(calcProfitMargin(40, 100)).toBe(40);
  });

  it("retorna 0 quando saleValue é 0", () => {
    expect(calcProfitMargin(40, 0)).toBe(0);
  });
});

describe("calcROI", () => {
  it("calcula ROI percentual", () => {
    expect(calcROI(30, 100)).toBe(30);
  });

  it("retorna 0 quando totalInvested é 0", () => {
    expect(calcROI(30, 0)).toBe(0);
  });
});

// ─── Entrada/Transferência ───

describe("calcMilesGenerated", () => {
  it("calcula sem bônus", () => {
    expect(calcMilesGenerated(1000, 1)).toBe(1000);
  });

  it("calcula com bônus percentual", () => {
    expect(calcMilesGenerated(1000, 1, 50)).toBe(1500);
  });

  it("ignora bônus 0%", () => {
    expect(calcMilesGenerated(1000, 1, 0)).toBe(1000);
  });
});

describe("calcProportionalCost", () => {
  it("calcula custo proporcional", () => {
    expect(calcProportionalCost(100, 1000, 500)).toBe(50);
  });

  it("retorna 0 quando saldo ou amount é 0", () => {
    expect(calcProportionalCost(100, 0, 500)).toBe(0);
    expect(calcProportionalCost(0, 1000, 500)).toBe(0);
  });
});

// ─── Relatórios ───

describe("calcWeightedAverageCost", () => {
  it("calcula custo médio ponderado por saldo", () => {
    const accounts = [
      { balance: 1000, averageCostPerMile: 0.1 },
      { balance: 2000, averageCostPerMile: 0.2 },
    ];
    expect(calcWeightedAverageCost(accounts)).toBeCloseTo(0.1667, 3);
  });

  it("retorna 0 quando estoque total é 0", () => {
    expect(calcWeightedAverageCost([{ balance: 0, averageCostPerMile: 0.1 }])).toBe(0);
  });

  it("lida com averageCostPerMile undefined", () => {
    expect(calcWeightedAverageCost([{ balance: 1000 }])).toBe(0);
  });
});

describe("calcRevenueChange", () => {
  it("calcula variação percentual", () => {
    expect(calcRevenueChange(120, 100)).toBe(20);
  });

  it("retorna 0 quando previous é 0", () => {
    expect(calcRevenueChange(120, 0)).toBe(0);
  });
});

// ─── Filtros ───

describe("filterActiveSales", () => {
  it("filtra vendas canceladas", () => {
    const sales = [
      { status: "concluida" },
      { status: "pendente" },
      { status: "cancelado" },
    ];
    expect(filterActiveSales(sales)).toHaveLength(2);
  });
});

describe("filterSalesByMonth", () => {
  it("filtra vendas do mês", () => {
    // new Date(2026, 5, 15) = junho, new Date(2026, 6, 1) = julho
    const sales = [
      { date: new Date(2026, 6, 1).toISOString() },
      { date: new Date(2026, 5, 15).toISOString() },
      { date: new Date(2026, 6, 20).toISOString() },
    ];
    expect(filterSalesByMonth(sales, 6, 2026)).toHaveLength(2);
  });
});

// ─── Métricas Agregadas ───

describe("computeDashboardMetrics", () => {
  const accounts = [
    { id: "a1", balance: 10000, totalInvested: 1000, status: "ativa", ownerId: "o1" },
    { id: "a2", balance: 5000, totalInvested: 600, status: "ativa", ownerId: "o1" },
    { id: "a3", balance: 2000, totalInvested: 300, status: "inativa", ownerId: "o2" },
  ];

  const sales = [
    { status: "concluida", date: new Date().toISOString(), saleValue: 800, profit: 200, milesUsed: 2000, accountId: "a1", passengers: [{ cpf: "111" }, { cpf: "222" }] },
    { status: "pendente", date: new Date().toISOString(), saleValue: 500, profit: 100, milesUsed: 1000, accountId: "a1", passengers: [{ cpf: "333" }] },
    { status: "cancelado", date: new Date().toISOString(), saleValue: 300, profit: 50, milesUsed: 500, accountId: "a2", passengers: [] },
    { status: "concluida", saleValue: 400, profit: 80, milesUsed: 1000, accountId: "a1", passengers: [{ cpf: "444" }], date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString() },
  ];

  const entries = [
    { date: new Date().toISOString(), amount: 5000, entryStatus: "confirmado" },
    { date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), amount: 3000, entryStatus: "confirmado" },
    { date: new Date().toISOString(), amount: 1000, entryStatus: "aguardando" },
  ];

  const owners = [
    { id: "o1", name: "João" },
    { id: "o2", name: "Maria" },
  ];

  const metrics = computeDashboardMetrics(accounts, sales, entries, owners, 22);

  it("calcula totalMiles corretamente", () => {
    expect(metrics.totalMiles).toBe(17000);
  });

  it("calcula totalInvested corretamente", () => {
    expect(metrics.totalInvested).toBe(1900);
  });

  it("calcula activeAccounts corretamente", () => {
    expect(metrics.activeAccounts).toBe(2);
  });

  it("calcula pendingSales corretamente", () => {
    expect(metrics.pendingSales).toBe(1);
  });

  it("calcula monthlyRevenue (mês atual)", () => {
    // 800 + 500 = 1300 (vendas do mês atual, não canceladas)
    expect(metrics.monthlyRevenue).toBe(1300);
  });

  it("calcula monthlyProfit", () => {
    expect(metrics.monthlyProfit).toBe(300);
  });

  it("calcula avgProfitMargin", () => {
    // totalProfit=380, totalRevenue=1700 (800+500+400) → (380/1700)*100 ≈ 22.35
    expect(metrics.avgProfitMargin).toBeCloseTo(22.35, 1);
  });

  it("calcula avgCostPerMile", () => {
    // 1900/17000 = 0.1117...
    expect(metrics.avgCostPerMile).toBeCloseTo(0.1117, 2);
  });

  it("define revenueChange como número", () => {
    expect(typeof metrics.revenueChange).toBe("number");
  });
});