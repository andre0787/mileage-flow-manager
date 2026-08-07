import { describe, it, expect } from "vitest";
import { getLastAccountActivity } from "@/lib/accountActivity";
import type { PointEntry, Sale } from "@/types";

const baseEntry = (over: Partial<PointEntry>): PointEntry => ({
  id: "e1",
  accountId: "acc-1",
  origemTypeId: "ot-1",
  amount: 1000,
  amountPaid: 50,
  costPerThousand: 50,
  date: "2026-07-01",
  ...over,
});

const baseSale = (over: Partial<Sale>): Sale => ({
  id: "s1",
  accountId: "acc-1",
  accountName: "Conta",
  ownerName: "Dono",
  program: "Programa",
  clientId: "c1",
  clientName: "Cliente",
  milesUsed: 1000,
  saleValue: 100,
  costPerMile: 0.05,
  profit: 50,
  profitMargin: 0.5,
  status: "pago",
  date: "2026-07-01",
  ...over,
});

describe("getLastAccountActivity", () => {
  it("retorna a entrada mais recente da conta", () => {
    const entries = [
      baseEntry({ id: "old", date: "2026-06-01" }),
      baseEntry({ id: "new", date: "2026-08-01" }),
    ];
    expect(getLastAccountActivity(entries, [], "acc-1").lastEntry?.id).toBe("new");
  });

  it("ignora entradas com entryStatus aguardando", () => {
    const entries = [
      baseEntry({ id: "confirmed", date: "2026-07-01" }),
      baseEntry({ id: "pending", date: "2026-09-01", entryStatus: "aguardando" }),
    ];
    expect(getLastAccountActivity(entries, [], "acc-1").lastEntry?.id).toBe("confirmed");
  });

  it("ignora vendas canceladas", () => {
    const sales = [
      baseSale({ id: "paid", date: "2026-07-01" }),
      baseSale({ id: "cancelled", date: "2026-09-01", status: "cancelado" }),
    ];
    expect(getLastAccountActivity([], sales, "acc-1").lastSale?.id).toBe("paid");
  });

  it("retorna undefined quando a conta não tem registros", () => {
    const result = getLastAccountActivity([], [], "acc-1");
    expect(result.lastEntry).toBeUndefined();
    expect(result.lastSale).toBeUndefined();
  });

  it("não mistura registros de outras contas", () => {
    const entries = [baseEntry({ id: "other", accountId: "acc-2", date: "2026-09-01" })];
    expect(getLastAccountActivity(entries, [], "acc-1").lastEntry).toBeUndefined();
  });

  it("retorna última venda entre múltiplas", () => {
    const sales = [
      baseSale({ id: "s-old", date: "2026-05-01" }),
      baseSale({ id: "s-new", date: "2026-07-15" }),
      baseSale({ id: "s-cancelled", date: "2026-08-01", status: "cancelado" }),
    ];
    expect(getLastAccountActivity([], sales, "acc-1").lastSale?.id).toBe("s-new");
  });
});
