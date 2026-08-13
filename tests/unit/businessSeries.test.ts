/**
 * businessSeries.test.ts — Testes da lib de séries diárias de negócio
 * (src/lib/businessSeries.ts) — regra-31.
 */

import { describe, it, expect } from "vitest";
import {
  businessDayLabel,
  computeDailyBusinessSeries,
  computeOwnersBreakdown,
  computeProgramsBreakdown,
} from "@/lib/businessSeries";

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

describe("computeOwnersBreakdown", () => {
  const owners = [
    { id: "o1", name: "Ana" },
    { id: "o2", name: "Beto" },
  ];
  const accounts = [
    { id: "a1", ownerId: "o1", programId: "p1", balance: 100000, totalInvested: 5000 },
    { id: "a2", ownerId: "o1", programId: "p2", balance: 50000, totalInvested: 2000 },
    { id: "a3", ownerId: "o2", programId: "p1", balance: 20000, totalInvested: 800 },
  ];
  const sales = [
    { accountId: "a1", status: "concluido", passengers: [{ cpf: "111" }, { cpf: "222" }] },
    { accountId: "a1", status: "concluido", passengers: [{ cpf: "111" }] },
    { accountId: "a3", status: "cancelado", passengers: [{ cpf: "999" }] }, // excluída
  ];

  it("agrega estoque, investido e CPFs únicos por dono (ordena por milhas)", () => {
    const rows = computeOwnersBreakdown(owners, accounts, sales);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Ana", totalMiles: 150000, totalInvested: 7000 });
    expect(rows[0].cpfCount).toBe(2); // 111 e 222 (111 repetido conta 1)
    expect(rows[1]).toMatchObject({ name: "Beto", totalMiles: 20000, cpfCount: 0 });
  });

  it("filtra donos sem estoque nem investimento", () => {
    const rows = computeOwnersBreakdown(owners, [], []);
    expect(rows).toEqual([]);
  });
});

describe("computeProgramsBreakdown", () => {
  const programs = [
    { id: "p1", name: "Smiles" },
    { id: "p2", name: "Latam Pass" },
    { id: "p3", name: "Vazio" },
  ];
  const accounts = [
    { id: "a1", ownerId: "o1", programId: "p1", balance: 100000 },
    { id: "a2", ownerId: "o1", programId: "p2", balance: 50000 },
  ];

  it("soma saldo por programa e ordena decrescente", () => {
    const rows = computeProgramsBreakdown(programs, accounts);
    expect(rows).toEqual([
      { name: "Smiles", balance: 100000 },
      { name: "Latam Pass", balance: 50000 },
    ]);
  });
});
