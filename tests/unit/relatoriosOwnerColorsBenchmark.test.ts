import { describe, it, expect } from "vitest";
import { ownerColor } from "@/lib/ownerColors";

interface Owner {
  id: string;
  name: string;
  color?: string | null;
}

interface Report {
  ownerName: string;
  totalRevenue: number;
}

describe("Relatorios Owner Color Lookup Benchmark", () => {
  it("compares linear array search vs precomputed Map lookup for owner colors", () => {
    // Generate synthetic dataset
    const numOwners = 100;
    const numReportsPerOwner = 50; // 5000 total report rows

    const owners: Owner[] = Array.from({ length: numOwners }, (_, i) => ({
      id: `owner-${i}`,
      name: `Owner Name ${i}`,
      color: i % 2 === 0 ? `#${((i * 1234567) % 0xffffff).toString(16).padStart(6, "0")}` : null,
    }));

    const reports: Report[] = [];
    for (let r = 0; r < numReportsPerOwner; r++) {
      for (const o of owners) {
        reports.push({
          ownerName: o.name,
          totalRevenue: 1000 + r,
        });
      }
    }

    // Baseline approach: array find + ownerColor per iteration (as was in Relatorios.tsx)
    const iterations = 10;

    const startBaseline = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const colorsBaseline: string[] = [];
      for (const report of reports) {
        const color = ownerColor(
          report.ownerName,
          owners.find((o) => o.name === report.ownerName)?.color ?? null
        );
        colorsBaseline.push(color);
      }
    }
    const endBaseline = performance.now();
    const baselineDuration = endBaseline - startBaseline;

    // Optimized approach: precomputed Map lookup
    const startOptimized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const ownerColorsByName = new Map<string, string>();
      for (const o of owners) {
        ownerColorsByName.set(o.name, ownerColor(o.name, o.color ?? null));
      }

      const colorsOptimized: string[] = [];
      for (const report of reports) {
        const color = ownerColorsByName.get(report.ownerName) ?? ownerColor(report.ownerName);
        colorsOptimized.push(color);
      }
    }
    const endOptimized = performance.now();
    const optimizedDuration = endOptimized - startOptimized;

    console.log(`Baseline duration (${iterations} iterations x ${reports.length} rows): ${baselineDuration.toFixed(2)} ms`);
    console.log(`Optimized duration (${iterations} iterations x ${reports.length} rows): ${optimizedDuration.toFixed(2)} ms`);
    console.log(`Speedup: ${(baselineDuration / (optimizedDuration || 0.001)).toFixed(2)}x`);

    // Ensure correctness
    const ownerColorsByName = new Map<string, string>();
    for (const o of owners) {
      ownerColorsByName.set(o.name, ownerColor(o.name, o.color ?? null));
    }
    for (const report of reports) {
      const expected = ownerColor(
        report.ownerName,
        owners.find((o) => o.name === report.ownerName)?.color ?? null
      );
      const actual = ownerColorsByName.get(report.ownerName) ?? ownerColor(report.ownerName);
      expect(actual).toBe(expected);
    }
  });
});
