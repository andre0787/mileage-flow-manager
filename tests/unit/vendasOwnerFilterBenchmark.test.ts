import { describe, it, expect } from "vitest";

interface Account {
  id: string;
  ownerId: string;
  name: string;
}

function getOwnerAccountIdsBaseline(accounts: Account[], ownerFilter: string): Set<string> {
  return new Set(accounts.filter((a) => a.ownerId === ownerFilter).map((a) => a.id));
}

function getOwnerAccountIdsOptimized(accounts: Account[], ownerFilter: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].ownerId === ownerFilter) {
      set.add(accounts[i].id);
    }
  }
  return set;
}

describe("Vendas/Entradas ownerAccountIds benchmark", () => {
  it("compares baseline filter.map chaining vs single-pass loop Set creation", () => {
    const numAccounts = 10000;
    const targetOwner = "owner-42";

    const accounts: Account[] = Array.from({ length: numAccounts }, (_, i) => ({
      id: `acc-${i}`,
      ownerId: `owner-${i % 100}`,
      name: `Account ${i}`,
    }));

    const iterations = 500;

    // Baseline timing
    const startBaseline = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      getOwnerAccountIdsBaseline(accounts, targetOwner);
    }
    const durationBaseline = performance.now() - startBaseline;

    // Optimized timing
    const startOptimized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      getOwnerAccountIdsOptimized(accounts, targetOwner);
    }
    const durationOptimized = performance.now() - startOptimized;

    const speedup = durationBaseline / (durationOptimized || 0.001);

    // Verify correctness
    const setBaseline = getOwnerAccountIdsBaseline(accounts, targetOwner);
    const setOptimized = getOwnerAccountIdsOptimized(accounts, targetOwner);

    expect(setOptimized.size).toBe(setBaseline.size);
    expect(Array.from(setOptimized)).toEqual(Array.from(setBaseline));
  });
});
