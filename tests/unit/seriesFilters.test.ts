import { describe, it, expect } from "vitest";
import { isActiveMilesSale, isConfirmedDayEntry, sumEntriesMiles } from "@/lib/seriesFilters";

describe("isActiveMilesSale", () => {
  it("aceita milhas ativa no dia", () => {
    expect(
      isActiveMilesSale({ status: "pago", kind: "milhas", date: "2026-09-06" }, "2026-09-06"),
    ).toBe(true);
  });

  it("rejeita cancelada, servico e outro dia", () => {
    expect(isActiveMilesSale({ status: "cancelado", date: "2026-09-06" }, "2026-09-06")).toBe(
      false,
    );
    expect(
      isActiveMilesSale({ status: "pago", kind: "servico", date: "2026-09-06" }, "2026-09-06"),
    ).toBe(false);
    expect(isActiveMilesSale({ status: "pago", date: "2026-09-05" }, "2026-09-06")).toBe(false);
  });

  it("kind ausente conta como milhas", () => {
    expect(isActiveMilesSale({ status: "pago", date: "2026-09-06" }, "2026-09-06")).toBe(true);
  });
});

describe("isConfirmedDayEntry", () => {
  it("aceita confirmada no dia e rejeita aguardando", () => {
    expect(isConfirmedDayEntry({ date: "2026-09-06" }, "2026-09-06")).toBe(true);
    expect(
      isConfirmedDayEntry({ entryStatus: "aguardando", date: "2026-09-06" }, "2026-09-06"),
    ).toBe(false);
  });
});

describe("sumEntriesMiles", () => {
  it("soma geradas/amount ignorando com origem", () => {
    expect(
      sumEntriesMiles([
        { amount: 100, milesGenerated: 120 },
        { amount: 50 },
        { amount: 999, sourceAccountId: "a1" },
      ]),
    ).toBe(170);
  });
});
