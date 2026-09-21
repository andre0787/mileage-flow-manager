import { describe, it, expect } from "vitest";
import type { PointEntry, Account } from "@/types";

describe("Entradas Filter Performance", () => {
  it("compares nested find vs Set lookup for entriesByTab filtering", () => {
    const NUM_ACCOUNTS = 1000;
    const NUM_ENTRIES = 10000;

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
      origemTypeId: `ot-${i % 3}`,
      amount: 1000,
      amountPaid: 100,
      costPerThousand: 100,
      date: "2025-01-01",
    }));

    const activeTab = "pontos";

    // Old approach: O(N * M)
    const startOld = performance.now();
    const oldResult = entries.filter(
      (e) => accounts.find((a) => a.id === e.accountId)?.type === activeTab,
    );
    const timeOld = performance.now() - startOld;

    // Optimized approach: O(N + M)
    const startNew = performance.now();
    const validAccountIds = new Set(
      accounts.filter((a) => a.type === activeTab).map((a) => a.id),
    );
    const newResult = entries.filter((e) => validAccountIds.has(e.accountId));
    const timeNew = performance.now() - startNew;

    expect(newResult.length).toBe(oldResult.length);
    expect(newResult).toEqual(oldResult);

    expect(timeNew).toBeLessThan(timeOld);
  });
});
