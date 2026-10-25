import { describe, it, expect } from "vitest";
import { computeStockInfo } from "@/features/vendas/vendaStockHelpers";
import type { Account, Owner } from "@/types";

describe("vendaStockHelpers", () => {
  const mockOwners: Owner[] = [
    { id: "o-1", name: "Dono 1", color: "#ffffff" },
    { id: "o-2", name: "Dono 2", color: "#000000" },
  ];

  const mockAccounts: Account[] = [
    {
      id: "a-1",
      ownerId: "o-1",
      name: "Conta 1",
      type: "milhas",
      status: "ativa",
      programId: "p-1",
      balance: 50000,
      averageCostPerMile: 18.5,
    },
    {
      id: "a-2",
      ownerId: "o-2",
      name: "Conta 2",
      type: "pontos",
      status: "ativa",
      programId: "p-2",
      balance: 100000,
    },
    {
      id: "a-3",
      ownerId: "o-1",
      name: "Conta 3 Inativa",
      type: "milhas",
      status: "inativa",
      programId: "p-1",
      balance: 20000,
    },
  ];

  it("filtra apenas contas de milhas ativas e mapeia nome do dono", () => {
    const stock = computeStockInfo(mockAccounts, mockOwners);
    expect(stock).toHaveLength(1);
    expect(stock[0]).toEqual({
      accountId: "a-1",
      ownerName: "Dono 1",
      accountName: "Conta 1",
      averageCostPerMile: 18.5,
    });
  });
});
