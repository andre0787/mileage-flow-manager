import { describe, it, expect } from "vitest";
import { computeRecentEntries, computeRecentTransfers } from "@/lib/dashboardTimeline";
import type { Account, OrigemType, PointEntry } from "@/types";

describe("dashboardTimeline performance benchmark", () => {
  it("measures performance of computeRecentTransfers and computeRecentEntries with Map vs array find", () => {
    const numAccounts = 1000;
    const numEntries = 100;

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
      { id: "ot-purchase", name: "Compra", accountType: "milhas", color: "#111" },
    ];

    const entries: PointEntry[] = Array.from({ length: numEntries }, (_, i) => ({
      id: `entry-${i}`,
      accountId: `acc-${i % numAccounts}`,
      sourceAccountId: `acc-${(i + 500) % numAccounts}`,
      origemTypeId: "ot-transfer",
      amount: 1000 + i,
      amountPaid: 100,
      costPerThousand: 100,
      date: `2026-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    }));

    const iterations = 10000;

    const startTransfers = performance.now();
    let transferRowsCount = 0;
    for (let iter = 0; iter < iterations; iter++) {
      const rows = computeRecentTransfers(entries, accounts, origemTypes);
      transferRowsCount = rows.length;
    }
    const durationTransfers = performance.now() - startTransfers;

    const startEntries = performance.now();
    let entryRowsCount = 0;
    for (let iter = 0; iter < iterations; iter++) {
      const rows = computeRecentEntries(entries, accounts);
      entryRowsCount = rows.length;
    }
    const durationEntries = performance.now() - startEntries;

    expect(transferRowsCount).toBe(8);
    expect(entryRowsCount).toBe(6);
    expect(durationTransfers).toBeGreaterThan(0);
    expect(durationEntries).toBeGreaterThan(0);
  });
});
