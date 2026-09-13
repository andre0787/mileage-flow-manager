import { describe, it, expect } from "vitest";
import type { Account, Owner } from "@/types";

export function computeStockInfoBaseline(accounts: Account[], owners: Owner[]) {
  return accounts
    .filter((a) => a.type === "milhas" && a.status === "ativa")
    .map((a) => ({
      accountId: a.id,
      ownerName: owners.find((o) => o.id === a.ownerId)?.name ?? "",
      accountName: a.name,
      averageCostPerMile: a.averageCostPerMile ?? 0,
    }));
}

export function computeStockInfoOptimized(accounts: Account[], owners: Owner[]) {
  const ownerMap = new Map(owners.map((o) => [o.id, o.name]));
  return accounts
    .filter((a) => a.type === "milhas" && a.status === "ativa")
    .map((a) => ({
      accountId: a.id,
      ownerName: ownerMap.get(a.ownerId) ?? "",
      accountName: a.name,
      averageCostPerMile: a.averageCostPerMile ?? 0,
    }));
}

describe("Vendas stockInfo calculation optimization", () => {
  it("produces identical output for baseline and optimized methods", () => {
    const owners: Owner[] = [
      { id: "o1", name: "Alice", color: "#fff" },
      { id: "o2", name: "Bob", color: "#000" },
    ];
    const accounts: Account[] = [
      {
        id: "a1",
        ownerId: "o1",
        programId: "p1",
        name: "Account 1",
        type: "milhas",
        status: "ativa",
        balance: 10000,
        averageCostPerMile: 15,
      },
      {
        id: "a2",
        ownerId: "o2",
        programId: "p2",
        name: "Account 2",
        type: "milhas",
        status: "ativa",
        balance: 20000,
        averageCostPerMile: 20,
      },
      {
        id: "a3",
        ownerId: "o3", // missing owner
        programId: "p1",
        name: "Account 3",
        type: "milhas",
        status: "ativa",
        balance: 5000,
      },
      {
        id: "a4",
        ownerId: "o1",
        programId: "p1",
        name: "Account 4",
        type: "pontos", // filtered out
        status: "ativa",
        balance: 5000,
      },
    ];

    const baselineResult = computeStockInfoBaseline(accounts, owners);
    const optimizedResult = computeStockInfoOptimized(accounts, owners);

    expect(optimizedResult).toEqual(baselineResult);
  });

  it("benchmarks performance improvement on large dataset", () => {
    const ownerCount = 500;
    const accountCount = 2000;

    const owners: Owner[] = Array.from({ length: ownerCount }, (_, i) => ({
      id: `owner-${i}`,
      name: `Owner ${i}`,
    }));

    const accounts: Account[] = Array.from({ length: accountCount }, (_, i) => ({
      id: `acc-${i}`,
      ownerId: `owner-${i % ownerCount}`,
      programId: `prog-${i % 10}`,
      name: `Account ${i}`,
      type: "milhas",
      status: "ativa",
      balance: 10000,
      averageCostPerMile: 18,
    }));

    // Warmup
    computeStockInfoBaseline(accounts, owners);
    computeStockInfoOptimized(accounts, owners);

    const baselineStart = performance.now();
    for (let i = 0; i < 50; i++) {
      computeStockInfoBaseline(accounts, owners);
    }
    const baselineEnd = performance.now();
    const baselineDuration = baselineEnd - baselineStart;

    const optimizedStart = performance.now();
    for (let i = 0; i < 50; i++) {
      computeStockInfoOptimized(accounts, owners);
    }
    const optimizedEnd = performance.now();
    const optimizedDuration = optimizedEnd - optimizedStart;

    expect(optimizedDuration).toBeLessThan(baselineDuration);
  });
});
