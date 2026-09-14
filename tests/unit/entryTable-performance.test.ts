import { describe, it, expect } from "vitest";
import type { PointEntry, Account, OrigemType, Program, Owner } from "@/types";

// Helper function simulating the current getSortValue implementation
function getSortValueArray(
  entry: PointEntry,
  col: string,
  accounts: Account[],
  origemTypes: OrigemType[],
  programs: Program[],
): unknown {
  switch (col) {
    case "Data":
      return new Date(entry.date).getTime();
    case "Conta":
      return accounts.find((a) => a.id === entry.accountId)?.name ?? "";
    case "Origem": {
      const ot = origemTypes.find((item) => item.id === entry.origemTypeId);
      if (ot) return ot.name.toLowerCase();
      const prog = programs.find((p) => p.id === entry.origemTypeId);
      return (prog?.name ?? entry.origemTypeId).toLowerCase();
    }
    case "Pontos":
      return entry.amount;
    case "Milhas Geradas":
    case "Milhas":
      return entry.milesGenerated ?? entry.amount;
    case "Valor Pago":
      return entry.amountPaid;
    case "Taxa Conv.":
      return entry.conversionRate ?? 0;
    case "Custo/Milha":
      return entry.costPerMile ?? 0;
    default:
      return "";
  }
}

// Helper function simulating Map-based getSortValue
function getSortValueMap(
  entry: PointEntry,
  col: string,
  accountMap: Map<string, Account>,
  origemNameMap: Map<string, string>,
): unknown {
  switch (col) {
    case "Data":
      return new Date(entry.date).getTime();
    case "Conta":
      return accountMap.get(entry.accountId)?.name ?? "";
    case "Origem":
      return (origemNameMap.get(entry.origemTypeId) ?? entry.origemTypeId).toLowerCase();
    case "Pontos":
      return entry.amount;
    case "Milhas Geradas":
    case "Milhas":
      return entry.milesGenerated ?? entry.amount;
    case "Valor Pago":
      return entry.amountPaid;
    case "Taxa Conv.":
      return entry.conversionRate ?? 0;
    case "Custo/Milha":
      return entry.costPerMile ?? 0;
    default:
      return "";
  }
}

describe("EntryTable Lookup Performance Benchmark", () => {
  it("compares Map-based lookup performance vs linear Array search", () => {
    const NUM_ENTRIES = 5000;
    const NUM_ACCOUNTS = 100;
    const NUM_OWNERS = 100;
    const NUM_ORIGEMS = 100;

    const accounts: Account[] = Array.from({ length: NUM_ACCOUNTS }, (_, i) => ({
      id: `acc-${i}`,
      name: `Conta ${i}`,
      ownerId: `owner-${i % NUM_OWNERS}`,
      programId: `prog-${i}`,
      type: "pontos",
      balance: 1000,
      status: "ativa",
      createdAt: "2024-01-01",
    }));

    const owners: Owner[] = Array.from({ length: NUM_OWNERS }, (_, i) => ({
      id: `owner-${i}`,
      name: `Dono ${i}`,
      cpf: "",
      phone: "",
      color: "#123456",
    }));

    const origemTypes: OrigemType[] = Array.from({ length: NUM_ORIGEMS }, (_, i) => ({
      id: `orig-${i}`,
      name: `Origem ${i}`,
      accountType: "pontos",
      color: "#654321",
    }));

    const programs: Program[] = [];

    const entries: PointEntry[] = Array.from({ length: NUM_ENTRIES }, (_, i) => ({
      id: `entry-${i}`,
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      origemTypeId: `orig-${i % NUM_ORIGEMS}`,
      amount: i * 10,
      amountPaid: i * 2,
      costPerMile: 0.05,
      date: "2024-05-01",
      entryStatus: "confirmado",
    }));

    // Baseline: Array.find method inside loop
    const startBaseline = performance.now();
    for (let iteration = 0; iteration < 10; iteration++) {
      for (const entry of entries) {
        const account = accounts.find((a) => a.id === entry.accountId);
        const ownerId = account?.ownerId ?? "";
        const owner = owners.find((o) => o.id === ownerId);
        const ownerNameStr = owner?.name ?? ownerId;
        const customColorHex = owner?.color ?? null;
        const ot = origemTypes.find((item) => item.id === entry.origemTypeId);
        const origemName = ot?.name ?? entry.origemTypeId;
        void account;
        void ownerNameStr;
        void customColorHex;
        void origemName;
      }
      // Also simulate sorting by 'Conta' or 'Origem'
      entries.slice().sort((a, b) => {
        const valA = getSortValueArray(a, "Conta", accounts, origemTypes, programs) as string;
        const valB = getSortValueArray(b, "Conta", accounts, origemTypes, programs) as string;
        return valA.localeCompare(valB);
      });
    }
    const durationBaseline = performance.now() - startBaseline;

    // Optimized: Map pre-computed
    const startOptimized = performance.now();
    for (let iteration = 0; iteration < 10; iteration++) {
      const accountMap = new Map(accounts.map((a) => [a.id, a]));
      const ownerMap = new Map(owners.map((o) => [o.id, o]));
      const origemNameMap = new Map<string, string>();
      origemTypes.forEach((ot) => origemNameMap.set(ot.id, ot.name));

      for (const entry of entries) {
        const account = accountMap.get(entry.accountId);
        const ownerId = account?.ownerId ?? "";
        const owner = ownerMap.get(ownerId);
        const ownerNameStr = owner?.name ?? ownerId;
        const customColorHex = owner?.color ?? null;
        const origemName = origemNameMap.get(entry.origemTypeId) ?? entry.origemTypeId;
        void account;
        void ownerNameStr;
        void customColorHex;
        void origemName;
      }

      entries.slice().sort((a, b) => {
        const valA = getSortValueMap(a, "Conta", accountMap, origemNameMap) as string;
        const valB = getSortValueMap(b, "Conta", accountMap, origemNameMap) as string;
        return valA.localeCompare(valB);
      });
    }
    const durationOptimized = performance.now() - startOptimized;

    console.log(`[Benchmark] Baseline (Array.find): ${durationBaseline.toFixed(2)}ms`);
    console.log(`[Benchmark] Optimized (Map.get):    ${durationOptimized.toFixed(2)}ms`);
    console.log(
      `[Benchmark] Speedup factor:          ${(durationBaseline / durationOptimized).toFixed(2)}x faster`,
    );

    expect(durationOptimized).toBeLessThan(durationBaseline);
  });
});
