import { describe, it, expect } from "vitest";
import { buildCollectionReport, collectionCsvRows, filterCollectionSales } from "@/lib/collections";

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

const earn = (clientId: string, amount: number, date = "2026-09-01T10:00:00Z") => ({
  id: `${clientId}-earn-${amount}`,
  clientId,
  kind: "earn",
  reversalOf: undefined,
  amount,
  createdAt: date,
});

const spend = (clientId: string, amount: number, date = "2026-09-01T10:00:00Z") => ({
  id: `${clientId}-spend-${amount}`,
  clientId,
  kind: "spend",
  reversalOf: undefined,
  amount,
  createdAt: date,
});

const reversal = (
  clientId: string,
  amount: number,
  reversalOf: "earn" | "spend",
  date = "2026-09-01T10:00:00Z",
) => ({
  id: `${clientId}-reversal-${reversalOf}-${amount}`,
  clientId,
  kind: "reversal",
  reversalOf,
  amount,
  createdAt: date,
});

describe("buildCollectionReport", () => {
  it("inclui vendas pagas e pendentes e calcula os totais do cliente", () => {
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
    expect(ana.lines).toHaveLength(2);
    expect(ana.lines[0]).toMatchObject({ saleId: "s1", pending: 600 });
    expect(ana.totalSold).toBe(1500);
    expect(ana.totalReceived).toBe(900);
    expect(ana.totalPending).toBe(600);
    expect(ana.net).toBe(600);
  });

  it("exclui canceladas, mas preserva vendas quitadas no histórico", () => {
    const rows = buildCollectionReport(
      [
        sale("s1", "c1", { status: "cancelado", saleValue: 1000 }),
        sale("s2", "c1", { saleValue: 500, amountReceived: 500 }),
      ],
      [],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.lines).toHaveLength(1);
    expect(rows[0]?.lines[0]).toMatchObject({ saleId: "s2", received: 500, pending: 0 });
    expect(rows[0]?.net).toBe(0);
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

  it("ordena clientes pela atividade mais recente", () => {
    const rows = buildCollectionReport(
      [sale("s1", "c1", { date: "2026-09-05" }), sale("s2", "c2", { date: "2026-08-01" })],
      [],
    );
    expect(rows.map((r) => r.clientId)).toEqual(["c1", "c2"]);
  });

  it("inclui earn, spend e reversões e ordena todo o extrato do mais recente ao mais antigo", () => {
    const rows = buildCollectionReport(
      [
        sale("old-pending", "c1", { date: "2024-01-01", saleValue: 1000, amountReceived: 200 }),
        sale("paid", "c1", { date: "2025-01-01", saleValue: 300, amountReceived: 300 }),
        sale("canceled", "c1", { date: "2026-09-06", status: "cancelado" }),
      ],
      [
        earn("c1", 500, "2026-09-02T10:00:00Z"),
        spend("c1", 200, "2026-09-03T10:00:00Z"),
        reversal("c1", 100, "earn", "2026-09-04T10:00:00Z"),
        reversal("c1", 50, "spend", "2026-09-05T10:00:00Z"),
      ],
    );
    const row = rows[0]!;
    expect(row.lines.map((line) => line.id)).toEqual([
      "credit:c1-reversal-spend-50",
      "credit:c1-reversal-earn-100",
      "credit:c1-spend-200",
      "credit:c1-earn-500",
      "sale:paid",
      "sale:old-pending",
    ]);
    expect(row.lines.map((line) => line.effect)).toEqual([50, -100, -200, 500, -300, -1000]);
    expect(row.totalSold).toBe(1300);
    expect(row.totalReceived).toBe(500);
    expect(row.totalPending).toBe(800);
    expect(row.creditBalance).toBe(250);
    expect(row.net).toBe(550);
  });

  it("mostra cliente com apenas créditos como saldo credor", () => {
    const rows = buildCollectionReport([], [earn("credito-only", 75)]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      clientId: "credito-only",
      totalSold: 0,
      totalReceived: 0,
      totalPending: 0,
      creditBalance: 75,
      net: -75,
    });
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

describe("filterCollectionSales", () => {
  it("passthrough com filtros nulos (comportamento anterior)", () => {
    const input = [sale("s1", "c1"), sale("s2", "c2", { accountId: "a9" })];
    const out = filterCollectionSales(input, {
      cutoff: new Date("2020-01-01T00:00:00"),
      accountIds: null,
      programName: null,
    });
    expect(out).toHaveLength(2);
  });

  it("corta pelo período (data da venda)", () => {
    const input = [
      sale("s1", "c1", { date: "2026-09-05" }),
      sale("s2", "c1", { date: "2026-08-01" }),
    ];
    const out = filterCollectionSales(input, {
      cutoff: new Date("2026-09-01T00:00:00"),
      accountIds: null,
      programName: null,
    });
    expect(out.map((s) => s.id)).toEqual(["s1"]);
  });

  it("filtra por dono via conta (serviço sem conta sai no filtro, entra sem filtro)", () => {
    const withAccount = sale("s1", "c1", { accountId: "a1" });
    const service = sale("s2", "c1", { kind: "servico", accountId: null });
    const filtered = filterCollectionSales([withAccount, service], {
      cutoff: new Date("2020-01-01T00:00:00"),
      accountIds: ["a1"],
      programName: null,
    });
    expect(filtered.map((s) => s.id)).toEqual(["s1"]);
    const all = filterCollectionSales([withAccount, service], {
      cutoff: new Date("2020-01-01T00:00:00"),
      accountIds: null,
      programName: null,
    });
    expect(all).toHaveLength(2);
  });

  it("filtra por programa", () => {
    const input = [sale("s1", "c1", { program: "Smiles" }), sale("s2", "c1", { program: "Latam" })];
    const out = filterCollectionSales(input, {
      cutoff: new Date("2020-01-01T00:00:00"),
      accountIds: null,
      programName: "Latam",
    });
    expect(out.map((s) => s.id)).toEqual(["s2"]);
  });
});
