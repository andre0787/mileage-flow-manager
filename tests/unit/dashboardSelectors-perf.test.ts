import { describe, it, expect } from "vitest";
import { entriesOfAccountType, salesOfAccountType } from "@/lib/dashboardSelectors";
import type { Account, PointEntry, Sale } from "@/types";

describe("Dashboard Selectors Performance Benchmark", () => {
  it("benchmarks entriesOfAccountType and salesOfAccountType performance", () => {
    const NUM_ACCOUNTS = 1000;
    const NUM_ENTRIES = 10000;
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

    const entries: PointEntry[] = Array.from({ length: NUM_ENTRIES }, (_, i) => ({
      id: `entry-${i}`,
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      sourceAccountId: i % 5 === 0 ? `acc-${(i + 1) % NUM_ACCOUNTS}` : undefined,
      origemTypeId: `ot-${i % 3}`,
      amount: 1000,
      amountPaid: 100,
      costPerThousand: 100,
      date: "2025-01-01",
    }));

    const sales: Sale[] = Array.from({ length: NUM_SALES }, (_, i) => ({
      id: `sale-${i}`,
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      accountName: `Account ${i % NUM_ACCOUNTS}`,
      ownerName: "Owner",
      program: "Program",
      clientId: `client-${i % 20}`,
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

    // Warmup
    entriesOfAccountType(entries, accounts, "milhas");
    salesOfAccountType(sales, accounts, "milhas");

    const startEntries = performance.now();
    const milhasEntries = entriesOfAccountType(entries, accounts, "milhas");
    const durationEntries = performance.now() - startEntries;

    const startSales = performance.now();
    const milhasSales = salesOfAccountType(sales, accounts, "milhas");
    const durationSales = performance.now() - startSales;


    expect(milhasEntries.length).toBeGreaterThan(0);
    expect(milhasSales.length).toBeGreaterThan(0);
  });
});
