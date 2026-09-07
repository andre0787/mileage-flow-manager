import { describe, expect, it } from "vitest";
import { avgUnitCost, formatUnitCost } from "@/lib/unitCost";

describe("avgUnitCost", () => {
  it("divide investido pelo saldo no caso normal", () => {
    expect(avgUnitCost(100, 2000)).toBeCloseTo(0.05, 10);
  });

  it("retorna undefined quando investido <= 0", () => {
    expect(avgUnitCost(0, 1000)).toBeUndefined();
    expect(avgUnitCost(-10, 1000)).toBeUndefined();
    expect(avgUnitCost(null, 1000)).toBeUndefined();
    expect(avgUnitCost(undefined, 1000)).toBeUndefined();
  });

  it("retorna undefined quando saldo <= 0", () => {
    expect(avgUnitCost(100, 0)).toBeUndefined();
    expect(avgUnitCost(100, -5)).toBeUndefined();
  });
});

describe("formatUnitCost", () => {
  it("formata em R$ pt-BR com 4 casas", () => {
    expect(formatUnitCost(0.05)).toBe("R$ 0,0500");
    expect(formatUnitCost(0.0234)).toBe("R$ 0,0234");
  });
});
