import { describe, it, expect } from "vitest";
import {
  CREDIT_EPSILON,
  movementEffect,
  calcCreditBalance,
  planReceipt,
  planCancelReversals,
} from "@/lib/clientCredits";

const earn = (amount: number) => ({ kind: "earn" as const, amount });
const spend = (amount: number) => ({ kind: "spend" as const, amount });
const rev = (reversalOf: "earn" | "spend", amount: number) => ({
  kind: "reversal" as const,
  reversalOf,
  amount,
});

describe("movementEffect", () => {
  it("earn soma, spend subtrai, reversal inverte o referenciado", () => {
    expect(movementEffect(earn(100))).toBe(100);
    expect(movementEffect(spend(30))).toBe(-30);
    expect(movementEffect(rev("earn", 100))).toBe(-100);
    expect(movementEffect(rev("spend", 30))).toBe(30);
  });

  it("reversal sem referência trata como earn (conservador)", () => {
    expect(movementEffect({ kind: "reversal", amount: 10 })).toBe(-10);
  });
});

describe("calcCreditBalance", () => {
  it("deriva earn menos spend com reversals", () => {
    expect(
      calcCreditBalance([earn(150), spend(40), rev("earn", 50), rev("spend", 10)]),
    ).toBe(150 - 40 - 50 + 10);
  });

  it("zera poeira de float abaixo do epsilon", () => {
    expect(CREDIT_EPSILON).toBeGreaterThan(0);
    expect(calcCreditBalance([earn(0.1), earn(0.2), spend(0.3)])).toBe(0);
  });

  it("lista vazia zera", () => {
    expect(calcCreditBalance([])).toBe(0);
  });
});

describe("planReceipt", () => {
  it("aplica crédito até min(saldo, pendente) e dinheiro no restante", () => {
    const r = planReceipt({
      saleValue: 500,
      amountReceived: 200,
      balance: 100,
      cash: 150,
      useCredit: 80,
    });
    expect(r.appliedCredit).toBe(80);
    expect(r.appliedCash).toBe(150);
    expect(r.earnedCredit).toBe(0);
    expect(r.newReceived).toBe(430);
    expect(r.fullyPaid).toBe(false);
  });

  it("só excedente EM DINHEIRO vira earn (crédito nunca gera crédito)", () => {
    const r = planReceipt({
      saleValue: 500,
      amountReceived: 400,
      balance: 1000,
      cash: 200,
      useCredit: 1000,
    });
    expect(r.appliedCredit).toBe(100);
    expect(r.appliedCash).toBe(0);
    expect(r.earnedCredit).toBe(200);
    expect(r.newReceived).toBe(500);
    expect(r.fullyPaid).toBe(true);
  });

  it("sanitiza entradas negativas, NaN e zero", () => {
    const r = planReceipt({
      saleValue: 500,
      amountReceived: 0,
      balance: -50,
      cash: Number.NaN,
      useCredit: -10,
    });
    expect(r).toEqual({
      appliedCash: 0,
      appliedCredit: 0,
      earnedCredit: 0,
      newReceived: 0,
      fullyPaid: false,
    });
  });

  it("quitação exata não gera earn", () => {
    const r = planReceipt({
      saleValue: 500,
      amountReceived: 0,
      balance: 0,
      cash: 500,
    });
    expect(r.earnedCredit).toBe(0);
    expect(r.fullyPaid).toBe(true);
  });
});

describe("planCancelReversals", () => {
  it("espelha earn/spend preservando a ordem (extrato)", () => {
    expect(
      planCancelReversals([earn(50), spend(20), earn(10)]),
    ).toEqual([
      { kind: "reversal", reversalOf: "earn", amount: 50 },
      { kind: "reversal", reversalOf: "spend", amount: 20 },
      { kind: "reversal", reversalOf: "earn", amount: 10 },
    ]);
  });

  it("ignora reversals aninhadas e valores não positivos", () => {
    expect(
      planCancelReversals([rev("earn", 40), earn(0), spend(-5), spend(25)]),
    ).toEqual([{ kind: "reversal", reversalOf: "spend", amount: 25 }]);
  });
});
