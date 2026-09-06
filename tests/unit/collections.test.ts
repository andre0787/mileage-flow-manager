import { describe, it, expect } from "vitest";
import { buildCollectionReport, collectionCsvRows } from "@/lib/collections";

const sale = (id: string, clientId: string, opts: Record<string, unknown> = {}) => ({
  id,
  clientId,
  clientName: "Cliente",
  kind: "milhas",
  saleValue: 1000,
  amountReceived: 0,
  status: "pendente",
  date: "2026-09-01",
  ...opts,
});

const earn = (clientId: string, amount: number) => ({
  clientId,
  kind: "earn",
  reversalOf: undefined,
  amount,
});

const spend = (clientId: string, amount: number) => ({
  clientId,
  kind: "spend",
  reversalOf: undefined,
  amount,
});

describe("buildCollectionReport", () => {
  it("agrupa pendentes por cliente com linhas detalhadas", () => {
    const rows = buildCollectionReport(
      [
        sale("s1", "c1", { clientName: "Ana", saleValue: 1000, amountReceived: 400 }),
        sale("s2", "c1", { clientName: "Ana", saleValue: 500, amountReceived: 500 }),
        sale("s3", "c2", { clientName: "Beto", saleValue: 200, date: "2026-08-01" }),
      ],
      [],
    );
    expect(rows).toHaveLength(2);
    const ana = rows.find((r) => r.clientId === "c1")!;
    expect(ana.lines).toHaveLength(1);
    expect(ana.lines[0]).toMatchObject({ saleId: "s1", pending: 600 });
    expect(ana.totalPending).toBe(600);
    expect(ana.net).toBe(600);
  });

  it("exclui canceladas e quitadas", () => {
    const rows = buildCollectionReport(
      [
        sale("s1", "c1", { status: "cancelado", saleValue: 1000 }),
        sale("s2", "c1", { saleValue: 500, amountReceived: 500 }),
      ],
      [],
    );
    expect(rows).toHaveLength(0);
  });

  it("abate o saldo de crédito no líquido (sem dupla subtração do spend)", () => {
    // spend de 200 já reduziu o saldo derivado para 100 — o líquido usa o
    // saldo final, nunca subtrai o spend de novo.
    const rows = buildCollectionReport(
      [sale("s1", "c1", { saleValue: 1000 })],
      [earn("c1", 300), spend("c1", 200)],
    );
    expect(rows[0]?.creditBalance).toBe(100);
    expect(rows[0]?.net).toBe(900);
  });

  it("ordena pelo débito mais antigo", () => {
    const rows = buildCollectionReport(
      [sale("s1", "c1", { date: "2026-09-05" }), sale("s2", "c2", { date: "2026-08-01" })],
      [],
    );
    expect(rows.map((r) => r.clientId)).toEqual(["c2", "c1"]);
  });

  it("nunca expõe lucro/margem/custos", () => {
    const rows = buildCollectionReport([sale("s1", "c1")], []);
    const csv = collectionCsvRows(rows);
    const blob = JSON.stringify({ rows, csv });
    for (const banned of ["profit", "margin", "cost", "lucro", "margem", "custo"]) {
      expect(blob.toLowerCase()).not.toContain(banned);
    }
  });
});
