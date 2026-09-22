import { describe, it, expect } from "vitest";
import { calcProfitMargin, calcROI } from "@/lib/metrics";

interface Owner {
  id: string;
  name: string;
}

interface Account {
  id: string;
  ownerId: string;
}

interface Entry {
  accountId: string;
  amount: number;
  amountPaid: number;
  milesGenerated?: number;
}

interface Sale {
  accountId?: string;
  saleValue: number;
  profit: number;
}

interface OwnerReportResult {
  ownerName: string;
  totalPointsAcquired: number;
  totalAmountInvested: number;
  totalMilesGenerated: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  roi: number;
}

describe("Relatorios Owner Traversal Benchmark", () => {
  it("compares nested array filtering vs map pre-aggregation", () => {
    const numOwners = 50;
    const accountsPerOwner = 10; // 500 accounts
    const entriesCount = 5000;
    const salesCount = 5000;

    const owners: Owner[] = Array.from({ length: numOwners }, (_, i) => ({
      id: `owner-${i}`,
      name: `Owner ${i}`,
    }));

    const accounts: Account[] = [];
    for (const o of owners) {
      for (let a = 0; a < accountsPerOwner; a++) {
        accounts.push({
          id: `acc-${o.id}-${a}`,
          ownerId: o.id,
        });
      }
    }

    const filteredEntries: Entry[] = Array.from({ length: entriesCount }, (_, i) => {
      const acc = accounts[i % accounts.length];
      return {
        accountId: acc.id,
        amount: 1000 + (i % 500),
        amountPaid: 500 + (i % 200),
        milesGenerated: i % 2 === 0 ? 1000 + (i % 500) : undefined,
      };
    });

    const filteredSales: Sale[] = Array.from({ length: salesCount }, (_, i) => {
      const acc = accounts[i % accounts.length];
      return {
        accountId: acc.id,
        saleValue: 2000 + (i % 300),
        profit: 300 + (i % 100),
      };
    });

    const iterations = 10;

    // Baseline implementation
    const startBaseline = performance.now();
    let baselineResult: OwnerReportResult[] = [];
    for (let iter = 0; iter < iterations; iter++) {
      baselineResult = owners.map((owner) => {
        const ownerAccountIds = accounts.filter((a) => a.ownerId === owner.id).map((a) => a.id);

        const ownerEntries = filteredEntries.filter((e) => ownerAccountIds.includes(e.accountId));
        const totalPointsAcquired = ownerEntries.reduce((sum, e) => sum + e.amount, 0);
        const totalAmountInvested = ownerEntries.reduce((sum, e) => sum + e.amountPaid, 0);
        const totalMilesGenerated = ownerEntries.reduce(
          (sum, e) => sum + (e.milesGenerated ?? e.amount),
          0
        );

        const ownerSales = filteredSales.filter((s) => ownerAccountIds.includes(s.accountId ?? ""));
        const totalRevenue = ownerSales.reduce((sum, s) => sum + s.saleValue, 0);
        const totalProfit = ownerSales.reduce((sum, s) => sum + s.profit, 0);

        const profitMargin = calcProfitMargin(totalProfit, totalRevenue);
        const roi = calcROI(totalProfit, totalAmountInvested);

        return {
          ownerName: owner.name,
          totalPointsAcquired,
          totalAmountInvested,
          totalMilesGenerated,
          totalRevenue,
          totalProfit,
          profitMargin,
          roi,
        };
      });
    }
    const endBaseline = performance.now();
    const baselineDuration = endBaseline - startBaseline;

    // Optimized implementation
    const startOptimized = performance.now();
    let optimizedResult: OwnerReportResult[] = [];
    for (let iter = 0; iter < iterations; iter++) {
      const accountOwnerMap = new Map<string, string>();
      for (const acc of accounts) {
        if (acc.ownerId) {
          accountOwnerMap.set(acc.id, acc.ownerId);
        }
      }

      const entriesByOwner = new Map<
        string,
        { totalPointsAcquired: number; totalAmountInvested: number; totalMilesGenerated: number }
      >();

      for (const e of filteredEntries) {
        const ownerId = accountOwnerMap.get(e.accountId);
        if (!ownerId) continue;
        let agg = entriesByOwner.get(ownerId);
        if (!agg) {
          agg = { totalPointsAcquired: 0, totalAmountInvested: 0, totalMilesGenerated: 0 };
          entriesByOwner.set(ownerId, agg);
        }
        agg.totalPointsAcquired += e.amount;
        agg.totalAmountInvested += e.amountPaid;
        agg.totalMilesGenerated += e.milesGenerated ?? e.amount;
      }

      const salesByOwner = new Map<string, { totalRevenue: number; totalProfit: number }>();

      for (const s of filteredSales) {
        if (!s.accountId) continue;
        const ownerId = accountOwnerMap.get(s.accountId);
        if (!ownerId) continue;
        let agg = salesByOwner.get(ownerId);
        if (!agg) {
          agg = { totalRevenue: 0, totalProfit: 0 };
          salesByOwner.set(ownerId, agg);
        }
        agg.totalRevenue += s.saleValue;
        agg.totalProfit += s.profit;
      }

      optimizedResult = owners.map((owner) => {
        const entryAgg = entriesByOwner.get(owner.id) ?? {
          totalPointsAcquired: 0,
          totalAmountInvested: 0,
          totalMilesGenerated: 0,
        };
        const saleAgg = salesByOwner.get(owner.id) ?? {
          totalRevenue: 0,
          totalProfit: 0,
        };

        const profitMargin = calcProfitMargin(saleAgg.totalProfit, saleAgg.totalRevenue);
        const roi = calcROI(saleAgg.totalProfit, entryAgg.totalAmountInvested);

        return {
          ownerName: owner.name,
          totalPointsAcquired: entryAgg.totalPointsAcquired,
          totalAmountInvested: entryAgg.totalAmountInvested,
          totalMilesGenerated: entryAgg.totalMilesGenerated,
          totalRevenue: saleAgg.totalRevenue,
          totalProfit: saleAgg.totalProfit,
          profitMargin,
          roi,
        };
      });
    }
    const endOptimized = performance.now();
    const optimizedDuration = endOptimized - startOptimized;

    // Note: avoid console.log to satisfy rule-30 in production code/tests if needed, but vitest output or assertion can be used.
    expect(baselineResult).toEqual(optimizedResult);
    expect(optimizedDuration).toBeLessThan(baselineDuration);
  });
});
