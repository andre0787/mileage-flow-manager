import { describe, it, expect } from "vitest";
import { percentile, computeLeadDays, computeMttrDays, computeFlowKeys } from "@/lib/flowKeys";

describe("percentile", () => {
  it("p50/p85 sobre array ordenado e null sem dados", () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(20);
    expect(percentile([10, 20, 30, 40], 0.85)).toBe(40);
    expect(percentile([], 0.5)).toBeNull();
  });
});

describe("computeLeadDays (FIFO proxy)", () => {
  it("casa cada venda com a entrada não-consumida mais antiga", () => {
    const leads = computeLeadDays(
      [
        { id: "s1", date: "2026-09-05", status: "pago", kind: "milhas" },
        { id: "s2", date: "2026-09-08", status: "concluido", kind: "milhas" },
        { id: "s3", date: "2026-09-08", status: "pendente", kind: "milhas" },
        { id: "s4", date: "2026-09-08", status: "pago", kind: "servico" },
      ],
      [{ date: "2026-09-01" }, { date: "2026-09-06" }],
    );
    expect(leads).toEqual([2, 4]);
  });
  it("ignora venda sem entrada anterior", () => {
    expect(
      computeLeadDays(
        [{ id: "s1", date: "2026-09-01", status: "pago", kind: "milhas" }],
        [{ date: "2026-09-10" }],
      ),
    ).toEqual([]);
  });
});

describe("computeMttrDays", () => {
  it("média reversal−spend por par; null sem pares (nunca 0)", () => {
    expect(
      computeMttrDays([
        { saleId: "a", kind: "spend", reversalOf: undefined, createdAt: "2026-09-01" },
        {
          saleId: "a",
          kind: "reversal",
          reversalOf: "spend",
          createdAt: "2026-09-04",
        },
      ]),
    ).toEqual({ days: 3, pairs: 1 });
    expect(computeMttrDays([])).toEqual({ days: null, pairs: 0 });
    expect(
      computeMttrDays([
        { saleId: "a", kind: "earn", reversalOf: undefined, createdAt: "2026-09-01" },
      ]),
    ).toEqual({ days: null, pairs: 0 });
  });
});

describe("computeFlowKeys", () => {
  it("throughput, CFR e flags com amostra pequena", () => {
    const keys = computeFlowKeys(
      [
        { id: "s1", date: "2026-09-05", status: "pago", kind: "milhas" },
        { id: "s2", date: "2026-09-04", status: "cancelado", kind: "milhas" },
        { id: "s3", date: "2026-09-03", status: "concluido", kind: "milhas" },
      ],
      [{ date: "2026-09-01" }],
      [],
      30,
    );
    expect(keys.throughputCount).toBe(2);
    expect(keys.throughputPerDay).toBeCloseTo(2 / 30);
    expect(keys.divergenceNum).toBe(1);
    expect(keys.divergenceDen).toBe(3);
    expect(keys.divergencePct).toBeCloseTo(100 / 3);
    expect(keys.leadPreliminary).toBe(true);
    expect(keys.mttrDays).toBeNull();
  });
  it("venda com reversal entra no numerador do CFR", () => {
    const keys = computeFlowKeys(
      [{ id: "s1", date: "2026-09-05", status: "pago", kind: "milhas" }],
      [{ date: "2026-09-01" }],
      [
        { saleId: "s1", kind: "spend", reversalOf: undefined, createdAt: "2026-09-02" },
        {
          saleId: "s1",
          kind: "reversal",
          reversalOf: "spend",
          createdAt: "2026-09-03",
        },
      ],
      30,
    );
    expect(keys.divergenceNum).toBe(1);
    expect(keys.mttrDays).toBe(1);
    expect(keys.mttrPairs).toBe(1);
  });
});
