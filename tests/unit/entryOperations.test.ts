import { describe, it, expect } from "vitest";
import { computeEntryValues } from "@/lib/entryOperations";
import type { EntryFormData, OrigemType } from "@/types";

const form = (overrides: Partial<EntryFormData> = {}): EntryFormData => ({
  accountId: "acc-1",
  origemTypeId: "ot-normal",
  amount: "50000",
  amountPaid: "2500",
  conversionRate: "1",
  sourceAccountId: "",
  bonusPercent: "",
  cartAmount: "",
  cartCost: "",
  date: "2026-08-13",
  isClube: false,
  clubeMeses: "",
  isRecurrent: false,
  recurrenceType: "monthly",
  recurrenceCount: 1,
  startDate: "",
  recurrenceValueMode: "repeat",
  ...overrides,
});

const origemTypes: OrigemType[] = [
  {
    id: "ot-normal",
    name: "Compra Direta",
    accountType: "milhas",
    color: "#10b981",
    description: "{}",
  },
  {
    id: "ot-transfer",
    // isTransferencia: name === "Transferência" && accountType === "milhas"
    name: "Transferência",
    accountType: "milhas",
    color: "#6366f1",
    description: "{}",
  },
];

describe("computeEntryValues", () => {
  it("entrada comum sem carrinho: custo por milha = amountPaid / amount", () => {
    const r = computeEntryValues(form(), origemTypes);
    expect(r.isTransfer).toBe(false);
    expect(r.totalAmount).toBe(50000);
    expect(r.totalPaid).toBe(2500);
    expect(r.milesGenerated).toBe(50000);
    expect(r.costPerThousand).toBeCloseTo(50, 3);
    expect(r.costPerMile).toBeCloseTo(0.05, 3);
  });

  it("transferência: aplica bônus, carrinho e não soma cartCost em não-transferência", () => {
    const r = computeEntryValues(
      form({
        origemTypeId: "ot-transfer",
        amount: "50000",
        amountPaid: "2500",
        bonusPercent: "30",
        cartAmount: "10000",
        cartCost: "200",
        conversionRate: "1",
      }),
      origemTypes,
    );
    expect(r.isTransfer).toBe(true);
    expect(r.bonusPercent).toBe(30);
    // bônus 30% sobre 50K + 10K carrinho
    expect(r.totalAmount).toBe(60000);
    expect(r.totalPaid).toBe(2700); // 2500 + 200 carrinho
    expect(r.milesGenerated).toBeCloseTo(78000, 3); // 60000 * 1.3
  });

  it("entrada comum ignora cartCost (carrinho só em transferência)", () => {
    const r = computeEntryValues(form({ cartAmount: "5000", cartCost: "100" }), origemTypes);
    expect(r.isTransfer).toBe(false);
    expect(r.totalPaid).toBe(2500); // cartCost NÃO soma
  });

  it("conversão de pontos: milesGenerated = amount * conversionRate", () => {
    const r = computeEntryValues(form({ conversionRate: "1.5" }), origemTypes);
    expect(r.milesGenerated).toBe(75000);
    expect(r.costPerMile).toBeCloseTo(2500 / 75000, 6);
  });

  it("origem desconhecida → não-transferência, sem bônus", () => {
    const r = computeEntryValues(form({ origemTypeId: "ot-inexistente" }), origemTypes);
    expect(r.isTransfer).toBe(false);
    expect(r.bonusPercent).toBeUndefined();
  });

  it("amount zero → custo por milha 0 (sem NaN/Infinity)", () => {
    const r = computeEntryValues(form({ amount: "0", amountPaid: "100" }), origemTypes);
    expect(r.costPerMile).toBe(0);
    expect(r.costPerThousand).toBe(0);
  });
});
