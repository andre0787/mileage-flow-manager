import { describe, it, expect } from "vitest";
import {
  MAX_CPF_PER_OWNER,
  accountsByOwner,
  accountsOfType,
  computeOwnerData,
  computeProgramData,
  entriesByOwner,
  entriesOfAccountType,
  salesByOwner,
  salesOfAccountType,
} from "@/lib/dashboardSelectors";
import type { Account, Owner, PointEntry, Program, Sale } from "@/types";

const ownerA: Owner = { id: "o1", name: "Ana", cpf: "111", phone: "" };
const ownerB: Owner = { id: "o2", name: "Bruno", cpf: "222", phone: "" };

const prog = (id: string, name: string): Program => ({
  id,
  name,
  type: "milhas",
  maxPassengers: 6,
});

const acct = (
  id: string,
  type: Account["type"],
  ownerId: string,
  programId: string,
  balance: number,
  totalInvested?: number,
): Account => ({
  id,
  name: `Conta ${id}`,
  ownerId,
  programId,
  type,
  balance,
  totalInvested,
  status: "ativa",
  createdAt: "2026-01-01",
});

const sale = (id: string, accountId: string, opts: Partial<Sale> = {}): Sale => ({
  id,
  accountId,
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
  passengers: [{ name: "P", passengerId: "p1", cpf: "11111111111" }],
  date: "2026-08-01",
  ...opts,
});

const entry = (id: string, accountId: string, opts: Partial<PointEntry> = {}): PointEntry => ({
  id,
  accountId,
  origemTypeId: "ot1",
  amount: 1000,
  amountPaid: 100,
  costPerThousand: 100,
  date: "2026-08-01",
  ...opts,
});

describe("accountsOfType / salesOfAccountType / entriesOfAccountType", () => {
  const accounts = [acct("a1", "milhas", "o1", "p1", 100), acct("a2", "pontos", "o1", "p2", 50)];
  const sales = [sale("s1", "a1"), sale("s2", "a2")];
  const entries = [entry("e1", "a1"), entry("e2", "a2")];

  it("filtra contas pelo tipo", () => {
    expect(accountsOfType(accounts, "milhas").map((a) => a.id)).toEqual(["a1"]);
    expect(accountsOfType(accounts, "pontos").map((a) => a.id)).toEqual(["a2"]);
  });

  it("filtra vendas pelo tipo da conta vinculada (via lookup)", () => {
    expect(salesOfAccountType(sales, accounts, "milhas").map((s) => s.id)).toEqual(["s1"]);
    expect(salesOfAccountType(sales, accounts, "pontos").map((s) => s.id)).toEqual(["s2"]);
  });

  it("filtra entradas pelo tipo da conta vinculada", () => {
    expect(entriesOfAccountType(entries, accounts, "milhas").map((e) => e.id)).toEqual(["e1"]);
    expect(entriesOfAccountType(entries, accounts, "pontos").map((e) => e.id)).toEqual(["e2"]);
  });
});

describe("accountsByOwner / salesByOwner / entriesByOwner", () => {
  const accounts = [acct("a1", "milhas", "o1", "p1", 100), acct("a2", "milhas", "o2", "p1", 50)];
  const sales = [sale("s1", "a1"), sale("s2", "a2")];
  const entries = [entry("e1", "a1"), entry("e2", "a2")];

  it("ownerId nulo retorna a lista completa", () => {
    expect(accountsByOwner(accounts, null)).toHaveLength(2);
    expect(salesByOwner(sales, accounts, null)).toHaveLength(2);
    expect(entriesByOwner(entries, accounts, null)).toHaveLength(2);
  });

  it("filtra por dono via ownerId da conta vinculada", () => {
    expect(accountsByOwner(accounts, "o1").map((a) => a.id)).toEqual(["a1"]);
    expect(salesByOwner(sales, accounts, "o1").map((s) => s.id)).toEqual(["s1"]);
    expect(entriesByOwner(entries, accounts, "o2").map((e) => e.id)).toEqual(["e2"]);
  });
});

describe("computeOwnerData", () => {
  it("agrega saldo, investido, programas e CPFs únicos por dono", () => {
    const accounts = [
      acct("a1", "milhas", "o1", "p1", 1000, 200),
      acct("a2", "milhas", "o1", "p2", 500, 100),
    ];
    const programs = [prog("p1", "Smiles"), prog("p2", "Latam")];
    const sales = [
      sale("s1", "a1", { passengers: [{ name: "P1", passengerId: "x", cpf: "11111111111" }] }),
      sale("s2", "a1", { passengers: [{ name: "P2", passengerId: "y", cpf: "11111111111" }] }),
      sale("s3", "a1", { passengers: [{ name: "P3", passengerId: "z", cpf: "22222222222" }] }),
      sale("s4", "a1", {
        status: "cancelado",
        passengers: [{ name: "P4", passengerId: "w", cpf: "99999999999" }],
      }),
    ];
    const rows = computeOwnerData([ownerA, ownerB], accounts, programs, sales);
    expect(rows).toHaveLength(1);
    const ana = rows[0];
    expect(ana.owner).toBe("Ana");
    expect(ana.totalMiles).toBe(1500);
    expect(ana.totalInvested).toBe(300);
    expect(ana.avgCost).toBeCloseTo(0.2);
    expect(ana.programs).toEqual(["Smiles", "Latam"]);
    // 2 CPFs únicos (venda cancelada não conta)
    expect(ana.cpfCount).toBe(2);
    expect(ana.maxCpf).toBe(MAX_CPF_PER_OWNER);
  });

  it("omite donos sem saldo nem investimento", () => {
    const accounts = [acct("a1", "milhas", "o1", "p1", 0)];
    const rows = computeOwnerData([ownerA, ownerB], accounts, [prog("p1", "Smiles")], []);
    expect(rows).toEqual([]);
  });
});

describe("computeProgramData", () => {
  it("soma saldos por nome do programa e usa fallback Desconhecido", () => {
    const accounts = [
      acct("a1", "milhas", "o1", "p1", 1000),
      acct("a2", "milhas", "o1", "p1", 500),
      acct("a3", "milhas", "o1", "ghost", 200),
    ];
    const data = computeProgramData(accounts, [prog("p1", "Smiles")]);
    expect(data).toEqual([
      { name: "Smiles", value: 1500, color: "hsl(211 100% 45%)" },
      { name: "Desconhecido", value: 200, color: "hsl(211 100% 45%)" },
    ]);
  });
});
