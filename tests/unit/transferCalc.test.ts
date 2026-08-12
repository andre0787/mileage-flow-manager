import { describe, it, expect } from "vitest";
import { computeTransferCalc } from "@/lib/transferCalc";

describe("computeTransferCalc", () => {
  it("sem carrinho: custo por milha = amountPaid / miles geradas", () => {
    const r = computeTransferCalc({
      amount: 50000,
      cartAmount: 0,
      amountPaid: 2500,
      cartCost: 0,
      conversionRate: 1,
      bonusPercent: 0,
    });
    expect(r.totalAmount).toBe(50000);
    expect(r.totalPaid).toBe(2500);
    expect(r.milesGenerated).toBe(50000);
    expect(r.costPerThousand).toBeCloseTo(50, 3); // 2500/50000*1000
    expect(r.costPerMile).toBeCloseTo(0.05, 3);
  });

  it("com carrinho: totalPaid inclui cartCost e custo por milha reflete o custo total", () => {
    // 50K transferência (2500) + 10K carrinho (200), 30% bônus
    const r = computeTransferCalc({
      amount: 50000,
      cartAmount: 10000,
      amountPaid: 2500,
      cartCost: 200,
      conversionRate: 1.3,
      bonusPercent: 30,
    });
    expect(r.totalAmount).toBe(60000);
    expect(r.totalPaid).toBe(2700); // 2500 + 200
    expect(r.milesGenerated).toBeCloseTo(78000, 0); // 60000 * 1.3
    // custo por milha = 2700 / 78000
    expect(r.costPerMile).toBeCloseTo(2700 / 78000, 4);
    expect(r.costPerThousand).toBeCloseTo((2700 / 78000) * 1000, 3);
  });

  it("carrinho sem bônus: miles = totalAmount (conversionRate 1)", () => {
    const r = computeTransferCalc({
      amount: 50000,
      cartAmount: 10000,
      amountPaid: 2500,
      cartCost: 200,
      conversionRate: 1,
      bonusPercent: 0,
    });
    expect(r.milesGenerated).toBe(60000);
    expect(r.costPerMile).toBeCloseTo(2700 / 60000, 4);
  });

  it("carrinho com bônus e sem cartAmount (valores zerados)", () => {
    const r = computeTransferCalc({
      amount: 100000,
      cartAmount: 0,
      amountPaid: 4000,
      cartCost: 0,
      conversionRate: 1.1,
      bonusPercent: 10,
    });
    expect(r.totalAmount).toBe(100000);
    expect(r.milesGenerated).toBeCloseTo(110000, 0);
    expect(r.costPerMile).toBeCloseTo(4000 / 110000, 4);
  });
});
