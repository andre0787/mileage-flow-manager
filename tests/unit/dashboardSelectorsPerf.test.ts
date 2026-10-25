import { describe, it, expect } from "vitest";
import {
  salesByOwner,
  salesOfAccountType,
  entriesOfAccountType,
  computeProgramData,
} from "@/lib/dashboardSelectors";
import type { Account, Program, Sale, PointEntry } from "@/types";

describe("Dashboard Selectors Performance Benchmark", () => {
  it("compares baseline linear lookup vs optimized Set/Map lookup performance", () => {
    const NUM_ACCOUNTS = 1000;
    const NUM_SALES = 10000;
    const NUM_ENTRIES = 10000;
    const NUM_PROGRAMS = 50;

    const programs: Program[] = Array.from({ length: NUM_PROGRAMS }, (_, i) => ({
      id: `p-${i}`,
      name: `Program ${i}`,
      type: "milhas",
      maxPassengers: 25,
    }));

    const accounts: Account[] = Array.from({ length: NUM_ACCOUNTS }, (_, i) => ({
      id: `acc-${i}`,
      name: `Account ${i}`,
      ownerId: `owner-${i % 10}`,
      programId: `p-${i % NUM_PROGRAMS}`,
      type: i % 2 === 0 ? "milhas" : "pontos",
      balance: 10000,
      totalInvested: 200,
      status: "ativa",
      createdAt: "2026-01-01",
    }));

    const sales: Sale[] = Array.from({ length: NUM_SALES }, (_, i) => ({
      id: `sale-${i}`,
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      accountName: "Account",
      ownerName: "Owner",
      program: "Program",
      clientId: "c-1",
      clientName: "Client",
      milesUsed: 1000,
      saleValue: 100,
      costPerMile: 0.05,
      profit: 50,
      profitMargin: 0.5,
      status: "concluido",
      ticketLocator: "",
      passengers: [],
      date: "2026-08-01",
    }));

    const entries: PointEntry[] = Array.from({ length: NUM_ENTRIES }, (_, i) => ({
      id: `entry-${i}`,
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      sourceAccountId: i % 3 === 0 ? `acc-${(i + 1) % NUM_ACCOUNTS}` : undefined,
      origemTypeId: "ot-1",
      amount: 1000,
      amountPaid: 100,
      costPerThousand: 100,
      date: "2026-08-01",
    }));

    const targetOwner = "owner-2";

    // --- Baseline (Linear lookup algorithm) ---
    const startBaseline = performance.now();
    for (let run = 0; run < 10; run++) {
      sales.filter((s) => accounts.find((a) => a.id === s.accountId)?.ownerId === targetOwner);
      sales.filter((s) => accounts.find((a) => a.id === s.accountId)?.type === "milhas");
      entries.filter(
        (e) =>
          accounts.find((a) => a.id === e.accountId)?.type === "pontos" ||
          (e.sourceAccountId != null &&
            accounts.find((a) => a.id === e.sourceAccountId)?.type === "pontos"),
      );
    }
    const durationBaseline = performance.now() - startBaseline;

    // --- Optimized (Set/Map lookup algorithm) ---
    const startOptimized = performance.now();
    for (let run = 0; run < 10; run++) {
      salesByOwner(sales, accounts, targetOwner);
      salesOfAccountType(sales, accounts, "milhas");
      entriesOfAccountType(entries, accounts, "pontos");
      computeProgramData(accounts, programs);
    }
    const durationOptimized = performance.now() - startOptimized;

    expect(durationOptimized).toBeLessThan(durationBaseline);
  });
});
