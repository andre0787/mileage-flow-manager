import { describe, it, expect } from "vitest";
import {
  movementEffect,
  calcCreditBalance,
  planReceipt,
  planCancelReversals,
} from "@/lib/clientCredits";
import type { ClientCredit } from "@/types";

const move = (
  over: Partial<ClientCredit>,
): Pick<ClientCredit, "kind" | "reversalOf" | "amount"> => ({
  kind: "earn",
  amount: 0,
  ...over,
});

describe("movementEffect", () => {
  it("earn soma, spend subtrai", () => {
    expect(movementEffect(move({ kind: "earn", amount: 100 }))).toBe(100);
    expect(movementEffect(move({ kind: "spend", amount: 30 }))).toBe(-30);
  });

  it("reversal inverte o referenciado", () => {
    expect(movementEffect(move({ kind: "reversal", reversalOf: "earn", amount: 100 }))).toBe(
      -100,
    );
    expect(movementEffect(move({ kind: "reversal", reversalOf: "spend", amount: 30 }))).toBe(30);
  });
});

describe("calcCreditBalance", () => {
  it("lista vazia zera", () => {
    expect(calcCreditBalance([])).toBe(0);
  });

  it("deriva earn menos spend", () => {
    expect(
      calcCreditBalance([
        move({ kind: "earn", amount: 150 }),
        move({ kind: "spend", amount: 100 }),
      ]),
    ).toBe(50);
  });

  it("reversal anula o original", () => {
    expect(
      calcCreditBalance([
        move({ kind: "earn", amount: 150 }),
        move({ kind: "spend", amount: 100 }),
        move({ kind: "reversal", reversalOf: "earn", amount: 150 }),
        move({ kind: "reversal", reversalOf: "spend", amount: 100 }),
      ]),
    ).toBe(0);
  });
});

describe("planReceipt", () => {
  it("parcial simples sem crédito", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 0, balance: 0, cash: 200 }),
    ).toEqual({
      appliedCash: 200,
      appliedCredit: 0,
      earnedCredit: 0,
      newReceived: 200,
      fullyPaid: false,
    });
  });

  it("excedente em dinheiro vira earn e quita", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 0, balance: 0, cash: 600 }),
    ).toEqual({
      appliedCash: 500,
      appliedCredit: 0,
      earnedCredit: 100,
      newReceived: 500,
      fullyPaid: true,
    });
  });

  it("uso manual misto (saldo + dinheiro)", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 0, balance: 100, cash: 200, useCredit: 100 }),
    ).toEqual({
      appliedCash: 200,
      appliedCredit: 100,
      earnedCredit: 0,
      newReceived: 300,
      fullyPaid: false,
    });
  });

  it("uso limitado a min(saldo, pendente)", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 0, balance: 100, cash: 0, useCredit: 1000 }),
    ).toEqual({
      appliedCash: 0,
      appliedCredit: 100,
      earnedCredit: 0,
      newReceived: 100,
      fullyPaid: false,
    });
  });

  it("quitação total só com crédito", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 0, balance: 500, cash: 0, useCredit: 500 }),
    ).toEqual({
      appliedCash: 0,
      appliedCredit: 500,
      earnedCredit: 0,
      newReceived: 500,
      fullyPaid: true,
    });
  });

  it("crédito nunca gera crédito (excedente só do dinheiro)", () => {
    const r = planReceipt({
      saleValue: 500,
      amountReceived: 400,
      balance: 100,
      cash: 100,
      useCredit: 100,
    });
    expect(r.appliedCredit).toBe(100);
    expect(r.appliedCash).toBe(0);
    expect(r.earnedCredit).toBe(100);
    expect(r.newReceived).toBe(500);
    expect(r.fullyPaid).toBe(true);
  });

  it("venda quitada + dinheiro vira earn integral", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 500, balance: 0, cash: 50 }),
    ).toEqual({
      appliedCash: 0,
      appliedCredit: 0,
      earnedCredit: 50,
      newReceived: 500,
      fullyPaid: true,
    });
  });

  it("nada informado retorna zeros (mutation rejeita depois)", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 100, balance: 50, cash: 0, useCredit: 0 }),
    ).toEqual({
      appliedCash: 0,
      appliedCredit: 0,
      earnedCredit: 0,
      newReceived: 100,
      fullyPaid: false,
    });
  });

  it("sanitiza negativos e NaN", () => {
    expect(
      planReceipt({ saleValue: 500, amountReceived: 0, balance: -10, cash: NaN, useCredit: -5 }),
    ).toEqual({
      appliedCash: 0,
      appliedCredit: 0,
      earnedCredit: 0,
      newReceived: 0,
      fullyPaid: false,
    });
  });
});

describe("planCancelReversals", () => {
  it("espelha earn e spend, ignora reversals existentes", () => {
    expect(
      planCancelReversals([
        { kind: "earn", amount: 150 } as Pick<ClientCredit, "kind" | "reversalOf" | "amount">,
        { kind: "spend", amount: 100 } as Pick<ClientCredit, "kind" | "reversalOf" | "amount">,
        {
          kind: "reversal",
          reversalOf: "earn",
          amount: 150,
        } as Pick<ClientCredit, "kind" | "reversalOf" | "amount">,
      ]),
    ).toEqual([
      { kind: "reversal", reversalOf: "earn", amount: 150 },
      { kind: "reversal", reversalOf: "spend", amount: 100 },
    ]);
  });

  it("sem movimentos retorna vazio", () => {
    expect(planCancelReversals([])).toEqual([]);
  });
});
