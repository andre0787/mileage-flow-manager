import { describe, it, expect } from "vitest";
import {
  computeMonthlySales,
  computeRecentEntries,
  computeRecentSales,
  computeRecentTransfers,
} from "@/lib/dashboardTimeline";
import type { Account, OrigemType, PointEntry, Sale } from "@/types";

const acct = (id: string, name: string): Account => ({
  id,
  name,
  ownerId: "o1",
  programId: "p1",
  type: "milhas",
  balance: 0,
  status: "ativa",
  createdAt: "2026-01-01",
});

const sale = (id: string, opts: Partial<Sale> = {}): Sale => ({
  id,
  accountId: "a1",
  accountName: "Conta",
  ownerName: "Ana",
  program: "Smiles",
  clientId: "c1",
  clientName: "Cliente",
  milesUsed: 1000,
  saleValue: 100,
  costPerMile: 0.05,
  profit: 50,
  profitMargin: 0.5,
  status: "concluido",
  ticketLocator: "",
  passengers: [],
  date: "2026-08-01",
  ...opts,
});

const entry = (id: string, opts: Partial<PointEntry> = {}): PointEntry => ({
  id,
  accountId: "a1",
  origemTypeId: "ot1",
  amount: 1000,
  amountPaid: 100,
  costPerThousand: 100,
  date: "2026-08-01",
  ...opts,
});

describe("computeMonthlySales", () => {
  it("agrupa por mês, soma vendas/lucro e ordena cronologicamente", () => {
    const sales = [
      sale("s1", { date: "2026-08-05", saleValue: 100, profit: 40 }),
      sale("s2", { date: "2026-08-20", saleValue: 50, profit: 20 }),
      sale("s3", { date: "2026-07-10", saleValue: 200, profit: 80 }),
      sale("s4", { date: "2026-08-01", status: "cancelado", saleValue: 999, profit: 999 }),
    ];
    const rows = computeMonthlySales(sales);
    expect(rows).toHaveLength(2);
    expect(rows[0].month).toBe("Jul/26");
    expect(rows[0].vendas).toBe(200);
    expect(rows[1].month).toBe("Ago/26");
    expect(rows[1].vendas).toBe(150);
    expect(rows[1].lucro).toBe(60);
  });
});

describe("computeRecentSales", () => {
  it("ordena por data desc, limita a 6 e mapeia status/statusColor", () => {
    const sales = [
      sale("s1", { date: "2026-08-01", status: "concluido" }),
      sale("s2", { date: "2026-08-10", status: "pago" }),
      sale("s3", { date: "2026-08-20", status: "cancelado" }),
      sale("s4", { date: "2026-08-15", status: "pendente" }),
      sale("s5", { date: "2026-07-01", status: "concluido" }),
      sale("s6", { date: "2026-06-01", status: "concluido" }),
      sale("s7", { date: "2026-05-01", status: "concluido" }),
    ];
    const rows = computeRecentSales(sales);
    expect(rows.map((r) => r.id)).toEqual(["s3", "s4", "s2", "s1", "s5", "s6"]);
    expect(rows[0].status).toBe("Cancelado");
    expect(rows[0].statusColor).toBe("destructive");
    expect(rows[1].status).toBe("Pendente");
    expect(rows[2].status).toBe("Pago");
    expect(rows[2].statusColor).toBe("secondary");
    expect(rows[3].status).toBe("Concluído");
    expect(rows[3].statusColor).toBe("default");
    expect(rows[0].client).toBe("Cliente");
    expect(rows[0].miles).toBe(1000);
  });
});

describe("computeRecentEntries", () => {
  it("ordena por data desc, limita a 6 e resolve nome da conta", () => {
    const accounts = [acct("a1", "Conta Milhas"), acct("a2", "Conta Pontos")];
    const entries = [
      entry("e1", { accountId: "a1", date: "2026-08-01", amount: 100 }),
      entry("e2", { accountId: "a2", date: "2026-08-10", amount: 200 }),
    ];
    const rows = computeRecentEntries(entries, accounts);
    expect(rows).toEqual([
      { id: "e2", amount: 200, accountName: "Conta Pontos" },
      { id: "e1", amount: 100, accountName: "Conta Milhas" },
    ]);
  });
});

describe("computeRecentTransfers", () => {
  const transferOt: OrigemType = {
    id: "ot-t",
    name: "Transferência",
    accountType: "milhas",
    color: "",
  };
  const otherOt: OrigemType = { id: "ot-x", name: "Compra", accountType: "milhas", color: "" };
  const accounts = [acct("a1", "Origem"), acct("a2", "Destino")];

  it("filtra apenas transferências com sourceAccountId e resolve nomes/bônus", () => {
    const entries = [
      entry("t1", {
        origemTypeId: "ot-t",
        sourceAccountId: "a1",
        accountId: "a2",
        amount: 1000,
        bonusPercent: 20,
        milesGenerated: 1200,
        date: "2026-08-10",
      }),
      entry("t2", {
        origemTypeId: "ot-t",
        sourceAccountId: "a1",
        accountId: "a2",
        amount: 500,
        date: "2026-08-01",
      }),
      // transferência sem sourceAccountId → não é transferência registrada
      entry("t3", { origemTypeId: "ot-t", accountId: "a2", amount: 300, date: "2026-08-05" }),
      // origem tipo compra → não entra
      entry("t4", {
        origemTypeId: "ot-x",
        sourceAccountId: "a1",
        accountId: "a2",
        amount: 999,
        date: "2026-08-08",
      }),
    ];
    const rows = computeRecentTransfers(entries, accounts, [transferOt, otherOt]);
    expect(rows.map((r) => r.id)).toEqual(["t1", "t2"]);
    expect(rows[0]).toMatchObject({
      sourceAccountName: "Origem",
      destAccountName: "Destino",
      pointsDebited: 1000,
      bonusPercent: 20,
      milesReceived: 1200,
    });
    // sem milesGenerated → usa amount
    expect(rows[1].milesReceived).toBe(500);
  });
});
