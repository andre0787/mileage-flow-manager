import { describe, it, expect } from "vitest";
import type { Account, Owner, Program } from "@/types";

function computeStockInfoBaseline(
  accounts: Account[],
  owners: Owner[],
  programs: Program[],
) {
  return accounts
    .filter((a) => a.type === "milhas" && a.status === "ativa")
    .map((a) => ({
      accountId: a.id,
      ownerId: a.ownerId,
      ownerName: owners.find((o) => o.id === a.ownerId)?.name ?? "",
      accountName: a.name,
      programId: a.programId,
      program: programs.find((p) => p.id === a.programId)?.name ?? "",
      availableMiles: a.balance,
      averageCostPerMile: a.averageCostPerMile ?? 0,
    }));
}

function computeStockInfoOptimized(
  accounts: Account[],
  owners: Owner[],
  programs: Program[],
) {
  const ownersMap = new Map(owners.map((o) => [o.id, o.name]));
  const programsMap = new Map(programs.map((p) => [p.id, p.name]));
  return accounts
    .filter((a) => a.type === "milhas" && a.status === "ativa")
    .map((a) => ({
      accountId: a.id,
      ownerId: a.ownerId,
      ownerName: ownersMap.get(a.ownerId) ?? "",
      accountName: a.name,
      programId: a.programId,
      program: programsMap.get(a.programId) ?? "",
      availableMiles: a.balance,
      averageCostPerMile: a.averageCostPerMile ?? 0,
    }));
}

describe("saleForm stockInfo optimization", () => {
  it("produces identical output for baseline and optimized stockInfo computation", () => {
    const owners: Owner[] = [
      { id: "o1", name: "Alice", cpf: "111", phone: "111" },
      { id: "o2", name: "Bob", cpf: "222", phone: "222" },
    ];
    const programs: Program[] = [
      { id: "p1", name: "Smiles", type: "milhas" },
      { id: "p2", name: "TudoAzul", type: "milhas" },
    ];
    const accounts: Account[] = [
      {
        id: "a1",
        name: "Conta 1",
        ownerId: "o1",
        programId: "p1",
        type: "milhas",
        balance: 10000,
        averageCostPerMile: 0.02,
        status: "ativa",
        createdAt: "2025-01-01",
      },
      {
        id: "a2",
        name: "Conta 2",
        ownerId: "o2",
        programId: "p2",
        type: "milhas",
        balance: 20000,
        averageCostPerMile: 0.018,
        status: "ativa",
        createdAt: "2025-01-01",
      },
      {
        id: "a3",
        name: "Conta 3 (inativa)",
        ownerId: "o1",
        programId: "p1",
        type: "milhas",
        balance: 5000,
        status: "inativa",
        createdAt: "2025-01-01",
      },
    ];

    const baselineResult = computeStockInfoBaseline(accounts, owners, programs);
    const optimizedResult = computeStockInfoOptimized(accounts, owners, programs);

    expect(optimizedResult).toEqual(baselineResult);
  });

  it("benchmarks performance improvement on large datasets", () => {
    const ownersCount = 200;
    const programsCount = 50;
    const accountsCount = 2000;

    const owners: Owner[] = Array.from({ length: ownersCount }, (_, i) => ({
      id: `owner-${i}`,
      name: `Owner Name ${i}`,
      cpf: "00000000000",
      phone: "0000000000",
    }));

    const programs: Program[] = Array.from({ length: programsCount }, (_, i) => ({
      id: `program-${i}`,
      name: `Program Name ${i}`,
      type: "milhas",
    }));

    const accounts: Account[] = Array.from({ length: accountsCount }, (_, i) => ({
      id: `acc-${i}`,
      name: `Account ${i}`,
      ownerId: `owner-${i % ownersCount}`,
      programId: `program-${i % programsCount}`,
      type: "milhas",
      balance: 50000,
      averageCostPerMile: 0.02,
      status: "ativa",
      createdAt: "2025-01-01",
    }));

    // Warmup
    computeStockInfoBaseline(accounts, owners, programs);
    computeStockInfoOptimized(accounts, owners, programs);

    const iterations = 50;

    const startBaseline = performance.now();
    for (let i = 0; i < iterations; i++) {
      computeStockInfoBaseline(accounts, owners, programs);
    }
    const durationBaseline = performance.now() - startBaseline;

    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
      computeStockInfoOptimized(accounts, owners, programs);
    }
    const durationOptimized = performance.now() - startOptimized;

    expect(durationOptimized).toBeLessThan(durationBaseline);
  });
});
