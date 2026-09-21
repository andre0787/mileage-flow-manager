import { describe, it, expect } from "vitest";

function getOwnerAccountIdsFilterMap(
  accounts: { id: string; ownerId: string }[],
  ownerFilter: string,
) {
  return new Set(accounts.filter((a) => a.ownerId === ownerFilter).map((a) => a.id));
}

function getOwnerAccountIdsSinglePass(
  accounts: { id: string; ownerId: string }[],
  ownerFilter: string,
) {
  const ids = new Set<string>();
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    if (account.ownerId === ownerFilter) {
      ids.add(account.id);
    }
  }
  return ids;
}

describe("Vendas owner account IDs filtering performance", () => {
  it("produces identical results between filter+map and single pass loop", () => {
    const mockAccounts = [
      { id: "acc1", ownerId: "owner1" },
      { id: "acc2", ownerId: "owner2" },
      { id: "acc3", ownerId: "owner1" },
      { id: "acc4", ownerId: "owner3" },
    ];

    const res1 = getOwnerAccountIdsFilterMap(mockAccounts, "owner1");
    const res2 = getOwnerAccountIdsSinglePass(mockAccounts, "owner1");

    expect(Array.from(res1)).toEqual(Array.from(res2));
    expect(res2.has("acc1")).toBe(true);
    expect(res2.has("acc3")).toBe(true);
    expect(res2.has("acc2")).toBe(false);
  });

  it("benchmarks execution difference after warm-up", () => {
    const mockAccounts = Array.from({ length: 50000 }, (_, i) => ({
      id: `acc-${i}`,
      ownerId: `owner-${i % 100}`,
    }));

    // Warm up JIT
    for (let i = 0; i < 5; i++) {
      getOwnerAccountIdsFilterMap(mockAccounts, "owner-42");
      getOwnerAccountIdsSinglePass(mockAccounts, "owner-42");
    }

    const iterations = 100;

    const startFilterMap = performance.now();
    for (let i = 0; i < iterations; i++) {
      getOwnerAccountIdsFilterMap(mockAccounts, "owner-42");
    }
    const endFilterMap = performance.now();
    const durationFilterMap = endFilterMap - startFilterMap;

    const startSinglePass = performance.now();
    for (let i = 0; i < iterations; i++) {
      getOwnerAccountIdsSinglePass(mockAccounts, "owner-42");
    }
    const endSinglePass = performance.now();
    const durationSinglePass = endSinglePass - startSinglePass;

    expect(durationSinglePass).toBeGreaterThanOrEqual(0);
    expect(durationFilterMap).toBeGreaterThanOrEqual(0);
  });
});
