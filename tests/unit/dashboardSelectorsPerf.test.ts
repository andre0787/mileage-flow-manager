import { describe, it, expect } from "vitest";
import { salesOfAccountType } from "@/lib/dashboardSelectors";
import type { Account, Sale } from "@/types";

describe("dashboardSelectors Performance Benchmark", () => {
  it("benchmarks salesOfAccountType with large dataset", () => {
    const NUM_ACCOUNTS = 1000;
    const NUM_SALES = 10000;

    const accounts: Account[] = Array.from({ length: NUM_ACCOUNTS }, (_, i) => ({
      id: `acc-${i}`,
      name: `Account ${i}`,
      ownerId: `owner-${i % 10}`,
      programId: `prog-${i % 5}`,
      type: i % 2 === 0 ? "pontos" : "milhas",
      balance: 1000,
      status: "ativa",
      createdAt: "2025-01-01",
    }));

    const sales: Sale[] = Array.from({ length: NUM_SALES }, (_, i) => ({
      id: `sale-${i}`,
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      accountName: "Account",
      ownerName: "Owner",
      program: "Program",
      clientId: "client-1",
      clientName: "Client",
      milesUsed: 1000,
      saleValue: 100,
      costPerMile: 0.05,
      profit: 50,
      profitMargin: 0.5,
      status: "concluido",
      ticketLocator: "",
      passengers: [],
      date: "2025-01-01",
    }));

    const start = performance.now();
    const result = salesOfAccountType(sales, accounts, "milhas");
    const duration = performance.now() - start;

    expect(result.length).toBe(NUM_SALES / 2);
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
