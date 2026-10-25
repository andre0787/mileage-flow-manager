import { describe, it, expect } from "vitest";
import { computeRecentEntries, computeRecentTransfers } from "@/lib/dashboardTimeline";
import type { Account, OrigemType, PointEntry } from "@/types";

describe("dashboardTimeline Benchmark", () => {
  it("measures performance of computeRecentTransfers and computeRecentEntries", () => {
    const numAccounts = 500;
    const numEntries = 5000;

    const accounts: Account[] = Array.from({ length: numAccounts }, (_, i) => ({
      id: `acc-${i}`,
      name: `Account Name ${i}`,
      ownerId: `owner-${i % 10}`,
      programId: `prog-${i % 5}`,
      type: "milhas",
      balance: 1000,
      status: "ativa",
      createdAt: "2026-01-01",
    }));

    const origemTypes: OrigemType[] = [
      { id: "ot-transfer", name: "Transferência", accountType: "milhas", color: "#000" },
      { id: "ot-buy", name: "Compra", accountType: "milhas", color: "#fff" },
    ];

    const entries: PointEntry[] = Array.from({ length: numEntries }, (_, i) => ({
      id: `entry-${i}`,
      accountId: `acc-${i % numAccounts}`,
      sourceAccountId: `acc-${(i + 1) % numAccounts}`,
      origemTypeId: i % 2 === 0 ? "ot-transfer" : "ot-buy",
      amount: 1000 + i,
      amountPaid: 50,
      costPerThousand: 20,
      date: `2026-08-${String((i % 28) + 1).padStart(2, "0")}`,
    }));

    const iterations = 500;

    const start = performance.now();
    let transferRowsCount = 0;
    let entryRowsCount = 0;

    for (let iter = 0; iter < iterations; iter++) {
      const transfers = computeRecentTransfers(entries, accounts, origemTypes);
      const recentEntries = computeRecentEntries(entries, accounts);
      transferRowsCount = transfers.length;
      entryRowsCount = recentEntries.length;
    }

    const duration = performance.now() - start;

    expect(transferRowsCount).toBe(8);
    expect(entryRowsCount).toBe(6);
    expect(duration).toBeGreaterThan(0);
  });
});
