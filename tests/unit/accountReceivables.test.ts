import { describe, it, expect } from "vitest";
import { computeReceivablesByAccount } from "@/lib/accountReceivables";

const sale = (id: string, accountId: string | undefined, opts: object = {}) => ({
  accountId,
  status: "pendente",
  saleValue: 1000,
  amountReceived: 0,
  id,
  ...opts,
});

describe("computeReceivablesByAccount", () => {
  it("soma o pendente (saleValue − amountReceived) por conta", () => {
    const map = computeReceivablesByAccount([
      sale("s1", "a1", { amountReceived: 400 }),
      sale("s2", "a1", { saleValue: 500, amountReceived: 500 }),
      sale("s3", "a2", { saleValue: 200 }),
    ]);
    expect(map.get("a1")).toBe(600);
    expect(map.get("a2")).toBe(200);
  });

  it("exclui vendas canceladas", () => {
    const map = computeReceivablesByAccount([
      sale("s1", "a1", { status: "cancelado", saleValue: 900 }),
    ]);
    expect(map.get("a1")).toBeUndefined();
  });

  it("ignora quite (parcial conta, total some) e sem conta", () => {
    const map = computeReceivablesByAccount([
      sale("s1", "a1", { saleValue: 300, amountReceived: 300 }),
      sale("s2", undefined, { saleValue: 300 }),
    ]);
    expect(map.get("a1")).toBeUndefined();
    expect(map.size).toBe(0);
  });
});
