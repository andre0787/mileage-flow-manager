import { describe, it, expect } from "vitest";
import { calcWeightedAverageCost } from "@/lib/metrics";

interface Program {
  id: string;
  name: string;
}

interface Account {
  id: string;
  programId: string;
  balance: number;
  averageCostPerMile?: number;
}

interface Sale {
  id: string;
  program: string;
  milesUsed: number;
  saleValue: number;
  profit: number;
}

interface ExpectedProgramReport {
  program: string;
  totalStock: number;
  averageCostPerMile: number;
  totalSold: number;
  revenue: number;
  profit: number;
}

describe("Relatorios Program Reports Benchmark", () => {
  it("compares linear filter per program vs pre-grouped Map lookup", () => {
    const numPrograms = 50;
    const numAccounts = 2000;
    const numSales = 5000;

    const programs: Program[] = Array.from({ length: numPrograms }, (_, i) => ({
      id: `prog-${i}`,
      name: `Program ${i}`,
    }));

    const accounts: Account[] = Array.from({ length: numAccounts }, (_, i) => {
      const prog = programs[i % numPrograms];
      return {
        id: `acc-${i}`,
        programId: prog.id,
        balance: 10000 + (i % 50) * 1000,
        averageCostPerMile: 0.015 + (i % 10) * 0.001,
      };
    });

    const filteredSales: Sale[] = Array.from({ length: numSales }, (_, i) => {
      const prog = programs[i % numPrograms];
      return {
        id: `sale-${i}`,
        program: prog.name,
        milesUsed: 5000 + (i % 20) * 500,
        saleValue: 150 + (i % 20) * 15,
        profit: 30 + (i % 20) * 3,
      };
    });

    const iterations = 50;

    // Baseline approach: filter accounts & filter sales inside .map loop
    const startBaseline = performance.now();
    let baselineResults: ExpectedProgramReport[] = [];
    for (let iter = 0; iter < iterations; iter++) {
      baselineResults = programs.map((program) => {
        const programAccounts = accounts.filter((a) => a.programId === program.id);
        const totalStock = programAccounts.reduce((sum, a) => sum + a.balance, 0);
        const averageCostPerMile = calcWeightedAverageCost(programAccounts);

        const programSales = filteredSales.filter((s) => s.program === program.name);
        const totalSold = programSales.reduce((sum, s) => sum + s.milesUsed, 0);
        const revenue = programSales.reduce((sum, s) => sum + s.saleValue, 0);
        const profit = programSales.reduce((sum, s) => sum + s.profit, 0);

        return {
          program: program.name,
          totalStock,
          averageCostPerMile,
          totalSold,
          revenue,
          profit,
        };
      });
    }
    const endBaseline = performance.now();
    const baselineDuration = endBaseline - startBaseline;

    // Optimized approach: pre-group accounts and sales into Maps before .map loop
    const startOptimized = performance.now();
    let optimizedResults: ExpectedProgramReport[] = [];
    for (let iter = 0; iter < iterations; iter++) {
      const accountsByProgramId = new Map<string, Account[]>();
      for (const a of accounts) {
        let group = accountsByProgramId.get(a.programId);
        if (!group) {
          group = [];
          accountsByProgramId.set(a.programId, group);
        }
        group.push(a);
      }

      const salesByProgramName = new Map<string, Sale[]>();
      for (const s of filteredSales) {
        let group = salesByProgramName.get(s.program);
        if (!group) {
          group = [];
          salesByProgramName.set(s.program, group);
        }
        group.push(s);
      }

      optimizedResults = programs.map((program) => {
        const programAccounts = accountsByProgramId.get(program.id) ?? [];
        const totalStock = programAccounts.reduce((sum, a) => sum + a.balance, 0);
        const averageCostPerMile = calcWeightedAverageCost(programAccounts);

        const programSales = salesByProgramName.get(program.name) ?? [];
        const totalSold = programSales.reduce((sum, s) => sum + s.milesUsed, 0);
        const revenue = programSales.reduce((sum, s) => sum + s.saleValue, 0);
        const profit = programSales.reduce((sum, s) => sum + s.profit, 0);

        return {
          program: program.name,
          totalStock,
          averageCostPerMile,
          totalSold,
          revenue,
          profit,
        };
      });
    }
    const endOptimized = performance.now();
    const optimizedDuration = endOptimized - startOptimized;

    // Verify exact equality of outputs
    expect(optimizedResults).toEqual(baselineResults);

  });
});
