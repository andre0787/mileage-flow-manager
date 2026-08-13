import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { BusinessPanel } from "@/components/kpi/BusinessPanel";
import type { DashboardMetrics } from "@/lib/metrics";
import type { DailyBusinessPoint } from "@/lib/businessSeries";

const METRICS: DashboardMetrics = {
  totalMiles: 250000,
  totalInvested: 15000,
  monthlyRevenue: 12000,
  monthlyProfit: 4500,
  activeAccounts: 8,
  pendingSales: 2,
  cpfAlerts: 1,
  totalSoldMiles: 60000,
  totalRevenue: 90000,
  totalProfit: 30000,
  avgProfitMargin: 33.3,
  avgCostPerMile: 0.045,
  monthlyMilesIn: 30000,
  revenueChange: 12,
};

const DAILY: DailyBusinessPoint[] = Array.from({ length: 14 }, (_, i) => ({
  day: `2026-08-${String(i + 1).padStart(2, "0")}`,
  label: `${String(i + 1).padStart(2, "0")}/08`,
  revenue: 500,
  profit: 180,
  milesIn: 5000,
  milesOut: 1000,
}));

describe("BusinessPanel", () => {
  it("renderiza os cards de saúde do negócio", () => {
    render(createElement(BusinessPanel, { metrics: METRICS, daily: DAILY }));

    expect(screen.getByText("Saúde do negócio")).toBeTruthy();
    expect(screen.getByText("Estoque de milhas")).toBeTruthy();
    expect(screen.getByText("Total investido")).toBeTruthy();
    expect(screen.getByText("Receita do mês")).toBeTruthy();
    expect(screen.getByText("Lucro do mês")).toBeTruthy();
    expect(screen.getByText("Margem média")).toBeTruthy();
    expect(screen.getByText("Vendas pendentes")).toBeTruthy();
  });

  it("mostra alertas e contas ativas na faixa inferior", () => {
    render(createElement(BusinessPanel, { metrics: METRICS, daily: DAILY }));

    expect(screen.getByText(/dono\(s\) próximo\(s\) do limite de CPF/)).toBeTruthy();
    expect(screen.getByText(/contas ativas/)).toBeTruthy();
  });
});
