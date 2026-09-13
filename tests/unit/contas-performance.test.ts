import { describe, expect, it } from "vitest";
import type { Owner, Program } from "@/types";

describe("Contas lookups performance benchmark", () => {
  const NUM_ITEMS = 500;
  const NUM_LOOKUPS = 5000;

  const owners: Owner[] = Array.from({ length: NUM_ITEMS }, (_, i) => ({
    id: `owner-${i}`,
    name: `Owner ${i}`,
    cpf: `000000000${i}`,
    phone: `1199999${i}`,
    color: `#ff00${i.toString(16).padStart(2, "0")}`,
  }));

  const programs: Program[] = Array.from({ length: NUM_ITEMS }, (_, i) => ({
    id: `program-${i}`,
    name: `Program ${i}`,
    type: i % 2 === 0 ? "pontos" : "milhas",
  }));

  it("produces identical lookup results for O(N) array find and O(1) Map get", () => {
    const ownerMap = new Map(owners.map((o) => [o.id, o]));
    const programMap = new Map(programs.map((p) => [p.id, p]));

    const arrayOwnerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;
    const mapOwnerName = (id: string) => ownerMap.get(id)?.name ?? id;

    const arrayOwnerColor = (id: string) => owners.find((o) => o.id === id)?.color ?? null;
    const mapOwnerColor = (id: string) => ownerMap.get(id)?.color ?? null;

    const arrayProgramName = (id: string) => programs.find((p) => p.id === id)?.name ?? id;
    const mapProgramName = (id: string) => programMap.get(id)?.name ?? id;

    const testIds = [
      "owner-0",
      "owner-250",
      "owner-499",
      "owner-unknown",
      "program-10",
      "program-499",
      "program-missing",
    ];

    for (const id of testIds) {
      expect(mapOwnerName(id)).toBe(arrayOwnerName(id));
      expect(mapOwnerColor(id)).toBe(arrayOwnerColor(id));
      expect(mapProgramName(id)).toBe(arrayProgramName(id));
    }
  });

  it("benchmarks performance difference between array find O(N) and Map get O(1)", () => {
    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    // Generate lookup target IDs
    const targetIds = Array.from({ length: NUM_LOOKUPS }, (_, i) => `owner-${i % NUM_ITEMS}`);

    // Array lookups
    const startArray = performance.now();
    let sumArrayLength = 0;
    for (let i = 0; i < NUM_LOOKUPS; i++) {
      const id = targetIds[i];
      const name = owners.find((o) => o.id === id)?.name ?? id;
      const color = owners.find((o) => o.id === id)?.color ?? null;
      sumArrayLength += name.length + (color?.length ?? 0);
    }
    const durationArray = performance.now() - startArray;

    // Map lookups
    const startMap = performance.now();
    let sumMapLength = 0;
    for (let i = 0; i < NUM_LOOKUPS; i++) {
      const id = targetIds[i];
      const name = ownerMap.get(id)?.name ?? id;
      const color = ownerMap.get(id)?.color ?? null;
      sumMapLength += name.length + (color?.length ?? 0);
    }
    const durationMap = performance.now() - startMap;

    expect(sumMapLength).toBe(sumArrayLength);

    expect(durationMap).toBeLessThan(durationArray + 1);
  });
});
