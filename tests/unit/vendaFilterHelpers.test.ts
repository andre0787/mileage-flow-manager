import { describe, it, expect } from "vitest";
import { filterSales, buildExportRows } from "@/features/vendas/vendaFilterHelpers";
import { ALL_OWNERS, ALL_PROGRAMS } from "@/components/ui";
import type { Sale, Account, Program } from "@/types";

describe("vendaFilterHelpers", () => {
  const mockSales: Sale[] = [
    {
      id: "sale-1",
      kind: "milhas",
      accountId: "acc-1",
      ownerName: "João",
      accountName: "Conta Smiles",
      program: "Smiles",
      clientId: "cli-1",
      clientName: "Alice",
      milesUsed: 10000,
      saleValue: 200,
      costPerMile: 15,
      profit: 50,
      profitMargin: 25,
      status: "pendente",
      ticketLocator: "LOC123",
      passengers: [],
      date: "2026-03-01",
    },
    {
      id: "sale-2",
      kind: "servico",
      serviceType: "consultoria",
      accountId: undefined,
      ownerName: "",
      accountName: "",
      program: "",
      clientId: "cli-2",
      clientName: "Bob",
      milesUsed: 0,
      saleValue: 150,
      profit: 150,
      profitMargin: 100,
      status: "pago",
      ticketLocator: "",
      passengers: [],
      date: "2026-03-02",
    },
  ];

  const mockAccounts: Account[] = [
    {
      id: "acc-1",
      ownerId: "owner-1",
      name: "Conta Smiles",
      type: "milhas",
      status: "ativa",
      programId: "prog-1",
      balance: 100000,
    },
  ];

  const mockPrograms: Program[] = [
    {
      id: "prog-1",
      name: "Smiles",
      type: "milhas",
    },
  ];

  it("filtra por status", () => {
    const res = filterSales(mockSales, "pago", ALL_OWNERS, ALL_PROGRAMS, "", mockAccounts, mockPrograms);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("sale-2");
  });

  it("filtra por busca de texto", () => {
    const res = filterSales(mockSales, "todos", ALL_OWNERS, ALL_PROGRAMS, "alice", mockAccounts, mockPrograms);
    expect(res).toHaveLength(1);
    expect(res[0].clientName).toBe("Alice");
  });

  it("gera linhas para exportação CSV", () => {
    const rows = buildExportRows(mockSales);
    expect(rows).toHaveLength(2);
    expect(rows[0].Cliente).toBe("Alice");
    expect(rows[0].Tipo).toBe("Milhas");
    expect(rows[1].Cliente).toBe("Bob");
    expect(rows[1].Tipo).toBe("Serviço");
  });
});
