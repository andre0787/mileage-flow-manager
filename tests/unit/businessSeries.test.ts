/**
 * businessSeries.test.ts — Testes da lib de séries diárias de negócio
 * (src/lib/businessSeries.ts) — regra-31.
 */

import { describe, it, expect } from "vitest";
import { businessDayLabel, computeDailyBusinessSeries } from "@/lib/businessSeries";

describe("businessDayLabel", () => {
  it("converte YYYY-MM-DD em dd/mm", () => {
    expect(businessDayLabel("2026-08-13")).toBe("13/08");
  });
});

describe("computeDailyBusinessSeries", () => {
  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  };

  const sales = [
    { date: day(0), saleValue: 1000, profit: 400, milesUsed: 10000, status: "concluido" },
    { date: day(1), saleValue: 500, profit: 150, milesUsed: 5000, status: "concluido" },
    { date: day(1), saleValue: 9999, profit: 0, milesUsed: 1, status: "cancelado" }, // excluída
  ];
  const entries = [
    { date: day(0), amount: 50000, milesGenerated: 55000, entryStatus: "confirmado" },
    { date: day(0), amount: 30000, milesGenerated: 30000, entryStatus: "aguardando" }, // excluída
    { date: day(2), amount: 20000, milesGenerated: 20000, sourceAccountId: "src-1" }, // transferência — excluída do milesIn
  ];

  it("gera N dias terminando hoje, mais antigo primeiro", () => {
    const series = computeDailyBusinessSeries(sales, entries, 5);
    expect(series).toHaveLength(5);
    const days = series.map((p) => p.day);
    expect(days).toEqual([...days].sort());
    expect(days[days.length - 1]).toBe(day(0));
  });

  it("agrega receita/lucro/milhas por dia com as mesmas regras do dashboard", () => {
    const series = computeDailyBusinessSeries(sales, entries, 5);
    const last = series[series.length - 1]; // hoje
    expect(last.revenue).toBe(1000);
    expect(last.profit).toBe(400);
    expect(last.milesIn).toBe(55000); // só a entrada confirmada não-transferência
    expect(last.milesOut).toBe(10000);

    const yesterday = series[series.length - 2];
    expect(yesterday.revenue).toBe(500); // cancelada excluída
    expect(yesterday.profit).toBe(150);
  });

  it("zera dias sem dados", () => {
    const series = computeDailyBusinessSeries([], [], 3);
    expect(series.every((p) => p.revenue === 0 && p.profit === 0 && p.milesIn === 0)).toBe(true);
  });
});
